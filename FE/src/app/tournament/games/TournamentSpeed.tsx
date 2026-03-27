'use client';

import { useEffect, useState } from 'react';

interface Question {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  level: string;
}

interface TournamentSpeedProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
  userLevel: string;
}

const SPEED_GAME_TIME = 60; // 60 seconds

export default function TournamentSpeed({
  onComplete,
  onExit,
  userLevel,
}: TournamentSpeedProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SPEED_GAME_TIME);
  const [gameActive, setGameActive] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!gameActive || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameActive(false);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vocabulary/by-level/tournament?limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (!data.data || data.data.length === 0) {
        setLoading(false);
        return;
      }

      const quizQuestions = data.data.slice(0, 20).map((vocab: Question) => {
        const wrongAnswers = data.data
          .filter((v: Question) => v.id !== vocab.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((v: Question) => v.vietnamese);

        const options = [vocab.vietnamese, ...wrongAnswers].sort(
          () => Math.random() - 0.5
        );

        return {
          ...vocab,
          options,
          correctAnswer: vocab.vietnamese,
        };
      });

      setQuestions(quizQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (answered || !gameActive) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    const question = questions[currentQuestion] as any;
    if (answer === question.correctAnswer) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    }

    // Auto proceed after 500ms
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1 && gameActive) {
      setCurrentQuestion((prev) => prev + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    } else if (currentQuestion === questions.length - 1) {
      handleGameEnd();
    }
  };

  const handleGameEnd = () => {
    setGameActive(false);
    const finalScore = score + (answered && selectedAnswer === questions[currentQuestion]?.correctAnswer ? 10 : 0);
    const finalCorrect = correctAnswers + (answered && selectedAnswer === questions[currentQuestion]?.correctAnswer ? 1 : 0);
    setFinalScore(finalScore);
    setFinalCorrect(finalCorrect);
    setGameCompleted(true);
    setTimeout(() => {
      onComplete(finalScore, finalCorrect);
    }, 3000);
  };

  const startGame = () => {
    setGameActive(true);
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
            <div className="text-6xl mb-6 animate-bounce">🏆</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Hết Giờ!</h2>
            <p className="text-xl text-gray-600 mb-8">
              Bạn đã hoàn thành trò chơi tốc độ
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">✅ Trả lời đúng</p>
                <p className="text-4xl font-bold text-green-600">{finalCorrect}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">⭐ Tổng điểm</p>
                <p className="text-4xl font-bold text-yellow-600">{finalScore}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">📊 Tỷ lệ</p>
                <p className="text-4xl font-bold text-blue-600">
                  {Math.round(((finalCorrect / currentQuestion + 1) * 100))}%
                </p>
              </div>
            </div>

            <button
              onClick={() => onExit()}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-4 rounded-lg hover:shadow-lg transition-all"
            >
              ← Quay Lại Tournament Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameActive && timeLeft === SPEED_GAME_TIME) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">⚡ Tốc Độ Giải Đấu</h1>
            <button
              onClick={onExit}
              className="text-white hover:text-gray-300 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">⚡</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Trắc Nghiệm Tốc Độ
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Trả lời đúng bao nhiêu câu trong {SPEED_GAME_TIME} giây?
            </p>

            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-6 mb-8">
              <p className="text-gray-600 mb-2">Thời gian</p>
              <p className="text-5xl font-bold text-orange-600">
                {SPEED_GAME_TIME}s
              </p>
            </div>

            <ul className="text-left space-y-3 mb-8 bg-gray-50 p-6 rounded-lg">
              <li className="text-gray-700">✓ Trả lời nhanh để nhận điểm</li>
              <li className="text-gray-700">✓ Mỗi câu đúng: +10 điểm</li>
              <li className="text-gray-700">✓ Tự động chuyển câu sau 0.5s</li>
              <li className="text-gray-700">
                ✓ {questions.length} câu - Vượt qua bao nhiêu được?
              </li>
            </ul>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold py-4 rounded-lg transition-all transform hover:scale-105 text-lg"
            >
              🚀 Bắt Đầu
            </button>

            <button
              onClick={onExit}
              className="w-full bg-gray-300 text-gray-800 font-bold py-3 rounded-lg mt-4 hover:bg-gray-400"
            >
              Quay Lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion] as any;
  const totalScore =
    score +
    (answered && selectedAnswer === question?.correctAnswer ? 10 : 0);
  const totalCorrect =
    correctAnswers +
    (answered && selectedAnswer === question?.correctAnswer ? 1 : 0);

  const timeBarColor =
    timeLeft > 20 ? 'from-green-400' : timeLeft > 10 ? 'from-yellow-400' : 'from-red-400';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with Timer */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">⚡ Tốc Độ</h1>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-white text-sm opacity-80">Thời gian</p>
              <p
                className={`text-4xl font-bold ${
                  timeLeft > 20
                    ? 'text-green-300'
                    : timeLeft > 10
                    ? 'text-yellow-300'
                    : 'text-red-300'
                }`}
              >
                {timeLeft}s
              </p>
            </div>
            <button
              onClick={onExit}
              className="text-white hover:text-gray-300 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-lg p-4 mb-6 backdrop-blur">
          <div className="flex justify-between text-white mb-2">
            <span>Câu {currentQuestion + 1}/{questions.length}</span>
            <span className="text-yellow-300 font-bold">Điểm: {totalScore}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div
              className={`bg-gradient-to-r ${timeBarColor} to-orange-500 h-3 rounded-full transition-all duration-300`}
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {question?.korean || 'Câu hỏi'}
          </h2>
          <p className="text-gray-600 mb-8 text-lg">{question?.english || ''}</p>

          {/* Options */}
          <div className="space-y-2">
            {question?.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={answered || !gameActive}
                className={`w-full p-3 rounded-lg font-semibold transition-all text-left ${
                  selectedAnswer === option
                    ? option === question?.correctAnswer
                      ? 'bg-green-500 text-white scale-105 shadow-lg'
                      : 'bg-red-500 text-white scale-105 shadow-lg'
                    : answered
                    ? option === question?.correctAnswer
                      ? 'bg-green-100 text-green-900 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 hover:bg-blue-200 text-gray-800 cursor-pointer'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-80">✅ Trả lời đúng</p>
              <p className="text-3xl font-bold text-green-300">{totalCorrect}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">⭐ Tổng điểm</p>
              <p className="text-3xl font-bold text-yellow-300">{totalScore}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
