import { getFirstTopicForLevel } from '@/mocks/topics';
import { Level } from '@/mocks/topics';

// Mock data (sau này sẽ update vào backend)
const userLevels: { [key: string]: { level: Level; currentTopicId: string } } = {};

export async function POST(request: Request) {
  try {
    const { level } = await request.json();

    if (!['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER', 'ADVANCED'].includes(level)) {
      return Response.json({ error: 'Invalid level' }, { status: 400 });
    }

    // Get first topic for this level
    const firstTopic = getFirstTopicForLevel(level);
    if (!firstTopic) {
      return Response.json({ error: 'No topics found for this level' }, { status: 400 });
    }

    // Mock: Save user level (later: update backend)
    userLevels['current'] = {
      level,
      currentTopicId: firstTopic.id,
    };

    return Response.json({
      success: true,
      message: 'Level set successfully',
      data: {
        level,
        currentTopicId: firstTopic.id,
        currentTopicName: firstTopic.name,
      },
    });
  } catch (error) {
    console.error('Error setting level:', error);
    return Response.json(
      { error: 'Failed to set level' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const currentLevel = userLevels['current'];
  
  if (!currentLevel) {
    return Response.json(
      { error: 'No level selected' },
      { status: 404 }
    );
  }

  return Response.json(currentLevel);
}
