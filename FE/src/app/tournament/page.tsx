'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  difficulty: string;
  mascot: string;
  mascotAlt: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  avatar: string;
  avatarAlt: string;
  isPremium?: boolean;
}

interface UserRank {
  rank: number;
  name: string;
  points: number;
}

export default function TournamentPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [userRank] = useState<UserRank>({
    rank: 42,
    name: 'OtterLearner',
    points: 15300,
  });
  const [leaderboard] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      name: 'KimChiWarrior',
      points: 24850,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZM2pK8dCYowOZOj11ds8H89uBQGNs9eeyJh9bwv1wSoB84MBMX8ibCeQ3uTILYTfV3RyD2k4_PWYA3QdSEt74W8XPV7-X9pNFknQl1p9LZxKnIpRJPN-uknCrZjG_qp9YtbV_5bGZx2oiqClZftxhM1_3jNVMlgwvLMQa9WbNHTSDimAF31yGOGwfAbVs7dn_QVYDw-TLDZ9dsW5TVRDEPQmbVK-wxEcbrkMO_byOd4nuY-LzQQqd8f1OhHFSSBGVe8xN1bYfL3wY',
      avatarAlt: 'Clever fox wearing a crown',
      isPremium: true,
    },
    {
      rank: 2,
      name: 'SeoulRunner',
      points: 22100,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVi9wPjnpA1lQVrOtpxijtSBOn8cvq-4PxlIRFypJHW24Rr6XNmYutEnv81CMhlEl_ZJaaTpxk4oJeoPvL9BAMhV_3mrfFEc03a0k0PiHYEMnMnhhuOaD2nH3myKi-rwJhSUVuNKgNAkbwYi7AEmbA1Ftcb9VpmCBoX-XmDCG-HQsaxhQtQFAgrmhmrawR78mTHHtPUJGlYyt4WE6n-Y4hZKgjKZb6B5TIEOXe0KBWNWxPKT0PiOVdvK9qiLL_4fB1BInm6DmFbn2F',
      avatarAlt: 'Happy bear wearing a blue hoodie',
    },
    {
      rank: 3,
      name: 'PaliPali_99',
      points: 21450,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNi2ZQ5PddpH4mo6LxotH06OtoOPvo_OHLDLYgmiEXE3YijgHSjlkLCJImCpQ7PsHbEBkuLrJDHIjLCGwrvzNbgquvEcP-G3Grfkh7UTgfay6alo4ELnPExLCpd6yR8aJZfISjlzbXKXKi_hqFV_NhAnXdQo8M7GglceSj4LyuaD9alhLg8_Kf7_QdcOgDMGUeFuuNKo8Sq0OSN3AzGJYwG4JTpfIBQVa_07uNxHrRs5Yh9__i2NylEIQvqqjBWln-yB2hGcy3pySc',
      avatarAlt: 'Ninja cat with a mask',
    },
  ]);

  const gameModes: GameMode[] = [
    {
      id: 'speed-quiz',
      title: 'Speed Quiz',
      description: 'Match Korean vowels and consonants against the clock.',
      icon: '',
      color: 'bg-[#ffddb5]',
      status: 'Live Now',
      difficulty: 'Intermediate',
      mascot: 'https://res.cloudinary.com/dds5jlp7e/image/upload/q_auto/f_auto/v1775133394/clock_okbser.png',
      mascotAlt: 'Clock icon for Speed Quiz',
    },
    {
      id: 'flash-writing',
      title: 'Flash Writing',
      description: 'Precision stroke order training with immediate feedback.',
      icon: '',
      color: 'bg-[#c2ebe5]',
      status: 'Expert Tier',
      difficulty: 'Advanced',
      mascot: 'https://res.cloudinary.com/dds5jlp7e/image/upload/q_auto/f_auto/v1775133605/writing_kgqgdy.png',
      mascotAlt: 'Writing icon for Flash Writing',
    },
    {
      id: 'word-match',
      title: 'Word Match',
      description: 'Connect definitions to complex Hangul structures fast.',
      icon: '',
      color: 'bg-[#ffddb5]',
      status: 'New Records',
      difficulty: 'Intermediate',
      mascot: 'https://res.cloudinary.com/dds5jlp7e/image/upload/q_auto/f_auto/v1775133703/puzzle_k88yqv.png',
      mascotAlt: 'Puzzle icon for Word Match',
    },
    {
      id: 'perfect-speaking',
      title: 'Perfect Speaking',
      description: 'AI-powered pronunciation battle for top fluency scores.',
      icon: '',
      color: 'bg-[#ffdad6]',
      status: 'Intense',
      difficulty: 'Expert',
      mascot: 'https://res.cloudinary.com/dds5jlp7e/image/upload/q_auto/f_auto/v1775133799/microphone_1_syam64.png',
      mascotAlt: 'Microphone icon for Perfect Speaking',
    },
  ];

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <Header />
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Header Section */}
          <div className="pt-[70px] pl-[200px]">
            <h1 className="text-5xl font-extrabold text-[#1a1c19] tracking-tight mb-0">The Otter Arena</h1>
            <p className="text-[#504441] max-w-lg leading-relaxed mt-[20px]">
              Choose your battleground. Sharpen your skills against players worldwide and climb the seasonal rankings for exclusive rewards.
            </p>
          </div>

          <div className="px-[90px] py-12 max-w-7xl mx-auto">
            {/* The Otter Arena Section */}
            <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
              {/* Game Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {gameModes.map((mode) => (
                  <Link
                    key={mode.id}
                    href={`/tournament/games/${mode.id}`}
                    className="group relative bg-[#f4f4ef] rounded-lg p-8 overflow-hidden transition-all hover:translate-y-[-4px] cursor-pointer hover:shadow-xl"
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <h3 className="text-2xl font-bold mb-2 text-[#1a1c19]">{mode.title}</h3>
                      <p className="text-sm text-[#504441] mb-6">{mode.description}</p>
                      <div className="mt-auto flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold uppercase tracking-widest text-[#72564c]">{mode.status}</span>
                          <span className="text-xs text-[#504441]">{mode.difficulty}</span>
                        </div>
                        <div className="w-24 h-24 -mr-4 -mb-4 rounded-lg overflow-hidden">
                          <img alt={mode.mascotAlt} src={mode.mascot} className="w-full h-full object-cover brightness-0 saturate-200" style={{filter: 'sepia(0.6) hue-rotate(15deg) brightness(0.9) saturate(1.5)'}} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[#1a1c19]">Leaderboard</h2>
                <span className="text-xs font-bold text-[#72564c] px-3 py-1 bg-[#ffdbce] rounded-full">GLOBAL</span>
              </div>

              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-4 p-4 bg-[#f9f9f7] rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-8 text-center font-black text-[#815300]">{entry.rank}</div>
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#ffddb5]">
                      <img alt={entry.avatarAlt} src={entry.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#1a1c19]">{entry.name}</p>
                      <p className="text-xs text-[#504441]">{entry.points.toLocaleString()} pts</p>
                    </div>
                    {entry.isPremium && <span className="text-lg"></span>}
                  </div>
                ))}

                <div className="py-2 border-t border-[#d4c3be] opacity-20 my-4"></div>

                {/* Current User */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white rounded-lg shadow-lg">
                  <div className="w-8 text-center font-black">{userRank.rank}</div>
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white">
                    <img
                      alt="Your profile"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJoMsfYw4TU1mbNhOektUNzsOIA6ArwLScIPgB3T32k-lOj3j3eSSyQx7Gfb-dJaHA_rPiDxHDgQmpPf5hg3WnGlupY7yTEnG39i-I959118mt6M5iRaG_SelTBVYyMC5uogTjogAqw8P5eO8ENM8bCb6NXWtwUtvCTpgFx2DSt04FrvbAnXiMBMhN0slj_KQfMoJpPGuP2qoe6y7CQmDnkvqx6-wrQ_CknwDmwgu7R2zJuIaBQXUK7Wibsadwqbkf776axCcux6EO"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">You ({userRank.name})</p>
                    <p className="text-xs opacity-80">{userRank.points.toLocaleString()} pts</p>
                  </div>
                  <span>📈</span>
                </div>
              </div>

              <button className="w-full mt-8 py-4 text-[#72564c] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#eeeee9] transition-colors rounded-full">
                View Full Standings →
              </button>

              {/* Weekly Reward */}
              <div className="mt-8 bg-gradient-to-br from-[#815300] to-[#a26900] text-white p-6 rounded-lg relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Weekly Prize</p>
                  <h4 className="text-lg font-bold mb-4">Master Calligrapher Otter Skin</h4>
                  <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span className="text-sm">Ends in: 2d 14h 22m</span>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 opacity-20 text-6xl">🏅</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
