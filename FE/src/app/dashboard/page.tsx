'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface GameStats {
  trophy?: number;
  xp?: number;
  quizCount?: number;
  writeCount?: number;
  speakCount?: number;
  rank?: string;
  unlockTournament?: boolean;
}

interface UserData {
  id: number;
  email: string;
  name: string;
  level: string;
  levelLocked?: boolean;
}

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

    // Kiểm tra xem người dùng đã chọn cấp độ chưa
    // Nếu levelLocked = false tức là chưa chọn
    if (authUser && !authUser.levelLocked) {
      router.push('/level-selection');
      return;
    }

    loadData();
  }, [token, authUser, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [userRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!userRes.ok || !statsRes.ok) {
        throw new Error('Failed to load data');
      }

      const userData = await userRes.json();
      const statsData = await statsRes.json();

      setUser(userData);
      setStats(statsData);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { label: '📸 Từ Vựng', href: '/camera', description: 'Nhận diện bằng camera' },
    { label: '🎯 Quiz', href: '/quiz', description: 'Trả lời câu hỏi' },
    { label: '✏️ Luyện Viết', href: '/writing', description: 'So sánh với đáp án' },
    { label: '🎤 Phát Âm', href: '/pronunciation', description: 'Ghi âm và kiểm tra' },
    { label: ' Giải Đấu', href: '/tournament', description: 'Cạnh tranh với người khác', locked: !stats?.unlockTournament },
    { label: ' Học Tập', href: '/learning-map', description: 'Theo dõi tiến độ' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold">Xin chào, {user.name}! </h1>
              <p className="text-purple-100 mt-2">Cấp độ: <span className="font-semibold text-white">{user.level}</span></p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Game Economy Section */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎮 Thống Kê Của Bạn</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Rank Card */}
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg p-4 text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">Xếp Hạng</p>
                <p className="text-3xl font-bold">{stats.rank}</p>
                <p className="text-xs mt-2">Dựa trên XP</p>
              </div>

              {/* Trophy Card */}
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-4 text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">Trophy</p>
                <p className="text-3xl font-bold"> {stats?.trophy ?? 0}</p>
                {!stats?.unlockTournament && (
                  <p className="text-xs mt-2">{(1000 - (stats?.trophy ?? 0))} cần</p>
                )}
              </div>

              {/* XP Card */}
              <div className="bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg p-4 text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">XP</p>
                <p className="text-3xl font-bold">⭐ {stats?.xp ?? 0}</p>
                <p className="text-xs mt-2">Điểm kinh nghiệm</p>
              </div>

              {/* Quiz Card */}
              <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg p-4 text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">Quiz</p>
                <p className="text-3xl font-bold"> {stats?.quizCount ?? 0}</p>
                <p className="text-xs mt-2">Bài hoàn thành</p>
              </div>

              {/* Tournament Status */}
              <div className={`rounded-lg p-4 shadow-lg text-white ${stats.unlockTournament ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                <p className="text-sm opacity-90 mb-2">Giải Đấu</p>
                <p className="text-2xl font-bold">{stats.unlockTournament ? '🔓' : '🔒'}</p>
                <p className="text-xs mt-2">{stats.unlockTournament ? 'Sẵn sàng' : 'Khóa'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Activity Stats */}
        {stats && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4"> Hoạt Động</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-600 text-sm">Quiz</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.quizCount ?? 0}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-600 text-sm">Luyện Viết</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.writeCount ?? 0}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-gray-600 text-sm">Phát Âm</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.speakCount ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🎓 Các Chức Năng Học Tập</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => {
            const isLocked = item.locked;
            return (
              <Link
                key={idx}
                href={isLocked ? '#' : item.href}
                onClick={(e) => isLocked && e.preventDefault()}
                className={`rounded-lg p-6 shadow-lg transition transform hover:scale-105 ${
                  isLocked
                    ? 'bg-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-white hover:shadow-xl'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-4xl">{item.label.split(' ')[0]}</span>
                  {isLocked && <span className="text-2xl">🔒</span>}
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">{item.label.split(' ').slice(1).join(' ')}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
                {isLocked && (
                  <p className="text-red-600 text-xs font-semibold mt-3">Cần 1000+ Trophy</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
