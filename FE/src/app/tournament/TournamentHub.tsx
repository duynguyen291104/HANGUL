'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { BookOpenText, Mic2, PenTool, Puzzle, Swords, Zap } from 'lucide-react';
import TournamentListening from './games/TournamentListening';
import TournamentMatching from './games/TournamentMatching';
import TournamentQuiz from './games/TournamentQuiz';
import TournamentSpeed from './games/TournamentSpeed';
import TournamentWriting from './games/TournamentWriting';
import { HangulCard, HangulPageFrame, MascotPortrait, MiniRail, Pill, ProgressBar } from '@/components/hangul/ui';

interface Leaderboard {
  rank: number;
  userId: number;
  name: string;
  avatar?: string;
  trophy: number;
  level: string;
  xp: number;
}

interface UserStats {
  userId: number;
  name?: string;
  trophy: number;
  eligible: boolean;
  level?: string;
  xp?: number;
  streak?: number;
}

type GameType = 'quiz' | 'listening' | 'writing' | 'matching' | 'speed' | null;

const GAME_CONFIG = {
  quiz: {
    name: 'Speed Quiz',
    description: 'Match Korean vowels and consonants against the clock.',
    tier: 'Race now',
    icon: Zap,
    tone: 'paper' as const,
    mascot: '🦦',
  },
  writing: {
    name: 'Flash Writing',
    description: 'Precision stroke-order training with immediate feedback.',
    tier: 'Expert tier',
    icon: PenTool,
    tone: 'soft' as const,
    mascot: '🦦',
  },
  matching: {
    name: 'Word Match',
    description: 'Connect definitions to complex Hangul structures fast.',
    tier: 'New records',
    icon: Puzzle,
    tone: 'soft' as const,
    mascot: '🦦',
  },
  listening: {
    name: 'Perfect Speaking',
    description: 'AI-powered pronunciation battle for top fluency scores.',
    tier: 'Intense',
    icon: Mic2,
    tone: 'paper' as const,
    mascot: '🦦',
  },
  speed: {
    name: 'Arena Drill',
    description: 'Rapid-fire challenges blending voice, quiz, and writing.',
    tier: 'Pro rush',
    icon: BookOpenText,
    tone: 'mint' as const,
    mascot: '⚔️',
  },
};

