import { mockDailyChallenge } from '@/mocks/data';

export async function GET() {
  return Response.json({
    challenge: mockDailyChallenge,
    message: 'Complete daily challenges for bonus XP',
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Mock: update progress
  mockDailyChallenge.progress = Math.min(
    mockDailyChallenge.progress + (body.increment || 1),
    mockDailyChallenge.goal
  );

  if (mockDailyChallenge.progress >= mockDailyChallenge.goal) {
    mockDailyChallenge.completed = true;
  }

  return Response.json({
    success: true,
    challenge: mockDailyChallenge,
    message: mockDailyChallenge.completed 
      ? '🎉 Daily challenge completed!' 
      : 'Progress updated',
  });
}
