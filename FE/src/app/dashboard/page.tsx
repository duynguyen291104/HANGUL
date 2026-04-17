'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/Header';
import Link from 'next/link';

interface GameStats {
  trophy?: number;
  xp?: number;
  quizCount?: number;
  writeCount?: number;
  speakCount?: number;
  rank?: string;
  eligible?: boolean;
}

interface ActivityData {
  weekStart: string;
  weekEnd: string;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  avgSessionMinutes: number;
  activityCount: number;
  daily: Array<{
    date: string;
    dayOfWeek: string;
    seconds: number;
    minutes: number;
    hours: string;
  }>;
}

export default function Dashboard() {
  const router = useRouter();
  const { user: authUser, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<ActivityData | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (authUser && !authUser.levelLocked) {
      router.push('/level-selection');
      return;
    }

    loadData();
  }, [token, authUser, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const [, statsRes, activityRes] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity/weekly`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
      ]);

      clearTimeout(timeoutId);

      // Check if requests succeeded
      const statsOk = statsRes.status === 'fulfilled' && statsRes.value.ok;
      const activityOk = activityRes.status === 'fulfilled' && activityRes.value.ok;

      if (!statsOk) {
        console.warn('API calls failed, using default data');
        setStats({
          trophy: 0,
          xp: 0,
          quizCount: 0,
          writeCount: 0,
          speakCount: 0,
          rank: 'Beginner',
          eligible: true,
        });
        setLoading(false);
        return;
      }

      const statsData = await statsRes.value.json();
      setStats(statsData);

      if (activityOk) {
        const activityData = await activityRes.value.json();
        setWeeklyActivity(activityData);
      }
      setLoading(false);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
      // Set default data on error
      setStats({
        trophy: 0,
        xp: 0,
        quizCount: 0,
        writeCount: 0,
        speakCount: 0,
        rank: 'Beginner',
        eligible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafaf5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#72564c] mx-auto mb-4"></div>
          <p className="text-[#504441]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <Header />
      <div className="flex">
        {/* Main Content */}
        <main className="flex-grow p-8 lg:p-12 max-w-7xl mx-auto">

          {/* Welcome Section */}
          <section className="relative mb-12 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                <h1 className="text-5xl lg:text-7xl font-extrabold text-[#72564c] tracking-tighter mb-4 leading-none">
                  Welcome back,<br />
                  <span className="text-[#815300]">Explorer!</span>
                </h1>
                <p className="text-xl text-[#504441] max-w-lg">
                  You're on a {stats?.quizCount ?? 0}-day streak. Keep the momentum going and master your next 10 characters today.
                </p>
              </div>
              <div className="lg:col-span-4 relative group">
                <div className="absolute -top-16 -left-12 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 z-10">
                  <p className="font-bold text-[#72564c] italic">"Fighting! You are doing great today!"</p>
                </div>
                <img
                  alt="Hana the Otter mascot"
                  className="w-48 h-48 object-contain drop-shadow-2xl transform translate-y-4"
                  src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png"
                />
              </div>
            </div>
          </section>

          {/* Game Stats */}
          {stats && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-[#72564c] mb-6">Your Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-[#815300] to-[#a26900] rounded-lg p-4 text-white shadow-lg">
                  <p className="text-sm opacity-90 mb-2">Rank</p>
                  <p className="text-3xl font-bold">{stats.rank}</p>
                </div>
                <div className="bg-gradient-to-br from-[#ffb957] to-[#ffddb5] rounded-lg p-4 text-[#2a1800] shadow-lg">
                  <p className="text-sm opacity-90 mb-2">Trophy</p>
                  <p className="text-3xl font-bold">{stats?.trophy ?? 0}</p>
                </div>
                <div className="bg-gradient-to-br from-[#72564c] to-[#8d6e63] rounded-lg p-4 text-white shadow-lg">
                  <p className="text-sm opacity-90 mb-2">XP</p>
                  <p className="text-3xl font-bold">{stats?.xp ?? 0}</p>
                </div>
                <div className="bg-gradient-to-br from-[#406561] to-[#c2ebe5] rounded-lg p-4 text-white shadow-lg">
                  <p className="text-sm opacity-90 mb-2">Quiz</p>
                  <p className="text-3xl font-bold">{stats?.quizCount ?? 0}</p>
                </div>
                <div className={`rounded-lg p-4 shadow-lg text-white ${stats.eligible ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                  <p className="text-sm opacity-90 mb-2">Tournament</p>
                  <p className="text-2xl font-bold">{stats.eligible ? 'Eligible' : 'Locked'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bento Grid Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Daily Goal Progress */}
            <div className="md:col-span-2 lg:col-span-2 bg-[#f4f4ef] p-8 rounded-lg flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <span className="text-6xl opacity-20">✨</span>
              </div>
              <h3 className="font-bold text-[#72564c] mb-8">Daily Goal</h3>
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-[#e8e8e3]"></circle>
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-[#815300] rounded-full transition-all duration-1000" strokeDasharray="553" strokeDashoffset="138"></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-[#72564c]">75%</span>
                  <span className="text-xs uppercase tracking-widest font-bold opacity-60">Complete</span>
                </div>
              </div>
              <p className="text-sm font-medium text-[#504441]">15 / 20 XP earned today</p>
            </div>

            {/* Continue Lesson */}
            <Link href="/quiz" className="bg-[#72564c] text-white p-8 rounded-lg flex flex-col justify-between group cursor-pointer hover:bg-[#8d6e63] transition-all shadow-lg active:scale-[0.98]">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/10 rounded-full">
                  <span className="text-2xl"></span>
                </div>
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">Level 2</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Continue Lesson</h3>
                <p className="text-sm opacity-80">Common Verbs & Sentence Structures</p>
              </div>
            </Link>

            {/* Vocabulary Flashcards */}
            <div className="bg-[#e3e3de] p-8 rounded-lg flex flex-col justify-between hover:shadow-xl transition-shadow cursor-pointer relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <span className="text-9xl"></span>
              </div>
              <div className="p-3 bg-[#72564c]/10 rounded-full w-fit">
                <span className="text-2xl"></span>
              </div>
              <div className="z-10">
                <h3 className="text-xl font-bold text-[#72564c] mb-1">Vocabulary</h3>
                <p className="text-sm text-[#504441]">42 words to review</p>
              </div>
            </div>

            {/* Daily Quiz */}
            <div className="bg-[#eeeee9] p-8 rounded-lg flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#d4c3be]/20">
              <div className="p-3 bg-[#815300]/10 rounded-full w-fit">
                <span className="text-2xl">❓</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1a1c19] mb-1">Daily Quiz</h3>
                <p className="text-sm text-[#504441]">Test your knowledge from yesterday</p>
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="lg:col-span-2 bg-white p-8 rounded-lg border border-[#d4c3be]/10 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-[#72564c] mb-1">Weekly Activity</h3>
                  <p className="text-sm text-[#504441]/60">
                    {weeklyActivity?.totalHours} hours this week
                  </p>
                </div>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#815300]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffdbce]"></div>
                </div>
              </div>
              
              {weeklyActivity ? (
                <div>
                  <div className="flex items-end justify-between h-32 gap-2 mb-4">
                    {weeklyActivity.daily.map((day, idx) => {
                      const maxSeconds = Math.max(...weeklyActivity.daily.map(d => d.seconds), 3600); // At least 1 hour for scale
                      const heightPercent = (day.seconds / maxSeconds) * 100 || 5;
                      const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                      
                      return (
                        <div key={idx} className="flex-grow flex flex-col items-center gap-1">
                          <div 
                            className={`flex-grow w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer ${
                              day.seconds === 0 
                                ? 'bg-[#e3e3de]' 
                                : isToday
                                ? 'bg-[#815300]'
                                : 'bg-[#8d6e63]'
                            }`}
                            style={{ height: `${Math.max(heightPercent, 10)}%` }}
                            title={`${day.dayOfWeek}: ${day.minutes} min`}
                          ></div>
                          <span className="text-[10px] font-bold text-[#827470] uppercase tracking-widest">
                            {day.dayOfWeek.slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Activity Stats Row */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#e8e8e3]">
                    <div className="text-center">
                      <p className="text-xs text-[#504441]/60 mb-1">Total Time</p>
                      <p className="font-bold text-[#72564c]">{weeklyActivity.totalHours}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#504441]/60 mb-1">Avg Session</p>
                      <p className="font-bold text-[#72564c]">{weeklyActivity.avgSessionMinutes}m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#504441]/60 mb-1">Sessions</p>
                      <p className="font-bold text-[#72564c]">{weeklyActivity.activityCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-end justify-between h-32 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-grow bg-[#e3e3de] rounded-t-lg h-[40%]"></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg flex justify-around items-center py-4 px-6 border-t border-[#d4c3be]/10 z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#72564c]">
          <span className="text-2xl"></span>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </Link>
        <Link href="/quiz" className="flex flex-col items-center gap-1 text-[#504441]/60">
          <span className="text-2xl"></span>
          <span className="text-[10px] font-bold uppercase">Learn</span>
        </Link>
        <Link href="/tournament" className="flex flex-col items-center gap-1 text-[#504441]/60">
          <span className="text-2xl"></span>
          <span className="text-[10px] font-bold uppercase">Rank</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-[#504441]/60">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <img alt="Profile" className="w-full h-full object-cover" src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png" />
          </div>
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </button>
      </nav>
    </div>
  );
}