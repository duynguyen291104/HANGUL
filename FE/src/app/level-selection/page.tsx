'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Level } from '@/mocks/topics';

const levels: { value: Level; label: string; description: string; emoji: string }[] = [
  {
    value: 'NEWBIE',
    label: 'Cực cơ bản',
    description: 'Làm quen với chữ cái và từ vựng đơn giản',
    emoji: '🌱',
  },
  {
    value: 'BEGINNER',
    label: 'Sơ cấp',
    description: 'Viết được câu đơn hoàn chỉnh',
    emoji: '🌿',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Trung cấp',
    description: 'Viết được đoạn văn với 5-7 câu',
    emoji: '🌳',
  },
  {
    value: 'UPPER',
    label: 'Trên trung cấp',
    description: 'Viết được các bài có logic và lập luận',
    emoji: '🏔️',
  },
  {
    value: 'ADVANCED',
    label: 'Nâng cao',
    description: 'Viết essay, phân tích sâu',
    emoji: '🏔️❄️',
  },
];

export default function LevelSelectionPage() {
  const router = useRouter();
  const { user, updateLevel } = useAuthStore();
  const [selected, setSelected] = useState<Level | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔥 KIỂM TRA: Nếu user đã chọn level rồi thì redirect về home
  useEffect(() => {
    if (user && user.levelLocked) {
      // User đã chọn level → không cần chọn lại
      router.push('/');
    }
  }, [user, router]);

  const handleSelectLevel = async (level: Level) => {
    setSelected(level);
    setLoading(true);
    setError('');

    try {
      // Update level in authStore (this will also call backend)
      await updateLevel(level);

      // Redirect to home after brief delay
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err: any) {
      console.error('Error setting level:', err);
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
      setLoading(false);
      setSelected(null);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #2d5d4d 0%, #1f4439 100%)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl mb-3">🇰🇷</h1>
          <h2 className="text-4xl font-bold text-white mb-3">HANGUL</h2>
          <p className="text-[#a8d5ba] text-lg">Chào mừng, {user?.name}! 👋</p>
          <p className="text-[#a8d5ba] mt-4 text-lg">
            Hãy chọn mức độ học tập phù hợp với bạn
          </p>
        </div>

        {/* Level Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {levels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelectLevel(level.value)}
              disabled={loading}
              className={`p-6 rounded-2xl transition-all transform hover:scale-105 ${
                selected === level.value
                  ? 'ring-4 ring-[#a8d5ba] shadow-lg'
                  : 'shadow-md hover:shadow-lg'
              } ${loading && selected !== level.value ? 'opacity-50' : ''}`}
              style={{
                background: selected === level.value ? '#a8d5ba' : 'white',
                color: selected === level.value ? '#2d5d4d' : '#2d3436',
              }}
            >
              <div className="text-4xl mb-3">{level.emoji}</div>
              <h3 className="text-xl font-bold mb-2">{level.label}</h3>
              <p className="text-sm opacity-75">{level.description}</p>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#a8d5ba' }}
        >
          <p className="text-sm">
            💡 Bạn có thể thay đổi mức độ bất kỳ lúc nào trong cài đặt
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Selection Info */}
        {selected && (
          <div className="mt-8 text-center">
            <p className="text-[#a8d5ba] mb-4">
              Bạn đã chọn: <span className="font-bold">{levels.find(l => l.value === selected)?.label}</span>
            </p>
            {loading && (
              <div className="flex justify-center items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#a8d5ba]"></div>
                <span className="text-[#a8d5ba]">Đang cập nhật...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
