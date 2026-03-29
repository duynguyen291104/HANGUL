'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenText, GraduationCap, Lock, Sparkles } from 'lucide-react';
import { HangulCard, HangulPageFrame, HangulSidebar, Pill, ProgressBar, SectionLabel, getSidebarItems } from '@/components/hangul/ui';
import { Level } from '@/mocks/topics';
import { useAuthStore } from '@/store/authStore';

const levels: Array<{
  value: Level;
  title: string;
  subtitle: string;
  progress: number;
  lessons: string;
  tone: 'paper' | 'mint' | 'peach' | 'cocoa';
  icon: 'cap' | 'sparkle' | 'book';
  locked?: boolean;
}> = [
  { value: 'NEWBIE', title: 'Level 1: Beginner', subtitle: 'Foundations & Vowels', progress: 100, lessons: '12/12 Lessons', tone: 'paper', icon: 'cap' },
  { value: 'BEGINNER', title: 'Level 2: Explorer', subtitle: 'Daily Phrases & Verbs', progress: 45, lessons: '9/20 Lessons', tone: 'mint', icon: 'sparkle' },
  { value: 'INTERMEDIATE', title: 'Level 3: Intermediate', subtitle: 'Complex Structures', progress: 0, lessons: '0/24 Lessons', tone: 'paper', icon: 'sparkle' },
  { value: 'UPPER', title: 'Level 4: Advanced', subtitle: 'Culture & Nuance', progress: 0, lessons: 'Locked', tone: 'peach', icon: 'book', locked: true },
  { value: 'ADVANCED', title: 'Level 5: Master', subtitle: 'Native Fluency & Literature', progress: 0, lessons: 'Locked', tone: 'cocoa', icon: 'book', locked: true },
];

function LevelIcon({ name }: { name: 'cap' | 'sparkle' | 'book' }) {
  if (name === 'cap') {
    return <GraduationCap className="h-7 w-7" />;
  }
  if (name === 'book') {
    return <BookOpenText className="h-7 w-7" />;
  }
  return <Sparkles className="h-7 w-7" />;
}

export default function LevelSelectionPage() {
  const router = useRouter();
  const { user, updateLevel } = useAuthStore();
  const [selected, setSelected] = useState<Level | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.levelLocked) {
      router.push('/dashboard');
    }
  }, [router, user]);

  const handleSelectLevel = async (level: Level) => {
    setSelected(level);
    setLoading(true);
    setError('');

    try {
      await updateLevel(level);
      router.push('/dashboard');
    } catch (requestError) {
      const safeError = requestError as Error;
      setError(safeError.message || 'Unable to update your level.');
      setLoading(false);
      setSelected(null);
    }
  };

  return (
    <HangulPageFrame
      activeNav="Practice"
      sidebar={
        <HangulSidebar
          items={getSidebarItems('path')}
          profile={{
            title: 'Level 2: Explorer',
            subtitle: 'Next: Advanced Hangul',
            emoji: '🦦',
            tone: 'paper',
          }}
        />
      }
    >
      <div className="space-y-6">
        <HangulCard className="px-7 py-8 sm:px-10 sm:py-10">
          <SectionLabel>Learning Path</SectionLabel>
          <h1 className="hangul-title mt-5 text-[clamp(3.2rem,6vw,5.6rem)] font-black text-[var(--hangul-ink)]">
            Choose Your Path,
            <span className="block text-[var(--hangul-gold)]">Little Otter!</span>
          </h1>
          <p className="mt-6 max-w-4xl text-[1.6rem] leading-[1.55] text-[var(--hangul-soft-ink)]">
            Select a level that matches your curiosity. From the first strokes to poetic mastery, your journey with Hangul begins here.
          </p>
          {error ? <p className="mt-6 rounded-[28px] bg-[#ffe8e1] px-5 py-4 text-base text-[#944f42]">{error}</p> : null}
        </HangulCard>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.08fr_1fr]">
          {levels.slice(0, 3).map((level) => (
            <button
              key={level.value}
              className={`text-left ${selected === level.value ? 'scale-[1.01]' : ''}`}
              disabled={loading}
              onClick={() => handleSelectLevel(level.value)}
              type="button"
            >
              <HangulCard className="h-full p-7" tone={level.tone}>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-[var(--hangul-soft-ink)]">
                    <LevelIcon name={level.icon} />
                  </div>
                  {selected === level.value ? <Pill className="bg-[#f5ead4] text-[var(--hangul-gold)]">Selected</Pill> : null}
                </div>
                <p className="mt-14 text-[3rem] font-black tracking-[-0.05em] text-[var(--hangul-ink)]">{level.title}</p>
                <p className="mt-3 text-2xl text-[var(--hangul-soft-ink)]">{level.subtitle}</p>
                <div className="mt-16 flex items-center justify-between text-lg font-semibold text-[var(--hangul-soft-ink)]">
                  <span>{level.progress}% Complete</span>
                  <span>{level.lessons}</span>
                </div>
                <ProgressBar className="mt-4 h-4" value={level.progress} />
              </HangulCard>
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          {levels.slice(3).map((level) => (
            <button
              key={level.value}
              className={`text-left ${selected === level.value ? 'scale-[1.01]' : ''}`}
              disabled={loading}
              onClick={() => handleSelectLevel(level.value)}
              type="button"
            >
              <HangulCard className="h-full p-7" tone={level.tone}>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-[var(--hangul-soft-ink)]">
                    <LevelIcon name={level.icon} />
                  </div>
                  {level.locked ? (
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white/70 text-[var(--hangul-soft-ink)]">
                      <Lock className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>
                <p className={`mt-14 font-black tracking-[-0.05em] ${level.value === 'ADVANCED' ? 'text-[4.5rem] text-white' : 'text-[3.6rem] text-[var(--hangul-ink)]'}`}>
                  {level.title}
                </p>
                <p className={`mt-3 text-2xl ${level.value === 'ADVANCED' ? 'text-white/76' : 'text-[var(--hangul-soft-ink)]'}`}>{level.subtitle}</p>
                <div className={`mt-16 flex items-center justify-between text-lg font-semibold ${level.value === 'ADVANCED' ? 'text-white/72' : 'text-[var(--hangul-soft-ink)]'}`}>
                  <span>{level.lessons}</span>
                  <span>{level.locked ? 'Locked' : `${level.progress}% Complete`}</span>
                </div>
                <ProgressBar className="mt-4 h-4" fillClassName={level.value === 'ADVANCED' ? 'bg-[linear-gradient(90deg,rgba(255,255,255,0.64),rgba(255,255,255,0.26))]' : ''} value={level.progress} />
              </HangulCard>
            </button>
          ))}
        </div>

        <HangulCard className="flex flex-wrap items-center justify-between gap-5 px-7 py-6">
          <Pill className="bg-[#daf6f2] text-[#2e6764]">You can change this later in settings.</Pill>
          <p className="text-lg font-semibold text-[var(--hangul-soft-ink)]">
            {selected && loading ? `Saving ${levels.find((item) => item.value === selected)?.title}...` : 'Tap any card to continue.'}
          </p>
        </HangulCard>
      </div>
    </HangulPageFrame>
  );
}
