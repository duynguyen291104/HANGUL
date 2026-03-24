import { mockAchievements } from '@/mocks/data';

export async function GET() {
  return Response.json({
    data: mockAchievements,
    total: mockAchievements.length,
    unlocked: mockAchievements.filter(a => a.unlocked).length,
  });
}
