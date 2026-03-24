import { mockLeaderboard } from '@/mocks/data';

export async function GET() {
  return Response.json({
    leaderboard: mockLeaderboard,
    userRank: {
      rank: 25,
      name: 'You',
      level: 'BEGINNER',
      xp: 1500,
      streak: 3,
    },
    total: mockLeaderboard.length,
  });
}
