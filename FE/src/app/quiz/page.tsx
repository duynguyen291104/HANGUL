'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, SkipForward } from 'lucide-react';
import { HangulCard, HangulPageFrame, MascotPortrait, Pill, ProgressBar } from '@/components/hangul/ui';

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

    const loadQuiz = async () => {
      try {
        setLoading(true);
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userResponse.json();
        const userLevel = userData.level || 'NEWBIE';

        const questionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/quiz/generate?level=${userLevel}&limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const payload = await questionResponse.json();
        if (!Array.isArray(payload)) {
          throw new Error('No quiz questions returned.');
        }

        setQuestions(payload);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setQuizComplete(false);
      } catch (requestError) {
        console.error(requestError);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [router, token]);

  const currentQuestion = questions[currentIndex];
  const progress = useMemo(() => ((currentIndex + 1) / Math.max(questions.length, 1)) * 100, [currentIndex, questions.length]);

  const submitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) {
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((current) => current + 1);
    }
    setShowResult(true);
  };

  const goNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/submit`, {
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
      const payload = await response.json();
      setTrophy(payload.trophy ?? 0);
      setXp(payload.xp ?? 0);
    } catch (requestError) {
      console.error(requestError);
    }

    setQuizComplete(true);
  };

  const skipQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  if (loading) {
    return (
      <HangulPageFrame activeNav="Lessons">
        <HangulCard className="grid min-h-[72vh] place-items-center p-10">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[rgba(140,103,88,0.12)] border-t-[var(--hangul-accent)]" />
            <p className="mt-5 text-lg text-[var(--hangul-soft-ink)]">Preparing your quiz sequence...</p>
          </div>
        </HangulCard>
      </HangulPageFrame>
    );
  }

  if (quizComplete) {
    return (
      <HangulPageFrame activeNav="Lessons">
        <HangulCard className="mx-auto max-w-[980px] p-10 text-center">
          <Pill className="bg-[#ffe7c9] text-[#9c6700]">Lesson complete</Pill>
          <h1 className="mt-6 text-6xl font-black tracking-[-0.06em] text-[var(--hangul-ink)]">Great work, Explorer.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-9 text-[var(--hangul-soft-ink)]">
            You kept the streak alive and finished the greetings checkpoint with a calmer, cleaner flow.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <HangulCard className="p-6" tone="paper">
              <p className="text-5xl font-black tracking-[-0.05em]">{score}/{questions.length}</p>
              <p className="mt-3 text-lg text-[var(--hangul-soft-ink)]">Correct answers</p>
            </HangulCard>
            <HangulCard className="p-6" tone="peach">
              <p className="text-5xl font-black tracking-[-0.05em]">+{trophy}</p>
              <p className="mt-3 text-lg text-[var(--hangul-soft-ink)]">Trophy</p>
            </HangulCard>
            <HangulCard className="p-6" tone="mint">
              <p className="text-5xl font-black tracking-[-0.05em]">+{xp}</p>
              <p className="mt-3 text-lg text-[var(--hangul-soft-ink)]">XP</p>
            </HangulCard>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button className="hangul-button-secondary" onClick={() => window.location.reload()} type="button">
              Retry Lesson
            </button>
            <Link className="hangul-button-primary" href="/dashboard">
              Back to Dashboard
            </Link>
          </div>
        </HangulCard>
      </HangulPageFrame>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <HangulPageFrame activeNav="Lessons">
      <div className="mx-auto max-w-[1220px] space-y-6">
        <HangulCard className="px-7 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xl font-semibold text-[var(--hangul-soft-ink)]">
            <p>Lesson 4: Greetings</p>
            <p>{currentIndex + 1} / {questions.length}</p>
          </div>
          <ProgressBar className="mt-5 h-5" value={progress} />

          <div className="mt-12 text-center">
            <h1 className="hangul-title text-[clamp(3.4rem,6vw,5.6rem)] font-black text-[var(--hangul-ink)]">
              {currentQuestion.question}
            </h1>
            <p className="mt-5 text-[1.8rem] text-[var(--hangul-soft-ink)]">
              Select the correct phrase to continue your streak.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {currentQuestion.options.map((option, index) => {
              const letter = ['A', 'B', 'C', 'D'][index] ?? String(index + 1);
              const isCorrect = option === currentQuestion.correctAnswer;
              const isSelected = selectedAnswer === option;
              const answerClass = showResult
                ? isCorrect
                  ? 'bg-[#daf6f2] ring-2 ring-[#3b7875]'
                  : isSelected
                    ? 'bg-[#ffe8e1] ring-2 ring-[#a65f54]'
                    : 'bg-white/64'
                : isSelected
                  ? 'bg-[#f7eee6] ring-2 ring-[var(--hangul-accent)]'
                  : 'bg-white/72 hover:bg-white';

              return (
                <button
                  key={option}
                  className={`rounded-[34px] p-7 text-left shadow-[0_20px_40px_rgba(121,96,79,0.08)] transition ${answerClass}`}
                  disabled={showResult}
                  onClick={() => setSelectedAnswer(option)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[3rem] font-black tracking-[-0.05em] text-[var(--hangul-ink)]">{option}</p>
                      <p className="mt-2 text-xl italic text-[var(--hangul-soft-ink)]">
                        {currentQuestion.romanization || 'Choose the most natural greeting.'}
                      </p>
                    </div>
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(121,97,82,0.06)] text-lg font-bold text-[var(--hangul-muted)]">
                      {letter}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[0.24fr_0.76fr] xl:items-end">
            <div className="flex items-end gap-4">
              <MascotPortrait emoji="🦦" tone="sky" className="h-56 w-48 shrink-0" />
              <div className="rounded-[30px] bg-white px-6 py-5 text-lg leading-8 text-[var(--hangul-ink)] shadow-[0_18px_42px_rgba(121,95,78,0.12)]">
                Remember: formal greetings often end in <span className="font-bold">-yo</span> or <span className="font-bold">-nida</span>. Look for the most common one.
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-4">
              <button className="hangul-button-secondary" onClick={skipQuestion} type="button">
                <SkipForward className="mr-2 h-5 w-5" />
                Skip
              </button>
              <button className="hangul-button-primary" onClick={showResult ? goNext : submitAnswer} type="button">
                {showResult ? 'Next Step' : 'Check Answer'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </HangulCard>
      </div>
    </HangulPageFrame>
  );
}
