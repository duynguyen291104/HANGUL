'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PronunciationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [_word] = useState('안녕하세요');
  const [scores, setScores] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState(0);

  const words = [
    { korean: '안녕하세요', english: 'Xin chào', pronunciation: 'An-nyeong-ha-se-yo' },
    { korean: '감사합니다', english: 'Cảm ơn', pronunciation: 'Gam-sa-ham-ni-da' },
    { korean: '미안합니다', english: 'Xin lỗi', pronunciation: 'Mi-an-ham-ni-da' },
    { korean: '예', english: 'Vâng', pronunciation: 'Ye' },
    { korean: '아니오', english: 'Không', pronunciation: 'A-ni-o' },
  ];

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Mock feedback
        setScores({
          pronunciation: Math.floor(Math.random() * 30 + 70),
          confidence: Math.floor(Math.random() * 20 + 80),
          feedback: 'Phát âm rất tốt! Hãy tiếp tục luyện tập.'
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Lỗi truy cập microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const nextWord = () => {
    setWordIndex((wordIndex + 1) % words.length);
    setAudioUrl(null);
    setScores(null);
  };

  const currentWordData = words[wordIndex];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f1e8 0%, #ede4d3 100%)' }}>
      <div className="flex">
        {/* Sidebar */}
        <aside style={{ background: '#2d5d4d', width: '280px', minHeight: '100vh' }} className="sticky top-0 p-6 text-white">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl">←</span>
            <span className="font-semibold">Quay lại</span>
          </Link>
          <h2 className="text-xl font-bold mb-4">🎤 Phát âm</h2>
          <p className="text-sm opacity-75">Luyện phát âm tiếng Hàn chuẩn.</p>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#2d3436] mb-2">🎤 Luyện phát âm</h1>
              <p className="text-[#636e72]">Ghi âm tiếng nói của bạn để kiểm tra phát âm.</p>
            </div>

            {/* Main Card */}
            <div style={{ background: 'white', borderRadius: '20px' }} className="shadow-sm p-12 text-center mb-8">
              {/* Word Display */}
              <p className="text-sm text-[#636e72] mb-4 font-semibold">TỪ CẦN LUY ỆN</p>
              <p style={{ color: '#2d5d4d' }} className="text-5xl font-bold mb-6">{currentWordData.korean}</p>
              <p className="text-lg text-[#636e72] mb-4">{currentWordData.english}</p>
              <p className="text-sm text-[#a8d5ba] font-semibold mb-8">Phát âm: {currentWordData.pronunciation}</p>

              {/* Recording Button */}
              <div className="mb-8">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className="relative inline-block mb-4"
                >
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      background: isRecording ? '#e74c3c' : '#2d5d4d',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '48px',
                      transition: 'all 0.3s ease',
                      opacity: isRecording ? 0.8 : 1,
                      animation: isRecording ? 'pulse 1s infinite' : 'none',
                      boxShadow: isRecording ? '0 0 30px rgba(231, 76, 60, 0.5)' : '0 4px 15px rgba(45, 93, 77, 0.2)',
                    }}
                  >
                    {isRecording ? '⏹️' : '🎤'}
                  </div>
                </button>
                <p className="text-sm text-[#636e72] font-semibold">
                  {isRecording ? 'Đang ghi âm...' : 'Nhấn để bắt đầu ghi âm'}
                </p>
              </div>

              {/* Audio Playback */}
              {audioUrl && (
                <div className="mb-8 text-center">
                  <p className="text-sm text-[#636e72] mb-3 font-semibold">GHI ÂM CỦA BẠN</p>
                  <audio
                    src={audioUrl}
                    controls
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}

              {/* Feedback */}
              {scores && (
                <div style={{ background: '#f5f1e8', borderRadius: '16px' }} className="p-6 mb-8 text-left">
                  <p className="font-semibold text-[#2d3436] mb-4 text-center">Đánh giá của bạn</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p style={{ color: '#2d5d4d' }} className="text-3xl font-bold">{scores.pronunciation}</p>
                      <p className="text-xs text-[#636e72] mt-1">Phát âm</p>
                    </div>
                    <div className="text-center">
                      <p style={{ color: '#2d5d4d' }} className="text-3xl font-bold">{scores.confidence}%</p>
                      <p className="text-xs text-[#636e72] mt-1">Độ tự tin</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#636e72] text-center italic">"{scores.feedback}"</p>
                </div>
              )}

              {/* Button */}
              <button
                onClick={nextWord}
                className="px-8 py-3 rounded-lg font-semibold text-white transition w-full"
                style={{ background: '#2d5d4d' }}
              >
                ➜ Từ tiếp theo
              </button>
            </div>

            {/* Word List */}
            <div>
              <p className="text-sm text-[#636e72] mb-4 font-semibold">CÁC TỪ CÓN LẠI</p>
              <div className="grid grid-cols-1 gap-3">
                {words.map((w, idx) => (
                  <button
                    key={idx}
                    onClick={() => setWordIndex(idx)}
                    className="text-left p-4 rounded-lg transition"
                    style={{
                      background: idx === wordIndex ? '#2d5d4d' : 'white',
                      color: idx === wordIndex ? 'white' : '#2d3436',
                      border: `2px solid ${idx === wordIndex ? '#2d5d4d' : '#a8d5ba'}`,
                    }}
                  >
                    <p className="font-semibold">{w.korean}</p>
                    <p className="text-sm opacity-75">{w.english}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
