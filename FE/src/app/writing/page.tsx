'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ExercisePoint {
  x: number;
  y: number;
  time: number;
}

export default function WritingPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<ExercisePoint[]>([]);
  const [currentChar, setCurrentChar] = useState('가');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);

  const characters = ['가', '나', '다', '라', '마', '바', '사', '아'];

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setStrokes([{ x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() }]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (rect && ctx && canvas) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.strokeStyle = '#2d5d4d';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (strokes.length === 0) {
        ctx.moveTo(x, y);
      } else {
        const lastPoint = strokes[strokes.length - 1];
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      setStrokes(prev => [...prev, { x, y, time: Date.now() }]);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Mock score
    setFeedback('Tốt lắm! Nét vẽ rất giống với mẫu.');
    setScore(Math.floor(Math.random() * 30 + 70));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setStrokes([]);
      setFeedback('');
      setScore(null);
    }
  };

  const nextChar = () => {
    const currentIndex = characters.indexOf(currentChar);
    setCurrentChar(characters[(currentIndex + 1) % characters.length]);
    clearCanvas();
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f1e8 0%, #ede4d3 100%)' }}>
      <div className="flex">
        {/* Sidebar */}
        <aside style={{ background: '#2d5d4d', width: '280px', minHeight: '100vh' }} className="sticky top-0 p-6 text-white">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl">←</span>
            <span className="font-semibold">Quay lại</span>
          </Link>
          <h2 className="text-xl font-bold mb-4">✏️ Luyện viết</h2>
          <p className="text-sm opacity-75">Luyện viết chữ Hangul theo hướng dẫn.</p>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#2d3436] mb-2">✏️ Luyện viết chữ Hangul</h1>
              <p className="text-[#636e72]">Hãy viết theo mẫu để cải thiện kỹ năng viết.</p>
            </div>

            {/* Character Card */}
            <div style={{ background: 'white', borderRadius: '20px' }} className="shadow-sm p-8 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Canvas */}
                <div className="lg:col-span-2">
                  <p className="text-sm text-[#636e72] mb-3 font-semibold">VẼ CÓP THEO MẫU</p>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{
                      background: '#f9f9f9',
                      border: '2px solid #a8d5ba',
                      borderRadius: '12px',
                      cursor: 'crosshair',
                      width: '100%',
                      height: 'auto',
                      touchAction: 'none',
                    }}
                  />
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={clearCanvas}
                      className="flex-1 py-3 px-4 rounded-lg font-semibold transition"
                      style={{ background: '#e74c3c', color: 'white' }}
                    >
                      🗑️ Xóa
                    </button>
                    <button
                      onClick={nextChar}
                      className="flex-1 py-3 px-4 rounded-lg font-semibold transition"
                      style={{ background: '#2d5d4d', color: 'white' }}
                    >
                      ➜ Chữ tiếp theo
                    </button>
                  </div>
                </div>

                {/* Sample & Feedback */}
                <div>
                  <div style={{ background: '#f5f1e8', borderRadius: '16px' }} className="p-8 text-center mb-6">
                    <p className="text-sm text-[#636e72] mb-4">MẫU CHỮ</p>
                    <p style={{ color: '#2d5d4d' }} className="text-6xl font-bold mb-4">{currentChar}</p>
                    <p className="text-sm text-[#636e72]">Gamsang chữ này</p>
                  </div>

                  {score !== null && (
                    <div style={{ background: '#a8d5ba', borderRadius: '16px' }} className="p-6 text-center">
                      <p className="text-5xl font-bold text-[#2d3436] mb-3">{score}</p>
                      <p className="text-sm font-semibold text-[#2d5d4d] mb-3">Điểm</p>
                      <p className="text-xs text-[#2d5d4d] leading-relaxed">{feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Character Grid */}
            <div>
              <p className="text-sm text-[#636e72] mb-4 font-semibold">CHỌN CHỮ</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {characters.map(char => (
                  <button
                    key={char}
                    onClick={() => {
                      setCurrentChar(char);
                      clearCanvas();
                    }}
                    className="aspect-square rounded-lg font-bold text-2xl transition"
                    style={{
                      background: char === currentChar ? '#2d5d4d' : 'white',
                      color: char === currentChar ? 'white' : '#2d5d4d',
                      border: `2px solid ${char === currentChar ? '#2d5d4d' : '#a8d5ba'}`,
                    }}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
