'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookMarked,
  BookOpen,
  Eraser,
  Gamepad2,
  Map,
  Mic2,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import {
  HangulCard,
  HangulPageFrame,
  HangulSidebar,
  MascotPortrait,
  StatusChip,
} from '@/components/hangul/ui';
import { handwritingService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface ExercisePoint {
  x: number;
  y: number;
  time: number;
}

interface HandwritingMetrics {
  accuracy: number;
  strokeBalance: number;
  neatness: number;
  completion: number;
}

interface HandwritingStats {
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  latestScore: number;
  recentAverage: number;
  uniqueCharacters: number;
}

interface HandwritingHistoryItem {
  id: number;
  character: string;
  score: number;
  grade: string;
  feedback: string;
  createdAt: string;
}

const palette = ['#846458', '#a28277', '#6c4f42', '#918280', '#5e4d4b', '#ffd5c8'] as const;
const brushSizes = [4, 10, 18] as const;
const characters = ['한', '가', '나', '다', '라', '마', '바', '사'];
const expectedStrokeMap: Record<string, number> = {
  한: 6,
  가: 4,
  나: 4,
  다: 5,
  라: 5,
  마: 6,
  바: 6,
  사: 5,
};

const practiceSidebar = [
  { key: 'course' as const, label: 'Current Session', href: '/dashboard', icon: BookOpen },
  { key: 'path' as const, label: 'Learning Path', href: '/learning-map', icon: Map },
  { key: 'vocabulary' as const, label: 'Vocabulary', href: '/camera', icon: BookMarked },
  { key: 'achievements' as const, label: 'Voice Lab', href: '/pronunciation', icon: Mic2 },
  { key: 'friends' as const, label: 'Achievements', href: '/profile', icon: Trophy },
];

function formatAttemptTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function WritingPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeGroups, setStrokeGroups] = useState<ExercisePoint[][]>([]);
  const [currentChar, setCurrentChar] = useState('한');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<HandwritingMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [brushSize, setBrushSize] = useState<(typeof brushSizes)[number]>(10);
  const [brushColor, setBrushColor] = useState<(typeof palette)[number]>('#846458');
  const [startedAt, setStartedAt] = useState<number | null>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [stats, setStats] = useState<HandwritingStats | null>(null);
  const [history, setHistory] = useState<HandwritingHistoryItem[]>([]);

  const strokeCount = useMemo(() => strokeGroups.length, [strokeGroups]);
  const pointCount = useMemo(
    () => strokeGroups.reduce((sum, stroke) => sum + stroke.length, 0),
    [strokeGroups]
  );
  const expectedStrokes = expectedStrokeMap[currentChar] ?? 5;

  async function loadHandwritingData() {
    try {
      const [statsResponse, historyResponse] = await Promise.all([
        handwritingService.getStats(),
        handwritingService.getHistory(1, 5),
      ]);

      setStats(statsResponse.data);
      setHistory(historyResponse.data.items || []);
    } catch (error) {
      console.error('Failed to load handwriting data', error);
    }
  }

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    void loadHandwritingData();
  }, [router, token]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (startedAt) {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  const getCanvasPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  };

  const beginStroke = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = getCanvasPoint(event);

    if (!canvas || !point) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    setStrokeGroups((current) => [...current, [point]]);
    setPageError('');
  };

  const drawStroke = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const point = getCanvasPoint(event);

    if (!canvas || !point) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    setStrokeGroups((current) => {
      if (!current.length) return current;
      const next = [...current];
      next[next.length - 1] = [...next[next.length - 1], point];
      return next;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    setStrokeGroups([]);
    setFeedback('');
    setScore(null);
    setMetrics(null);
    setSuggestions([]);
    setPageError('');
    setStartedAt(Date.now());
    setElapsed(0);
  };

  const checkWriting = async () => {
    const canvas = canvasRef.current;

    if (!canvas || strokeGroups.length === 0) {
      setPageError('Bạn cần viết chữ lên canvas trước khi chấm điểm.');
      return;
    }

    setIsSubmitting(true);
    setPageError('');

    try {
      const response = await handwritingService.submit({
        character: currentChar,
        level: user?.level || 'NEWBIE',
        topicName: 'Basic Characters',
        imageBase64: canvas.toDataURL('image/png'),
        drawingData: {
          strokeCount: strokeGroups.length,
          durationMs: startedAt ? Date.now() - startedAt : 0,
          canvas: {
            width: canvas.width,
            height: canvas.height,
          },
          strokes: strokeGroups,
        },
      });

      const result = response.data;

      setScore(result.score);
      setFeedback(result.feedback || '');
      setMetrics(result.metrics || null);
      setSuggestions(result.suggestions || []);

      await loadHandwritingData();
    } catch (error: any) {
      setPageError(error.message || 'Không thể chấm handwriting lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextCharacter = () => {
    const currentIndex = characters.indexOf(currentChar);
    const nextChar = characters[(currentIndex + 1) % characters.length];
    setCurrentChar(nextChar);
    clearCanvas();
  };

  const bubbleText =
    feedback || 'Great start! Follow the flow of the strokes and keep the pressure consistent.';

  return (
    <HangulPageFrame
      activeNav="Practice"
      sidebar={
        <HangulSidebar
          items={practiceSidebar}
          profile={{ title: 'Current Session', subtitle: 'Han [한] Mastery', emoji: '🦦', tone: 'paper' }}
          ctaLabel="Go to Arena"
          ctaHref="/tournament"
        />
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-6">
            <HangulCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">
                Brush Size
              </p>
              <div className="mt-6 flex items-center justify-between gap-3">
                {brushSizes.map((size) => (
                  <button
                    key={size}
                    className={`grid h-20 w-20 place-items-center rounded-full border ${
                      brushSize === size
                        ? 'border-[var(--hangul-accent)] bg-white shadow-[0_18px_36px_rgba(121,95,78,0.12)]'
                        : 'border-[rgba(121,95,78,0.1)] bg-white/64'
                    }`}
                    onClick={() => setBrushSize(size)}
                    type="button"
                  >
                    <span className="rounded-full bg-[var(--hangul-accent)]" style={{ width: size, height: size }} />
                  </button>
                ))}
              </div>
            </HangulCard>

            <HangulCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">
                Otter Tones
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {palette.map((color) => (
                  <button
                    key={color}
                    className={`h-20 w-20 rounded-full border-4 ${
                      brushColor === color
                        ? 'border-white shadow-[0_18px_34px_rgba(121,95,78,0.14)]'
                        : 'border-transparent'
                    }`}
                    onClick={() => setBrushColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </HangulCard>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-end gap-4">
              <div className="max-w-sm rounded-[30px] bg-white px-6 py-5 text-xl leading-8 text-[var(--hangul-ink)] shadow-[0_18px_42px_rgba(121,95,78,0.12)]">
                “{bubbleText}”
              </div>
              <MascotPortrait emoji="🦦" tone="peach" className="h-48 w-40" />
            </div>

            <HangulCard className="overflow-hidden p-5 sm:p-7">
              <div className="rounded-[34px] bg-[rgba(255,255,255,0.76)] p-3 shadow-[inset_0_0_0_1px_rgba(121,95,78,0.06)]">
                <div className="relative rounded-[30px] bg-white p-4">
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-[18rem] font-black tracking-[-0.08em] text-[rgba(121,95,78,0.07)]">
                    {currentChar}
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="relative z-10 h-[620px] w-full rounded-[28px]"
                    height={620}
                    onMouseDown={beginStroke}
                    onMouseLeave={stopDrawing}
                    onMouseMove={drawStroke}
                    onMouseUp={stopDrawing}
                    width={980}
                  />
                </div>
              </div>
            </HangulCard>
          </div>
        </div>

        <HangulCard className="flex flex-wrap items-center justify-between gap-4 px-7 py-6">
          <button className="hangul-button-secondary min-w-[260px] justify-center" onClick={clearCanvas} type="button">
            <Eraser className="mr-2 h-5 w-5" />
            Clear Canvas
          </button>
          <button
            className="hangul-button-primary min-w-[360px] justify-center"
            disabled={isSubmitting}
            onClick={checkWriting}
            type="button"
          >
            <ShieldCheck className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Checking...' : 'Check My Writing'}
          </button>
        </HangulCard>

        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex flex-wrap gap-3">
            <StatusChip label={`Strokes: ${strokeCount} / ${expectedStrokes}`} tone="paper" />
            <StatusChip label={`Points: ${pointCount}`} tone="paper" />
            <StatusChip label={`Time: 0:${String(elapsed).padStart(2, '0')}`} tone="paper" />
            {score !== null ? <StatusChip label={`Score: ${score}`} tone="mint" /> : null}
            {metrics ? <StatusChip label={`Accuracy: ${metrics.accuracy}`} tone="mint" /> : null}
            {stats ? <StatusChip label={`Best: ${stats.highestScore}`} tone="paper" /> : null}
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="hangul-button-secondary" onClick={nextCharacter} type="button">
              <Gamepad2 className="mr-2 h-5 w-5" />
              Next Character
            </button>
            <Link className="hangul-button-primary" href="/tournament">
              Go to Arena
            </Link>
          </div>
        </div>

        {pageError ? (
          <HangulCard className="border border-[rgba(190,80,70,0.2)] bg-[rgba(255,240,236,0.92)] p-6">
            <p className="text-lg leading-8 text-[var(--hangul-ink)]">{pageError}</p>
          </HangulCard>
        ) : null}

        {feedback ? (
          <HangulCard className="space-y-4 p-6">
            <p className="text-lg leading-8 text-[var(--hangul-ink)]">{feedback}</p>

            {metrics ? (
              <div className="flex flex-wrap gap-3">
                <StatusChip label={`Accuracy ${metrics.accuracy}`} tone="mint" />
                <StatusChip label={`Balance ${metrics.strokeBalance}`} tone="paper" />
                <StatusChip label={`Neatness ${metrics.neatness}`} tone="paper" />
                <StatusChip label={`Completion ${metrics.completion}`} tone="paper" />
              </div>
            ) : null}

            {suggestions.length ? (
              <div className="space-y-2 text-[var(--hangul-ink)]">
                {suggestions.map((item) => (
                  <p key={item} className="text-base leading-7">
                    • {item}
                  </p>
                ))}
              </div>
            ) : null}
          </HangulCard>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <HangulCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">
              Handwriting Stats
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-[24px] bg-white/80 p-4">
                <p className="text-sm text-[var(--hangul-soft-ink)]">Attempts</p>
                <p className="mt-2 text-3xl font-black text-[var(--hangul-ink)]">{stats?.totalAttempts ?? 0}</p>
              </div>
              <div className="rounded-[24px] bg-white/80 p-4">
                <p className="text-sm text-[var(--hangul-soft-ink)]">Average</p>
                <p className="mt-2 text-3xl font-black text-[var(--hangul-ink)]">
                  {stats?.averageScore ?? 0}
                </p>
              </div>
              <div className="rounded-[24px] bg-white/80 p-4">
                <p className="text-sm text-[var(--hangul-soft-ink)]">Latest</p>
                <p className="mt-2 text-3xl font-black text-[var(--hangul-ink)]">{stats?.latestScore ?? 0}</p>
              </div>
              <div className="rounded-[24px] bg-white/80 p-4">
                <p className="text-sm text-[var(--hangul-soft-ink)]">Characters</p>
                <p className="mt-2 text-3xl font-black text-[var(--hangul-ink)]">
                  {stats?.uniqueCharacters ?? 0}
                </p>
              </div>
            </div>
          </HangulCard>

          <HangulCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">
              Recent Attempts
            </p>
            <div className="mt-5 space-y-3">
              {history.length ? (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-[24px] bg-white/80 px-4 py-3"
                  >
                    <div>
                      <p className="text-lg font-semibold text-[var(--hangul-ink)]">
                        {item.character} · {item.grade}
                      </p>
                      <p className="text-sm text-[var(--hangul-soft-ink)]">{formatAttemptTime(item.createdAt)}</p>
                    </div>
                    <StatusChip label={`Score ${item.score}`} tone="mint" />
                  </div>
                ))
              ) : (
                <p className="text-base leading-7 text-[var(--hangul-soft-ink)]">
                  Chưa có lượt chấm nào. Viết xong rồi bấm Check My Writing để tạo history.
                </p>
              )}
            </div>
          </HangulCard>
        </div>
      </div>
    </HangulPageFrame>
  );
}
