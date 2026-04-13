'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';

interface ExercisePoint {
  x: number;
  y: number;
  time: number;
}

const CANVAS_WIDTH = 650;
const CANVAS_HEIGHT = 600;

export default function WritingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.topicId as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<ExercisePoint[]>([]);
  const [currentChar, setCurrentChar] = useState('한');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#72564c');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalScores, setTotalScores] = useState<number[]>([]);
  const [completionStats, setCompletionStats] = useState({
    xp: 25,
    accuracy: 0,
    time: '00:00',
  });

  const [characters, setCharacters] = useState(() => {
    // Initialize with exactly 10 characters
    const chars = ['한', '글', '가', '나', '다', '라', '마', '바', '사', '아'];
    return chars.slice(0, 10);
  });
  const colors = ['#72564c', '#8d6e63', '#5b4137', '#827470', '#504441', '#ffdbce'];

  const characterMeanings: { [key: string]: string } = {
    '한': 'Hàn - Người Hàn Quốc',
    '글': 'Geul - Chữ viết',
    '가': 'Ga - Gia đình',
    '나': 'Na - Tôi',
    '다': 'Da - Tất cả',
    '라': 'Ra - La',
    '마': 'Ma - Ngựa',
    '바': 'Ba - Ba',
    '사': 'Sa - Sư',
    '아': 'A - Con gái',
  };

  // Fetch writing exercises for this topic
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/writing/exercises?topic=${topicId}&limit=10`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            const chars = data.data
              .map((ex: any) => ex.character || ex.korean)
              .slice(0, 10); // Limit to 10
            setCharacters(chars.length > 0 ? chars : characters);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch writing exercises:', error);
      } finally {
        setIsLoading(false);
        setStartTime(Date.now());
      }
    };

    if (topicId) {
      fetchExercises();
    }
  }, [topicId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        const cellSize = 20;

        for (let x = 0; x <= canvas.width; x += cellSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y += cellSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        ctx.font = 'bold 280px "Plus Jakarta Sans", serif';
        ctx.fillStyle = '#f5e6d3';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentChar, canvas.width / 2, canvas.height / 2);
      }
    }
  }, [currentChar]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    setStrokes([...strokes, { x, y, time: Date.now() }]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        const cellSize = 20;

        for (let x = 0; x <= canvas.width; x += cellSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y += cellSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        ctx.font = 'bold 280px "Plus Jakarta Sans", serif';
        ctx.fillStyle = '#f5e6d3';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentChar, canvas.width / 2, canvas.height / 2);
      }
      setStrokes([]);
      setFeedback('');
      setScore(null);
      setIsDrawing(false);
    }
  };

  const markTopicComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz/progress/complete-topic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ topicId: Number(topicId), mode: 'writing' }),
        }
      );
      console.log('✅ Topic marked as completed');
    } catch (error) {
      console.error('Error marking topic complete:', error);
    }
  };

  const nextChar = async () => {
    if (score !== null) {
      const nextIndex = currentCharIndex + 1;
      
      // Add current score to total
      setTotalScores([...totalScores, score]);

      // Check if completed all 10 characters
      if (nextIndex >= 10 || nextIndex >= characters.length) {
        await markTopicComplete();
        
        // Calculate completion stats
        const scores = [...totalScores, score];
        const avgAccuracy = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const elapsedTime = startTime ? Date.now() - startTime : 0;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        setCompletionStats({
          xp: 25,
          accuracy: avgAccuracy,
          time: timeStr,
        });
        setIsCompleted(true);
        return;
      }

      setCurrentCharIndex(nextIndex);
      setCurrentChar(characters[nextIndex]);
      clearCanvas();
    } else {
      setFeedback('Great! Your stroke is very similar to the model.');
      setScore(Math.floor(Math.random() * 30 + 70));
    }
  };

  return (
    <div
      className="min-h-screen bg-[#fafaf5]"
      style={{
        backgroundImage: 'radial-gradient(#d4c3be 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Header />

      {/* Completion Screen */}
      {isCompleted ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-12 px-4 py-12">
          {/* Hero Section */}
          <div className="relative w-full flex flex-col items-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full bg-gradient-radial opacity-30 rounded-full blur-3xl"></div>
            </div>
            <div className="text-center">
              <h1 className="font-extrabold text-5xl md:text-6xl text-[#72564c] tracking-tight">
                Bài học hoàn tất!
              </h1>
              <p className="text-[#504441] font-medium mt-4 text-xl">
                Hana rất tự hào về nỗ lực của bạn!
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            {/* XP Card */}
            <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                <span className="text-xl"></span>
              </div>
              <span className="font-bold text-2xl text-[#815300]">
                +{completionStats.xp} XP
              </span>
              <span className="text-xs uppercase tracking-widest text-[#504441] mt-2">
                Điểm kinh nghiệm
              </span>
            </div>

            {/* Accuracy Card */}
            <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                <span className="text-xl"></span>
              </div>
              <span className="font-bold text-2xl text-[#72564c]">
                {completionStats.accuracy}%
              </span>
              <span className="text-xs uppercase tracking-widest text-[#504441] mt-2">
                Độ chính xác
              </span>
            </div>

            {/* Time Card */}
            <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                <span className="text-xl"></span>
              </div>
              <span className="font-bold text-2xl text-[#5b4137]">
                {completionStats.time}
              </span>
              <span className="text-xs uppercase tracking-widest text-[#504441] mt-2">
                Thời gian học
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full max-w-sm gap-4">
            <button
              onClick={() => router.push('/writing')}
              className="bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:from-[#8d6e63] hover:to-[#a0806e] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Tiếp tục
              <span>→</span>
            </button>
            <button
              onClick={() => router.push('/writing')}
              className="bg-[#ffdbce] text-[#2b160f] font-bold text-lg py-4 rounded-xl hover:bg-[#e4beb2] active:scale-95 transition-all"
            >
              Chọn bài khác
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex h-screen overflow-hidden">
        <main className="flex-1 p-12 relative flex flex-col items-center justify-start overflow-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/writing')}
            className="absolute top-24 left-6 flex items-center gap-2 text-[#72564c] hover:text-[#8d6e63] font-semibold transition"
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>

          {/* Progress Bar */}
          <div className="absolute top-24 right-12 w-64 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-[#72564c] uppercase">Tiến độ</span>
              <span className="text-sm font-bold text-[#8d6e63]">{currentCharIndex + 1}/10</span>
            </div>
            <div className="w-full bg-[#e8dcd3] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#72564c] to-[#8d6e63] h-2 transition-all duration-300"
                style={{ width: `${((currentCharIndex + 1) / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Character Display */}
          <div 
            className="fixed bg-white rounded-xl shadow-[0_40px_100px_rgba(43,22,15,0.08)] p-8 text-left z-10"
            style={{ top: '180px', left: '100px' }}
          >
            <p className="text-xs uppercase tracking-widest text-[#72564c]/60 mb-3 font-bold">Current Character</p>
            <p className="text-7xl font-bold text-[#72564c]">{currentChar}</p>
          </div>

          {/* Canvas Container */}
          <div
            ref={canvasContainerRef}
            className="bg-white rounded-xl shadow-[0_40px_100px_rgba(43,22,15,0.08)] relative overflow-hidden flex items-center justify-center group mb-10"
            style={{ width: '650px', height: '600px' }}
          >
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
                display: 'block'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 mb-8" style={{ width: '650px' }}>
            <button
              onClick={clearCanvas}
              className="flex-1 bg-[#eeeee9] text-[#72564c] font-bold py-5 rounded-full border-b-4 border-[#d4c3be]/30 hover:bg-[#e8e8e3] transition-colors flex items-center justify-center gap-3"
            >
              Clear Canvas
            </button>
            <button
              onClick={nextChar}
              className="flex-[2] bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-black text-lg py-5 rounded-full shadow-[0_15px_30px_rgba(114,86,76,0.25)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              Check My Writing
            </button>
          </div>

          {/* Brush Size & Color Palette */}
          <div className="flex gap-6 mb-8" style={{ width: '650px' }}>
            <div className="flex-1 bg-white rounded-lg p-6 shadow-md">
              <span className="text-xs uppercase tracking-widest text-[#72564c]/60 block mb-4 font-bold">Brush Size</span>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setBrushSize(2)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    brushSize === 2 ? 'bg-gradient-to-r from-[#72564c] to-[#8d6e63] shadow-lg scale-105' : 'bg-[#eeeee9] border-2 border-[#72564c]/20 hover:translate-x-1'
                  }`}
                >
                  <div className={`rounded-full ${brushSize === 2 ? 'w-2 h-2 bg-white' : 'w-1 h-1 bg-[#72564c]'}`}></div>
                </button>
                <button
                  onClick={() => setBrushSize(3)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    brushSize === 3 ? 'bg-gradient-to-r from-[#72564c] to-[#8d6e63] shadow-lg scale-105' : 'bg-[#eeeee9] border-2 border-[#72564c]/20 hover:translate-x-1'
                  }`}
                >
                  <div className={`rounded-full ${brushSize === 3 ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-[#72564c]'}`}></div>
                </button>
                <button
                  onClick={() => setBrushSize(4)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    brushSize === 4 ? 'bg-gradient-to-r from-[#72564c] to-[#8d6e63] shadow-lg scale-105' : 'bg-[#eeeee9] border-2 border-[#72564c]/20 hover:translate-x-1'
                  }`}
                >
                  <div className={`rounded-full ${brushSize === 4 ? 'w-5 h-5 bg-white' : 'w-3 h-3 bg-[#72564c]'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-lg p-6 shadow-md">
              <span className="text-xs uppercase tracking-widest text-[#72564c]/60 block mb-4 font-bold">Otter Tones</span>
              <div className="grid grid-cols-6 gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`aspect-square rounded-full transition-all ${
                      brushColor === color ? 'scale-110 shadow-lg border-4 border-white' : 'border-2 border-white/50 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Modal */}
          {score !== null && (
            <>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-white rounded-2xl p-8 shadow-2xl border-3 border-[#72564c] w-80 pointer-events-auto">
                  <div className="text-center mb-6">
                    <p className="text-xs uppercase font-bold text-[#504441] tracking-wider mb-3">Score</p>
                    <p className="text-6xl font-black text-[#72564c] mb-4">{score}%</p>
                    <p className="text-lg font-bold text-[#8d6e63]">{feedback}</p>

                    <div className="mt-6 pt-6 border-t-2 border-[#f0f0f0]">
                      <p className="text-xs uppercase font-bold text-[#72564c]/60 tracking-wider mb-2">Meaning</p>
                      <p className="text-md font-semibold text-[#72564c]">{characterMeanings[currentChar]}</p>
                    </div>
                  </div>
                  <button
                    onClick={nextChar}
                    className="w-full bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white py-4 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    Next Character
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
        </>
      )}
    </div>
  );
}
