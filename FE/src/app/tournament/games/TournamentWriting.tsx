'use client';

import { useEffect, useState } from 'react';

interface Question {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  level: string;
}

interface TournamentWritingProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
  userLevel: string;
}

export default function TournamentWriting({
  onComplete,
  onExit,
  userLevel,
}: TournamentWritingProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vocabulary/by-level/tournament?limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (!data.data || data.data.length === 0) {
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

  const checkAnswer = () => {
    const question = questions[currentQuestion];
    const isCorrect =
      userInput.toLowerCase().trim() ===
      question.vietnamese.toLowerCase().trim();

    if (isCorrect) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    }

    setAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setAnswered(false);
      setUserInput('');
    } else {
      setGameCompleted(true);
      setTimeout(() => {
        onComplete(score, correctAnswers);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Đang tải câu hỏi...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">
          Không có câu hỏi cho cấp độ của bạn
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Hoàn Thành!</h2>
            <p className="text-xl text-gray-600 mb-8">
              Bạn đã hoàn thành bài luyện viết
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">✅ Trả lời đúng</p>
                <p className="text-4xl font-bold text-green-600">{correctAnswers}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">⭐ Tổng điểm</p>
                <p className="text-4xl font-bold text-yellow-600">{score}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">📊 Tỷ lệ</p>
                <p className="text-4xl font-bold text-blue-600">
                  {Math.round(((correctAnswers / questions.length) * 100))}%
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentGame(null)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-lg hover:shadow-lg transition-all"
            >
              ← Quay Lại Tournament Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isCorrect =
    userInput.toLowerCase().trim() ===
    question.vietnamese.toLowerCase().trim();
  const totalScore = score + (answered && isCorrect ? 10 : 0);
  const totalCorrect = correctAnswers + (answered && isCorrect ? 1 : 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">✍️ Luyện Viết Giải Đấu</h1>
          <button
            onClick={onExit}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-lg p-4 mb-6 backdrop-blur">
          <div className="flex justify-between text-white mb-2">
            <span>Câu {currentQuestion + 1}/{questions.length}</span>
            <span className="text-yellow-300 font-bold">Điểm: {totalScore}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full">
              Cấp độ: {question.level}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {question?.korean || 'Câu hỏi'}
          </h2>
          <p className="text-gray-600 mb-8 text-lg">{question?.english || ''}</p>

          <p className="text-lg text-gray-700 font-semibold mb-6">
            Nhập tiếng Việt tương ứng:
          </p>

          {/* Input Field */}
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={answered}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !answered) {
                checkAnswer();
              }
            }}
            placeholder="Nhập đáp án của bạn..."
            className={`w-full p-4 rounded-lg border-2 text-lg mb-6 font-semibold transition-all ${
              answered
                ? isCorrect
                  ? 'border-green-500 bg-green-50 text-gray-800'
                  : 'border-red-500 bg-red-50 text-gray-800'
                : 'border-gray-300 bg-white text-gray-800 focus:border-orange-400 focus:outline-none'
            }`}
          />

          {/* Feedback */}
          {answered && (
            <div
              className={`p-4 rounded-lg mb-6 text-center font-bold ${
                isCorrect
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isCorrect ? (
                <>✅ Chính xác! Đáp án: {question.vietnamese}</>
              ) : (
                <>❌ Sai rồi! Đáp án đúng: {question.vietnamese}</>
              )}
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-white mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-80">✅ Trả lời đúng</p>
              <p className="text-3xl font-bold text-green-300">{totalCorrect}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">⭐ Tổng điểm</p>
              <p className="text-3xl font-bold text-yellow-300">{totalScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">📊 Tiến độ</p>
              <p className="text-3xl font-bold text-blue-300">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!answered ? (
          <button
            onClick={checkAnswer}
            disabled={!userInput.trim()}
            className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Kiểm Tra
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105"
          >
            {currentQuestion < questions.length - 1
              ? '➜ Câu tiếp theo'
              : '🎉 Hoàn thành'}
          </button>
        )}
      </div>
    </div>
  );
}
