'use client';

import { useEffect, useState } from 'react';

interface Vocabulary {
  id: number;
  korean: string;
  vietnamese: string;
  romanization?: string;
}

interface ListeningTournamentProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

export default function ListeningTournament({ onComplete, onExit }: ListeningTournamentProps) {
  const [questions, setQuestions] = useState<Vocabulary[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
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
      const finalCorrect = correctAnswers + (selectedAnswer === questions[currentQuestion].vietnamese ? 1 : 0);
      onComplete(score + (selectedAnswer === questions[currentQuestion].vietnamese ? 10 : 0), finalCorrect);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Đang tải câu hỏi...</div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const wrongAnswers = questions
    .filter((q) => q.id !== question.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((q) => q.vietnamese);

  const options = [question.vietnamese, ...wrongAnswers].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">🎧 Nghe</h1>
          <button onClick={onExit} className="text-white hover:text-gray-300 text-2xl">
            ✕
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <p className="text-gray-600 mb-6">Nghe và chọn từ đúng</p>

          <button
            onClick={() => playAudio(question.korean)}
            disabled={playing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 rounded-lg mb-8 text-lg"
          >
            {playing ? '🔊 Đang phát...' : '🔊 Nghe'}
          </button>

          <div className="space-y-3">
            {options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`w-full p-4 rounded-lg font-semibold transition-all text-left ${
                  selectedAnswer === option
                    ? option === question.vietnamese
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : answered
                    ? option === question.vietnamese
                      ? 'bg-green-100 text-green-900'
                      : 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 hover:bg-blue-200 text-gray-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

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
