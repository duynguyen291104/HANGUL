'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Camera, Mic2, PencilLine, Swords } from 'lucide-react';
import { FooterBrand, HangulCard, HangulPageFrame, MascotPortrait, Pill, SectionLabel } from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

const toolkit = [
  {
    title: 'Smart Quiz',
    description: 'Dynamic testing that adapts to your weak spots and keeps every round fresh.',
    icon: BookOpen,
    tone: 'bg-[#ffe3d8] text-[#8b6052]',
  },
  {
    title: 'Writing Pad',
    description: 'Stroke-order guidance built for tactile repetition and confident handwriting.',
    icon: PencilLine,
    tone: 'bg-[#d9f7f4] text-[#2d6764]',
  },
  {
    title: 'Voice Lab',
    description: 'Native cadence, waveform feedback, and score-based pronunciation coaching.',
    icon: Mic2,
    tone: 'bg-[#ffefc7] text-[#926602]',
  },
  {
    title: 'Lens Scan',
    description: 'Scan real objects, spot Korean labels, and translate the world around you.',
    icon: Camera,
    tone: 'bg-[#ffd9d3] text-[#b1473e]',
  },
  {
    title: 'The Arena',
    description: 'Live battle modes that turn vocabulary and listening drills into competition.',
    icon: Swords,
    tone: 'bg-[#f0e7db] text-[#7e6457]',
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [router, user]);

  return (
    <div className="min-h-screen">
      <HangulPageFrame activeNav="Lessons">
        <div className="space-y-16">
          <section className="grid gap-10 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div className="space-y-7 px-2 pt-8 sm:pt-14">
              <SectionLabel>Premium Korean Journey</SectionLabel>
              <div className="max-w-4xl">
                <h1 className="hangul-title text-[clamp(3.8rem,9vw,7.2rem)] font-black text-[var(--hangul-ink)]">
                  Korean Learning
                  <span className="block text-[#3f7472]">Made Tactile.</span>
                </h1>
                <p className="mt-6 max-w-3xl text-xl leading-9 text-[var(--hangul-soft-ink)] sm:text-2xl">
                  Join Hana, Ji-woo, and our otter squad on a premium path to mastering Hangul. Less sterile grid, more warm rhythm, soft surfaces, and playful repetition.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/register" className="hangul-button-primary">
                  Start Learning for Free
                </Link>
                <Link href="/tournament" className="hangul-button-secondary">
                  See the Arena
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MascotPortrait emoji="🦦" tone="paper" className="h-52" />
                <MascotPortrait emoji="🧥" label="Hana" tone="cocoa" className="h-64 sm:-mt-6" />
                <MascotPortrait emoji="🦦" tone="sky" className="h-52" />
              </div>
            </div>

            <div className="space-y-5">
              <HangulCard className="grid gap-4 p-7 lg:grid-cols-[1.2fr_0.8fr]" tone="paper">
                <div>
                  <SectionLabel>Our Philosophy</SectionLabel>
                  <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">
                    The Tactile Approach
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-[var(--hangul-soft-ink)]">
                    We design each lesson like a desk made of paper, wood, and warm light. Progress feels physical: softer cards, calmer spacing, and feedback that guides instead of shouts.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-[32px] bg-[linear-gradient(135deg,#f4f0e7,#ffffff)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <div className="text-right text-6xl font-black text-[rgba(122,96,79,0.12)]">02</div>
                    <p className="-mt-4 text-2xl font-bold tracking-[-0.03em] text-[var(--hangul-ink)]">Mascot-Led Support</p>
                    <p className="mt-3 text-base leading-7 text-[var(--hangul-soft-ink)]">
                      Hana and the team celebrate your wins, keep the energy gentle, and step in with tiny nudges when you get stuck.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <HangulCard className="p-6" tone="mint">
                      <p className="text-2xl font-bold tracking-[-0.04em]">Smart Progress</p>
                      <p className="mt-3 text-sm leading-6 text-[var(--hangul-soft-ink)]">
                        Lessons flex to your pace and keep revisiting weak points without feeling repetitive.
                      </p>
                    </HangulCard>
                    <HangulCard className="p-6" tone="soft">
                      <p className="text-2xl font-bold tracking-[-0.04em]">Master The Script</p>
                      <p className="mt-3 text-sm leading-6 text-[var(--hangul-soft-ink)]">
                        Build from vowels to sentence patterns through clean visual rhythm and guided calligraphy.
                      </p>
                    </HangulCard>
                  </div>
                </div>
              </HangulCard>
            </div>
          </section>

          <section className="space-y-8 py-4">
            <div className="text-center">
              <SectionLabel>Your Learning Toolkit</SectionLabel>
              <h2 className="mt-4 text-5xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">
                Everything you need, in one soft interface.
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[var(--hangul-soft-ink)]">
                Move from beginner to fluent with a unified dashboard, practice lab, AI vision, arena ranking, and a mascot team that makes every screen feel alive.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-5">
              {toolkit.map((item) => {
                const Icon = item.icon;
                return (
                  <HangulCard key={item.title} className="p-6">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${item.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-10 text-2xl font-bold tracking-[-0.03em] text-[var(--hangul-ink)]">{item.title}</p>
                    <p className="mt-4 text-sm leading-7 text-[var(--hangul-soft-ink)]">{item.description}</p>
                  </HangulCard>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <HangulCard className="relative overflow-hidden px-8 py-10 sm:px-12 sm:py-12" tone="cocoa">
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-tl-[90px] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
              <Pill className="bg-white/15 text-white">Ready to Master Hangul?</Pill>
              <h2 className="mt-6 max-w-xl text-5xl font-black tracking-[-0.06em] text-white">
                Build a premium study ritual that actually feels inviting.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
                Join over 100,000 learners using HANGUL to move from first strokes to arena-ready fluency with one consistent, tactile UI.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" className="hangul-button-secondary bg-white text-[var(--hangul-ink)]">
                  Start Learning for Free
                </Link>
                <Link href="/profile" className="border-b border-white/40 pb-1 text-lg font-semibold text-white">
                  Compare Plans
                </Link>
              </div>
            </HangulCard>

            <div className="grid gap-6 sm:grid-cols-2">
              <HangulCard className="p-7" tone="mint">
                <SectionLabel>Soft Feedback</SectionLabel>
                <p className="mt-4 text-3xl font-black tracking-[-0.04em]">Practice that never feels punishing.</p>
                <p className="mt-4 text-base leading-7 text-[var(--hangul-soft-ink)]">
                  Visual cues, rounded forms, and warm tones make extended study sessions calmer and easier to sustain.
                </p>
              </HangulCard>
              <HangulCard className="p-7" tone="peach">
                <SectionLabel>Warm Competition</SectionLabel>
                <p className="mt-4 text-3xl font-black tracking-[-0.04em]">Climb the arena without losing the charm.</p>
                <p className="mt-4 text-base leading-7 text-[var(--hangul-soft-ink)]">
                  Battle in the Otter Arena, but keep the interface polished, soft, and friendly from screen to screen.
                </p>
              </HangulCard>
            </div>
          </section>
        </div>
      </HangulPageFrame>
      <FooterBrand />
    </div>
  );
}
