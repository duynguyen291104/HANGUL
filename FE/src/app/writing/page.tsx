'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, BookOpen, Eraser, Gamepad2, Map, Mic2, ShieldCheck, Trophy } from 'lucide-react';
import { HangulCard, HangulPageFrame, HangulSidebar, MascotPortrait, StatusChip } from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

interface ExercisePoint {
  x: number;
  y: number;
  time: number;
}

const palette = ['#846458', '#a28277', '#6c4f42', '#918280', '#5e4d4b', '#ffd5c8'] as const;
const brushSizes = [4, 10, 18] as const;
const characters = ['한', '가', '나', '다', '라', '마', '바', '사'];
const practiceSidebar = [
  { key: 'course' as const, label: 'Current Session', href: '/dashboard', icon: BookOpen },
  { key: 'path' as const, label: 'Learning Path', href: '/learning-map', icon: Map },
  { key: 'vocabulary' as const, label: 'Vocabulary', href: '/camera', icon: BookMarked },
  { key: 'achievements' as const, label: 'Voice Lab', href: '/pronunciation', icon: Mic2 },
  { key: 'friends' as const, label: 'Achievements', href: '/profile', icon: Trophy },
];

export default function WritingPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<ExercisePoint[]>([]);
  const [currentChar, setCurrentChar] = useState('한');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [brushSize, setBrushSize] = useState<(typeof brushSizes)[number]>(10);
  const [brushColor, setBrushColor] = useState<(typeof palette)[number]>('#846458');
  const [startedAt, setStartedAt] = useState<number | null>(Date.now());
  const [elapsed, setElapsed] = useState(14);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [router, token]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (startedAt) {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  const beginStroke = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setStrokes((current) => [...current, { x, y, time: Date.now() }]);
  };

  const drawStroke = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setStrokes((current) => [...current, { x, y, time: Date.now() }]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setFeedback('');
    setScore(null);
    setStartedAt(Date.now());
    setElapsed(0);
  };

  const checkWriting = () => {
    const effortScore = Math.min(99, 48 + Math.round(strokes.length / 5));
    const polishBoost = brushSize === 10 ? 8 : 0;
    const finalScore = Math.min(99, effortScore + polishBoost);
    setScore(finalScore);
    setFeedback(
      finalScore > 84
        ? 'Great start! Follow the flow of the strokes and keep the pressure consistent.'
        : 'The structure is there. Slow down slightly and let the vertical line land with more control.'
    );
  };

  const nextCharacter = () => {
    const currentIndex = characters.indexOf(currentChar);
    setCurrentChar(characters[(currentIndex + 1) % characters.length]);
    clearCanvas();
  };

  const strokeCount = useMemo(() => Math.max(0, Math.round(strokes.length / 14)), [strokes.length]);

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
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">Brush Size</p>
              <div className="mt-6 flex items-center justify-between gap-3">
                {brushSizes.map((size) => (
                  <button
                    key={size}
                    className={`grid h-20 w-20 place-items-center rounded-full border ${brushSize === size ? 'border-[var(--hangul-accent)] bg-white shadow-[0_18px_36px_rgba(121,95,78,0.12)]' : 'border-[rgba(121,95,78,0.1)] bg-white/64'}`}
                    onClick={() => setBrushSize(size)}
                    type="button"
                  >
                    <span className="rounded-full bg-[var(--hangul-accent)]" style={{ width: size, height: size }} />
                  </button>
                ))}
              </div>
            </HangulCard>

            <HangulCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">Otter Tones</p>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {palette.map((color) => (
                  <button
                    key={color}
                    className={`h-20 w-20 rounded-full border-4 ${brushColor === color ? 'border-white shadow-[0_18px_34px_rgba(121,95,78,0.14)]' : 'border-transparent'}`}
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
                “Great start! Follow the flow of the strokes.”
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
          <button className="hangul-button-primary min-w-[360px] justify-center" onClick={checkWriting} type="button">
            <ShieldCheck className="mr-2 h-5 w-5" />
            Check My Writing
          </button>
        </HangulCard>

        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex flex-wrap gap-3">
            <StatusChip label={`Strokes: ${strokeCount} / 9`} tone="paper" />
            <StatusChip label={`Time: 0:${String(elapsed).padStart(2, '0')}`} tone="paper" />
            {score !== null ? <StatusChip label={`Score: ${score}`} tone="mint" /> : null}
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

        {feedback ? (
          <HangulCard className="p-6">
            <p className="text-lg leading-8 text-[var(--hangul-ink)]">{feedback}</p>
          </HangulCard>
        ) : null}
      </div>
    </HangulPageFrame>
  );
}

