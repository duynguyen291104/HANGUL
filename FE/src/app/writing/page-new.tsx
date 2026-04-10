'use client';

import { handwritingService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ExercisePoint {
  x: number;
  y: number;
  time: number;
}

const CANVAS_WIDTH = 650;
const CANVAS_HEIGHT = 600;

const CHARACTERS = ['한', '글', '가', '나', '다', '라', '마', '바'];

const COLORS = ['#72564c', '#8d6e63', '#5b4137', '#827470', '#504441', '#ffdbce'];

const CHARACTER_MEANINGS: Record<string, string> = {
  한: 'Hàn - Hàn Quốc',
  글: 'Geul - Chữ viết',
  가: 'Ga - Gia đình',
  나: 'Na - Tôi',
  다: 'Da - Tất cả',
  라: 'Ra - La',
  마: 'Ma - Ngựa',
  바: 'Ba - Biển / thanh âm ba',
};

export default function WritingPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeGroupsRef = useRef<ExercisePoint[][]>([]);
  const startedAtRef = useRef<number | null>(null);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentChar, setCurrentChar] = useState(CHARACTERS[0]);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [canAdvance, setCanAdvance] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Chi clear để canvas trong suốt, không đổ nền trắng
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
    setCanAdvance(false);
    setIsSubmitting(false);
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
    setupCanvas();
    resetAttemptState();
  }, [currentChar]);

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
    if (!canvasRef.current) return;

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

    // Ảnh gửi BE vẫn có nền trắng
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
    const strokeGroups = strokeGroupsRef.current.filter((stroke) => stroke.length > 0);

    if (!strokeGroups.length) {
      setFeedback('Hãy viết ít nhất một nét trước khi chấm.');
      setScore(0);
      setSuggestions([]);
      setCanAdvance(false);
      return;
    }

    try {
      setIsSubmitting(true);

      const durationMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;

      const result = await handwritingService.submit({
        character: currentChar,
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
        topicName: 'Handwriting Practice',
      });

      setFeedback(result.data.feedback || 'Đã chấm xong bài viết.');
      setScore(Number(result.data.score ?? 0));
      setSuggestions(Array.isArray(result.data.suggestions) ? result.data.suggestions : []);
      setCanAdvance(true);
    } catch (error: any) {
      setFeedback(error.message || 'Không thể chấm chữ viết lúc này.');
      setScore(0);
      setSuggestions([]);
      setCanAdvance(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextCharacter = () => {
    const currentIndex = CHARACTERS.indexOf(currentChar);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % CHARACTERS.length : 0;
    setCurrentChar(CHARACTERS[nextIndex]);
  };

  const handleModalAction = () => {
    if (canAdvance) {
      nextCharacter();
      return;
    }

    setScore(null);
    setFeedback('');
    setSuggestions([]);
  };

  if (isCheckingAuth || !user) {
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
        <main className="flex-1 p-12 relative flex flex-col items-center justify-start overflow-auto">
          <div
            className="fixed bg-white rounded-xl shadow-[0_40px_100px_rgba(43,22,15,0.08)] p-8 text-left z-10"
            style={{ top: '100px', left: 'calc(18rem + 100px)' }}
          >
            <p className="text-xs uppercase tracking-widest text-[#72564c]/60 mb-3 font-bold">
              Current Character
            </p>
            <p className="text-7xl font-bold text-[#72564c]">{currentChar}</p>
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
              <span className="text-[18rem] text-[#eeeee9] font-bold opacity-40">{currentChar}</span>
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
                        Meaning
                      </p>
                      <p className="text-md font-semibold text-[#72564c]">
                        {CHARACTER_MEANINGS[currentChar]}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleModalAction}
                    className="w-full bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white py-4 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    {canAdvance ? 'Next Character' : 'Try Again'}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
