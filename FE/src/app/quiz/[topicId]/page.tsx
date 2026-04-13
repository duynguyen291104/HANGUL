'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/Header';

interface Question {
  id: number;
  type: string;
  question: string;
  korean: string;
  english: string;
  options: string[];
  difficulty: string;
  level: string;
  explanation?: string;
  explanation_vi?: string;
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

// Fallback questions khi API fail
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'multiple-choice',
    question: 'How do you say "Hello" in Korean?',
    korean: '안녕하세요',
    english: 'Hello',
    options: ['안녕하세요', '감사합니다', '죄송합니다', '안녕'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '안녕하세요 (annyeonghaseyo) is the formal greeting in Korean. It literally means "Please be well."',
    explanation_vi: '"안녕하세요" (annyeonghaseyo) là lời chào lịch sự trong tiếng Hàn. Nghĩa đen là "Xin vui lòng khỏe mạnh."',
  },
  {
    id: 2,
    type: 'multiple-choice',
    question: 'How do you say "Thank you" in Korean?',
    korean: '감사합니다',
    english: 'Thank you',
    options: ['안녕하세요', '감사합니다', '죄송합니다', '안녕'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '감사합니다 (gamsahamnida) is a formal way to say thank you. It shows respect and is appropriate in most situations.',
    explanation_vi: '"감사합니다" (gamsahamnida) là cách nói cảm ơn trang trọng. Nó biểu thị sự tôn trọng và thích hợp trong hầu hết các tình huống.',
  },
  {
    id: 3,
    type: 'multiple-choice',
    question: 'How do you say "Sorry" in Korean?',
    korean: '죄송합니다',
    english: 'Sorry',
    options: ['안녕하세요', '감사합니다', '죄송합니다', '안녕'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '죄송합니다 (joesonghamnida) is a formal apology. It\'s commonly used in formal settings or when apologizing sincerely.',
    explanation_vi: '"죄송합니다" (joesonghamnida) là lời xin lỗi trang trọng. Nó thường được sử dụng trong các tình huống chính thức hoặc khi xin lỗi chân thành.',
  },
  {
    id: 4,
    type: 'multiple-choice',
    question: 'How do you say "Yes" in Korean?',
    korean: '네',
    english: 'Yes',
    options: ['네', '아니요', '모르겠어요', '좋아요'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '네 (ne) is the basic affirmative response in Korean. It is polite and appropriate in most situations.',
    explanation_vi: '"네" (ne) là câu trả lời khẳng định cơ bản trong tiếng Hàn. Nó lịch sự và thích hợp trong hầu hết các tình huống.',
  },
  {
    id: 5,
    type: 'multiple-choice',
    question: 'How do you say "No" in Korean?',
    korean: '아니요',
    english: 'No',
    options: ['네', '아니요', '모르겠어요', '좋아요'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '아니요 (aniyo) is the polite way to say no in Korean. It\'s used when you want to politely decline something.',
    explanation_vi: '"아니요" (aniyo) là cách lịch sự để nói không trong tiếng Hàn. Nó được sử dụng khi bạn muốn từ chối điều gì đó một cách lịch sự.',
  },
  {
    id: 6,
    type: 'multiple-choice',
    question: 'How do you say "I do not know" in Korean?',
    korean: '모르겠어요',
    english: 'I do not know',
    options: ['네', '아니요', '모르겠어요', '좋아요'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '모르겠어요 (moreugesseoyo) literally means "I don\'t understand/know." It\'s a polite way to express uncertainty.',
    explanation_vi: '"모르겠어요" (moreugesseoyo) có nghĩa đen là "Tôi không hiểu/biết." Nó là cách lịch sự để bày tỏ sự không chắc chắn.',
  },
  {
    id: 7,
    type: 'multiple-choice',
    question: 'How do you say "Good" in Korean?',
    korean: '좋아요',
    english: 'Good',
    options: ['나빠요', '좋아요', '최고예요', '괜찮아요'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '좋아요 (johayo) means "good," "I like it," or "It\'s nice." It\'s one of the most commonly used positive expressions in Korean.',
    explanation_vi: '"좋아요" (johayo) có nghĩa là "tốt", "Tôi thích nó" hoặc "Nó đẹp lắm." Đó là một trong những biểu thức tích cực được sử dụng phổ biến nhất trong tiếng Hàn.',
  },
  {
    id: 8,
    type: 'multiple-choice',
    question: 'How do you say "Bad" in Korean?',
    korean: '나빠요',
    english: 'Bad',
    options: ['나빠요', '좋아요', '최고예요', '괜찮아요'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '나빠요 (nappayo) means "bad" or "it\'s not good." It\'s the opposite of 좋아요 and is used to express disapproval.',
    explanation_vi: '"나빠요" (nappayo) có nghĩa là "xấu" hoặc "không tốt". Nó là đối lập của 좋아요 và được sử dụng để bày tỏ sự không tán thành.',
  },
  {
    id: 9,
    type: 'multiple-choice',
    question: 'How do you say "The best" in Korean?',
    korean: '최고예요',
    english: 'The best',
    options: ['나빠요', '좋아요', '최고예요', '괜찮아요'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '최고예요 (choegoyeyo) means "the best" or "it\'s the best." It\'s used to express high satisfaction or praise.',
    explanation_vi: '"최고예요" (choegoyeyo) có nghĩa là "tốt nhất" hoặc "đó là tốt nhất." Nó được sử dụng để bày tỏ sự hài lòng cao hoặc lời khen ngợi.',
  },
  {
    id: 10,
    type: 'multiple-choice',
    question: 'How do you say "It is okay/fine" in Korean?',
    korean: '괜찮아요',
    english: 'It is okay/fine',
    options: ['나빠요', '좋아요', '최고예요', '괜찮아요'],
    difficulty: 'Easy',
    level: 'Beginner',
    explanation: '괜찮아요 (gwaenchanhayo) means "it\'s okay," "it\'s fine," or "it\'s alright." Use it to reassure someone or indicate acceptance.',
    explanation_vi: '"괜찮아요" (gwaenchanhayo) có nghĩa là "không sao", "tốt thôi" hoặc "tất cả được rồi". Sử dụng nó để yên tâm cho ai đó hoặc chỉ sự chấp nhận.',
  },
];

export default function QuizDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const topicId = params.topicId as string;

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

  const [startTime, setStartTime] = useState<number>(0);
  const [completionStats, setCompletionStats] = useState({
    xp: 25,
    accuracy: 0,
    time: '00:00',
  });

  useEffect(() => {
    if (!topicId) {
      return;
    }

    const loadQuiz = async () => {
      try {
        setQuiz((prev) => ({ ...prev, loading: true }));
        console.log('🎬 Fetching quiz for topicId:', topicId);

        // Add authorization header with token
        const headers: any = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `http://localhost:5000/api/quiz/generate?topicId=${topicId}`,
          {
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch quiz: ${response.status}`);
        }

        const data = await response.json();
        
        // Parse questions from new endpoint format
        let questions = data.questions || [];
        
        // Transform the new quiz format to match expected interface
        questions = questions.map((q: any) => ({
          id: q.vocabularyId,
          type: 'multiple-choice',
          question: q.questionText,
          korean: q.korean,
          english: q.english,
          options: q.answers.map((a: any) => a.text),
          difficulty: 'Medium',
          level: q.level,
          explanation: `Correct answer: ${q.correctAnswerText}`,
          explanation_vi: `Đáp án đúng: ${q.correctAnswerText}`,
        }));
        
        console.log('✅ Quiz loaded from API:', questions.length);

        // If API returns 0 questions, use fallback
        if (!Array.isArray(questions) || questions.length === 0) {
          console.warn('⚠️ API returned 0 questions, using fallback questions...');
          questions = FALLBACK_QUESTIONS;
        }

        setQuiz((prev) => ({
          ...prev,
          questions,
          loading: false,
        }));

        setStartTime(Date.now());
      } catch (error) {
        console.error('❌ Quiz load error:', error);
        console.warn('⚠️ Using fallback questions instead of redirecting...');
        
        // Use fallback instead of redirecting
        setQuiz((prev) => ({
          ...prev,
          questions: FALLBACK_QUESTIONS,
          loading: false,
        }));
        
        setStartTime(Date.now());
      }
    };

    loadQuiz();
  }, [topicId, token]);

  const handleAnswerSelect = (answer: string) => {
    if (quiz.showResult) return;
    setQuiz((prev) => ({ ...prev, selectedAnswer: answer }));
  };

  const handleCheckAnswer = async (answer: string) => {
    if (quiz.showResult || !quiz.selectedAnswer) return;

    setQuiz((prev) => ({ ...prev, showResult: true }));

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

      const responseData = await response.json();
      console.log('📝 Answer result:', { isCorrect: responseData.isCorrect, correctAnswer: responseData.correctAnswer });

      if (responseData.isCorrect) {
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
    } else {
      endQuiz();
    }
  };

  const endQuiz = async () => {
    try {
      console.log('🏁 Ending quiz...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/end/${quiz.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      await response.json();
      const percentage = Math.round((quiz.score / quiz.questions.length) * 100);
      const isPassed = percentage >= 70;

      // Calculate completion stats
      const elapsedTime = startTime ? Date.now() - startTime : 0;
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      setCompletionStats({
        xp: 25,
        accuracy: percentage,
        time: timeStr,
      });

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

          const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/progress/complete-topic`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ topicId: parseInt(topicId) }),
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

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center min-h-[80vh]">
          {/* Hero Section */}
          <div className="relative w-full flex flex-col items-center gap-12">
            <div className="text-center">
              <h1 className="font-extrabold text-5xl md:text-6xl text-[#72564c] tracking-tight">
                Bài học hoàn tất!
              </h1>
              <p className="text-[#504441] font-medium mt-4 text-xl">
                Hana rất tự hào về nỗ lực của bạn!
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {/* XP Card */}
              <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                  <span className="text-xl">⚡</span>
                </div>
                <span className="font-bold text-2xl text-[#815300]">
                  +{completionStats.xp} XP
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-widest text-[#504441] mt-2">
                  Điểm kinh nghiệm
                </span>
              </div>

              {/* Accuracy Card */}
              <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#c2ebe5] flex items-center justify-center mb-3">
                  <span className="text-xl">🎯</span>
                </div>
                <span className="font-bold text-2xl text-[#72564c]">
                  {completionStats.accuracy}%
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-widest text-[#504441] mt-2">
                  Độ chính xác
                </span>
              </div>

              {/* Time Card */}
              <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                  <span className="text-xl">⏱️</span>
                </div>
                <span className="font-bold text-2xl text-[#5b4137]">
                  {completionStats.time}
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-widest text-[#504441] mt-2">
                  Thời gian học
                </span>
              </div>
            </div>

            {/* Result Message */}
            <div className="w-full max-w-2xl">
              <div className={`p-6 rounded-lg text-center font-bold text-lg ${
                passed 
                  ? 'bg-[#ffdbce] text-[#2b160f]' 
                  : 'bg-[#ffdad6] text-[#ba1a1a]'
              }`}>
                {passed 
                  ? `✨ Bạn vượt qua với ${percentage}% - Bạn đã đạt mục tiêu 70% 🏆` 
                  : `💪 Bạn đạt ${percentage}% - Cần thêm ${70 - percentage}% để đạt mục tiêu`
                }
              </div>
              {quiz.unlockedMessage && (
                <div className="mt-4 p-4 bg-[#ffdbce] text-[#2b160f] rounded-lg animate-pulse font-semibold text-center">
                  {quiz.unlockedMessage}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col w-full max-w-sm gap-4">
              <button
                onClick={() => router.push('/quiz')}
                className="bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:from-[#8d6e63] hover:to-[#a0806e] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Tiếp tục
                <span>→</span>
              </button>
              <button
                onClick={() => router.push('/learning-map')}
                className="bg-[#ffdbce] text-[#2b160f] font-bold text-lg py-4 rounded-xl hover:bg-[#e4beb2] active:scale-95 transition-all"
              >
                Bài tiếp theo
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = quiz.questions[quiz.currentIndex];
  const isCorrect = quiz.showResult && quiz.selectedAnswer === currentQuestion.english;
  const answerLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        {/* Progress Section */}
        <section className="w-full mb-16">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-[#72564c] tracking-tight">
              Lesson {Math.floor(Math.random() * 10) + 1}: Korean Basics
            </span>
            <span className="font-bold text-[#72564c]/60">
              {quiz.currentIndex + 1} / {quiz.questions.length}
            </span>
          </div>
          <div className="w-full h-4 bg-[#eeeee9] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#72564c] to-[#8d6e63] rounded-full transition-all"
              style={{ width: `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </section>

        {/* Question Section */}
        <section className="w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#504441] tracking-tight mb-4">
            {currentQuestion.question}
          </h1>
          <p className="text-[#504441]/70 text-lg">
            Korean: <span className="font-bold text-[#72564c]">{currentQuestion.korean}</span>
          </p>
        </section>

        {/* Options Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = quiz.selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.english;
            let buttonClass =
              'group relative flex items-center justify-between p-8 bg-[#f4f4ef] hover:bg-white border-2 border-transparent hover:border-[#8d6e63]/30 rounded-xl transition-all duration-300 active:scale-[0.98]';

            if (quiz.showResult) {
              if (isCorrectOption) {
                buttonClass =
                  'group relative flex items-center justify-between p-8 bg-[#ffdbce] border-2 border-[#72564c] rounded-xl transition-all duration-300 active:scale-[0.98]';
              } else if (isSelected && !isCorrect) {
                buttonClass =
                  'group relative flex items-center justify-between p-8 bg-[#ffdad6] border-2 border-[#ba1a1a] rounded-xl transition-all duration-300 active:scale-[0.98]';
              }
            } else if (isSelected) {
              buttonClass =
                'group relative flex items-center justify-between p-8 bg-white border-2 border-[#72564c] rounded-xl transition-all duration-300 active:scale-[0.98]';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(option)}
                disabled={quiz.showResult}
                className={`${buttonClass} ${quiz.showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-3xl font-bold text-[#72564c] mb-1">
                    {option}
                  </span>
                  <span className="text-[#504441]/60 font-medium italic">
                    {idx === 0 && 'Option A'}
                    {idx === 1 && 'Option B'}
                    {idx === 2 && 'Option C'}
                    {idx === 3 && 'Option D'}
                  </span>
                </div>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    quiz.showResult && isCorrectOption
                      ? 'bg-[#406561]'
                      : quiz.showResult && isSelected && !isCorrect
                      ? 'bg-[#ba1a1a]'
                      : isSelected
                      ? 'bg-[#72564c]'
                      : 'bg-[#eeeee9]'
                  }`}
                >
                  <span
                    className={`font-black text-lg ${
                      quiz.showResult && isCorrectOption
                        ? 'text-white'
                        : quiz.showResult && isSelected && !isCorrect
                        ? 'text-white'
                        : isSelected
                        ? 'text-white'
                        : 'text-[#72564c]/40'
                    }`}
                  >
                    {answerLabels[idx]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation Section */}
        {quiz.showResult && (
          <section className="w-full mb-12 mt-8 max-w-3xl">
            <div className="bg-gradient-to-br from-[#c2ebe5]/20 to-[#ffddb5]/20 border-2 border-[#8d6e63]/30 rounded-xl p-8">
              {/* Correct Answer Highlight */}
              <div className="mb-8">
                <p className="text-[#504441]/70 text-sm font-bold tracking-widest mb-2">
                  ✓ CORRECT ANSWER
                </p>
                <p className="text-3xl font-bold text-[#72564c]">
                  {currentQuestion.english}
                </p>
              </div>

              {/* Two Column Layout for Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* English Explanation */}
                {currentQuestion.explanation && (
                  <div className="flex flex-col">
                    <p className="text-[#504441]/70 text-sm font-['Plus_Jakarta_Sans'] font-bold tracking-widest mb-3">
                      📖 EXPLANATION
                    </p>
                    <p className="text-[#504441] text-base leading-relaxed font-['Be_Vietnam_Pro'] font-medium">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Vietnamese Translation */}
                {currentQuestion.explanation_vi && (
                  <div className="flex flex-col bg-[#ffddb5]/20 rounded-lg p-4 border-l-4 border-[#ffddb5]">
                    <p className="text-[#504441]/70 text-sm font-['Plus_Jakarta_Sans'] font-bold tracking-widest mb-3">
                      🇻🇳 DỊCH TIẾNG VIỆT
                    </p>
                    <p className="text-[#504441] text-base leading-relaxed font-['Be_Vietnam_Pro'] font-medium">
                      {currentQuestion.explanation_vi}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Bottom Section with Buttons */}
        <section className="w-full flex items-end justify-end gap-8">
          {/* Action Button */}
          <button
            onClick={() => {
              if (quiz.showResult) {
                handleNextQuestion();
              } else if (quiz.selectedAnswer) {
                handleCheckAnswer(quiz.selectedAnswer);
              }
            }}
            disabled={!quiz.showResult && !quiz.selectedAnswer}
            className={`px-12 py-4 rounded-full font-bold font-['Plus_Jakarta_Sans'] shadow-lg transition-all active:scale-95 ${
              !quiz.showResult && !quiz.selectedAnswer
                ? 'bg-[#d4c3be] text-[#72564c]/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white shadow-[#72564c]/20 hover:scale-105'
            }`}
          >
            {quiz.showResult ? 'Continue' : 'Check Answer'}
          </button>
        </section>
      </main>
    </div>
  );
}
