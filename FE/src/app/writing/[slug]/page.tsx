'use client';

import { apiCall, handwritingService, userService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ExercisePoint {
  x: number;
  y: number;
  time: number;
}

interface WordData {
  id?: number;
  korean: string;
  english: string;
  vietnamese: string;
  romanization?: string;
  topic?: string;
}

interface GuidePoint {
  x: number;
  y: number;
}

interface GuideStroke {
  order: number;
  color: string;
  labelX: number;
  labelY: number;
  duration?: number;
  points: GuidePoint[];
}

interface CharacterGuide {
  canvas: {
    width: number;
    height: number;
  };
  strokes: GuideStroke[];
}

const CANVAS_WIDTH = 650;
const CANVAS_HEIGHT = 600;

const COLORS = ['#72564c', '#8d6e63', '#5b4137', '#827470', '#504441', '#ffdbce'];

const FALLBACK_WORDS: WordData[] = [
  { korean: '한글', english: 'Hangul', vietnamese: 'Chữ Hàn', romanization: 'Han-geul', topic: 'Writing Practice' },
  { korean: '안녕', english: 'Hello', vietnamese: 'Xin chào', romanization: 'An-nyeong', topic: 'Writing Practice' },
  { korean: '가방', english: 'Bag', vietnamese: 'Cặp / túi', romanization: 'Ga-bang', topic: 'Writing Practice' },
];

const XP_PER_WORD = 20;
const MIN_PASS_SCORE = 60;

const pointsToPath = (points: GuidePoint[]) => {
  if (!points.length) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
};

const extractHangulCharacters = (value: string) =>
  Array.from(String(value || '')).filter((char) => /[가-힣]/.test(char));

const getGuideBounds = (guide: CharacterGuide) => {
  const points = guide.strokes.flatMap((stroke) => stroke.points);

  if (!points.length) {
    return {
      minX: 0,
      minY: 0,
      maxX: guide.canvas.width,
      maxY: guide.canvas.height,
    };
  }

  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
};

const shiftGuide = (
  guide: CharacterGuide,
  offsetX: number,
  offsetY = 0
): CharacterGuide => ({
  canvas: {
    width: guide.canvas.width,
    height: guide.canvas.height,
  },
  strokes: guide.strokes.map((stroke) => ({
    ...stroke,
    labelX: Number((stroke.labelX + offsetX).toFixed(2)),
    labelY: Number((stroke.labelY + offsetY).toFixed(2)),
    points: stroke.points.map((point) => ({
      x: Number((point.x + offsetX).toFixed(2)),
      y: Number((point.y + offsetY).toFixed(2)),
    })),
  })),
});

const buildWordGuide = (
  text: string,
  guideMap: Record<string, CharacterGuide>
): CharacterGuide | null => {
  const characters = extractHangulCharacters(text);

  if (!characters.length) {
    return null;
  }

  const guides = characters
    .map((char) => guideMap[char])
    .filter(Boolean) as CharacterGuide[];

  if (!guides.length) {
    return null;
  }

  if (guides.length === 1) {
    return guides[0];
  }

  const mergedStrokes: GuideStroke[] = [];
  const gap = characters.length >= 3 ? 10 : 14;
  const paddingX = 4;
  const paddingY = 4;

  let cursorX = paddingX;
  let nextOrder = 1;
  let maxHeight = 0;

  guides.forEach((guide, index) => {
    const bounds = getGuideBounds(guide);
    const charWidth = Math.max(bounds.maxX - bounds.minX, 1);
    const charHeight = Math.max(bounds.maxY - bounds.minY, 1);

    const shifted = shiftGuide(
      guide,
      cursorX - bounds.minX,
      paddingY - bounds.minY
    );

    shifted.strokes.forEach((stroke) => {
      mergedStrokes.push({
        ...stroke,
        order: nextOrder++,
      });
    });

    cursorX += charWidth;
    maxHeight = Math.max(maxHeight, charHeight);

    if (index < guides.length - 1) {
      cursorX += gap;
    }
  });

  return {
    canvas: {
      width: Math.max(cursorX + paddingX, 100),
      height: Math.max(maxHeight + paddingY * 2, 100),
    },
    strokes: mergedStrokes,
  };
};

const getTraceFontSize = (text: string) => {
  const length = extractHangulCharacters(text).length;
  if (length >= 4) return '8rem';
  if (length === 3) return '10rem';
  if (length === 2) return '12rem';
  return '16rem';
};

const getTraceLetterSpacing = (text: string) => {
  const length = extractHangulCharacters(text).length;
  if (length >= 3) return '0.14em';
  if (length === 2) return '0.18em';
  return '0';
};

function StrokeGuidePreview({
  guide,
  replayKey,
}: {
  guide: CharacterGuide | null;
  replayKey: number;
}) {
  if (!guide) {
    return (
      <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-[#72564c]/30">
        ?
      </div>
    );
  }

  let accumulatedDelay = 0;

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes draw-stroke {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes fade-in-guide-label {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <svg
        key={replayKey}
        viewBox={`0 0 ${guide.canvas.width} ${guide.canvas.height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1="0"
          y1={guide.canvas.height / 2}
          x2={guide.canvas.width}
          y2={guide.canvas.height / 2}
          stroke="#cbd5e1"
          strokeDasharray="4 4"
        />

        {guide.strokes.map((stroke, index) => {
          const delay = accumulatedDelay;
          const duration = stroke.duration ?? 0.55;
          accumulatedDelay += duration + 0.12;

          return (
            <g key={`${stroke.order}-${index}`}>
              <path
                d={pointsToPath(stroke.points)}
                fill="none"
                stroke={stroke.color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100}
                style={{
                  animation: `draw-stroke ${duration}s ease forwards`,
                  animationDelay: `${delay}s`,
                }}
              />
              <text
                x={stroke.labelX}
                y={stroke.labelY}
                fill={stroke.color}
                fontSize="7"
                fontWeight="700"
                style={{
                  opacity: 0,
                  animation: `fade-in-guide-label 0.2s ease forwards`,
                  animationDelay: `${delay}s`,
                }}
              >
                {stroke.order}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function WritingPage() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeGroupsRef = useRef<ExercisePoint[][]>([]);
  const startedAtRef = useRef<number | null>(null);
  const rewardedWordsRef = useRef<Set<string>>(new Set());

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [earnedXp, setEarnedXp] = useState(0);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vocabularyList, setVocabularyList] = useState<WordData[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guidesByCharacter, setGuidesByCharacter] = useState<Record<string, CharacterGuide>>({});
  const [guideReplayKey, setGuideReplayKey] = useState(0);

  const currentWord = vocabularyList[currentWordIndex] || null;
  const currentText = currentWord?.korean || '';
  const currentGuide = buildWordGuide(currentText, guidesByCharacter);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const resetAttemptState = () => {
    strokeGroupsRef.current = [];
    startedAtRef.current = null;
    setIsDrawing(false);
    setFeedback('');
    setScore(null);
    setSuggestions([]);
    setEarnedXp(0);
    setIsSubmitting(false);
  };

  const fetchWritingVocabulary = async (level: string) => {
    const response = await fetch(`/api/pronunciation/vocabulary/${level.toUpperCase()}?limit=20`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Không tải được danh sách từ vựng (${response.status}).`);
    }

    const data = await response.json();

    if (!Array.isArray(data?.vocabulary) || data.vocabulary.length === 0) {
      return FALLBACK_WORDS;
    }

    const formattedWords: WordData[] = data.vocabulary
      .map((item: any) => ({
        id: item.id,
        korean: item.korean,
        english: item.english,
        vietnamese: item.vietnamese,
        romanization: item.romanization || item.korean,
        topic: item.topic,
      }))
      .filter((item: WordData) => extractHangulCharacters(item.korean).length > 0);

    return formattedWords.length ? formattedWords : FALLBACK_WORDS;
  };

  const loadWritingData = async () => {
    const level = String(user?.level || 'NEWBIE').toUpperCase();

    setIsLoadingData(true);

    let nextWords = FALLBACK_WORDS;
    let nextGuides: Record<string, CharacterGuide> = {};

    try {
      nextWords = await fetchWritingVocabulary(level);
    } catch (error) {
      console.error('Không thể tải vocabulary cho writing:', error);
    }

    try {
      const guidesResponse = await apiCall(`/handwriting/guides?level=${encodeURIComponent(level)}`);
      nextGuides = guidesResponse?.data?.guides || {};
    } catch (error) {
      console.error('Không thể tải stroke guides:', error);
    }

    setVocabularyList(nextWords);
    setGuidesByCharacter(nextGuides);
    setCurrentWordIndex(0);
    setIsLoadingData(false);
  };

  const nextWord = () => {
    if (!vocabularyList.length) return;
    setCurrentWordIndex((value) => (value + 1) % vocabularyList.length);
  };

  const rewardCurrentWordXP = async (word: WordData, nextScore: number) => {
    const rewardKey = String(word.id ?? word.korean);

    if (!user || nextScore < MIN_PASS_SCORE || rewardedWordsRef.current.has(rewardKey)) {
      return 0;
    }

    const response = await userService.addXP(XP_PER_WORD);
    rewardedWordsRef.current.add(rewardKey);

    if (response?.user) {
      const nextUser = {
        ...user,
        id: response.user.id ?? user.id,
        email: response.user.email ?? user.email,
        name: response.user.name ?? user.name,
        role: response.user.role ?? user.role,
        level: response.user.level ?? user.level,
        levelLocked: response.user.levelLocked ?? user.levelLocked,
        totalXP: response.user.totalXP ?? user.totalXP,
        trophy: response.user.trophy ?? user.trophy,
        avatar: response.user.avatar ?? user.avatar,
      };

      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
    }

    return XP_PER_WORD;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth || !user) {
      return;
    }

    void loadWritingData();
  }, [isCheckingAuth, user?.level]);

  useEffect(() => {
    if (!currentText) {
      return;
    }

    setupCanvas();
    resetAttemptState();
    setGuideReplayKey((value) => value + 1);
  }, [currentText]);

  const getCanvasPoint = (event: React.MouseEvent<HTMLCanvasElement>): ExercisePoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentText) return;

    const point = getCanvasPoint(event);

    if (startedAtRef.current === null) {
      startedAtRef.current = point.time;
    }

    strokeGroupsRef.current.push([point]);
    setIsDrawing(true);

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const point = getCanvasPoint(event);
    const ctx = canvasRef.current.getContext('2d');

    if (ctx) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    const groups = strokeGroupsRef.current;
    if (!groups.length) {
      groups.push([point]);
      return;
    }

    groups[groups.length - 1].push(point);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setupCanvas();
    resetAttemptState();
  };

  const buildExportImage = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#111111';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, brushSize + 1);

    strokeGroupsRef.current.forEach((stroke) => {
      if (!stroke.length) return;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }

      ctx.stroke();
    });

    return exportCanvas.toDataURL('image/png');
  };

  const handleCheckWriting = async () => {
    if (!currentText || !currentWord) {
      return;
    }

    const strokeGroups = strokeGroupsRef.current.filter((stroke) => stroke.length > 0);

    if (!strokeGroups.length) {
      setFeedback('Hãy viết ít nhất một nét trước khi chấm.');
      setScore(0);
      setSuggestions([]);
      setEarnedXp(0);
      return;
    }

    try {
      setIsSubmitting(true);

      const durationMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;

      const result = await handwritingService.submit({
        character: currentText,
        expectedStrokes: currentGuide?.strokes.length || undefined,
        level: user?.level || 'NEWBIE',
        imageBase64: buildExportImage(),
        drawingData: {
          strokes: strokeGroups,
          strokeCount: strokeGroups.length,
          durationMs,
          canvas: {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          },
        },
        topicName: currentWord.topic || 'Handwriting Practice',
      });

      const nextScore = Number(result?.data?.score ?? 0) || 0;
      const nextSuggestions = Array.isArray(result?.data?.suggestions)
        ? result.data.suggestions
        : [];
      let nextFeedback = result?.data?.feedback || 'Đã chấm xong bài viết.';
      let xpAwarded = 0;

      if (nextScore >= MIN_PASS_SCORE) {
        try {
          xpAwarded = await rewardCurrentWordXP(currentWord, nextScore);
          if (xpAwarded > 0) {
            nextFeedback = `${nextFeedback} (+${xpAwarded} XP)`;
          }
        } catch (xpError) {
          console.error('Không thể cộng XP cho writing:', xpError);
        }
      }

      setFeedback(nextFeedback);
      setScore(nextScore);
      setSuggestions(nextSuggestions);
      setEarnedXp(xpAwarded);
    } catch (error: any) {
      setFeedback(error.message || 'Không thể chấm chữ viết lúc này.');
      setScore(0);
      setSuggestions([]);
      setEarnedXp(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryFromModal = () => {
    clearCanvas();
  };

  const handleNextWordFromModal = () => {
    setScore(null);
    setFeedback('');
    setSuggestions([]);
    setEarnedXp(0);
    nextWord();
  };

  if (isCheckingAuth || isLoadingData || !user || !currentText) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro'] overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(#d4c3be 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden lg:flex flex-col gap-2 py-6 bg-[#f4f4ef] w-72 h-screen sticky left-0 top-0 text-[#72564c] font-['Plus_Jakarta_Sans'] overflow-y-auto">
          <div className="px-4 mb-4">
            <Link href="/dashboard" className="flex items-center gap-3 justify-center hover:opacity-70 transition-opacity cursor-pointer">
              <img
                src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png"
                alt="HANGUL Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="text-2xl font-black text-[#72564c] tracking-tighter uppercase font-['Plus_Jakarta_Sans']">
                HANGUL
              </div>
            </Link>
          </div>

          <nav className="flex-grow flex flex-col gap-1 px-4 text-sm">
            <Link
              href="/quiz"
              className="text-[#72564c] rounded-lg mx-0 py-3 px-4 flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold"
            >
              <div className="flex flex-col">
                <span className="font-bold">Quiz</span>
                <span className="text-xs opacity-70 font-normal">Test knowledge</span>
              </div>
            </Link>

            <Link href="/camera" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Camera to Vocab</span>
                <span className="text-xs opacity-70 font-normal">Visual learning</span>
              </div>
            </Link>

            <Link href="/writing" className="text-white bg-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Writing Practice</span>
                <span className="text-xs opacity-80 font-normal">Handwriting</span>
              </div>
            </Link>

            <Link href="/pronunciation" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Pronunciation</span>
                <span className="text-xs opacity-70 font-normal">Speak & listen</span>
              </div>
            </Link>

            <Link href="/learning-map" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Learning Path</span>
                <span className="text-xs opacity-70 font-normal">Adjust level</span>
              </div>
            </Link>

            <Link href="/tournament" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Tournament</span>
                <span className="text-xs opacity-70 font-normal">Compete & rank</span>
              </div>
            </Link>
          </nav>

          <div className="px-4 mt-4 flex flex-col gap-3">
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="w-full py-3 bg-[#e8e8e3] text-[#72564c] rounded-lg font-bold hover:bg-[#d4c3be] transition-all active:scale-95 text-sm"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-12 relative flex flex-col items-center justify-start overflow-auto">
          <div
            className="fixed bg-white rounded-xl shadow-[0_40px_100px_rgba(43,22,15,0.08)] p-6 text-left z-10"
            style={{ top: '100px', left: 'calc(18rem + 100px)', width: '320px' }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#72564c]/60 font-bold">
                  Stroke Guide
                </p>

                <div className="mt-2 text-2xl font-black text-[#a84b2f]">
                  {currentWord?.korean}
                </div>

                <p className="mt-2 text-sm font-semibold text-[#8d6e63]">
                  {currentWord?.vietnamese || ''}
                </p>

                <p className="mt-1 text-xs text-[#72564c]/60">
                  Viết cả từ
                </p>
              </div>

              <button
                onClick={() => setGuideReplayKey((value) => value + 1)}
                className="w-11 h-11 rounded-xl border border-[#e5e7eb] bg-white text-[#72564c] hover:bg-[#f8fafc] transition-all"
                title="Replay stroke order"
              >
                ↻
              </button>
            </div>

            <div className="w-full h-[280px] rounded-2xl bg-[#fafaf5] border border-[#ebe5df] p-3">
              <StrokeGuidePreview guide={currentGuide} replayKey={guideReplayKey} />
            </div>
          </div>

          <div
            className="bg-white rounded-xl shadow-[0_40px_100px_rgba(43,22,15,0.08)] relative overflow-hidden flex items-center justify-center group mb-10"
            style={{ width: '650px', height: '600px' }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-70"
              style={{
                backgroundImage:
                  'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span
                className="font-bold text-[#eeeee9] opacity-40"
                style={{
                  fontSize: getTraceFontSize(currentText),
                  letterSpacing: getTraceLetterSpacing(currentText),
                }}
              >
                {currentText}
              </span>
            </div>

            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          <div className="flex gap-6 mb-8" style={{ width: '650px' }}>
            <button
              onClick={clearCanvas}
              disabled={isSubmitting}
              className="flex-1 bg-[#eeeee9] text-[#72564c] font-bold py-5 rounded-full border-b-4 border-[#d4c3be]/30 hover:bg-[#e8e8e3] transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
            >
              Clear Canvas
            </button>

            <button
              onClick={handleCheckWriting}
              disabled={isSubmitting}
              className="flex-[2] bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-black text-lg py-5 rounded-full shadow-[0_15px_30px_rgba(114,86,76,0.25)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-60"
            >
              {isSubmitting ? 'Checking...' : 'Check My Writing'}
            </button>
          </div>

          <div className="flex gap-6 mb-8" style={{ width: '650px' }}>
            <div className="flex-1 bg-white rounded-lg p-6 shadow-md">
              <span className="text-xs uppercase tracking-widest text-[#72564c]/60 block mb-4 font-bold">
                Brush Size
              </span>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setBrushSize(2)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    brushSize === 2
                      ? 'bg-gradient-to-r from-[#72564c] to-[#8d6e63] shadow-lg scale-105'
                      : 'bg-[#eeeee9] border-2 border-[#72564c]/20 hover:translate-x-1'
                  }`}
                >
                  <div className={`rounded-full ${brushSize === 2 ? 'w-2 h-2 bg-white' : 'w-1 h-1 bg-[#72564c]'}`} />
                </button>

                <button
                  onClick={() => setBrushSize(3)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    brushSize === 3
                      ? 'bg-gradient-to-r from-[#72564c] to-[#8d6e63] shadow-lg scale-105'
                      : 'bg-[#eeeee9] border-2 border-[#72564c]/20 hover:translate-x-1'
                  }`}
                >
                  <div className={`rounded-full ${brushSize === 3 ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-[#72564c]'}`} />
                </button>

                <button
                  onClick={() => setBrushSize(4)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    brushSize === 4
                      ? 'bg-gradient-to-r from-[#72564c] to-[#8d6e63] shadow-lg scale-105'
                      : 'bg-[#eeeee9] border-2 border-[#72564c]/20 hover:translate-x-1'
                  }`}
                >
                  <div className={`rounded-full ${brushSize === 4 ? 'w-5 h-5 bg-white' : 'w-3 h-3 bg-[#72564c]'}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-lg p-6 shadow-md">
              <span className="text-xs uppercase tracking-widest text-[#72564c]/60 block mb-4 font-bold">
                Otter Tones
              </span>

              <div className="grid grid-cols-6 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`aspect-square rounded-full transition-all ${
                      brushColor === color
                        ? 'scale-110 shadow-lg border-4 border-white'
                        : 'border-2 border-white/50 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {score !== null && (
            <>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-white rounded-2xl p-8 shadow-2xl border-3 border-[#72564c] w-96 pointer-events-auto">
                  <div className="text-center mb-6">
                    <p className="text-xs uppercase font-bold text-[#504441] tracking-wider mb-3">Score</p>
                    <p className="text-6xl font-black text-[#72564c] mb-4">{score}%</p>
                    <p className="text-lg font-bold text-[#8d6e63]">{feedback}</p>

                    {score >= MIN_PASS_SCORE ? (
                      <p className="mt-3 text-sm font-bold text-[#2f855a]">
                        {earnedXp > 0
                          ? `Đã cộng ${earnedXp} XP cho từ này.`
                          : 'Đạt yêu cầu. Từ này đã nhận XP trước đó rồi.'}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm font-semibold text-[#a84b2f]">
                        Cần từ {MIN_PASS_SCORE}% để nhận XP.
                      </p>
                    )}

                    {suggestions.length > 0 && (
                      <div className="mt-6 pt-6 border-t-2 border-[#f0f0f0] text-left">
                        <p className="text-xs uppercase font-bold text-[#72564c]/60 tracking-wider mb-3">
                          Suggestions
                        </p>
                        <ul className="space-y-2 text-sm text-[#72564c]">
                          {suggestions.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t-2 border-[#f0f0f0]">
                      <p className="text-xs uppercase font-bold text-[#72564c]/60 tracking-wider mb-2">
                        Current Word
                      </p>
                      <p className="text-md font-semibold text-[#72564c]">
                        {currentWord?.korean} - {currentWord?.vietnamese}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRetryFromModal}
                      className="flex-1 bg-[#eeeee9] text-[#72564c] py-4 rounded-lg font-bold hover:bg-[#e8e8e3] active:scale-95 transition-all"
                    >
                      Thử lại
                    </button>

                    <button
                      onClick={handleNextWordFromModal}
                      className="flex-1 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white py-4 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      Tiếp theo
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
