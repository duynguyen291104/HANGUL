'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { leaderboardService } from '@/services/api';

interface LeaderboardUser {
  id: number;
  name: string;
  level: string;
  totalXP: number;
  currentStreak: number;
  rank: number;
}

interface UserRank {
  rank: number;
  totalXP: number;
  percentile: number;
}

export default function LeaderboardPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [timeframe, setTimeframe] = useState('top');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      loadLeaderboard();
    }
  }, [token, router, timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let response;
      
      if (timeframe === 'top') {
        response = await leaderboardService.getTopUsers(50, filterLevel === 'ALL' ? undefined : filterLevel);
      } else if (timeframe === 'weekly') {
        response = await leaderboardService.getWeekly(50);
      } else {
        response = await leaderboardService.getMonthly(50);
      }
      
      setUsers(response.users || []);

      // Load user's rank
      try {
        const rank = await leaderboardService.getNearby();
        if (rank) {
          setUserRank(rank);
        }
      } catch (e) {
        console.log('Không thể tải xếp hạng của người dùng');
      }
    } catch (error) {
      console.error('Lỗi tải bảng xếp hạng:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      NEWBIE: 'bg-gray-100 text-gray-800',
      BEGINNER: 'bg-green-100 text-green-800',
      INTERMEDIATE: 'bg-blue-100 text-blue-800',
      UPPER_INTERMEDIATE: 'bg-purple-100 text-purple-800',
      ADVANCED: 'bg-orange-100 text-orange-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-600">🏆 Bảng xếp hạng</h1>
          <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-800 text-2xl">✕</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Lọc theo cấp độ</label>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'].map(level => (
                  <button
                    key={level}
                    onClick={() => {
                      setFilterLevel(level);
                      setTimeframe('top');
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      filterLevel === level
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {level === 'UPPER_INTERMEDIATE' ? 'UPPER_INT' : level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Lọc theo thời gian</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'top', label: 'Tất cả' },
                  { value: 'weekly', label: 'Tuần này' },
                  { value: 'monthly', label: 'Tháng này' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTimeframe(value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      timeframe === value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!loading && users.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {users.slice(0, 3).map((u, index) => (
              <div
                key={u.id}
                className={`rounded-lg shadow-lg p-6 text-center transform transition ${
                  index === 0
                    ? 'bg-yellow-50 border-2 border-yellow-400 col-span-1 order-2 scale-105'
                    : index === 1
                    ? 'bg-gray-50 border-2 border-gray-400 order-1'
                    : 'bg-orange-50 border-2 border-orange-400 order-3'
                }`}
              >
                <div className="text-4xl mb-2">{getRankBadge(u.rank)}</div>
                <h3 className="text-lg font-bold text-gray-800">{u.name}</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getLevelColor(u.level)}`}>
                  {u.level}
                </div>
                <div className="space-y-1 text-gray-700 text-sm">
                  <p>⭐ {u.totalXP} XP</p>
                  <p>🔥 {u.currentStreak} ngày</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải bảng xếp hạng...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Xếp hạng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Cấp độ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">XP</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Streaks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-indigo-50 transition">
                      <td className="px-6 py-4 text-center text-lg font-bold">{getRankBadge(user.rank)}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(user.level)}`}>
                          {user.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-indigo-600">⭐ {user.totalXP}</td>
                      <td className="px-6 py-4 text-right font-semibold text-orange-600">🔥 {user.currentStreak}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                      Không có dữ liệu bảng xếp hạng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {userRank && (
          <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-6">
            <h3 className="text-lg font-bold text-indigo-800 mb-4">📍 Vị trí của bạn</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Xếp hạng</div>
                <div className="text-3xl font-bold text-indigo-600">#{userRank.rank}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">XP</div>
                <div className="text-3xl font-bold text-green-600">⭐ {userRank.totalXP}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phần trăm</div>
                <div className="text-3xl font-bold text-purple-600">{userRank.percentile}%</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
