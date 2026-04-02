import { Router, Request, Response } from 'express';
import axios from 'axios';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const HANDWRITING_AI_URL =
  process.env.HANDWRITING_AI_URL ||
  process.env.AI_BACKEND_URL ||
  process.env.FLASK_API_URL ||
  '';

const OPENAI_MODEL = process.env.HANDWRITING_OPENAI_MODEL || 'gpt-4o-mini';
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DEFAULT_TOPIC_NAME = 'Handwriting Practice';
const DEFAULT_LEVEL = 'NEWBIE';

function clamp(value: any, min = 0, max = 100) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function safeJsonParse<T>(value: any, fallback: T): T {
  if (value && typeof value === 'object') return value as T;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function extractJsonObject(value: string) {
  const raw = (value || '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return {};
  return JSON.parse(raw.slice(start, end + 1));
}

function toDataUrl(imageBase64: string) {
  if (!imageBase64) return '';
  return imageBase64.startsWith('data:image')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;
}

function scoreToGrade(score: number) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

function buildFeedback(score: number, strokeDiff: number) {
  if (score >= 90) return 'Chữ khá chuẩn, bố cục ổn và độ hoàn thiện tốt.';
  if (score >= 80) return 'Bài viết ổn, chỉ cần cân lại tỉ lệ và điểm dừng của vài nét.';
  if (score >= 65) {
    return strokeDiff > 0
      ? 'Hình chữ đã gần đúng nhưng số nét còn lệch, nên viết chậm và đủ nét hơn.'
      : 'Hình chữ đã đúng hướng, nhưng nét còn chưa đều và hơi thiếu kiểm soát.';
  }
  return 'Cần luyện lại cấu trúc cơ bản, viết chậm hơn và tách rõ từng nét.';
}

function buildSuggestions(score: number, expectedStrokes = 0, actualStrokes = 0) {
  const suggestions: string[] = [];

  if (expectedStrokes && actualStrokes && expectedStrokes !== actualStrokes) {
    suggestions.push(`Số nét hiện tại là ${actualStrokes}, nên bám gần hơn mốc ${expectedStrokes} nét.`);
  }

  if (score < 70) {
    suggestions.push('Giữ các nét tách bạch, không kéo liền quá nhanh giữa các đoạn.');
  }

  if (score < 85) {
    suggestions.push('Cân lại chiều cao, chiều rộng và điểm kết thúc của từng nét.');
  }

  if (!suggestions.length) {
    suggestions.push('Tiếp tục giữ nhịp viết ổn định và lặp lại đúng tỉ lệ chữ mẫu.');
  }

  return suggestions.slice(0, 3);
}

function expectedStrokesForChar(character: string) {
  const mapping: Record<string, number> = {
    한: 6,
    가: 4,
    나: 4,
    다: 5,
    라: 5,
    마: 6,
    바: 6,
    사: 5,
  };

  return mapping[character] || Math.max(2, Math.min(10, character ? character.length * 3 : 4));
}

function normalizeSuggestions(value: any, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const suggestions = value.map((item) => String(item).trim()).filter(Boolean);
  return suggestions.length ? suggestions.slice(0, 3) : fallback;
}

function normalizeDrawingPayload(body: any) {
  const drawingData = body?.drawingData ?? {};
  const rawStrokes = drawingData.strokes ?? body?.strokes ?? [];

  const strokeGroups =
    Array.isArray(rawStrokes) && rawStrokes.every((item: any) => Array.isArray(item))
      ? rawStrokes
      : Array.isArray(rawStrokes) && rawStrokes.length
      ? [rawStrokes]
      : [];

  const flatPoints = strokeGroups.flat().filter((item: any) => item && typeof item === 'object');
  const pointCount = flatPoints.length;

  const times = flatPoints
    .map((item: any) => Number(item.time))
    .filter((item: number) => Number.isFinite(item));

  const inferredDuration = times.length > 1 ? Math.max(...times) - Math.min(...times) : 0;
  const declaredStrokeCount = Number(drawingData.strokeCount ?? body?.strokeCount ?? 0);

  const strokeCount =
    declaredStrokeCount > 0
      ? declaredStrokeCount
      : strokeGroups.length > 1
      ? strokeGroups.length
      : pointCount > 0
      ? Math.max(1, Math.round(pointCount / 14))
      : 0;

  const durationMs = Number(drawingData.durationMs ?? body?.durationMs ?? inferredDuration) || inferredDuration;

  return {
    strokeCount,
    durationMs,
    pointCount,
    drawingData: {
      strokes: strokeGroups,
      strokeCount,
      durationMs,
      pointCount,
      canvas: drawingData.canvas ?? body?.canvas ?? null,
      hasImage: Boolean(body?.imageBase64),
    },
  };
}

async function resolveTopic(body: any, level: string) {
  const topicId = Number(body?.topicId || 0);
  if (topicId > 0) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      const error: any = new Error('Topic not found');
      error.status = 404;
      throw error;
    }
    return topic;
  }

  const topicName = String(body?.topicName || DEFAULT_TOPIC_NAME).trim();
  let topic = await prisma.topic.findFirst({
    where: { name: topicName, level },
  });

  if (!topic) {
    topic = await prisma.topic.create({
      data: {
        name: topicName,
        level,
        description: `Auto created handwriting topic for ${level}`,
        order: 999,
      },
    });
  }

  return topic;
}

