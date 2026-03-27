'use client';

interface Leaderboard {
  rank: number;
  userId: number;
  name: string;
  avatar?: string;
  trophy: number;
  level: string;
  xp: number;
}

export default function TournamentLeaderboard({
  leaderboard,
  currentUserId,
}: {
  leaderboard: Leaderboard[];
  currentUserId: number;
}) {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📋 Bảng Xếp Hạng Giải Đấu
        </h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <p className="text-lg">Chưa có người chơi nào trong giải đấu</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Xếp Hạng
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Tên Người Chơi
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Cấp Độ
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Điểm
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Exp
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${
                    player.userId === currentUserId
                      ? 'bg-yellow-50'
                      : idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50'
                  } hover:bg-blue-50 transition`}
                >
                  <td className="px-6 py-4 text-lg font-bold">
                    {getMedalEmoji(player.rank)} {player.rank}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                          👤
                        </div>
                      )}
                      <span
                        className={`font-semibold ${
                          player.userId === currentUserId
                            ? 'text-purple-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {player.name}
                        {player.userId === currentUserId && ' (Bạn)'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{player.level}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-purple-600 text-lg">
                      {player.trophy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{player.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
