'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/Header';
import { ArrowLeft, Check, X } from 'lucide-react';

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

  const topicId = searchParams.get('topicId');

  // Start quiz session
  useEffect(() => {
    if (!token || !topicId) {
      if (!token) router.push('/login');
      return;
    }

    const startQuiz = async () => {
      try {
        console.log('🎬 Starting quiz for topicId:', topicId);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/start-vocab`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            topicId: parseInt(topicId),
            numberOfQuestions: 10,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start quiz');
        }

        const data = await response.json();
        console.log('✅ Quiz started:', { sessionId: data.sessionId, questions: data.questions.length });

        setQuiz((prev) => ({
          ...prev,
          sessionId: data.sessionId,
          questions: data.questions,
          loading: false,
        }));
      } catch (error) {
        console.error('❌ Quiz start error:', error);
        alert('Failed to start quiz');
        router.back();
      }
    };

    startQuiz();
  }, [token, topicId, router]);

  const handleAnswerSelect = async (answer: string) => {
    if (!quiz.sessionId || quiz.showResult) return;

    setQuiz((prev) => ({ ...prev, selectedAnswer: answer, showResult: true }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: quiz.sessionId,
          vocabularyId: quiz.questions[quiz.currentIndex].id,
          selectedAnswer: answer,
        }),
      });

      const data = await response.json();
      console.log('📝 Answer submitted:', { isCorrect: data.isCorrect, percentage: data.percentage });

      if (data.isCorrect) {
        setQuiz((prev) => ({ ...prev, score: prev.score + 1 }));
      }
    } catch (error) {
      console.error('❌ Answer submission error:', error);
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
    } else {
      endQuiz();
    }
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

      // If passed, call complete-topic API to unlock next topic
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

          // Set unlock message
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
            <p className="text-[#504441]">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (quiz.completed) {
    const percentage = quiz.percentage || 0;
    const passed = quiz.isPassed || false;

    return (
      <div className="min-h-screen bg-surface font-body text-on-background">
        <nav className="w-full sticky top-0 z-50 bg-[#f4f4ef]">
          <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
            <button onClick={() => router.push('/learning-map')} className="flex items-center gap-2 text-primary hover:bg-[#eeeee9] px-3 py-1 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
              Quay lại
            </button>
            <span className="text-2xl font-black text-primary font-headline">OtterPath</span>
            <div className="w-10"></div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 pt-12 pb-12">
          <div className="max-w-2xl mx-auto">
            {/* Results Card */}
            <div className={`p-12 rounded-lg text-center relative overflow-hidden shadow-2xl ${
              passed 
                ? 'bg-gradient-to-br from-secondary-fixed to-secondary-container' 
                : 'bg-gradient-to-br from-error-container to-error'
            }`}>
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="text-6xl mb-6 animate-bounce">{passed ? '🎉' : '😊'}</div>
              
              <h1 className={`text-4xl font-headline font-black mb-4 ${
                passed ? 'text-on-secondary-container' : 'text-white'
              }`}>
                {passed ? 'Xuất sắc!' : 'Cố gắng lại nhé!'}
              </h1>
              
              <div className="mb-8">
                <div className={`text-6xl font-headline font-black ${
                  passed ? 'text-secondary' : 'text-white'
                }`}>
                  {percentage}%
                </div>
                <div className={`text-lg mt-2 ${
                  passed ? 'text-on-secondary-container' : 'text-white/90'
                }`}>
                  {quiz.score}/{quiz.questions.length} câu đúng
                </div>
              </div>

              <p className={`text-lg font-semibold mb-8 ${
                passed ? 'text-on-secondary-container' : 'text-white/90'
              }`}>
                {passed 
                  ? `Bạn đã vượt qua mục tiêu 70% 🏆` 
                  : `Bạn cần ${70 - percentage}% nữa để đạt mục tiêu`}
              </p>

              {/* Unlock message */}
              {quiz.unlockedMessage && (
                <div className="mb-8 p-4 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg animate-pulse font-semibold">
                  {quiz.unlockedMessage}
                </div>
              )}

              <div className="flex gap-4 justify-center flex-col sm:flex-row z-10 relative">
                <button
                  onClick={() => router.push('/learning-map')}
                  className={`px-8 py-4 rounded-full font-headline font-bold text-lg transition-all hover:scale-105 ${
                    passed 
                      ? 'bg-white text-secondary hover:bg-surface' 
                      : 'bg-white text-error hover:bg-surface'
                  }`}
                >
                  ← Quay lại học tập
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className={`px-8 py-4 rounded-full font-headline font-bold text-lg transition-all hover:scale-105 ${
                    passed 
                      ? 'bg-secondary text-white hover:bg-secondary-container' 
                      : 'bg-error text-white hover:bg-error-container'
                  }`}
                >
                  🔄 Làm lại
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface font-body text-on-background">
        <nav className="w-full sticky top-0 z-50 bg-[#f4f4ef]">
          <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
            <span className="text-2xl font-black text-primary font-headline">OtterPath</span>
          </div>
        </nav>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-on-surface-variant">No questions available</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[quiz.currentIndex];
  const isAnswered = quiz.selectedAnswer !== null;
  const isCorrect = quiz.selectedAnswer === currentQuestion.options[0];

  return (
    <div className="min-h-screen bg-surface font-body text-on-background">
      {/* Navigation */}
      <nav className="w-full sticky top-0 z-50 bg-[#f4f4ef]">
        <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
          <button onClick={() => router.push('/learning-map')} className="flex items-center gap-2 text-primary hover:bg-[#eeeee9] px-3 py-1 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <span className="text-2xl font-black text-primary font-headline">OtterPath</span>
          <div className="text-sm font-bold text-primary">
            {quiz.currentIndex + 1}/{quiz.questions.length}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-on-surface-variant">Tiến độ</span>
            <span className="text-sm font-bold text-primary">
              {quiz.score}/{quiz.questions.length} đúng
            </span>
          </div>
          <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="max-w-2xl mx-auto bg-surface-container-low p-8 rounded-lg shadow-[0_20px_40px_rgba(43,22,15,0.03)]">
          {/* Question Header */}
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-primary-fixed text-primary rounded-full text-xs font-headline font-bold mb-4">
              Câu hỏi {quiz.currentIndex + 1}
            </span>
            <h2 className="text-2xl md:text-3xl font-headline font-black text-primary mb-6">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Korean & English */}
          <div className="bg-primary-fixed p-6 rounded-lg mb-8">
            <div className="text-xl font-headline font-bold text-primary mb-2">
              {currentQuestion.korean}
            </div>
            <div className="text-sm text-on-surface-variant font-body">
              {currentQuestion.english}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = quiz.selectedAnswer === option;
              const showCorrectness = isAnswered;
              const isCorrectOption = option === currentQuestion.options[0];
              
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={isAnswered}
                  className={`w-full p-4 text-left rounded-lg font-headline font-bold transition-all border-2 ${
                    showCorrectness
                      ? isCorrectOption
                        ? 'bg-secondary-fixed border-secondary text-secondary'
                        : isSelected
                        ? 'bg-error-container border-error text-error'
                        : 'bg-surface-container-high border-outline-variant text-on-surface-variant opacity-50'
                      : isSelected
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-surface-container-highest border-outline-variant text-on-surface hover:bg-surface-container-high'
                  } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      showCorrectness
                        ? isCorrectOption
                          ? 'bg-secondary text-white'
                          : isSelected
                          ? 'bg-error text-white'
                          : 'bg-outline-variant'
                        : isSelected
                        ? 'bg-white text-primary'
                        : 'bg-surface-container border border-outline-variant'
                    }`}>
                      {showCorrectness && (
                        isCorrectOption ? <Check className="w-4 h-4" /> : (isSelected ? <X className="w-4 h-4" /> : '')
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result Message */}
          {isAnswered && (
            <div
              className={`p-4 rounded-lg mb-8 flex items-center gap-3 font-headline font-bold ${
                isCorrect
                  ? 'bg-secondary-fixed text-secondary border-2 border-secondary'
                  : 'bg-error-container text-error border-2 border-error'
              }`}
            >
              {isCorrect ? (
                <>
                  <Check className="w-6 h-6" />
                  <span>✅ Chính xác!</span>
                </>
              ) : (
                <>
                  <X className="w-6 h-6" />
                  <span>❌ Sai rồi. Đáp án: {currentQuestion.options[0]}</span>
                </>
              )}
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <button
              onClick={handleNextQuestion}
              className="w-full py-4 bg-primary hover:bg-primary-container text-white rounded-full font-headline font-bold text-lg transition-all shadow-lg shadow-primary/20 hover:scale-102"
            >
              {quiz.currentIndex === quiz.questions.length - 1 ? '🏁 Kết Thúc' : '→ Câu Tiếp Theo'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
