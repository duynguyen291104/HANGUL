'use client';

import { useEffect, useState } from 'react';

interface Vocabulary {
  id: number;
  korean: string;
  vietnamese: string;
  romanization?: string;
}

interface WritingTournamentProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

export default function WritingTournament({ onComplete, onExit }: WritingTournamentProps) {
  const [questions, setQuestions] = useState<Vocabulary[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vocabulary?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Handle both response formats: direct array or {data: array}
      const vocabArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : null);

      if (!vocabArray || vocabArray.length === 0) {
        console.error('Invalid API response:', data);
        setLoading(false);
        return;
      }

      setQuestions(vocabArray.slice(0, 10));
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoading(false);
    }
  };

  const playAudio = async (text: string) => {
    setPlaying(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pronunciation/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setPlaying(false);
    }
  };

  const handleSubmit = () => {
    if (answered) return;

    setAnswered(true);
    const isCorrect = userInput.trim().toLowerCase() === questions[currentQuestion].vietnamese.toLowerCase();

    if (isCorrect) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setAnswered(false);
      setUserInput('');
      setShowHint(false);
    } else {
      onComplete(score, correctAnswers);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-white text-xl">Đang tải...</div>;
  }

  if (questions.length === 0 || !questions[currentQuestion]) {
    return <div className="flex justify-center items-center min-h-screen text-white text-xl">Không có dữ liệu</div>;
  }

  const question = questions[currentQuestion];
  const isCorrect = userInput.trim().toLowerCase() === question.vietnamese.toLowerCase();

  return (
    <div className="min-h-screen p-6 bg-[#fafaf5] font-['Be_Vietnam_Pro']">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">✍️</span>
              <h1 className="text-3xl font-bold text-[#72564c]">Viết</h1>
            </div>
            <p className="text-[#8d6e63] text-sm">Luyện viết từ vựng</p>
          </div>
          <button onClick={onExit} className="text-[#72564c] hover:bg-[#f0e6e0] p-3 rounded-lg transition-all text-2xl">
            ✕
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <p className="text-[#8d6e63] text-sm mb-3 font-medium">Nhập tiếng Việt của từ Hàn Quốc</p>
            <div className="flex gap-3">
              <button
                onClick={() => playAudio(question.korean)}
                disabled={playing}
                className="flex-1 bg-gradient-to-r from-[#72564c] to-[#8d6e63] hover:opacity-90 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
              >
                {playing ? '🔊 Đang phát...' : '🔊 Nghe'}
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex-1 bg-[#f0e6e0] hover:bg-[#e8dcd4] text-[#72564c] font-bold py-3 rounded-lg transition-all active:scale-95"
              >
                💡 Gợi ý
              </button>
            </div>
          </div>

          {showHint && (
            <div className="bg-[#fff8f0] border-2 border-[#e8dcd4] p-4 rounded-lg mb-6">
              <p className="text-[#72564c] font-semibold">
                Phiên âm: <span className="text-[#8d6e63]">{question.romanization || 'N/A'}</span>
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-[#72564c] mb-2">{question.korean}</p>
              <p className="text-[#8d6e63]">=?</p>
            </div>
          </div>

          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !answered && handleSubmit()}
            placeholder="Nhập từ tiếng Việt tại đây..."
            disabled={answered}
            className="w-full px-4 py-3 mb-4 border-2 border-[#e8dcd4] rounded-lg focus:outline-none focus:border-[#72564c] text-[#72564c] placeholder-[#8d6e63]"
          />

          {answered && (
            <div className={`p-4 rounded-lg text-center font-bold mb-6 ${
              isCorrect
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-red-100 text-red-700 border-2 border-red-500'
            }`}>
              {isCorrect ? '✓ Chính xác! Đáp án đúng: ' + question.vietnamese : '✗ Sai! Đáp án đúng: ' + question.vietnamese}
            </div>
          )}

          <div className="flex gap-3">
            {!answered ? (
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all active:scale-95"
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all active:scale-95"
              >
                {currentQuestion < questions.length - 1 ? 'Tiếp tục' : 'Hoàn thành'}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#e8dcd4]">
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Điểm</p>
              <p className="text-2xl font-bold text-[#72564c]">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Đúng</p>
              <p className="text-2xl font-bold text-[#72564c]">{correctAnswers}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Từ</p>
              <p className="text-2xl font-bold text-[#72564c]">{currentQuestion + 1}/{questions.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
            </p>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !answered && handleSubmit()}
              disabled={answered}
              placeholder="Nhập câu trả lời..."
              className="w-full p-4 border-2 border-gray-300 rounded-lg mb-4 text-lg focus:outline-none focus:border-blue-500"
            />

            {answered && (
              <div
                className={`p-4 rounded-lg font-semibold ${
                  isCorrect
                    ? 'bg-green-100 text-green-900 border-2 border-green-500'
                    : 'bg-red-100 text-red-900 border-2 border-red-500'
                }`}
              >
                {isCorrect ? `✅ Đúng! Đáp án: ${question.vietnamese}` : `❌ Sai! Đáp án: ${question.vietnamese}`}
              </div>
            )}
          </div>
        </div>

        {!answered && (
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg"
          >
            Kiểm tra
          </button>
        )}

        {answered && (
          <button
            onClick={handleNext}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-lg"
          >
            {currentQuestion < questions.length - 1 ? 'Tiếp →' : 'Kết thúc 🎉'}
          </button>
        )}
      </div>
    </div>
  );
}
