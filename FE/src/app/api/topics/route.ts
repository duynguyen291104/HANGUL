import { getTopicsByLevel } from '@/mocks/topics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') as any;

    if (!level) {
      return Response.json({ error: 'Level is required' }, { status: 400 });
    }

    const levelTopics = getTopicsByLevel(level);

    return Response.json({
      level,
      topics: levelTopics,
      total: levelTopics.length,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return Response.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
