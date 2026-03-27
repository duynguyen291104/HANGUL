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

      const quizQuestions = data.data.slice(0, 20).map((vocab: any) => {
        const wrongAnswers = data.data
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

    setAnswered(true);

    if (answer === questions[currentQuestion].vietnamese) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setAnswered(false);
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
  const timeColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">⚡ Tốc Độ</h1>
            <p className="text-white/80">60 giây đếm ngược</p>
          </div>
          <button onClick={onExit} className="text-white hover:text-gray-300 text-2xl">
            ✕
          </button>
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className={`text-7xl font-bold ${timeColor} font-mono`}>
            {String(timeLeft).padStart(2, '0')}
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-4">
            <div
              className={`h-2 rounded-full transition-all ${
                timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{question.korean}</h2>
              <p className="text-gray-600">{question.english}</p>
            </div>
            <span className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-bold">
              {currentQuestion + 1}/{questions.length}
            </span>
          </div>

          <p className="text-gray-700 font-semibold mb-6">Đây là từ tiếng gì?</p>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`w-full p-4 rounded-lg font-semibold transition-all text-left ${
                  answered
                    ? option === question.vietnamese
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 hover:bg-blue-200 text-gray-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-white">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm opacity-80">Điểm</p>
              <p className="text-3xl font-bold">{score}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Đúng</p>
              <p className="text-3xl font-bold">{correctAnswers}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Tiến độ</p>
              <p className="text-3xl font-bold">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
