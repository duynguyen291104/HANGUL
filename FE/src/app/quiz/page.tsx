'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface QuizQuestion {
  id: number;
  type: string;
  question: string;
  romanization?: string;
  correctAnswer: string;
  options: string[];
  difficulty: string;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [trophy, setTrophy] = useState(0);
  const [xp, setXp] = useState(0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadQuiz();
  }, [token]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz/generate?level=NEWBIE&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setQuestions(data);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setQuizComplete(false);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('Lỗi tải quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score,
          totalQuestions: questions.length,
        }),
      });

      const data = await res.json();
      setTrophy(data.trophy);
      setXp(data.xp);
      setQuizComplete(true);
    } catch (error) {
      console.error('Lỗi gửi quiz:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài quiz...</p>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Hoàn Thành!</h1>
            
            <div className="grid grid-cols-3 gap-4 mb-8 mt-8">
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-purple-600">{score}/{questions.length}</div>
                <p className="text-gray-600 mt-2">Câu Trả Lời Đúng</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-yellow-500">🏆 +{trophy}</div>
                <p className="text-gray-600 mt-2">Trophy</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-blue-600">⭐ +{xp}</div>
                <p className="text-gray-600 mt-2">XP</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => loadQuiz()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Làm Lại
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              >
                Về Trang Chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <p className="text-gray-600">Không tìm thấy câu hỏi</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  
  // Guard against undefined currentQuestion
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <p className="text-gray-600">Lỗi tải câu hỏi</p>
      </div>
    );
  }
  
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            ← Quay Lại
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Quiz Tiếng Hàn 🎯</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{currentIndex + 1}/{questions.length}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{currentQuestion?.question || 'Loading...'}</div>
            {currentQuestion?.romanization && (
              <p className="text-lg text-gray-600 italic">[{currentQuestion.romanization}]</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Độ khó: {currentQuestion?.difficulty === 'easy' ? '⭐' : currentQuestion?.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
            </p>
          </div>

          <div className="space-y-3">
            {currentQuestion?.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(option)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg text-lg font-semibold transition-all ${
                  selectedAnswer === option
                    ? showResult
                      ? option === currentQuestion.correctAnswer
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-purple-600 text-white'
                    : showResult && option === currentQuestion.correctAnswer
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {option}
                {showResult && option === currentQuestion.correctAnswer && ' ✓'}
                {showResult && selectedAnswer === option && option !== currentQuestion.correctAnswer && ' ✗'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="flex-1 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Gửi Câu Trả Lời
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex-1 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              {currentIndex < questions.length - 1 ? 'Câu Tiếp Theo' : 'Hoàn Thành'}
            </button>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-lg text-gray-600">
            Điểm hiện tại: <span className="font-bold text-purple-600">{score}/{currentIndex + (showResult ? 1 : 0)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
