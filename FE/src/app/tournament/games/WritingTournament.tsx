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

      if (!data || !Array.isArray(data.data)) {
        console.error('Invalid API response:', data);
        setLoading(false);
        return;
      }

      setQuestions(data.data.slice(0, 10));
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
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">✍️ Viết</h1>
          <button onClick={onExit} className="text-white hover:text-gray-300 text-2xl">
            ✕
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <p className="text-gray-600 mb-4">Nhập tiếng Việt của từ Hàn Quốc</p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => playAudio(question.korean)}
              disabled={playing}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg"
            >
              {playing ? '🔊 Đang phát...' : '🔊 Nghe'}
            </button>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-lg"
            >
              💡 Gợi ý
            </button>
          </div>

          {showHint && (
            <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded-lg mb-6">
              <p className="text-gray-800 font-semibold">
                💬 Phiên âm: {question.romanization || 'N/A'}
              </p>
            </div>
          )}

          <div>
            <p className="text-2xl font-bold text-gray-800 mb-4">
              {question.korean} = ?
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
