import { Router, Request, Response } from 'express';
import axios from 'axios';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const {
  buildCharacterGuide,
  buildWordGuide,
  buildGuidesFromWords,
  getExpectedStrokeCount,
  scoreStrokeOrder,
} = require('../lib/hangulStrokeGuides');


const HANDWRITING_AI_URL = (process.env.HANDWRITING_AI_URL || '').replace(/\/+$/, '');
const OPENAI_MODEL = process.env.HANDWRITING_OPENAI_MODEL || 'gpt-4o-mini';
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DEFAULT_TOPIC_NAME = 'Handwriting Practice';
const DEFAULT_LEVEL = 'NEWBIE';

type HandwritingMetrics = {
  accuracy: number;
  strokeBalance: number;
  neatness: number;
  completion: number;
  strokeOrder: number;
};

type DrawingGeometry = {
  canvasWidth: number;
  canvasHeight: number;
  width: number;
  height: number;
  widthRatio: number;
  heightRatio: number;
  centerOffsetX: number;
  centerOffsetY: number;
  aspectRatio: number;
  avgStrokeLength: number;
  avgPointsPerStroke: number;
};

type DiagnosticIssue = {
  id: string;
  severity: number;
  detail: string;
  suggestion: string;
};

type CharProfile = {
  minCoverage: number;
  maxCoverage: number;
  aspectMin: number;
  aspectMax: number;
  centerToleranceX: number;
  centerToleranceY: number;
};

const DEFAULT_CHAR_PROFILE: CharProfile = {
  minCoverage: 0.28,
  maxCoverage: 0.78,
  aspectMin: 0.45,
  aspectMax: 1.08,
  centerToleranceX: 0.1,
  centerToleranceY: 0.1,
};

const CHAR_PROFILES: Record<string, CharProfile> = {
  한: { minCoverage: 0.3, maxCoverage: 0.8, aspectMin: 0.55, aspectMax: 1.02, centerToleranceX: 0.1, centerToleranceY: 0.1 },
  글: { minCoverage: 0.24, maxCoverage: 0.72, aspectMin: 0.32, aspectMax: 0.82, centerToleranceX: 0.12, centerToleranceY: 0.1 },
  가: { minCoverage: 0.24, maxCoverage: 0.7, aspectMin: 0.38, aspectMax: 0.95, centerToleranceX: 0.1, centerToleranceY: 0.1 },
  나: { minCoverage: 0.24, maxCoverage: 0.7, aspectMin: 0.38, aspectMax: 0.95, centerToleranceX: 0.1, centerToleranceY: 0.1 },
  다: { minCoverage: 0.25, maxCoverage: 0.74, aspectMin: 0.42, aspectMax: 1.0, centerToleranceX: 0.1, centerToleranceY: 0.1 },
  라: { minCoverage: 0.25, maxCoverage: 0.74, aspectMin: 0.42, aspectMax: 1.0, centerToleranceX: 0.1, centerToleranceY: 0.1 },
  마: { minCoverage: 0.28, maxCoverage: 0.8, aspectMin: 0.55, aspectMax: 1.08, centerToleranceX: 0.1, centerToleranceY: 0.1 },
  바: { minCoverage: 0.28, maxCoverage: 0.8, aspectMin: 0.55, aspectMax: 1.08, centerToleranceX: 0.1, centerToleranceY: 0.1 },
};

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
  const raw = String(value || '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return {};
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return {};
  }
}

function toDataUrl(imageBase64: string) {
  if (!imageBase64) return '';
  return imageBase64.startsWith('data:image')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;
}

