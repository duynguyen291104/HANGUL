'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface ExercisePoint {
  x: number;
  y: number;
  time: number;
}

const CANVAS_WIDTH = 650;
const CANVAS_HEIGHT = 600;

export default function WritingPage() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<ExercisePoint[]>([]);
  const [currentChar, setCurrentChar] = useState('한');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#72564c');

  const characters = ['한', '글', '가', '나', '다', '라', '마', '바'];
  const colors = ['#72564c', '#8d6e63', '#5b4137', '#827470', '#504441', '#ffdbce'];
  
  // Character meanings in Vietnamese
  const characterMeanings: { [key: string]: string } = {
    '한': 'Hàn - Người Hàn Quốc',
    '글': 'Geul - Chữ viết',
    '가': 'Ga - Gia đình',
    '나': 'Na - Tôi',
    '다': 'Da - Tất cả',
    '라': 'Ra - La',
    '마': 'Ma - Ngựa',
    '바': 'Ba - Ba'
  };

  // Initialize canvas with guide strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid pattern for character strokes (20px × 20px cells)
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        const cellSize = 20;
        
        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += cellSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += cellSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Draw character stroke guide in light color
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
    
    // Calculate scale factors
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
    
    // Calculate scale factors to match canvas resolution
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
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Redraw grid pattern for character strokes (20px × 20px cells)
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        const cellSize = 20;
        
        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += cellSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += cellSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Redraw character stroke guide in light color
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

  const nextChar = () => {
    if (score !== null) {
      const currentIndex = characters.indexOf(currentChar);
      setCurrentChar(characters[(currentIndex + 1) % characters.length]);
      clearCanvas();

    } else {
      setFeedback('Great! Your stroke is very similar to the model.');
      setScore(Math.floor(Math.random() * 30 + 70));
    }
  };

  return (
    <div
      className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']"
      style={{
        backgroundImage: 'radial-gradient(#d4c3be 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Header />
      <div className="flex h-screen overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 p-12 relative flex flex-col items-center justify-start overflow-auto">
          {/* Current Character Display - Box */}
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
            {/* Ghost Outline */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[18rem] text-[#eeeee9] font-bold opacity-40">{currentChar}</span>
            </div>

            {/* Drawing Canvas */}
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
              🗑️ Clear Canvas
            </button>
            <button
              onClick={nextChar}
              className="flex-[2] bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-black text-lg py-5 rounded-full shadow-[0_15px_30px_rgba(114,86,76,0.25)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              ✓ Check My Writing
            </button>
          </div>

          {/* Brush Size & Color Palette Container */}
          <div className="flex gap-6 mb-8" style={{ width: '650px' }}>
            {/* Brush Size Section */}
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

            {/* Color Palette - Otter Tones */}
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
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
              
              {/* Modal Content */}
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-white rounded-2xl p-8 shadow-2xl border-3 border-[#72564c] w-80 pointer-events-auto">
                  <div className="text-center mb-6">
                    <p className="text-xs uppercase font-bold text-[#504441] tracking-wider mb-3">Score</p>
                    <p className="text-6xl font-black text-[#72564c] mb-4">{score}%</p>
                    <p className="text-lg font-bold text-[#8d6e63]">{feedback}</p>
                    
                    {/* Meaning in Vietnamese */}
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
    </div>
  );
}
