'use client';

import { useEffect, useState } from 'react';

interface Question {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  options: string[];
}

interface QuizTournamentProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

export default function QuizTournament({ onComplete, onExit }: QuizTournamentProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

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

      const quizQuestions = data.data.slice(0, 10).map((vocab: any) => {
        const wrongAnswers = data.data
          .slice(0, 10)
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

    setSelectedAnswer(answer);
    setAnswered(true);

    if (answer === questions[currentQuestion].vietnamese) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    } else {
      onComplete(score + (selectedAnswer === questions[currentQuestion].vietnamese ? 10 : 0), correctAnswers + (selectedAnswer === questions[currentQuestion].vietnamese ? 1 : 0));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Äang táº£i cÃ¢u há»i...</div>
      </div>
    );
  }

  // Safety check: ensure question exists
  if (questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">KhÃ´ng cÃ³ cÃ¢u há»i nÃ o</div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const totalScore = score + (answered && selectedAnswer === question?.vietnamese ? 10 : 0);
  const totalCorrect = correctAnswers + (answered && selectedAnswer === question?.vietnamese ? 1 : 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">ðŸ“– Tráº¯c Nghiá»‡m</h1>
          <button
            onClick={onExit}
            className="text-white hover:text-gray-300 text-2xl"
          >
            âœ•
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-lg p-4 mb-6 backdrop-blur">
          <div className="flex justify-between text-white mb-2">
            <span>CÃ¢u {currentQuestion + 1}/{questions.length}</span>
            <span>Äiá»ƒm: {totalScore}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {question?.korean || 'CÃ¢u há»i'}
          </h2>
          <p className="text-gray-600 mb-8">{question?.english || ''}</p>

          <p className="text-lg text-gray-700 font-semibold mb-6">
            ÄÃ¢y lÃ  tá»« tiáº¿ng gÃ¬?
          </p>

          {/* Options */}
          <div className="space-y-3">
            {question?.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`w-full p-4 rounded-lg font-semibold transition-all text-left ${
                  selectedAnswer === option
                    ? option === question?.vietnamese
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-red-500 text-white scale-105'
                    : answered
                    ? option === question?.vietnamese
                      ? 'bg-green-100 text-green-900 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 hover:bg-blue-200 text-gray-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-white mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-80">Tráº£ lá»i Ä‘Ãºng</p>
              <p className="text-3xl font-bold">{totalCorrect}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">Tá»•ng Ä‘iá»ƒm</p>
              <p className="text-3xl font-bold">{totalScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">Tiáº¿n Ä‘á»™</p>
              <p className="text-3xl font-bold">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Next Button */}
        {answered && (
          <button
            onClick={handleNext}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-lg transition-all"
          >
            {currentQuestion < questions.length - 1 ? 'CÃ¢u tiáº¿p theo â†’' : 'Káº¿t thÃºc ðŸŽ‰'}
          </button>
        )}
      </div>
    </div>
  );
}