export default function TournamentHub() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 0;

  const [currentGame, setCurrentGame] = useState<GameType>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const loadUserStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to load stats');
        }
        const payload = await response.json();
        setUserStats({
          userId: payload.userId,
          name: payload.name || payload.email,
          trophy: Number(payload.trophy) || 0,
          eligible: Number(payload.trophy) >= 1000,
          level: payload.level,
          xp: payload.xp,
          streak: payload.streak,
        });
      } catch (requestError) {
        console.error(requestError);
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();

    const connection = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
    });
    connection.on('connect', () => {
      connection.emit('tournament:join', { userId, name: userStats?.name || 'Player' });
    });
    connection.on('tournament:leaderboard-updated', (payload: Leaderboard[]) => {
      setLeaderboard(payload);
    });
    setSocket(connection);

    return () => {
      connection.disconnect();
    };
  }, [router, token, userId]);

  const handleGameComplete = async (gameType: GameType, score: number, correctAnswers: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournament/save-score`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType,
          correctAnswers,
          totalQuestions: 10,
          score,
        }),
      });
      const payload = await response.json();
      if (payload.success) {
        setTotalScore((current) => current + score);
        setUserStats(payload.user);
        socket?.emit('tournament:score-update', { userId });
      }
    } catch (requestError) {
      console.error(requestError);
    } finally {
      setCurrentGame(null);
    }
  };

  if (loading) {
    return (
      <HangulPageFrame activeNav="Arena">
        <HangulCard className="grid min-h-[72vh] place-items-center p-10">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[rgba(140,103,88,0.12)] border-t-[var(--hangul-accent)]" />
            <p className="mt-5 text-lg text-[var(--hangul-soft-ink)]">Loading the Otter Arena...</p>
          </div>
        </HangulCard>
      </HangulPageFrame>
    );
  }

  const currentTrophy = userStats?.trophy ?? 0;
  const isEligible = currentTrophy >= 1000;
  const progressPercent = Math.min((currentTrophy / 1000) * 100, 100);

  if (currentGame) {
    const GameComponent = {
      quiz: TournamentQuiz,
      listening: TournamentListening,
      writing: TournamentWriting,
      matching: TournamentMatching,
      speed: TournamentSpeed,
    }[currentGame];

    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#f9f5ee,#f3ecdf)]">
        <GameComponent
          onComplete={(score, correctAnswers) => handleGameComplete(currentGame, score, correctAnswers)}
          onExit={() => setCurrentGame(null)}
          userLevel={userStats?.level || 'BEGINNER'}
        />
      </div>
    );
  }

  if (!isEligible) {
    return (
      <HangulPageFrame activeNav="Arena">
        <HangulCard className="mx-auto max-w-[980px] p-10 text-center">
          <Pill className="bg-[#ffe8c8] text-[#9c6700]">Weekly Tournament</Pill>
          <h1 className="mt-6 text-6xl font-black tracking-[-0.06em] text-[var(--hangul-ink)]">The Otter Arena</h1>
          <p className="mx-auto mt-5 max-w-3xl text-xl leading-9 text-[var(--hangul-soft-ink)]">
            Choose your battleground, sharpen your skills, and unlock seasonal competition once you reach the trophy gate.
          </p>
          <div className="mx-auto mt-10 max-w-xl rounded-[34px] bg-white/80 p-8 shadow-[0_24px_50px_rgba(121,95,78,0.12)]">
            <p className="text-6xl font-black tracking-[-0.06em] text-[var(--hangul-ink)]">{currentTrophy}</p>
            <p className="mt-2 text-xl text-[var(--hangul-soft-ink)]">of 1000 trophies required</p>
            <ProgressBar className="mt-8 h-5" value={progressPercent} />
            <p className="mt-4 text-lg text-[var(--hangul-soft-ink)]">Earn {Math.max(0, 1000 - currentTrophy)} more trophies through quiz, pronunciation, and writing practice.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button className="hangul-button-primary" onClick={() => router.push('/quiz')} type="button">Start Quiz</button>
              <button className="hangul-button-secondary" onClick={() => router.push('/pronunciation')} type="button">Open Practice Lab</button>
            </div>
          </div>
        </HangulCard>
      </HangulPageFrame>
    );
  }

  const ranking = leaderboard.find((player) => player.userId === userId)?.rank ?? 42;
  const prizeTimer = '2d 14h 22m';
  const displayedBoard = leaderboard.length > 0
    ? leaderboard.slice(0, 3)
    : [
        { rank: 1, userId: 11, name: 'KimChiWarrior', trophy: 24850, level: 'MASTER', xp: 0 },
        { rank: 2, userId: 12, name: 'SeoulRunner', trophy: 22100, level: 'UPPER', xp: 0 },
        { rank: 3, userId: 13, name: 'PaliPali_99', trophy: 21450, level: 'BEGINNER', xp: 0 },
      ];

  return (
    <HangulPageFrame activeNav="Arena">
      <div className="grid gap-6 xl:grid-cols-[104px_minmax(0,1fr)_420px]">
        <div className="hidden xl:block">
          <MiniRail />
        </div>

        <div className="space-y-6">
          <div className="px-2 pt-8">
            <Pill className="bg-[#ffe8c8] text-[#9c6700]">Weekly Tournament</Pill>
            <h1 className="mt-6 text-[clamp(3.8rem,6vw,6rem)] font-black tracking-[-0.06em] text-[var(--hangul-ink)]">The Otter Arena</h1>
            <p className="mt-4 max-w-4xl text-[1.55rem] leading-[1.55] text-[var(--hangul-soft-ink)]">
              Choose your battleground. Sharpen your skills against players worldwide and climb the seasonal rankings for exclusive rewards.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(GAME_CONFIG).slice(0, 4).map(([key, item]) => {
              const Icon = item.icon;
              return (
                <button key={key} className="text-left" onClick={() => setCurrentGame(key as GameType)} type="button">
                  <HangulCard className="h-full p-7" tone={item.tone}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/72 text-[var(--hangul-soft-ink)]">
                        <Icon className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--hangul-soft-ink)]">{item.tier}</p>
                    </div>
                    <p className="mt-14 text-5xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">{item.name}</p>
                    <p className="mt-5 text-xl leading-9 text-[var(--hangul-soft-ink)]">{item.description}</p>
                    <div className="mt-10 flex justify-end">
                      <MascotPortrait emoji={item.mascot} tone={key === 'quiz' ? 'paper' : key === 'writing' ? 'paper' : key === 'matching' ? 'sky' : 'peach'} className="h-32 w-32" />
                    </div>
                  </HangulCard>
                </button>
              );
            })}
          </div>

          <HangulCard className="p-4">
            <button className="hangul-button-primary w-full justify-center text-2xl" onClick={() => setCurrentGame('speed')} type="button">
              <Swords className="mr-3 h-6 w-6" />
              Enter Arena
            </button>
          </HangulCard>
        </div>

        <div className="space-y-6">
          <HangulCard className="p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-5xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">Leaderboard</h2>
              <Pill className="bg-[#ffe8dd] text-[var(--hangul-accent)]">Global</Pill>
            </div>
            <div className="mt-8 space-y-4">
              {displayedBoard.map((player) => (
                <div key={player.userId} className="flex items-center gap-4 rounded-[30px] bg-white/72 px-5 py-5 shadow-[0_16px_34px_rgba(121,95,78,0.08)]">
                  <div className="w-8 text-xl font-bold text-[var(--hangul-gold)]">{player.rank}</div>
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(145deg,#101318,#27323d)] text-3xl text-white">{player.rank}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-black tracking-[-0.03em] text-[var(--hangul-ink)]">{player.name}</p>
                    <p className="text-lg text-[var(--hangul-soft-ink)]">{player.trophy.toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
              <div className="mt-5 flex items-center gap-4 rounded-[30px] bg-[linear-gradient(135deg,#8d695c,#6d5047)] px-5 py-5 text-white shadow-[0_18px_42px_rgba(123,90,78,0.2)]">
                <div className="w-10 text-2xl font-black">{ranking}</div>
                <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-[linear-gradient(145deg,#101318,#27323d)] text-2xl">🧑</div>
                <div className="flex-1">
                  <p className="text-2xl font-black tracking-[-0.03em]">You ({userStats?.name || 'OtterLearner'})</p>
                  <p className="text-lg text-white/72">{(userStats?.trophy || 0).toLocaleString()} pts</p>
                </div>
              </div>
            </div>
            <button className="mt-8 w-full text-center text-xl font-semibold text-[var(--hangul-soft-ink)]" type="button">
              View Full Standings →
            </button>
          </HangulCard>

          <HangulCard className="p-8" tone="gold">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/72">Weekly Prize</p>
            <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-white">Master Calligrapher Otter Skin</p>
            <p className="mt-5 text-xl text-white/82">Ends in: {prizeTimer}</p>
            <div className="mt-8 flex items-end justify-between gap-4">
              <MascotPortrait emoji="🏆" tone="gold" className="h-40 w-40" />
              <div className="text-right text-lg text-white/75">
                <p>Daily score bonus: {totalScore}</p>
                <p>Streak multiplier active</p>
              </div>
            </div>
          </HangulCard>
        </div>
      </div>
    </HangulPageFrame>
  );
}

