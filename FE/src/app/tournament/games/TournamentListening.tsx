'use client';

import { useEffect, useState } from 'react';

interface Question {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  level: string;
  options: string[];
  correctAnswer: string;
}

interface TournamentListeningProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
  userLevel: string;
}

export default function TournamentListening({
  onComplete,
  onExit,
  userLevel: _userLevel,
}: TournamentListeningProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
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

      const quizQuestions = data.data.slice(0, 10).map((vocab: Question) => {
        const wrongAnswers = data.data
          .filter((v: Question) => v.id !== vocab.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((v: Question) => v.english);

        const options = [vocab.english, ...wrongAnswers].sort(
          () => Math.random() - 0.5
        );

        return {
          ...vocab,
          options,
          correctAnswer: vocab.english,
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

    const question = questions[currentQuestion]!;
    if (answer === question.correctAnswer) {
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
      const question = questions[currentQuestion]!;
      const finalScore =
        score +
        (answered && selectedAnswer === question.correctAnswer ? 10 : 0);
      const finalCorrect =
        correctAnswers +
        (answered && selectedAnswer === question.correctAnswer ? 1 : 0);
      setGameCompleted(true);
      setTimeout(() => {
        onComplete(finalScore, finalCorrect);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Äang táº£i cÃ¢u há»i...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">
          KhÃ´ng cÃ³ cÃ¢u há»i cho cáº¥p Ä‘á»™ cá»§a báº¡n
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-6 animate-bounce">ðŸŽ‰</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">HoÃ n ThÃ nh!</h2>
            <p className="text-xl text-gray-600 mb-8">
              Báº¡n Ä‘Ã£ hoÃ n thÃ nh bÃ i luyá»‡n nghe
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">âœ… Tráº£ lá»i Ä‘Ãºng</p>
                <p className="text-4xl font-bold text-green-600">{correctAnswers}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">â­ Tá»•ng Ä‘iá»ƒm</p>
                <p className="text-4xl font-bold text-yellow-600">
                  {score + (answered && selectedAnswer === questions[currentQuestion]?.correctAnswer ? 10 : 0)}
                </p>
              </div>
              <div className="bg-blue-100 rounded-lg p-6">
                <p className="text-gray-600 text-sm">ðŸ“Š Tá»· lá»‡</p>
                <p className="text-4xl font-bold text-blue-600">
                  {Math.round(((correctAnswers / questions.length) * 100))}%
                </p>
              </div>
            </div>

            <button
              onClick={() => onExit()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-lg hover:shadow-lg transition-all"
            >
              â† Quay Láº¡i Tournament Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion]!;
  const totalScore =
    score +
    (answered && selectedAnswer === question.correctAnswer ? 10 : 0);
  const totalCorrect =
    correctAnswers +
    (answered && selectedAnswer === question.correctAnswer ? 1 : 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">ðŸŽ§ Luyá»‡n Nghe Giáº£i Äáº¥u</h1>
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
            <span className="text-yellow-300 font-bold">Äiá»ƒm: {totalScore}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              Cáº¥p Ä‘á»™: {question.level}
            </span>
          </div>

          {/* Audio/Visual */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full p-8 mb-6">
              <span className="text-6xl">ðŸŽ§</span>
            </div>
            <p className="text-lg font-semibold text-gray-700">
              Nghe vÃ  chá»n tiáº¿ng Anh Ä‘Ãºng
            </p>
          </div>

          {/* Korean Text */}
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            {question?.korean || 'CÃ¢u há»i'}
          </h2>
          <p className="text-gray-600 mb-8 text-center">{question?.vietnamese || ''}</p>

          {/* Play Button */}
          <button
            onClick={() => {
              // In real app, would play audio
              alert(`Nghe: ${question?.korean}`);
            }}
            className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold py-3 rounded-lg mb-8 hover:shadow-lg transition-all"
          >
            â–¶ï¸ Báº¥m Ä‘á»ƒ nghe
          </button>

          {/* Options */}
          <div className="space-y-3">
            {question?.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`w-full p-4 rounded-lg font-semibold transition-all text-left ${
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
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-white mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-80">âœ… Tráº£ lá»i Ä‘Ãºng</p>
              <p className="text-3xl font-bold text-green-300">{totalCorrect}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">â­ Tá»•ng Ä‘iá»ƒm</p>
              <p className="text-3xl font-bold text-yellow-300">{totalScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">ðŸ“Š Tiáº¿n Ä‘á»™</p>
              <p className="text-3xl font-bold text-blue-300">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Next Button */}
        {answered && (
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105"
          >
            {currentQuestion < questions.length - 1
              ? 'âžœ CÃ¢u tiáº¿p theo'
              : 'ðŸŽ‰ HoÃ n thÃ nh'}
          </button>
        )}
      </div>
    </div>
  );
}

