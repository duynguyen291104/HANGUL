'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
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

interface AnswerOption {
  text: string;
  romanization: string;
  label: string;
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Sample questions for demo
  const sampleQuestions: QuizQuestion[] = [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'How do you say "Hello" in Korean?',
      options: ['안녕하세요', '감사합니다', '사랑해요', '죄송합니다'],
      correctAnswer: '안녕하세요',
      difficulty: 'beginner',
    },
    {
      id: 2,
      type: 'multiple-choice',
      question: 'What does "감사합니다" mean?',
      options: ['Hello', 'Thank you', 'Love', 'Sorry'],
      correctAnswer: 'Thank you',
      difficulty: 'beginner',
    },
    {
      id: 3,
      type: 'multiple-choice',
      question: 'How do you say "Goodbye" in Korean?',
      options: ['안녕히 가세요', '좋은 아침', '좋은 밤', '반가워요'],
      correctAnswer: '안녕히 가세요',
      difficulty: 'beginner',
    },
    {
      id: 4,
      type: 'multiple-choice',
      question: 'What does "사랑해요" mean?',
      options: ['Thank you', 'I love you', 'Good morning', 'Goodbye'],
      correctAnswer: 'I love you',
      difficulty: 'beginner',
    },
    {
      id: 5,
      type: 'multiple-choice',
      question: 'How do you say "Good morning" in Korean?',
      options: ['좋은 밤', '안녕하세요', '좋은 아침', '반가워요'],
      correctAnswer: '좋은 아침',
      difficulty: 'beginner',
    },
    {
      id: 6,
      type: 'multiple-choice',
      question: 'What does "죄송합니다" mean?',
      options: ['Thank you', 'Goodbye', 'I am sorry', 'Good night'],
      correctAnswer: 'I am sorry',
      difficulty: 'beginner',
    },
    {
      id: 7,
      type: 'multiple-choice',
      question: 'How do you say "Good night" in Korean?',
      options: ['좋은 아침', '좋은 밤', '반가워요', '안녕하세요'],
      correctAnswer: '좋은 밤',
      difficulty: 'beginner',
    },
    {
      id: 8,
      type: 'multiple-choice',
      question: 'What does "반가워요" mean?',
      options: ['Good night', 'Nice to meet you', 'Thank you', 'Goodbye'],
      correctAnswer: 'Nice to meet you',
      difficulty: 'beginner',
    },
    {
      id: 9,
      type: 'multiple-choice',
      question: 'How do you say "Water" in Korean?',
      options: ['물', '밥', '음식', '음료'],
      correctAnswer: '물',
      difficulty: 'beginner',
    },
    {
      id: 10,
      type: 'multiple-choice',
      question: 'What does "밥" mean in Korean?',
      options: ['Water', 'Rice/Food', 'Drink', 'Eat'],
      correctAnswer: 'Rice/Food',
      difficulty: 'beginner',
    },
  ];

  // Answer options mapping
  const answerOptionsMap: { [key: string]: AnswerOption } = {
    '안녕하세요': { text: '안녕하세요', romanization: 'An-nyeong-ha-se-yo', label: 'A' },
    '감사합니다': { text: '감사합니다', romanization: 'Gam-sa-ham-ni-da', label: 'B' },
    '사랑해요': { text: '사랑해요', romanization: 'Sa-rang-hae-yo', label: 'C' },
    '죄송합니다': { text: '죄송합니다', romanization: 'Joe-song-ham-ni-da', label: 'D' },
    'Hello': { text: 'Hello', romanization: '', label: 'A' },
    'Thank you': { text: 'Thank you', romanization: '', label: 'B' },
    'Love': { text: 'Love', romanization: '', label: 'C' },
    'Sorry': { text: 'Sorry', romanization: '', label: 'D' },
    'I love you': { text: 'I love you', romanization: '', label: 'B' },
    'Good morning': { text: 'Good morning', romanization: '', label: 'C' },
    '좋은 아침': { text: '좋은 아침', romanization: 'Jo-eun a-chim', label: 'B' },
    '좋은 밤': { text: '좋은 밤', romanization: 'Jo-eun bam', label: 'C' },
    '반가워요': { text: '반가워요', romanization: 'Ban-ga-woe-yo', label: 'D' },
    '안녕히 가세요': { text: '안녕히 가세요', romanization: 'An-nyeong-hi ga-se-yo', label: 'A' },
    'Goodbye': { text: 'Goodbye', romanization: '', label: 'D' },
    'I am sorry': { text: 'I am sorry', romanization: '', label: 'C' },
    'Good night': { text: 'Good night', romanization: '', label: 'D' },
    'Nice to meet you': { text: 'Nice to meet you', romanization: '', label: 'B' },
    '물': { text: '물', romanization: 'Mul', label: 'A' },
    '밥': { text: '밥', romanization: 'Bap', label: 'B' },
    '음식': { text: '음식', romanization: 'Eum-sik', label: 'C' },
    '음료': { text: '음료', romanization: 'Eum-ryo', label: 'D' },
    'Water': { text: 'Water', romanization: '', label: 'A' },
    'Rice/Food': { text: 'Rice/Food', romanization: '', label: 'B' },
    'Drink': { text: 'Drink', romanization: '', label: 'C' },
    'Eat': { text: 'Eat', romanization: '', label: 'D' },
  };

  // Answer meaning mapping (Vietnamese translations)
  const answerMeaningMap: { [key: string]: string } = {
    '안녕하세요': 'Xin chào',
    '감사합니다': 'Cảm ơn',
    '사랑해요': 'Anh/em yêu em/anh',
    '죄송합니다': 'Xin lỗi',
    'Hello': 'Xin chào',
    'Thank you': 'Cảm ơn',
    'Love': 'Yêu',
    'Sorry': 'Xin lỗi',
    'I love you': 'Tôi yêu bạn',
    'Good morning': 'Chào buổi sáng',
    '안녕히 가세요': 'Tạm biệt',
    '좋은 아침': 'Chào buổi sáng',
    '좋은 밤': 'Chào buổi tối',
    '반가워요': 'Vui lòng gặp lại bạn',
    'Goodbye': 'Tạm biệt',
    'I am sorry': 'Tôi xin lỗi',
    'Good night': 'Chào buổi tối',
    'Nice to meet you': 'Rất vui được gặp bạn',
    '물': 'Nước',
    '밥': 'Cơm/Thức ăn',
    '음식': 'Thức ăn',
    '음료': 'Đồ uống',
    'Water': 'Nước',
    'Rice/Food': 'Cơm/Thức ăn',
    'Drink': 'Đồ uống',
    'Eat': 'Ăn',
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadQuiz();
  }, [token]);

  const loadQuiz = async () => {
    try {
      setLoading(false);
      setQuestions(sampleQuestions);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setQuizComplete(false);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = () => {
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
      setQuizComplete(true);
    }
  };

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex items-center justify-center">
        <p className="text-[#72564c] font-bold text-lg">Đang tải bài quiz...</p>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex items-center justify-center flex-col gap-8">
        <div className="text-center">
          <h1 className="text-5xl font-black text-[#72564c] mb-4">Hoàn thành bài quiz!</h1>
          <p className="text-2xl font-bold text-[#8d6e63] mb-8">
            Điểm của bạn: {score} / {questions.length}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-12 py-4 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-bold rounded-full hover:scale-105 transition-all active:scale-95 shadow-lg"
          >
            Quay lại Bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex items-center justify-center">
            <p className="text-[#72564c] font-bold text-lg">Không có câu hỏi nào</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']">
      <Header />
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-2 py-6 bg-[#f4f4ef] w-72 h-screen sticky left-0 top-0 text-[#72564c] font-['Plus_Jakarta_Sans'] overflow-y-auto">
          <div className="px-4 mb-4">
            <Link href="/dashboard" className="flex items-center gap-3 justify-center hover:opacity-70 transition-opacity cursor-pointer">
              <img
                src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png"
                alt="HANGUL Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="text-2xl font-black text-[#72564c] tracking-tighter uppercase font-['Plus_Jakarta_Sans']">
                HANGUL
              </div>
            </Link>
          </div>

          <nav className="flex-grow flex flex-col gap-1 px-4 text-sm">
            <Link
              href="/quiz"
              className="text-[#72564c] rounded-lg mx-0 py-3 px-4 flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold"
            >
              <div className="flex flex-col">
                <span className="font-bold">Quiz</span>
                <span className="text-xs opacity-70 font-normal">Test knowledge</span>
              </div>
            </Link>

            <Link href="/camera" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Camera to Vocab</span>
                <span className="text-xs opacity-70 font-normal">Visual learning</span>
              </div>
            </Link>

            <Link href="/writing" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Writing Practice</span>
                <span className="text-xs opacity-70 font-normal">Handwriting</span>
              </div>
            </Link>

            <Link href="/pronunciation" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Pronunciation</span>
                <span className="text-xs opacity-70 font-normal">Speak & listen</span>
              </div>
            </Link>

            <Link href="/learning-map" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Learning Path</span>
                <span className="text-xs opacity-70 font-normal">Adjust level</span>
              </div>
            </Link>

            <Link href="/tournament" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95 font-semibold">
              <div className="flex flex-col">
                <span className="font-bold">Tournament</span>
                <span className="text-xs opacity-70 font-normal">Compete & rank</span>
              </div>
            </Link>
          </nav>

          <div className="px-4 mt-4 flex flex-col gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-[#e8e8e3] text-[#72564c] rounded-lg font-bold hover:bg-[#d4c3be] transition-all active:scale-95 text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        {/* Progress Bar */}
        <section className="w-full mb-16">
          <div className="flex items-center justify-between mb-4">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c] tracking-tight">
              Bài {currentIndex + 1}: {currentQuestion.question.split(' ')[0]}
            </span>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c]/60">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full h-4 bg-[#eeeee9] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#72564c] to-[#8d6e63] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </section>

        {/* Question */}
        <section className="w-full text-center mb-12">
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-5xl font-extrabold text-[#504441] tracking-tight mb-4">
            {currentQuestion.question}
          </h1>
          <p className="text-[#504441]/70 text-lg">Chọn câu trả lời đúng để tiếp tục cuộc thi của bạn.</p>
        </section>

        {/* Answer Options */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {currentQuestion.options.map((option, index) => {
            const answerOption = answerOptionsMap[option];
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const isWrong = isSelected && !isCorrect && showResult;

            let buttonClass = 'border-transparent';
            if (showResult) {
              if (isCorrect) {
                buttonClass = 'border-[#4caf50] bg-[#f1f8e9]';
              } else if (isWrong) {
                buttonClass = 'border-[#f44336] bg-[#ffebee]';
              }
            } else if (isSelected) {
              buttonClass = 'border-[#72564c] bg-[#f5f5f5]';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                disabled={showResult}
                className={`group relative flex items-center justify-between p-8 bg-[#f4f4ef] hover:bg-white border-2 ${buttonClass} rounded-xl transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#72564c] mb-1">
                    {answerOption.text}
                  </span>
                  {answerOption.romanization && (
                    <span className="text-[#504441]/60 font-medium italic">{answerOption.romanization}</span>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-[#72564c]' : 'bg-[#eeeee9] group-hover:bg-[#72564c]/10'
                }`}>
                  <span className={`font-['Plus_Jakarta_Sans'] font-black ${
                    isSelected ? 'text-white' : 'text-[#72564c]/40 group-hover:text-[#72564c]'
                  }`}>
                    {answerOption.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Result Feedback Message */}
        {showResult && (
          <div className="w-full mb-8 p-6 rounded-xl border-2 text-center animate-in fade-in duration-300">
            <div className={`${selectedAnswer === currentQuestion.correctAnswer ? 'bg-[#f1f8e9] border-[#4caf50]' : 'bg-[#ffebee] border-[#f44336]'} border-2 p-6 rounded-lg`}>
              <p className={`text-lg font-bold mb-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>
                {selectedAnswer === currentQuestion.correctAnswer ? '✓ Chính xác!' : '✗ Không chính xác!'}
              </p>
              <p className={`text-base font-semibold ${selectedAnswer === currentQuestion.correctAnswer ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>
                Đáp án đúng là: <span className="font-bold text-lg">{currentQuestion.correctAnswer}</span>
              </p>
              <p className={`text-sm font-medium mt-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>
                Nghĩa: <span className="font-semibold">{answerMeaningMap[currentQuestion.correctAnswer]}</span>
              </p>
              <p className="text-[#504441] text-sm mt-3">
                Số điểm hiện tại: {score} / {questions.length}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Section with Buttons */}
        <section className="w-full flex items-center justify-center">
          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              className="px-8 py-4 rounded-full bg-[#e8e8e3] text-[#72564c] font-bold font-['Plus_Jakarta_Sans'] hover:bg-[#e0e0db] transition-all active:scale-95"
            >
              Bỏ qua
            </button>
            <button
              onClick={showResult ? handleNextQuestion : handleCheckAnswer}
              disabled={!selectedAnswer && !showResult}
              className="px-12 py-4 rounded-full bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-bold font-['Plus_Jakarta_Sans'] shadow-lg shadow-[#72564c]/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {showResult ? 'Tiếp theo' : 'Kiểm tra'}
            </button>
          </div>
        </section>
        </div>
        </main>
      </div>


    </div>
  );
}
