import { mockUserStats, mockAchievements, mockQuizProgress, mockDailyChallenge, mockTodayStats } from '@/mocks/data';

export async function GET() {
  return Response.json({
    ...mockUserStats,
    achievements: {
      unlocked: 0,
      total: mockAchievements.length,
    },
    quiz: mockQuizProgress,
    dailyChallenge: mockDailyChallenge,
    today: mockTodayStats,
  });
}
