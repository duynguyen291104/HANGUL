'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Cloud, Lock, Sun, UtensilsCrossed, Users, Hash } from 'lucide-react';
import {
  HangulCard,
  HangulPageFrame,
  HangulSidebar,
  MascotPortrait,
  Pill,
  ProgressBar,
  SectionLabel,
  getLevelMeta,
  getSidebarItems,
} from '@/components/hangul/ui';
import { getTopicsByLevel } from '@/mocks/topics';
import { useAuthStore } from '@/store/authStore';

const topicIcons = [Hash, UtensilsCrossed, Users, Lock, Sun, Cloud];

export default function LearningMapPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [router, token]);

  const level = (user?.level ?? 'BEGINNER') as Parameters<typeof getTopicsByLevel>[0];
  const levelMeta = getLevelMeta(level);
  const visibleTopics = useMemo(() => getTopicsByLevel(level).slice(0, 5), [level]);

  const totalProgress = Math.min(100, Math.max(20, Math.round((2 / Math.max(visibleTopics.length, 1)) * 100)));

  return (
    <HangulPageFrame
      activeNav="Practice"
      sidebar={
        <HangulSidebar
          items={getSidebarItems('path')}
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
        <HangulCard className="px-7 py-8 sm:px-10 sm:py-10">
          <SectionLabel>Learning Path</SectionLabel>
          <h1 className="hangul-title mt-5 text-[clamp(3rem,5.5vw,5.4rem)] font-black text-[var(--hangul-ink)]">
            {levelMeta.step.toUpperCase()} JOURNEY
          </h1>
          <p className="mt-5 max-w-3xl text-[1.5rem] leading-[1.55] text-[var(--hangul-soft-ink)]">
            Master the rhythm of daily life and basic interactions through a curved route of tactile checkpoints.
          </p>
        </HangulCard>

        <HangulCard className="overflow-visible px-5 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
            <div className="relative min-h-[980px] rounded-[36px] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.02))] p-4 sm:p-8">
              <div className="absolute left-1/2 top-10 hidden h-[88%] w-[10px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#7b5d52,#e7dfd5)] opacity-40 xl:block" />

              <div className="space-y-16 xl:space-y-0">
                {visibleTopics.map((topic, index) => {
                  const Icon = topicIcons[index] ?? Cloud;
                  const isDone = index < 2;
                  const isActive = index === 2;
                  const isLocked = index > 2;
                  const wrapperClass = index % 2 === 0 ? 'xl:pr-[52%]' : 'xl:pl-[52%]';
                  const alignClass = index % 2 === 0 ? 'xl:items-end xl:text-right' : 'xl:items-start';
                  const bubbleClass = isActive ? 'bg-[linear-gradient(135deg,#c69310,#aa7300)] text-white shadow-[0_24px_46px_rgba(171,119,0,0.22)]' : isDone ? 'bg-[linear-gradient(135deg,#8a6658,#77584c)] text-white' : 'bg-white/86 text-[var(--hangul-muted)]';

                  return (
                    <div key={topic.id} className={`relative ${wrapperClass}`} style={{ paddingTop: index === 0 ? 12 : 0 }}>
                      <div className={`flex flex-col gap-4 ${alignClass}`}>
                        <div className={`grid h-28 w-28 place-items-center rounded-full border-[8px] border-white ${bubbleClass}`}>
                          {isDone ? <Check className="h-9 w-9" /> : <Icon className="h-9 w-9" />}
                        </div>
                        <div className="space-y-2">
                          <Pill className="w-fit bg-white/84">{isLocked ? 'Locked' : isDone ? 'Complete' : `Topic ${topic.order}`}</Pill>
                          <p className={`text-[2.2rem] font-black tracking-[-0.04em] ${isLocked ? 'text-[rgba(131,105,93,0.55)]' : 'text-[var(--hangul-ink)]'}`}>
                            {topic.name}
                          </p>
                          <p className={`max-w-md text-lg leading-8 ${isLocked ? 'text-[rgba(131,105,93,0.5)]' : 'text-[var(--hangul-soft-ink)]'}`}>
                            {topic.description}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="mt-6 flex items-center gap-4 xl:absolute xl:left-[35%] xl:top-[48%] xl:mt-0 xl:-translate-x-1/2">
                          <div className="rounded-[28px] bg-white px-5 py-4 text-base leading-7 text-[var(--hangul-ink)] shadow-[0_18px_42px_rgba(121,95,78,0.12)]">
                            Ready to learn about family, Explorer?
                          </div>
                          <MascotPortrait emoji="🦦" tone="sky" className="h-40 w-32" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <HangulCard className="p-7" tone="soft">
                <SectionLabel>Current Focus</SectionLabel>
                <p className="mt-4 text-4xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">
                  Topic 3: Family
                </p>
                <p className="mt-4 text-lg leading-8 text-[var(--hangul-soft-ink)]">
                  Build practical phrases for parents, siblings, and introductions before the next greetings checkpoint unlocks.
                </p>
                <Link className="hangul-button-primary mt-8 w-full" href="/quiz">
                  Continue Learning
                </Link>
              </HangulCard>

              <HangulCard className="p-7">
                <SectionLabel>Level Progress</SectionLabel>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-5xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">2/10</p>
                    <p className="mt-2 text-base text-[var(--hangul-soft-ink)]">Topics done</p>
                  </div>
                  <div>
                    <p className="text-5xl font-black tracking-[-0.05em] text-[var(--hangul-gold)]">450</p>
                    <p className="mt-2 text-base text-[var(--hangul-soft-ink)]">XP earned</p>
                  </div>
                </div>
                <ProgressBar className="mt-8 h-4" value={totalProgress} />
                <p className="mt-4 text-right text-base font-semibold text-[var(--hangul-soft-ink)]">{totalProgress}% complete</p>
              </HangulCard>
            </div>
          </div>
        </HangulCard>
      </div>
    </HangulPageFrame>
  );
}