async function resolveExercise(body: any, level: string) {
  const exerciseId = Number(body?.exerciseId || 0);

  if (exerciseId > 0) {
    const exercise = await prisma.handwritingExercise.findUnique({
      where: { id: exerciseId },
      include: { topic: true },
    });

    if (!exercise) {
      const error: any = new Error('Handwriting exercise not found');
      error.status = 404;
      throw error;
    }

    return exercise;
  }

  const character = String(body?.character || body?.hangulChar || '').trim();
  if (!character) {
    const error: any = new Error('exerciseId hoặc character là bắt buộc');
    error.status = 400;
    throw error;
  }

  const topic = await resolveTopic(body, level);

  let exercise = await prisma.handwritingExercise.findFirst({
    where: {
      hangulChar: character,
      level,
      topicId: topic.id,
      isActive: true,
    },
    include: { topic: true },
  });

  if (!exercise) {
    exercise = await prisma.handwritingExercise.create({
      data: {
        hangulChar: character,
        strokes: clamp(body?.expectedStrokes || expectedStrokesForChar(character), 1, 20),
        level,
        topicId: topic.id,
      },
      include: { topic: true },
    });
  }

  return exercise;
}

function normalizeEvaluation(raw: any, engine: string) {
  const metrics = raw?.metrics ?? {};

  const accuracy = clamp(metrics.accuracy ?? raw?.accuracy ?? raw?.score ?? 0);
  const strokeBalance = clamp(
    metrics.strokeBalance ??
      metrics.stroke_balance ??
      raw?.strokeBalance ??
      raw?.stroke_balance ??
      accuracy
  );
  const neatness = clamp(metrics.neatness ?? metrics.shape ?? raw?.neatness ?? raw?.shape ?? accuracy);
  const completion = clamp(metrics.completion ?? raw?.completion ?? accuracy);

  const score = clamp(
    raw?.score ??
      metrics.overall ??
      Math.round(accuracy * 0.45 + strokeBalance * 0.2 + neatness * 0.2 + completion * 0.15)
  );

  const feedback =
    String(raw?.feedback ?? raw?.feedback_vi ?? raw?.message ?? '').trim() || buildFeedback(score, 0);

  const suggestions = normalizeSuggestions(
    raw?.suggestions ?? raw?.tips ?? raw?.recommendations,
    buildSuggestions(score)
  );

  return {
    score,
    grade: String(raw?.grade || scoreToGrade(score)),
    feedback,
    metrics: {
      accuracy,
      strokeBalance,
      neatness,
      completion,
    },
    suggestions,
    engine,
  };
}

function buildRuleBasedEvaluation(payload: any) {
  const strokeDiff =
    payload.expectedStrokes > 0 && payload.actualStrokeCount > 0
      ? Math.abs(payload.expectedStrokes - payload.actualStrokeCount)
      : 0;

  const strokeBalance = Math.max(35, clamp(100 - strokeDiff * 18));
  const completion = Math.max(20, clamp(Math.min(100, 32 + payload.pointCount * 2)));
  const tempoBonus = payload.durationMs > 0 ? Math.min(24, Math.round(payload.durationMs / 250)) : 10;
  const neatness = Math.max(
    30,
    clamp(42 + tempoBonus + Math.min(22, Math.round(payload.pointCount / 5)) - Math.max(0, strokeDiff - 1) * 8)
  );
  const accuracy = clamp(Math.round(strokeBalance * 0.55 + completion * 0.45));
  const score = clamp(Math.round(accuracy * 0.45 + strokeBalance * 0.2 + neatness * 0.2 + completion * 0.15));

  return {
    score,
    grade: scoreToGrade(score),
    feedback: buildFeedback(score, strokeDiff),
    metrics: {
      accuracy,
      strokeBalance,
      neatness,
      completion,
    },
    suggestions: buildSuggestions(score, payload.expectedStrokes, payload.actualStrokeCount),
    engine: 'rule-based-fallback',
  };
}

