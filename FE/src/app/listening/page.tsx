'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  text: string;
  audioUrl: string;
  options: string[];
  correctAnswer: string;
}

export default function ListeningPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      loadQuestion();
    }
  }, [token, router, questionIndex]);

  const loadQuestion = () => {
    // Mock question
    const mockQuestion: Question = {
      id: 1,
      text: 'Bạn nghe thấy điều gì?',
      audioUrl: '/audio/greeting.wav',
      options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Không biết'],
      correctAnswer: 'Xin chào',
    };
    setQuestion(mockQuestion);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !question) return;

    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (questionIndex + 1 < 5) {
      setQuestionIndex(questionIndex + 1);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👂 Nghe hiểu</h1>
          <button onClick={() => router.push('/')} className="text-2xl">✕</button>
        </div>

        {question && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Câu {questionIndex + 1}/5</span>
                <span>Đúng: {score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((questionIndex + 1) / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {question.text}
            </h2>

            {/* Audio Player */}
            <div className="mb-8">
              <audio
                src={question.audioUrl}
                controls
                className="w-full"
              />
              <p className="text-center text-sm text-gray-500 mt-2">
                Bấm play để nghe
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  disabled={showResult}
                  className={`w-full p-4 text-left border-2 rounded-lg transition ${
                    selectedAnswer === option
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${showResult ? 'opacity-75' : ''}`}
                >
                  <span className="font-medium text-gray-800">{option}</span>
                </button>
              ))}
            </div>

            {/* Result */}
            {showResult && (
              <div className={`p-4 rounded-lg mb-6 text-center ${
                isCorrect
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isCorrect ? '✅ Chính xác!' : `❌ Sai. Đáp án đúng là: ${question.correctAnswer}`}
              </div>
            )}

            {/* Button */}
            {!showResult ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Gửi câu trả lời
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                {questionIndex + 1 < 5 ? 'Câu tiếp theo' : 'Hoàn thành'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
