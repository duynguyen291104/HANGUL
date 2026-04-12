'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/Header';
import { Check, X } from 'lucide-react';

interface Question {
  id: number;
  type: string;
  question: string;
  korean: string;
  english: string;
  options: string[];
  difficulty: string;
  level: string;
}

interface QuizState {
  sessionId: number | null;
  questions: Question[];
  currentIndex: number;
  score: number;
  completed: boolean;
  loading: boolean;
  selectedAnswer: string | null;
  showResult: boolean;
  percentage: number | null;
  isPassed: boolean | null;
  unlockedMessage: string | null;
}

const tips = [
  "Remember! Formal greetings in Korea often end with '-yo' or '-nida'. Look for the most common one!",
  "Listen carefully to the pronunciation patterns in Korean.",
  "Context matters! Think about when and where you'd use this phrase.",
  "Mnemonics can help! Create a story to remember new words.",
];

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  const [quiz, setQuiz] = useState<QuizState>({
    sessionId: null,
    questions: [],
    currentIndex: 0,
    score: 0,
    completed: false,
    loading: true,
    selectedAnswer: null,
    showResult: false,
    percentage: null,
    isPassed: null,
    unlockedMessage: null,
  });

  const [currentTip, setCurrentTip] = useState(0);

  const topicId = searchParams.get('topicId');

  useEffect(() => {
    if (!topicId) {
      return;
    }

    const loadQuiz = async () => {
      try {
        setQuiz((prev) => ({ ...prev, loading: true }));
        console.log('🎬 Fetching quiz for topicId:', topicId);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/quiz/questions?topicId=${topicId}&limit=10`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch quiz: ${response.status}`);
        }

        const questions = await response.json();
        console.log('✅ Quiz loaded:', questions.length);

        if (questions.length === 0) {
          throw new Error('No questions available');
        }

        setQuiz((prev) => ({
          ...prev,
          questions,
          loading: false,
        }));

        setCurrentTip(Math.floor(Math.random() * tips.length));
      } catch (error) {
        console.error('❌ Quiz load error:', error);
        alert('Failed to load quiz. Please try again.');
        router.back();
      }
    };

    loadQuiz();
  }, [topicId, router]);

  const handleAnswerSelect = async (answer: string) => {
    if (quiz.showResult) return;

    setQuiz((prev) => ({ ...prev, selectedAnswer: answer, showResult: true }));

    try {
      const currentQuestion = quiz.questions[quiz.currentIndex];
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: answer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      console.log('📝 Answer result:', { isCorrect: data.isCorrect, correctAnswer: data.correctAnswer });

      if (data.isCorrect) {
        setQuiz((prev) => ({ ...prev, score: prev.score + 1 }));
      }
    } catch (error) {
      console.error('❌ Answer error:', error);
    }
  };

  const handleNextQuestion = () => {
    if (quiz.currentIndex < quiz.questions.length - 1) {
      setQuiz((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        showResult: false,
      }));
      setCurrentTip(Math.floor(Math.random() * tips.length));
    } else {
      endQuiz();
    }
  };

  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  const endQuiz = async () => {
    if (!quiz.sessionId) return;

    try {
      console.log('🏁 Ending quiz...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/end/${quiz.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      const percentage = Math.round(data.percentage);
      const isPassed = percentage >= 70;
      
      console.log('✅ Quiz ended:', { percentage, isPassed });

      setQuiz((prev) => ({ 
        ...prev, 
        completed: true,
        percentage,
        isPassed,
      }));

      if (isPassed) {
        try {
          console.log('🔓 Unlocking next topic...');
          const topicId = searchParams.get('topicId');
          
          const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/progress/complete-topic`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ topicId: parseInt(topicId!) }),
          });

          const completeData = await completeResponse.json();
          console.log('✅ Topic marked complete:', completeData);

          if (completeData.nextTopicUnlocked) {
            setQuiz((prev) => ({
              ...prev,
              unlockedMessage: `🎉 Chủ đề tiếp theo "${completeData.nextTopicName}" đã được mở khóa!`,
            }));
          }
        } catch (error) {
          console.error('⚠️ Error completing topic:', error);
        }
      }
    } catch (error) {
      console.error('❌ Quiz end error:', error);
    }
  };

  if (quiz.loading) {
    return (
      <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#72564c] mx-auto mb-4"></div>
            <p className="text-[#504441]">Loading your quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (quiz.completed) {
    const percentage = quiz.percentage || 0;
    const passed = quiz.isPassed || false;

    return (
      <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']">
        <Header />

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center">
          <div className={`max-w-2xl w-full p-16 rounded-2xl text-center relative overflow-hidden shadow-2xl ${
            passed 
              ? 'bg-gradient-to-br from-[#c2ebe5] via-[#a6cec9] to-[#406561]' 
              : 'bg-gradient-to-br from-[#ffdad6] to-[#ba1a1a]'
          }`}>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="text-6xl mb-6 animate-bounce">{passed ? '🎉' : '😊'}</div>
            
            <h1 className={`font-['Plus_Jakarta_Sans'] text-4xl font-black mb-4 ${
              passed ? 'text-[#2a4d4a]' : 'text-white'
            }`}>
              {passed ? 'Xuất sắc!' : 'Cố gắng lại nhé!'}
            </h1>
            
            <div className="mb-8">
              <div className={`text-6xl font-['Plus_Jakarta_Sans'] font-black ${
                passed ? 'text-[#406561]' : 'text-white'
              }`}>
                {percentage}%
              </div>
              <div className={`text-lg mt-2 ${
                passed ? 'text-[#2a4d4a]' : 'text-white/90'
              }`}>
                {quiz.score}/{quiz.questions.length} câu đúng
              </div>
            </div>

            <p className={`text-lg font-semibold mb-8 ${
              passed ? 'text-[#2a4d4a]' : 'text-white/90'
            }`}>
              {passed 
                ? `Bạn đã vượt qua mục tiêu 70% 🏆` 
                : `Bạn cần ${70 - percentage}% nữa để đạt mục tiêu`}
            </p>

            {quiz.unlockedMessage && (
              <div className="mb-8 p-4 bg-[#ffddb5] text-[#2a1800] rounded-lg animate-pulse font-semibold font-['Plus_Jakarta_Sans']">
                {quiz.unlockedMessage}
              </div>
            )}

            <div className="flex gap-4 justify-center flex-col sm:flex-row z-10 relative">
              <button
                onClick={() => router.push('/learning-map')}
                className={`px-8 py-4 rounded-full font-['Plus_Jakarta_Sans'] font-bold text-lg transition-all hover:scale-105 ${
                  passed 
                    ? 'bg-white text-[#406561] hover:bg-[#fafaf5]' 
                    : 'bg-white text-[#ba1a1a] hover:bg-[#fafaf5]'
                }`}
              >
                ← Quay lại học tập
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`px-8 py-4 rounded-full font-['Plus_Jakarta_Sans'] font-bold text-lg transition-all hover:scale-105 ${
                  passed 
                    ? 'bg-[#406561] text-white hover:bg-[#2a4d4a]' 
                    : 'bg-[#ba1a1a] text-white hover:bg-[#93000a]'
                }`}
              >
                🔄 Làm lại
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <p className="text-[#504441]">No questions available</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[quiz.currentIndex];
  const isAnswered = quiz.selectedAnswer !== null;
  const isCorrect = quiz.selectedAnswer === currentQuestion.options[0];
  const answerOptions = currentQuestion.options || [];

  return (
    <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        {/* Progress Section */}
        <section className="w-full mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c] tracking-tight">
              Lesson {quiz.currentIndex + 1}: Learning
            </span>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c]/60">
              {quiz.score} / {quiz.questions.length}
            </span>
          </div>
          <div className="w-full h-4 bg-[#e8e8e3] rounded-full overflow-hidden">
            <div
              className="h-full w-4/5 bg-gradient-to-r from-[#72564c] to-[#8d6e63] rounded-full"
              style={{ width: `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </section>

        {/* Question Section */}
        <section className="w-full text-center mb-12">
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-5xl font-extrabold text-[#504441] tracking-tight mb-4">
            {currentQuestion.question}
          </h1>
          <p className="text-[#504441]/70 text-lg font-['Be_Vietnam_Pro']">
            Select the correct phrase to continue your streak.
          </p>
        </section>

        {/* Options Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-2xl mx-auto">
          {answerOptions.map((option, idx) => {
            const isSelected = quiz.selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.options[0];
            const showCorrectness = isAnswered;

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered}
                className={`group relative flex items-center justify-between p-8 rounded-xl transition-all duration-300 active:scale-[0.98] border-2 ${
                  showCorrectness
                    ? isCorrectOption
                      ? 'bg-[#c2ebe5] border-[#406561] text-[#406561]'
                      : isSelected
                      ? 'bg-[#ffdad6] border-[#ba1a1a] text-[#ba1a1a]'
                      : 'bg-[#f4f4ef] border-transparent text-[#504441]/40'
                    : isSelected
                    ? 'bg-[#72564c] border-[#72564c] text-white shadow-lg shadow-[#72564c]/20'
                    : 'bg-[#f4f4ef] border-transparent hover:bg-white text-[#504441]'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl font-bold mb-1">
                    {option}
                  </span>
                  <span className={`text-[#504441]/60 font-medium italic text-sm ${
                    showCorrectness || isSelected ? 'opacity-70' : ''
                  }`}>
                    {currentQuestion.korean}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-[#72564c]/10 transition-colors flex-shrink-0 ${
                  showCorrectness
                    ? isCorrectOption
                      ? 'bg-[#406561]'
                      : isSelected
                      ? 'bg-[#ba1a1a]'
                      : 'bg-[#e8e8e3]'
                    : isSelected
                    ? 'bg-white'
                    : 'bg-[#e8e8e3]'
                }`}>
                  <span className={`font-['Plus_Jakarta_Sans'] font-black ${
                    showCorrectness
                      ? isCorrectOption
                        ? 'text-white'
                        : isSelected
                        ? 'text-white'
                        : 'text-[#504441]/40'
                      : isSelected
                      ? 'text-[#72564c]'
                      : 'text-[#504441]/40'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Section with Mascot & Controls */}
        <section className="w-full flex items-end justify-between gap-8 max-w-5xl mx-auto">
          {/* Tip Section */}
          <div className="relative flex items-end gap-6 max-w-lg hidden md:flex">
            <div className="w-48 h-48 flex-shrink-0 relative overflow-visible z-10">
              <div className="w-full h-full object-contain filter drop-shadow-xl text-5xl flex items-center justify-center">
                🦦
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-t-3xl rounded-br-3xl border border-[#72564c]/10 shadow-lg relative mb-4">
              <div className="absolute -left-3 bottom-0 w-6 h-6 bg-white/80 border-l border-b border-[#72564c]/10 rotate-45"></div>
              <p className="text-[#72564c] font-semibold font-['Plus_Jakarta_Sans'] text-lg leading-snug">
                "{tips[currentTip]}"
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 w-full md:w-auto justify-center md:justify-end">
            {!isAnswered ? (
              <button
                onClick={handleSkipQuestion}
                className="px-8 py-4 rounded-full bg-[#e8e8e3] text-[#72564c] font-bold font-['Plus_Jakarta_Sans'] hover:bg-[#ddd] transition-all active:scale-95"
              >
                Skip
              </button>
            ) : null}
            <button
              onClick={() => isAnswered ? handleNextQuestion() : null}
              disabled={!isAnswered}
              className={`px-12 py-4 rounded-full font-bold font-['Plus_Jakarta_Sans'] shadow-lg transition-all active:scale-95 ${
                isAnswered
                  ? isCorrect
                    ? 'bg-gradient-to-r from-[#406561] to-[#72564c] text-white hover:scale-105 shadow-[#406561]/20'
                    : 'bg-gradient-to-r from-[#ba1a1a] to-[#93000a] text-white hover:scale-105 shadow-[#ba1a1a]/20'
                  : 'bg-[#e8e8e3] text-[#504441]/40 cursor-not-allowed'
              }`}
            >
              {!isAnswered ? 'Check Answer' : isCorrect ? '✅ Correct!' : '❌ Try Again'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