async function scoreWithRemoteAI(payload: any) {
  if (!HANDWRITING_AI_URL || !payload.imageBase64) return null;

  const base = HANDWRITING_AI_URL.replace(/\/+$/, '');
  const candidates = [`${base}/handwriting/score`, `${base}/api/handwriting/score`];

  for (const url of candidates) {
    try {
      const { data } = await axios.post(
        url,
        {
          image: payload.imageBase64,
          target: payload.character,
          level: payload.level,
          expectedStrokes: payload.expectedStrokes,
          actualStrokeCount: payload.actualStrokeCount,
          durationMs: payload.durationMs,
        },
        { timeout: 20000 }
      );

      return normalizeEvaluation(data?.data || data, 'remote-ai');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 405) continue;
      return null;
    }
  }

  return null;
}

async function scoreWithOpenAI(payload: any) {
  if (!openai || !payload.imageBase64) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: [
            'You are an expert Hangul handwriting evaluator.',
            'Return JSON only.',
            'Feedback and suggestions must be in Vietnamese.',
            'Be strict but fair.',
            'If the image is blank or unreadable, keep the score at 25 or below.',
            'Required schema:',
            '{',
            '  "score": 0,',
            '  "grade": "A",',
            '  "feedback": "string",',
            '  "metrics": { "accuracy": 0, "strokeBalance": 0, "neatness": 0, "completion": 0 },',
            '  "suggestions": ["string"]',
            '}',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                `Target character: ${payload.character}`,
                `Level: ${payload.level}`,
                `Expected strokes: ${payload.expectedStrokes}`,
                `Actual strokes: ${payload.actualStrokeCount}`,
                `Duration(ms): ${payload.durationMs}`,
                'Evaluate the handwriting in the image.',
              ].join('\n'),
            },
            {
              type: 'image_url',
              image_url: {
                url: toDataUrl(payload.imageBase64),
              },
            },
          ] as any,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    return normalizeEvaluation(extractJsonObject(content), 'openai-vision');
  } catch {
    return null;
  }
}

async function evaluateHandwriting(payload: any) {
  return (
    (await scoreWithRemoteAI(payload)) ||
    (await scoreWithOpenAI(payload)) ||
    buildRuleBasedEvaluation(payload)
  );
}

function mapAttempt(attempt: any) {
  const meta = safeJsonParse<any>(attempt.feedback, {});
  const drawing = safeJsonParse<any>(attempt.drawingData, {});

  return {
    id: attempt.id,
    exerciseId: attempt.exerciseId,
    character: attempt.exercise?.hangulChar || null,
    level: attempt.exercise?.level || null,
    topic: attempt.exercise?.topic
      ? {
          id: attempt.exercise.topic.id,
          name: attempt.exercise.topic.name,
          level: attempt.exercise.topic.level,
        }
      : null,
    score: attempt.score,
    grade: meta.grade || scoreToGrade(attempt.score),
    feedback: meta.feedback || '',
    metrics: meta.metrics || null,
    suggestions: Array.isArray(meta.suggestions) ? meta.suggestions : [],
    engine: meta.engine || 'stored',
    strokeCount: meta.actualStrokeCount ?? drawing.strokeCount ?? null,
    durationMs: meta.durationMs ?? drawing.durationMs ?? null,
    createdAt: attempt.createdAt,
  };
}

