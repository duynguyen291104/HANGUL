'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeaderboardPlayer {
  rank: number;
  userId: number;
  userName: string;
  score: number;
  medal: string;
}

interface UserStats {
  stats: {
    trophy: number;
    xp: number;
    quizCount: number;
    writeCount: number;
    speakCount: number;
  };
  rank: string;
  unlockTournament: boolean;
}

export default function TournamentPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadTournamentData();
  }, [token]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);
      const [leaderboardRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournament/leaderboard`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const leaderboardData = await leaderboardRes.json();
      const statsData = await statsRes.json();

      setLeaderboard(leaderboardData);
      setUserStats(statsData);

      const userInLeaderboard = leaderboardData.some((p: any) => p.userId === statsData.stats.userId);
      setJoined(userInLeaderboard);
    } catch (error) {
      console.error('Lỗi tải dữ liệu giải đấu:', error);
      setError('Không thể tải dữ liệu giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async () => {
    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournament/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Không thể tham gia giải đấu');
        return;
      }

      setJoined(true);
      loadTournamentData();
    } catch (error) {
      console.error('Lỗi tham gia giải đấu:', error);
      setError('Không thể tham gia giải đấu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải giải đấu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Quay Lại
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">🏆 Giải Đấu</h1>
          <div></div>
        </div>

        {/* User Stats Card */}
        {userStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Đầu Cấp</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.rank}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Hũy Căn</p>
                <p className="text-2xl font-bold text-yellow-500">🏆 {userStats.stats.trophy}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Kinh Nghiệm</p>
                <p className="text-2xl font-bold text-purple-600">⭐ {userStats.stats.xp}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Trạng Thái</p>
                {userStats.unlockTournament ? (
                  <p className="text-2xl font-bold text-green-600">✅ Mở Khóa</p>
                ) : (
                  <p className="text-lg font-bold text-red-600">🔒 {1000 - userStats.stats.trophy} cần</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tournament Info */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-3">Weekly Korean League 🥇</h2>
            <p className="text-white mb-6 text-lg">Tham gia giải đấu hàng tuần và đứng trên bảng xếp hạng!</p>

            {error && <div className="bg-red-500 text-white p-4 rounded-lg mb-6">{error}</div>}

            {userStats && !userStats.unlockTournament ? (
              <div className="bg-white bg-opacity-20 p-6 rounded-lg backdrop-blur">
                <p className="text-white mb-4 font-semibold text-lg">
                  🔒 Bạn cần <span className="font-bold">{1000 - userStats.stats.trophy}</span> Trophy để mở khóa giải đấu
                </p>
                <p className="text-white text-sm mb-4">Hoàn thành Quiz, Writing, và Pronunciation để kiếm Trophy!</p>
                <Link
                  href="/quiz"
                  className="inline-block px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100"
                >
                  Làm Quiz Ngay
                </Link>
              </div>
            ) : (
              <button
                onClick={handleJoinTournament}
                disabled={joined}
                className={`px-8 py-4 rounded-lg font-semibold text-lg ${
                  joined
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-white text-blue-600 hover:bg-gray-100'
                }`}
              >
                {joined ? '✅ Đã Tham Gia' : '⚔️ Tham Gia Giải Đấu'}
              </button>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h2 className="text-2xl font-bold text-white">🥇 Bảng Xếp Hạng</h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">Chưa có người chơi nào tham gia giải đấu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Hạng</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Tên</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{player.medal}</span>
                          <span className="font-bold text-lg text-gray-700">#{player.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{player.userName}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xl font-bold text-blue-600">{player.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How it Works */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Cách Hoạt Động</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-xl">1️⃣</span>
              <span>Kiếm <strong>1000+ Trophy</strong> từ Quiz, Writing, Pronunciation</span>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">2️⃣</span>
              <span>Mở khóa chế độ <strong>Giải Đấu</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">3️⃣</span>
              <span>Tham gia và <strong>cạnh tranh</strong> với người chơi khác</span>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">4️⃣</span>
              <span>Lên <strong>bảng xếp hạng</strong> và kiếm <strong>Medal</strong> 🥇🥈🥉</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
