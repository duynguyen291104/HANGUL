'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpenText, LogOut, Sparkles, Swords, Volume2 } from 'lucide-react';
import {
  DonutProgress,
  HangulCard,
  HangulPageFrame,
  HangulSidebar,
  HeaderStats,
  MascotPortrait,
  Pill,
  SectionLabel,
  getLevelMeta,
  getSidebarItems,
} from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

interface GameStats {
  trophy?: number;
  xp?: number;
  quizCount?: number;
  writeCount?: number;
  speakCount?: number;
  rank?: string;
  eligible?: boolean;
}

interface UserData {
  id: number;
  email: string;
  name: string;
  level: string;
  levelLocked?: boolean;
}

const weeklyBars = [28, 46, 31, 74, 60, 22, 16];

export default function Dashboard() {
  const router = useRouter();
  const { user: authUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (authUser && !authUser.levelLocked) {
      router.push('/level-selection');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [userResponse, statsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!userResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to load dashboard');
        }

        const userPayload = await userResponse.json();
        const statsPayload = await statsResponse.json();
        setUser(userPayload);
        setStats(statsPayload);
      } catch (requestError) {
        console.error(requestError);
        setError('Unable to load your dashboard right now.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser, router, token]);

  const levelMeta = getLevelMeta(user?.level ?? authUser?.level ?? 'BEGINNER');
  const progress = useMemo(() => {
    const xp = stats?.xp ?? authUser?.totalXP ?? 0;
    return Math.min(100, Math.max(20, Math.round((xp % 1200) / 12)));
  }, [authUser?.totalXP, stats?.xp]);
  const streak = Math.max(5, Math.min(18, Math.round((stats?.quizCount ?? 0) / 2) + 5));
  const wins = Math.max(12, Math.round((stats?.trophy ?? 0) / 18));

  if (loading) {
    return (
      <HangulPageFrame
        activeNav="Lessons"
        sidebar={
          <HangulSidebar
            items={getSidebarItems('course')}
            profile={{ title: `${levelMeta.step}: ${levelMeta.label}`, subtitle: `Next: ${levelMeta.next}`, emoji: '🦦', tone: 'paper' }}
          />
        }
      >
        <HangulCard className="grid min-h-[70vh] place-items-center p-10">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[rgba(140,103,88,0.12)] border-t-[var(--hangul-accent)]" />
            <p className="mt-5 text-lg text-[var(--hangul-soft-ink)]">Loading your tactile dashboard...</p>
          </div>
        </HangulCard>
      </HangulPageFrame>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <HangulPageFrame
      activeNav="Lessons"
      sidebar={
        <HangulSidebar
          items={getSidebarItems('course')}
          profile={{
            title: `${levelMeta.step}: ${levelMeta.label}`,
            subtitle: `Next: ${levelMeta.next}`,
            emoji: '🦦',
            tone: 'paper',
          }}
        />
      }
    >
      <div className="space-y-6">
        {error ? <div className="rounded-[28px] bg-[#ffe9e2] px-6 py-4 text-base text-[#8d5144]">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <HangulCard className="relative p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <SectionLabel>Current Course</SectionLabel>
                <h1 className="hangul-title mt-5 text-[clamp(3rem,6vw,5.5rem)] font-black text-[var(--hangul-ink)]">
                  Welcome back,
                  <span className="block text-[var(--hangul-gold)]">{levelMeta.label}!</span>
                </h1>
                <p className="mt-6 max-w-3xl text-[1.7rem] leading-[1.45] text-[var(--hangul-soft-ink)]">
                  You're on a {streak}-day streak. Keep the momentum going and master your next ten characters today.
                </p>
                <div className="mt-8">
                  <HeaderStats xp={stats?.xp ?? 0} streak={streak} wins={wins} />
                </div>
              </div>

              <div className="space-y-4">
                <Pill className="ml-auto flex w-fit bg-white text-[var(--hangul-ink)]">
                  “Fighting! You are doing great today!”
                </Pill>
                <MascotPortrait emoji="🦦" tone="cocoa" className="ml-auto h-72 w-full max-w-[320px]" />
                <div className="flex justify-end">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(129,100,85,0.14)] bg-white/80 px-5 py-3 text-base font-semibold text-[var(--hangul-soft-ink)]"
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </HangulCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.46fr_0.46fr]">
          <HangulCard className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">Daily Goal</p>
                <p className="mt-2 text-lg text-[var(--hangul-soft-ink)]">15 / 20 XP earned today</p>
              </div>
              <Sparkles className="h-10 w-10 text-[#ead7b0]" />
            </div>
            <div className="mt-8 flex justify-center">
              <DonutProgress label={`${progress}%`} size={280} sublabel="complete" value={progress} />
            </div>
          </HangulCard>

          <HangulCard className="flex min-h-[340px] flex-col justify-between p-8" tone="cocoa">
            <div className="flex items-center justify-between">
              <button className="grid h-16 w-16 place-items-center rounded-full bg-white/12">
                <ArrowRight className="h-7 w-7" />
              </button>
              <Pill className="bg-white/18 text-white">{levelMeta.step}</Pill>
            </div>
            <div>
              <p className="text-5xl font-black tracking-[-0.05em]">Continue Lesson</p>
              <p className="mt-4 text-xl leading-9 text-white/72">Common verbs and sentence structures, refined through soft repetition.</p>
            </div>
          </HangulCard>

          <HangulCard className="flex min-h-[340px] flex-col justify-between p-8" tone="mint">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white/42 text-[#2d6764]">
              <Swords className="h-8 w-8" />
            </div>
            <div>
              <p className="text-5xl font-black tracking-[-0.05em] text-[#315a59]">Practice Arena</p>
              <p className="mt-4 text-xl leading-9 text-[#567b79]">Challenge five other students in real time and push your ranking.</p>
            </div>
          </HangulCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_0.9fr_1.1fr]">
          <HangulCard className="relative min-h-[320px] p-7">
            <BookOpenText className="h-12 w-12 text-[rgba(121,97,82,0.16)]" />
            <p className="mt-24 text-5xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">Vocabulary</p>
            <p className="mt-4 text-xl text-[var(--hangul-soft-ink)]">{Math.max(18, 42 - (stats?.quizCount ?? 0))} words to review</p>
            <Link className="mt-8 inline-flex items-center gap-2 text-lg font-semibold text-[var(--hangul-accent)]" href="/camera">
              Open Lens Scan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </HangulCard>

          <HangulCard className="relative min-h-[320px] p-7" tone="soft">
            <Volume2 className="h-12 w-12 text-[rgba(171,119,0,0.28)]" />
            <p className="mt-24 text-5xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">Daily Quiz</p>
            <p className="mt-4 text-xl text-[var(--hangul-soft-ink)]">Test your knowledge from yesterday with a softer challenge cycle.</p>
            <Link className="mt-8 inline-flex items-center gap-2 text-lg font-semibold text-[var(--hangul-accent)]" href="/quiz">
              Start quiz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </HangulCard>

          <HangulCard className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <SectionLabel>Weekly Activity</SectionLabel>
                <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">Momentum graph</p>
              </div>
              <Pill>{stats?.rank ?? 'Explorer rank'}</Pill>
            </div>
            <div className="mt-10 flex h-[230px] items-end gap-4">
              {weeklyBars.map((value, index) => (
                <div key={value} className="flex flex-1 flex-col items-center gap-4">
                  <div
                    className={`w-full rounded-t-[30px] ${index === 3 ? 'bg-[var(--hangul-gold)]' : index === 4 ? 'bg-[#a88d83]' : 'bg-[rgba(137,112,97,0.12)]'}`}
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hangul-muted)]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              ))}
            </div>
          </HangulCard>
        </div>

        <HangulCard className="flex flex-wrap items-center justify-between gap-6 px-7 py-6">
          <div className="flex flex-wrap gap-3">
            <Pill className="bg-[#daf6f2] text-[#2e6764]">12:45 total practice</Pill>
            <Pill className="bg-[#ffe7c9] text-[#9c6700]">{streak} day streak</Pill>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link className="hangul-button-secondary px-10 py-4" href="/learning-map">
              Review Sentence
            </Link>
            <Link className="hangul-button-primary px-10 py-4" href="/pronunciation">
              Next Phrase
            </Link>
          </div>
        </HangulCard>
      </div>
    </HangulPageFrame>
  );
}



