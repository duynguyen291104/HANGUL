'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import TournamentQuiz from './games/TournamentQuiz';
import TournamentListening from './games/TournamentListening';
import TournamentWriting from './games/TournamentWriting';
import TournamentMatching from './games/TournamentMatching';
import TournamentSpeed from './games/TournamentSpeed';
import TournamentLeaderboard from './TournamentLeaderboard';

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
  trophy: number;  // ONLY trophy matters: >= 1000 to join tournament
  eligible: boolean;  // true if trophy >= 1000
  level?: string;
  xp?: number;
  streak?: number;
}

type GameType = 'quiz' | 'listening' | 'writing' | 'matching' | 'speed' | null;

const GAME_CONFIG = {
  quiz: { name: '📖 Trắc Nghiệm (Reading)', description: 'Chọn đáp án đúng' },
  listening: { name: '🎧 Nghe (Listening)', description: 'Nghe và chọn đáp án' },
  writing: { name: '✍️ Viết (Writing)', description: 'Nhập tiếng Việt' },
  matching: { name: '🔗 Ghép Cặp', description: 'Ghép từ tiếng Việt với tiếng Hàn' },
  speed: { name: '⚡ Tốc Độ', description: 'Trắc nghiệm trong 60 giây' },
};

export default function TournamentHub() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

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

    // Load user stats
    loadUserStats();

    // Initialize Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('🎮 Connected to tournament server');
      newSocket.emit('tournament:join', { userId, name: 'Player' });
    });

    newSocket.on('tournament:leaderboard-updated', (data: Leaderboard[]) => {
      setLeaderboard(data);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from tournament server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, userId]);

  const loadUserStats = async () => {
    try {
      console.log('🔄 Loading user stats...');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error(`❌ API Error: ${res.status} ${res.statusText}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('📊 Raw API response:', data);
      console.log('🎖️ Trophy value:', data.trophy, 'Type:', typeof data.trophy);
      console.log('✅ Eligible:', data.eligible);
      console.log('🏷️ User:', data.name || data.email);

      // Ensure trophy is a number
      const stats: UserStats = {
        userId: data.userId,
        name: data.name || data.email,
        trophy: Number(data.trophy) || 0,
        eligible: Number(data.trophy) >= 1000,
        level: data.level,
        xp: data.xp,
        streak: data.streak,
      };

      console.log('✨ Final stats object:', stats);
      setUserStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      setLoading(false);
    }
  };

  const handleGameComplete = async (gameType: GameType, score: number, correctAnswers: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournament/save-score`, {
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

      const data = await res.json();
      if (data.success) {
        setTotalScore((prev) => prev + score);
        setUserStats(data.user);
        
        // Emit update to all players
        socket?.emit('tournament:score-update', { userId });
        
        // Thoát khỏi game và quay lại hub
        setTimeout(() => {
          setCurrentGame(null);
        }, 500);
      }
    } catch (error) {
      console.error('Error saving score:', error);
      // Vẫn thoát dù có lỗi
      setTimeout(() => {
        setCurrentGame(null);
      }, 500);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Đang tải...</div>;
  }

  // Check eligibility: trophy >= 1000
  // IMPORTANT: Double check on frontend (don't trust backend alone)
  const currentTrophy = Number(userStats?.trophy) || 0;
  const maxTrophy = 1000;
  const isEligible = currentTrophy >= maxTrophy;
  const progressPercent = Math.min((currentTrophy / maxTrophy) * 100, 100);
  const needed = Math.max(0, maxTrophy - currentTrophy);

  console.log(`🔍 Final eligibility check: Trophy=${currentTrophy} >= ${maxTrophy} = ${isEligible}`);
  
  if (!isEligible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center text-white mb-12 mt-12">
            <h1 className="text-5xl font-bold mb-4">🏆 GIẢI ĐẤU HANGUL</h1>
            <p className="text-xl opacity-90">Mở khóa chức năng cạnh tranh toàn cầu</p>
          </div>

          {/* Locked State */}
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            {/* Trophy Icon */}
            <div className="mb-8">
              <div className="text-6xl mb-4 inline-block opacity-50">🔒</div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Cấp độ chưa được mở khóa
            </h2>

            {/* Current Trophy */}
            <div className="mb-8">
              <p className="text-gray-600 mb-2">Điểm hiện tại của bạn</p>
              <p className="text-5xl font-bold text-purple-600">{currentTrophy}</p>
              <p className="text-gray-500 mt-2">/ {maxTrophy} điểm yêu cầu</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="bg-gray-200 rounded-full h-6 overflow-hidden shadow-md">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${progressPercent}%` }}
                >
                  {progressPercent > 10 && (
                    <span className="text-white text-sm font-bold">
                      {Math.round(progressPercent)}%
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 mt-3 font-semibold">
                {needed > 0 ? (
                  <>
                    Cần thêm <span className="text-purple-600 text-lg">{needed}</span> điểm để mở khóa
                  </>
                ) : (
                  <span className="text-green-600">✅ Bạn đã sẵn sàng!</span>
                )}
              </p>
            </div>

            {/* Motivation */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
              <p className="text-gray-700 mb-4">
                📖 <strong>Mẹo:</strong> Chơi các trò chơi học tập (Quiz, Nghe, Viết...) để kiếm điểm!
              </p>
              <ul className="text-left text-gray-600 space-y-2">
                <li>✓ Mỗi câu trắc nghiệm đúng: +10 điểm</li>
                <li>✓ Chạy chuỗi học tập: Bonus điểm</li>
                <li>✓ Hoàn thành bài tập: +5-20 điểm</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/quiz')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-all transform hover:scale-105"
              >
                📖 Bắt đầu Quiz
              </button>
              <button
                onClick={() => router.push('/tasks')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                📚 Xem nhiệm vụ
              </button>
            </div>

            {/* Stats */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Sau khi có {maxTrophy} điểm, bạn sẽ có thể:
              </p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl mb-2">⚔️</p>
                  <p className="text-gray-700 font-semibold">Thi đấu trực tiếp</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl mb-2">🏅</p>
                  <p className="text-gray-700 font-semibold">Xếp hạng global</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl mb-2">🎁</p>
                  <p className="text-gray-700 font-semibold">Nhận phần thưởng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentGame) {
    const GameComponent = {
      quiz: TournamentQuiz,
      listening: TournamentListening,
      writing: TournamentWriting,
      matching: TournamentMatching,
      speed: TournamentSpeed,
    }[currentGame];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
        <GameComponent
          onComplete={(score, correct) =>
            handleGameComplete(currentGame, score, correct)
          }
          onExit={() => setCurrentGame(null)}
          userLevel={userStats?.level || 'BEGINNER'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl font-bold mb-2">🏆 GIẢI ĐẤU HANGUL</h1>
          <p className="text-xl opacity-90">
            Thi đấu với những người chơi khác và chiếm ngôi vương
          </p>
          <div className="mt-4 inline-block bg-white/20 backdrop-blur px-6 py-2 rounded-full">
            <p className="text-lg font-semibold">
              🎖️ Điểm của bạn: <span className="text-yellow-300 text-xl">{userStats?.trophy || 0}</span> / 1000+
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-12">
          {/* User Stats */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 Thống Kê</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tên:</span>
                  <span className="font-bold">{userStats?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm:</span>
                  <span className="font-bold text-purple-600">{userStats?.trophy || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cấp độ:</span>
                  <span className="font-bold">{userStats?.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ôn tập ngày này:</span>
                  <span className="font-bold text-blue-600">+{totalScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Selection */}
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(GAME_CONFIG) as Array<[GameType, typeof GAME_CONFIG.quiz]>).map(
                ([gameKey, gameInfo]) => (
                  <button
                    key={gameKey}
                    onClick={() => setCurrentGame(gameKey)}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <h3 className="text-xl font-bold mb-2 text-gray-800">
                      {gameInfo.name}
                    </h3>
                    <p className="text-gray-600">{gameInfo.description}</p>
                    <p className="text-sm text-purple-600 mt-3 font-semibold">
                      +10 điểm / câu đúng →
                    </p>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <TournamentLeaderboard leaderboard={leaderboard} currentUserId={Number(userId)} />
      </div>
    </div>
  );
}
