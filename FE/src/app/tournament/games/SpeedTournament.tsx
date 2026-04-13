'use client';

import { useEffect, useState } from 'react';

interface Question {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  options: string[];
}

interface SpeedTournamentProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

export default function SpeedTournament({ onComplete, onExit }: SpeedTournamentProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vocabulary?limit=20`, {
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

      const quizQuestions = vocabArray.slice(0, 20).map((vocab: any) => {
        const wrongAnswers = vocabArray
          .filter((v: any) => v.id !== vocab.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((v: any) => v.vietnamese);

        const options = [vocab.vietnamese, ...wrongAnswers].sort(
          () => Math.random() - 0.5
        );

        return {
          id: vocab.id,
          korean: vocab.korean,
          english: vocab.english,
          vietnamese: vocab.vietnamese,
          options,
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
    if (answered) return;

    const correct = answer === questions[currentQuestion].vietnamese;
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setAnswered(false);
        setSelectedAnswer(null);
        setIsCorrect(false);
      } else {
        finishGame();
      }
    }, 500);
  };

  const finishGame = () => {
    onComplete(score, correctAnswers);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="flex justify-center items-center min-h-screen text-white">Không có câu hỏi</div>;
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen p-6 bg-[#fafaf5]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl"></span>
              <h1 className="text-3xl font-bold text-[#72564c]">Tốc Độ</h1>
            </div>
            <p className="text-[#8d6e63] text-sm">{String(timeLeft).padStart(2, '0')} giây đếm ngược</p>
          </div>
          <button onClick={onExit} className="text-[#72564c] hover:bg-[#f0e6e0] p-3 rounded-lg transition-all text-2xl">
            ✕
          </button>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <p className="text-[#8d6e63] text-sm mb-2 font-medium">Đây là từ tiếng gì?</p>
              <h2 className="text-4xl font-bold text-[#72564c] mb-2">{question.korean}</h2>
              <p className="text-[#8d6e63]">{question.english}</p>
            </div>
            <div className="bg-gradient-to-br from-[#72564c] to-[#8d6e63] text-white rounded-xl p-4 text-center">
              <p className="text-xs opacity-75">Từ</p>
              <p className="text-2xl font-bold">{currentQuestion + 1}/{questions.length}</p>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="mb-6">
            <div className="w-full bg-[#e8dcd4] rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-gradient-to-r from-[#72564c] to-[#8d6e63]'
                }`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`p-4 rounded-lg font-bold transition-all ${
                  answered && option === selectedAnswer
                    ? isCorrect
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-red-100 text-red-700 border-2 border-red-500'
                    : answered && option === question.vietnamese && !isCorrect
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-[#f0e6e0] text-[#72564c] hover:bg-[#e8dcd4] border-2 border-transparent active:scale-95'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {answered && (
            <div className={`p-4 rounded-lg text-center font-bold mb-6 ${
              isCorrect
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-red-100 text-red-700 border-2 border-red-500'
            }`}>
              {isCorrect ? '✓ Chính xác!' : '✗ Sai rồi!'}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Điểm</p>
              <p className="text-3xl font-bold text-[#72564c]">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Đúng</p>
              <p className="text-3xl font-bold text-[#72564c]">{correctAnswers}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Tiến độ</p>
              <p className="text-3xl font-bold text-[#72564c]">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