router.post('/submit', async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user?.id || 0);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!req.body?.exerciseId && !req.body?.character && !req.body?.hangulChar) {
      return res.status(400).json({
        success: false,
        error: 'exerciseId hoặc character là bắt buộc',
      });
    }

    if (!req.body?.imageBase64 && !req.body?.drawingData && !req.body?.strokes) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu dữ liệu handwriting',
      });
    }

    const level = String(req.body?.level || DEFAULT_LEVEL).toUpperCase();
    const exercise = await resolveExercise(req.body, level);
    const normalized = normalizeDrawingPayload(req.body);

    const evaluation = await evaluateHandwriting({
      imageBase64: req.body?.imageBase64 || '',
      character: exercise.hangulChar,
      level: exercise.level,
      expectedStrokes: exercise.strokes,
      actualStrokeCount: normalized.strokeCount,
      durationMs: normalized.durationMs,
      pointCount: normalized.pointCount,
    });

    const attempt = await prisma.handwritingAttempt.create({
      data: {
        userId,
        exerciseId: exercise.id,
        drawingData: JSON.stringify(normalized.drawingData),
        score: evaluation.score,
        feedback: JSON.stringify({
          ...evaluation,
          actualStrokeCount: normalized.strokeCount,
          expectedStrokeCount: exercise.strokes,
          durationMs: normalized.durationMs,
        }),
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        attemptId: attempt.id,
        exerciseId: exercise.id,
        character: exercise.hangulChar,
        level: exercise.level,
        topic: exercise.topic
          ? {
              id: exercise.topic.id,
              name: exercise.topic.name,
            }
          : null,
        score: evaluation.score,
        grade: evaluation.grade,
        feedback: evaluation.feedback,
        metrics: evaluation.metrics,
        suggestions: evaluation.suggestions,
        engine: evaluation.engine,
        submittedAt: attempt.createdAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(error?.status || 500).json({
      success: false,
      error: 'Failed to submit handwriting',
      message: error?.message || 'Unknown error',
    });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user?.id || 0);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const attempts = await prisma.handwritingAttempt.findMany({
      where: { userId },
      include: {
        exercise: {
          include: { topic: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!attempts.length) {
      return res.json({
        success: true,
        data: {
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          latestScore: 0,
          improvement: 0,
          recentAverage: 0,
          uniqueCharacters: 0,
          metricsAverage: {
            accuracy: 0,
            strokeBalance: 0,
            neatness: 0,
            completion: 0,
          },
          scoreBuckets: {
            excellent: 0,
            good: 0,
            average: 0,
            needPractice: 0,
          },
          topCharacters: [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    const parsed = attempts.map(mapAttempt);
    const scores = parsed.map((item) => item.score);
    const latestScore = parsed[parsed.length - 1].score;
    const firstScore = parsed[0].score;

    const scoreBuckets = {
      excellent: parsed.filter((item) => item.score >= 85).length,
      good: parsed.filter((item) => item.score >= 70 && item.score < 85).length,
      average: parsed.filter((item) => item.score >= 50 && item.score < 70).length,
      needPractice: parsed.filter((item) => item.score < 50).length,
    };

    const characterMap = new Map<string, { character: string; attempts: number; totalScore: number }>();
    parsed.forEach((item) => {
      if (!item.character) return;
      const current = characterMap.get(item.character) || {
        character: item.character,
        attempts: 0,
        totalScore: 0,
      };
      current.attempts += 1;
      current.totalScore += item.score;
      characterMap.set(item.character, current);
    });

    const topCharacters = Array.from(characterMap.values())
      .map((item) => ({
        character: item.character,
        attempts: item.attempts,
        averageScore: Number((item.totalScore / item.attempts).toFixed(2)),
      }))
      .sort((left, right) => right.attempts - left.attempts || right.averageScore - left.averageScore)
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        totalAttempts: attempts.length,
        averageScore: average(scores),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        latestScore,
        improvement: Number((latestScore - firstScore).toFixed(2)),
        recentAverage: average(scores.slice(-5)),
        uniqueCharacters: new Set(parsed.map((item) => item.character).filter(Boolean)).size,
        metricsAverage: {
          accuracy: average(parsed.map((item) => Number(item.metrics?.accuracy || 0))),
          strokeBalance: average(parsed.map((item) => Number(item.metrics?.strokeBalance || 0))),
          neatness: average(parsed.map((item) => Number(item.metrics?.neatness || 0))),
          completion: average(parsed.map((item) => Number(item.metrics?.completion || 0))),
        },
        scoreBuckets,
        topCharacters,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get handwriting stats',
      message: error?.message || 'Unknown error',
    });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user?.id || 0);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));

    const where: any = { userId };

    if (req.query.character || req.query.level) {
      where.exercise = {};
      if (req.query.character) {
        where.exercise.hangulChar = String(req.query.character).trim();
      }
      if (req.query.level) {
        where.exercise.level = String(req.query.level).toUpperCase();
      }
    }

    const [total, attempts] = await Promise.all([
      prisma.handwritingAttempt.count({ where }),
      prisma.handwritingAttempt.findMany({
        where,
        include: {
          exercise: {
            include: { topic: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: attempts.map(mapAttempt),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get handwriting history',
      message: error?.message || 'Unknown error',
    });
  }
});

module.exports = router;