function scoreToGrade(score: number) {
  if (score >= 93) return 'A';
  if (score >= 85) return 'B';
  if (score >= 75) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

function normalizeSuggestions(value: any, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return normalized.length ? normalized.slice(0, 5) : fallback;
}

function mergeSuggestions(primary: string[], secondary: string[]) {
  const seen = new Set<string>();

  return [...primary, ...secondary]
    .map((item) => String(item || '').trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 3);
}

function distanceBetweenPoints(left: any, right: any) {
  const dx = Number(right?.x || 0) - Number(left?.x || 0);
  const dy = Number(right?.y || 0) - Number(left?.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function expectedStrokesForChar(character: string) {
  const mapping: Record<string, number> = {
    한: 6,
    글: 5,
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

function scoreCoverage(coverage: number, profile: CharProfile) {
  if (!Number.isFinite(coverage) || coverage <= 0) return 18;

  const target = (profile.minCoverage + profile.maxCoverage) / 2;
  const tolerance = Math.max((profile.maxCoverage - profile.minCoverage) / 2, 0.08);
  const distance = Math.abs(coverage - target);

  return clamp(100 - Math.round((distance / tolerance) * 32));
}

function scoreAspectRatio(aspectRatio: number, profile: CharProfile) {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return 20;

  const target = (profile.aspectMin + profile.aspectMax) / 2;
  const tolerance = Math.max((profile.aspectMax - profile.aspectMin) / 2, 0.08);
  const distance = Math.abs(aspectRatio - target);

  return clamp(100 - Math.round((distance / tolerance) * 35));
}

function scoreCentering(geometry: Partial<DrawingGeometry>, profile: CharProfile) {
  const offsetX = Math.abs(Number(geometry.centerOffsetX || 0));
  const offsetY = Math.abs(Number(geometry.centerOffsetY || 0));

  const xPenalty = (offsetX / Math.max(profile.centerToleranceX, 0.04)) * 18;
  const yPenalty = (offsetY / Math.max(profile.centerToleranceY, 0.04)) * 18;

  return clamp(100 - Math.round(xPenalty + yPenalty));
}

function calculateStrictScore(
  metrics: HandwritingMetrics,
  expectedStrokes = 0,
  actualStrokeCount = 0
) {
  const strokeDiff =
    expectedStrokes > 0 && actualStrokeCount > 0
      ? Math.abs(expectedStrokes - actualStrokeCount)
      : 0;

  let score = Math.round(
    metrics.accuracy * 0.44 +
      metrics.strokeBalance * 0.18 +
      metrics.neatness * 0.1 +
      metrics.completion * 0.08 +
      metrics.strokeOrder * 0.2
  );

  if (strokeDiff > 0) score -= 8 + strokeDiff * 7;
  if (metrics.accuracy < 85) score -= Math.round((85 - metrics.accuracy) * 0.35);
  if (metrics.strokeBalance < 80) score -= Math.round((80 - metrics.strokeBalance) * 0.25);
  if (metrics.completion < 60) score -= Math.round((60 - metrics.completion) * 0.15);
  if (metrics.strokeOrder < 75) score -= Math.round((75 - metrics.strokeOrder) * 0.28);

  if (strokeDiff >= 3) score = Math.min(score, 52);
  else if (strokeDiff === 2) score = Math.min(score, 64);
  else if (strokeDiff === 1) score = Math.min(score, 72);

  if (metrics.accuracy < 75) score = Math.min(score, 69);
  if (metrics.accuracy < 60) score = Math.min(score, 54);
  if (metrics.strokeBalance < 60) score = Math.min(score, 58);
  if (metrics.strokeOrder < 60) score = Math.min(score, 68);
  if (metrics.strokeOrder < 40) score = Math.min(score, 52);

  return clamp(score);
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

  const canvasWidth = Number(drawingData.canvas?.width ?? body?.canvas?.width ?? 650) || 650;
  const canvasHeight = Number(drawingData.canvas?.height ?? body?.canvas?.height ?? 600) || 600;

  const xs = flatPoints
    .map((item: any) => Number(item.x))
    .filter((value: number) => Number.isFinite(value));

  const ys = flatPoints
    .map((item: any) => Number(item.y))
    .filter((value: number) => Number.isFinite(value));

  const bounds =
    xs.length && ys.length
      ? {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
        }
      : null;

  const width = bounds ? bounds.maxX - bounds.minX : 0;
  const height = bounds ? bounds.maxY - bounds.minY : 0;
  const centerX = bounds ? (bounds.minX + bounds.maxX) / 2 : canvasWidth / 2;
  const centerY = bounds ? (bounds.minY + bounds.maxY) / 2 : canvasHeight / 2;

  const strokeLengths = strokeGroups.map((stroke: any[]) => {
    if (!Array.isArray(stroke) || stroke.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < stroke.length; i += 1) {
      total += distanceBetweenPoints(stroke[i - 1], stroke[i]);
    }
    return total;
  });

  const nonZeroStrokeLengths = strokeLengths.filter((value) => value > 0);
  const avgStrokeLength = nonZeroStrokeLengths.length ? average(nonZeroStrokeLengths) : 0;
  const avgPointsPerStroke = strokeCount > 0 ? Number((pointCount / strokeCount).toFixed(2)) : 0;

  const geometry: DrawingGeometry = {
    canvasWidth,
    canvasHeight,
    width,
    height,
    widthRatio: canvasWidth > 0 ? Number((width / canvasWidth).toFixed(4)) : 0,
    heightRatio: canvasHeight > 0 ? Number((height / canvasHeight).toFixed(4)) : 0,
    centerOffsetX: canvasWidth > 0 ? Number((centerX / canvasWidth - 0.5).toFixed(4)) : 0,
    centerOffsetY: canvasHeight > 0 ? Number((centerY / canvasHeight - 0.5).toFixed(4)) : 0,
    aspectRatio: height > 0 ? Number((width / height).toFixed(4)) : 0,
    avgStrokeLength: Number(avgStrokeLength || 0),
    avgPointsPerStroke,
  };

  return {
    strokeCount,
    durationMs,
    pointCount,
    geometry,
    drawingData: {
      strokes: strokeGroups,
      strokeCount,
      durationMs,
      pointCount,
      geometry,
      canvas: drawingData.canvas ?? body?.canvas ?? { width: canvasWidth, height: canvasHeight },
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
        strokes: clamp(
          body?.expectedStrokes ||
            getExpectedStrokeCount(character) ||
            expectedStrokesForChar(character),
          1,
          20
        ),
        level,
        topicId: topic.id,
      },
      include: { topic: true },
    });
  }

  return exercise;
}

function analyzeHandwritingIssues(payload: any, metrics: HandwritingMetrics) {
  const issues: DiagnosticIssue[] = [];
  const geometry: Partial<DrawingGeometry> = payload?.geometry ?? {};
  const profile = CHAR_PROFILES[payload?.character] || DEFAULT_CHAR_PROFILE;

  const expectedStrokes = Number(payload?.expectedStrokes || 0);
  const actualStrokeCount = Number(payload?.actualStrokeCount || 0);
  const strokeDiff =
    expectedStrokes > 0 && actualStrokeCount > 0
      ? actualStrokeCount - expectedStrokes
      : 0;

  if (strokeDiff < 0) {
    issues.push({
      id: 'missing_strokes',
      severity: 100 + Math.abs(strokeDiff) * 10,
      detail: `Bạn đang viết thiếu ${Math.abs(strokeDiff)} nét so với mẫu, nên khung chữ hiện chưa đúng ngay từ cấu trúc cơ bản.`,
      suggestion: `Viết đủ ${expectedStrokes} nét trước, đừng gộp các nét chính lại với nhau.`,
    });
  }

  if (strokeDiff > 0) {
    issues.push({
      id: 'extra_strokes',
      severity: 94 + strokeDiff * 8,
      detail: `Bạn đang thừa ${strokeDiff} nét so với mẫu, nên chữ bị rối và sai cấu trúc nét chính.`,
      suggestion: `Bỏ các nét phụ không cần thiết và quay lại đúng số nét chuẩn là ${expectedStrokes}.`,
    });
  }

  const coverage = Math.max(Number(geometry.widthRatio || 0), Number(geometry.heightRatio || 0));

  if (coverage > 0 && coverage < profile.minCoverage) {
    issues.push({
      id: 'too_small',
      severity: 76,
      detail: 'Chữ hiện đang quá nhỏ trong ô viết, khiến độ dài và tỷ lệ giữa các nét không ra đúng form mẫu.',
      suggestion: 'Tăng độ phủ của chữ trong ô viết, nhưng vẫn giữ đúng tỷ lệ giữa các nét.',
    });
  }

  if (coverage > profile.maxCoverage) {
    issues.push({
      id: 'too_large',
      severity: 73,
      detail: 'Chữ đang chiếm quá nhiều diện tích ô viết, nên các nét dễ chạm biên và mất kiểm soát ở điểm dừng.',
      suggestion: 'Thu chữ gọn lại một chút để giữ khoảng thở quanh chữ và dễ kiểm soát điểm kết thúc nét.',
    });
  }

  const offsetX = Number(geometry.centerOffsetX || 0);
  const offsetY = Number(geometry.centerOffsetY || 0);

  if (offsetX < -profile.centerToleranceX) {
    issues.push({
      id: 'left_shift',
      severity: 68,
      detail: 'Cụm chữ đang lệch sang trái, nên vị trí tương đối giữa các nét chưa cân trong ô viết.',
      suggestion: 'Đặt cụm chữ cân hơn vào giữa ô, đặc biệt là nét mở đầu.',
    });
  }

  if (offsetX > profile.centerToleranceX) {
    issues.push({
      id: 'right_shift',
      severity: 68,
      detail: 'Cụm chữ đang lệch sang phải, làm bố cục các nét chính mất cân đối.',
      suggestion: 'Lùi vị trí đặt nét đầu vào giữa hơn để bố cục chữ cân lại.',
    });
  }

  if (offsetY < -profile.centerToleranceY) {
    issues.push({
      id: 'top_shift',
      severity: 64,
      detail: 'Chữ đang bị dồn lên phía trên, nên khoảng phân bổ giữa các nét theo chiều dọc chưa ổn.',
      suggestion: 'Hạ cụm chữ xuống một chút để các nét có không gian đều hơn theo chiều dọc.',
    });
  }

  if (offsetY > profile.centerToleranceY) {
    issues.push({
      id: 'bottom_shift',
      severity: 64,
      detail: 'Chữ đang tụt xuống thấp, làm trọng tâm chữ bị nặng ở phần dưới.',
      suggestion: 'Nâng cụm chữ lên nhẹ để cân lại trọng tâm theo chiều dọc.',
    });
  }

  const aspectRatio = Number(geometry.aspectRatio || 0);

  if (aspectRatio > 0 && aspectRatio < profile.aspectMin) {
    issues.push({
      id: 'too_narrow',
      severity: 72,
      detail: 'Chữ đang bị hẹp ngang hoặc quá đứng, khiến khoảng cách giữa các nét không đúng kiểu chữ mẫu.',
      suggestion: 'Mở bề ngang ra thêm một chút, đừng ép các nét sát nhau quá.',
    });
  }

  if (aspectRatio > profile.aspectMax) {
    issues.push({
      id: 'too_wide',
      severity: 72,
      detail: 'Chữ đang bị bè ngang, nên các nét chính bị trải ra và mất liên kết hình khối.',
      suggestion: 'Thu bề ngang lại để chữ gọn hơn và bám đúng form chuẩn.',
    });
  }

  const avgPointsPerStroke = Number(geometry.avgPointsPerStroke || 0);

  if (avgPointsPerStroke > 0 && avgPointsPerStroke < 5) {
    issues.push({
      id: 'short_or_incomplete_strokes',
      severity: 66,
      detail: 'Một số nét có dấu hiệu quá ngắn hoặc dừng sớm, nên chữ chưa hoàn thiện ở các nét chính.',
      suggestion: 'Đi hết trọn từng nét trước khi nhấc bút, đừng cắt nét giữa chừng.',
    });
  }

  if (avgPointsPerStroke > 25) {
    issues.push({
      id: 'hesitant_strokes',
      severity: 55,
      detail: 'Nét viết có dấu hiệu ngập ngừng hoặc rê bút quá nhiều, nên đường nét chưa dứt khoát.',
      suggestion: 'Đi bút liền mạch hơn và hạn chế sửa nét quá nhiều giữa chừng.',
    });
  }

  const strokeOrderScore = Number(payload?.strokeOrderScore || 0);
  if (strokeOrderScore > 0 && strokeOrderScore < 60) {
    issues.push({
      id: 'wrong_stroke_order',
      severity: 92,
      detail: 'Bạn đã viết ra gần đúng hình chữ, nhưng thứ tự nét hoặc hướng đi bút chưa đúng với mẫu chuẩn.',
      suggestion: 'Xem lại card hướng dẫn và viết lại từng nét theo đúng số thứ tự hiển thị.',
    });
  }

  if (metrics.accuracy < 70 && !issues.length) {
    issues.push({
      id: 'generic_accuracy',
      severity: 70,
      detail: 'Tổng thể chữ đã có hình, nhưng độ chính xác của từng nét vẫn chưa bám sát mẫu.',
      suggestion: 'Viết chậm hơn và kiểm tra lại điểm bắt đầu, hướng đi và điểm kết thúc của từng nét.',
    });
  }

  return issues.sort((left, right) => right.severity - left.severity);
}

function buildFeedbackFromIssues(
  issues: DiagnosticIssue[],
  metrics: HandwritingMetrics,
  score: number
) {
  if (!issues.length) {
    if (metrics.accuracy >= 90) {
      return 'Các nét chính đang bám rất sát chữ mẫu. Độ dài, vị trí và tỷ lệ nét hiện khá chuẩn.';
    }

    if (metrics.accuracy >= 80) {
      return 'Tổng thể chữ đã khá đúng form. Sai số còn lại chủ yếu nằm ở vài điểm đặt bút và độ dài nét.';
    }

    return 'Chữ đã có form tương đối ổn, nhưng vẫn cần siết lại độ chính xác của các nét chính.';
  }

  const parts: string[] = [issues[0].detail];

  if (issues[1] && issues[1].severity >= 65) {
    parts.push(issues[1].detail);
  }

  if (metrics.accuracy < 70) {
    parts.push('Hiện tại lỗi chính nằm ở độ chính xác nét nhiều hơn là yếu tố thẩm mỹ.');
  } else if (metrics.neatness < 70 && score >= 70) {
    parts.push('Sau khi sửa đúng nét chính, bạn có thể làm đều tay hơn để chữ gọn hơn.');
  }

  return parts.join(' ');
}

function buildSuggestionsFromIssues(issues: DiagnosticIssue[], metrics: HandwritingMetrics) {
  const seen = new Set<string>();

  const suggestions = issues
    .map((item) => item.suggestion)
    .filter((item) => {
      const value = String(item || '').trim();
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });

  if (metrics.accuracy < 65) {
    const generic = 'Ưu tiên luyện đúng từng nét chính trước, chưa cần viết nhanh.';
    if (!seen.has(generic)) {
      suggestions.push(generic);
    }
  }

  return suggestions.length
    ? suggestions.slice(0, 3)
    : ['Viết chậm hơn và kiểm tra kỹ điểm bắt đầu, hướng đi và điểm kết thúc của từng nét.'];
}

function normalizeEvaluation(raw: any, engine: string, payload: any) {
  const metrics = raw?.metrics ?? {};
  const strokeOrderResult = scoreStrokeOrder(
    payload?.character,
    payload?.strokeGroups,
    payload?.geometry?.canvasWidth,
    payload?.geometry?.canvasHeight
  );

  const strictMetrics: HandwritingMetrics = {
    accuracy: clamp(metrics.accuracy ?? raw?.accuracy ?? raw?.score ?? 0),
    strokeBalance: clamp(
      metrics.strokeBalance ??
        metrics.stroke_balance ??
        raw?.strokeBalance ??
        raw?.stroke_balance ??
        metrics.accuracy ??
        raw?.accuracy ??
        raw?.score ??
        0
    ),
    neatness: clamp(metrics.neatness ?? metrics.shape ?? raw?.neatness ?? raw?.shape ?? raw?.score ?? 0),
    completion: clamp(metrics.completion ?? raw?.completion ?? raw?.score ?? 0),
    strokeOrder: strokeOrderResult.score,
  };

  const score = calculateStrictScore(
    strictMetrics,
    Number(payload?.expectedStrokes || 0),
    Number(payload?.actualStrokeCount || 0)
  );

  const issues = [
    ...strokeOrderResult.issues,
    ...analyzeHandwritingIssues(
      {
        ...payload,
        strokeOrderScore: strokeOrderResult.score,
      },
      strictMetrics
    ),
  ].sort((left, right) => right.severity - left.severity);

  const feedback = buildFeedbackFromIssues(issues, strictMetrics, score);
  const modelSuggestions = normalizeSuggestions(
    raw?.suggestions ?? raw?.tips ?? raw?.recommendations,
    []
  );

  const suggestions = mergeSuggestions(
    buildSuggestionsFromIssues(issues, strictMetrics),
    modelSuggestions
  );

  return {
    score,
    grade: String(raw?.grade || scoreToGrade(score)),
    feedback,
    metrics: strictMetrics,
    suggestions,
    issues,
    guideData: strokeOrderResult.guideData || null,
    engine,
  };
}

function buildRuleBasedEvaluation(payload: any) {
  const expectedStrokes = Number(payload.expectedStrokes || 0);
  const actualStrokeCount = Number(payload.actualStrokeCount || 0);
  const pointCount = Number(payload.pointCount || 0);
  const durationMs = Number(payload.durationMs || 0);
  const geometry: Partial<DrawingGeometry> = payload.geometry || {};
  const profile = CHAR_PROFILES[payload.character] || DEFAULT_CHAR_PROFILE;

  const strokeOrderResult = scoreStrokeOrder(
    payload?.character,
    payload?.strokeGroups,
    payload?.geometry?.canvasWidth,
    payload?.geometry?.canvasHeight
  );

  if (pointCount < 8) {
    const strictMetrics: HandwritingMetrics = {
      accuracy: 12,
      strokeBalance: 10,
      neatness: 18,
      completion: 10,
      strokeOrder: strokeOrderResult.score,
    };

    const issues = [
      ...strokeOrderResult.issues,
      ...analyzeHandwritingIssues(
        {
          ...payload,
          strokeOrderScore: strokeOrderResult.score,
        },
        strictMetrics
      ),
    ].sort((left, right) => right.severity - left.severity);

    const score = calculateStrictScore(strictMetrics, expectedStrokes, actualStrokeCount);

    return {
      score,
      grade: scoreToGrade(score),
      feedback:
        'Bài viết gần như chưa thành hình. Độ chính xác nét hiện quá thấp nên chưa thể xem là viết đúng chữ mẫu.',
      metrics: strictMetrics,
      suggestions: buildSuggestionsFromIssues(issues, strictMetrics),
      issues,
      guideData: strokeOrderResult.guideData || null,
      engine: 'rule-based-fallback',
    };
  }

  const coverage = Math.max(Number(geometry.widthRatio || 0), Number(geometry.heightRatio || 0));
  const coverageScore = scoreCoverage(coverage, profile);
  const aspectScore = scoreAspectRatio(Number(geometry.aspectRatio || 0), profile);
  const centeringScore = scoreCentering(geometry, profile);

  const strokeCountScore =
    expectedStrokes > 0 && actualStrokeCount > 0
      ? clamp(100 - Math.abs(expectedStrokes - actualStrokeCount) * 22)
      : 55;

  const strokeDiff =
    expectedStrokes > 0 && actualStrokeCount > 0
      ? Math.abs(expectedStrokes - actualStrokeCount)
      : 0;

  const strictMetrics: HandwritingMetrics = {
    accuracy: clamp(
      Math.round(
        strokeCountScore * 0.44 +
          coverageScore * 0.18 +
          aspectScore * 0.18 +
          centeringScore * 0.2 -
          strokeDiff * 6
      )
    ),
    strokeBalance: clamp(
      Math.round(
        strokeCountScore * 0.36 +
          aspectScore * 0.34 +
          centeringScore * 0.3 -
          strokeDiff * 5
      )
    ),
    neatness: clamp(
      Math.round(
        36 +
          Math.min(22, Number(geometry.avgPointsPerStroke || 0) * 3) +
          Math.min(16, durationMs / 600) -
          strokeDiff * 8
      )
    ),
    completion: clamp(
      Math.round(
        Math.min(100, 18 + pointCount * 1.55 + Math.min(14, durationMs / 450)) -
          strokeDiff * 6
      )
    ),
    strokeOrder: strokeOrderResult.score,
  };

  const issues = [
    ...strokeOrderResult.issues,
    ...analyzeHandwritingIssues(
      {
        ...payload,
        strokeOrderScore: strokeOrderResult.score,
      },
      strictMetrics
    ),
  ].sort((left, right) => right.severity - left.severity);

  const score = calculateStrictScore(strictMetrics, expectedStrokes, actualStrokeCount);

  return {
    score,
    grade: scoreToGrade(score),
    feedback: buildFeedbackFromIssues(issues, strictMetrics, score),
    metrics: strictMetrics,
    suggestions: buildSuggestionsFromIssues(issues, strictMetrics),
    issues,
    guideData: strokeOrderResult.guideData || null,
    engine: 'rule-based-fallback',
  };
}

async function scoreWithRemoteAI(payload: any) {
  if (!HANDWRITING_AI_URL || !payload.imageBase64) return null;

  const candidates = [
    `${HANDWRITING_AI_URL}/handwriting/score`,
    `${HANDWRITING_AI_URL}/api/handwriting/score`,
  ];

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

      return normalizeEvaluation(data?.data || data, 'remote-ai', payload);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 405) {
        continue;
      }
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
      response_format: { type: 'json_object' } as any,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: [
            'You are an expert Hangul handwriting evaluator.',
            'Return JSON only.',
            'Feedback and suggestions must be in Vietnamese.',
            'Be strict.',
            'Prioritize stroke accuracy over aesthetics.',
            'Wrong stroke count, missing main strokes, merged strokes, misplaced intersections, or wrong stroke direction must reduce the score heavily.',
            'Do not give a score above 80 unless the core stroke structure is very close to the target.',
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
                'Focus strongly on stroke count, stroke placement, stroke length, spacing, and whether the main structural strokes are correct.',
                'The first sentence of feedback should address stroke accuracy directly.',
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
    return normalizeEvaluation(extractJsonObject(content), 'openai-vision', payload);
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
    issues: Array.isArray(meta.issues) ? meta.issues : [],
    geometry: meta.geometry || drawing.geometry || null,
    guideData: meta.guideData || null,
    engine: meta.engine || 'stored',
    strokeCount: meta.actualStrokeCount ?? drawing.strokeCount ?? null,
    durationMs: meta.durationMs ?? drawing.durationMs ?? null,
    createdAt: attempt.createdAt,
  };
}

router.get('/guides', async (req: Request, res: Response) => {
  try {
    const level = String(req.query.level || DEFAULT_LEVEL).toUpperCase();

    const vocabularies = await prisma.vocabulary.findMany({
      where: {
        isActive: true,
        level,
      },
      select: {
        korean: true,
      },
    });

    const guides = buildGuidesFromWords(vocabularies.map((item: any) => item.korean));

    return res.json({
      success: true,
      data: {
        level,
        characters: Object.keys(guides),
        guides,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to load handwriting guides',
      message: error?.message || 'Unknown error',
    });
  }
});

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
    const guideData = buildWordGuide(exercise.hangulChar) || buildCharacterGuide(exercise.hangulChar);


    const expectedStrokeCount = guideData?.strokes?.length || exercise.strokes;

    const evaluation = await evaluateHandwriting({
      imageBase64: req.body?.imageBase64 || '',
      character: exercise.hangulChar,
      level: exercise.level,
      expectedStrokes: expectedStrokeCount,
      actualStrokeCount: normalized.strokeCount,
      durationMs: normalized.durationMs,
      pointCount: normalized.pointCount,
      geometry: normalized.geometry,
      strokeGroups: normalized.drawingData.strokes,
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
          expectedStrokeCount,
          durationMs: normalized.durationMs,
          geometry: normalized.geometry,
          guideData: evaluation.guideData || guideData || null,
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
        issues: evaluation.issues,
        guideData: evaluation.guideData || guideData || null,
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
            strokeOrder: 0,
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
          strokeOrder: average(parsed.map((item) => Number(item.metrics?.strokeOrder || 0))),
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
    const exerciseFilter: any = {};

    if (req.query.character) {
      exerciseFilter.hangulChar = String(req.query.character).trim();
    }

    if (req.query.level) {
      exerciseFilter.level = String(req.query.level).toUpperCase();
    }

    if (Object.keys(exerciseFilter).length > 0) {
      where.exercise = { is: exerciseFilter };
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
