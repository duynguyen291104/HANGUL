'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Level } from '@/mocks/topics';

const levels: { value: Level; label: string; description: string }[] = [
  {
    value: 'NEWBIE',
    label: 'Cực cơ bản',
    description: 'Làm quen với chữ cái và từ vựng đơn giản',
  },
  {
    value: 'BEGINNER',
    label: 'Sơ cấp',
    description: 'Viết được câu đơn hoàn chỉnh',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Trung cấp',
    description: 'Viết được đoạn văn với 5-7 câu',
  },
  {
    value: 'UPPER',
    label: 'Trên trung cấp',
    description: 'Viết được các bài có logic và lập luận',
  },
  {
    value: 'ADVANCED',
    label: 'Nâng cao',
    description: 'Viết essay, phân tích sâu',
  },
];

export default function LevelSelectionPage() {
  const router = useRouter();
  const { user, updateLevel } = useAuthStore();
  const [selected, setSelected] = useState<Level | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    console.log('[LevelSelection] Token:', token ? 'EXISTS' : 'MISSING');
    console.log('[LevelSelection] User:', user);
    
    if (!token) {
      console.warn('[LevelSelection] No token found, redirecting to login');
      router.push('/login');
      return;
    }

    if (user && user.levelLocked) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSelectLevel = async (level: Level) => {
    setSelected(level);
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('[LevelSelection] Sending token:', token.substring(0, 20) + '...');
      console.log('[LevelSelection] API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/set-level`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level }),
      });

      console.log('[LevelSelection] Response status:', response.status);

      if (response.ok) {
        // Await the level update to complete
        await updateLevel(level);
        // Now redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        console.error('[LevelSelection] API Error:', errorData);
        setError(errorData.error || `Failed to update level (${response.status})`);
      }
    } catch (err) {
      console.error('[LevelSelection] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf5] flex flex-col" style={{
      backgroundImage: 'radial-gradient(#d4c3be 0.5px, transparent 0.5px)',
      backgroundSize: '24px 24px',
    }}>
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        {/* Header Section */}
        <header className="text-center mb-12">
          <div className="mb-8 flex justify-center items-center gap-2">
            <img
              alt="Otter Mascot"
              className="w-[200px] h-[200px] object-contain"
              src="/otter-mascot.png"
            />
          </div>
          <h1 className="text-6xl font-black tracking-tighter mb-4 uppercase text-[#72564c]">
            HANGUL
          </h1>
          <p className="text-2xl font-bold text-[#8d6e63] mb-1" suppressHydrationWarning>
            Chào mừng, {user?.name || 'Learner'}!
          </p>
          <p className="text-[#504441] font-medium">
            Hãy chọn mức độ học tập phù hợp với bạn
          </p>
        </header>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl mb-12">
          {levels.slice(0, 4).map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelectLevel(level.value)}
              disabled={loading}
              className="tactile-card bg-white p-8 rounded-xl flex flex-col items-center text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 border-2 border-transparent hover:border-[#8d6e63] hover:shadow-[0_20px_25px_-5px_rgba(114,86,76,0.1),0_10px_10px_-5px_rgba(114,86,76,0.04)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="text-xl font-extrabold text-[#72564c] mb-2">
                {level.label}
              </h3>
              <p className="text-sm text-[#504441] leading-relaxed">
                {level.description}
              </p>
              {selected === level.value && loading && (
                <div className="mt-4 w-4 h-4 border-2 border-[#72564c] border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
          ))}

          {/* Level 5 (Centered Span) */}
          <button
            onClick={() => handleSelectLevel(levels[4].value)}
            disabled={loading}
            className="tactile-card bg-white p-8 rounded-xl flex flex-col items-center text-center md:col-span-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 border-2 border-transparent hover:border-[#8d6e63] hover:shadow-[0_20px_25px_-5px_rgba(114,86,76,0.1),0_10px_10px_-5px_rgba(114,86,76,0.04)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <h3 className="text-xl font-extrabold text-[#72564c] mb-2">
              {levels[4].label}
            </h3>
            <p className="text-sm text-[#504441] leading-relaxed">
              {levels[4].description}
            </p>
            {selected === levels[4].value && loading && (
              <div className="mt-4 w-4 h-4 border-2 border-[#72564c] border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm mb-6 text-center">
            {error}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="p-10 text-center opacity-40 text-xs tracking-[0.2em] font-bold uppercase text-[#72564c]">
        Designed with Otter Love • Hangul Learning System
      </footer>

      <style>{`
        .tactile-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
