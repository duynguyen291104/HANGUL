import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import prisma from '../../lib/prisma';

const router = Router();

// ========================
// LEVEL REQUIREMENTS
// ========================
const LEVEL_REQUIREMENTS: Record<string, { xp: number; trophy: number }> = {
  'CỰC_CƠ_BẢN': { xp: 0, trophy: 0 },
  'CƠ_BẢN': { xp: 1500, trophy: 500 },
  'TRUNG_CẤP': { xp: 2500, trophy: 1000 },
  'NÂNG_CAO': { xp: 3500, trophy: 2000 },
  'LÃO_LUYỆN': { xp: 5000, trophy: 4000 },
  // Fallback for existing data
  'NEWBIE': { xp: 0, trophy: 0 },
  'BEGINNER': { xp: 1500, trophy: 500 },
  'INTERMEDIATE': { xp: 2500, trophy: 1000 },
  'UPPER_INTERMEDIATE': { xp: 3500, trophy: 2000 },
  'ADVANCED': { xp: 5000, trophy: 4000 },
};

const LEVEL_ORDER = ['CỰC_CƠ_BẢN', 'CƠ_BẢN', 'TRUNG_CẤP', 'NÂNG_CAO', 'LÃO_LUYỆN'];

// ========================
// 1. SET LEVEL
// ========================
router.post('/set-level', authenticate, async (req, res) => {
  try {
    const { level } = req.body;
    const userId = (req as any).user!.id;

    if (!LEVEL_REQUIREMENTS[level]) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    // Check if level is valid (can't skip levels)
    const nextLevelIndex = LEVEL_ORDER.indexOf(level);
    if (nextLevelIndex === -1) {
      return res.status(400).json({ error: 'Level not found' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check requirements
    const requirements = LEVEL_REQUIREMENTS[level];
    if (user.totalXP < requirements.xp || user.totalTrophy < requirements.trophy) {
      return res.status(400).json({
        error: 'Insufficient XP or Trophy',
        current: { xp: user.totalXP, trophy: user.totalTrophy },
        required: requirements,
      });
    }

    // Update level
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        level,
        levelUnlockedAt: new Date(),
      },
    });

    res.json({
      success: true,
      level: updatedUser.level,
      xp: updatedUser.totalXP,
      trophy: updatedUser.totalTrophy,
      message: `Cấp độ đã được nâng lên: ${level}`,
    });
  } catch (error) {
    console.error('❌ Error setting level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// 2. GET LEVEL STATUS
// ========================
router.get('/level-status', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentLevelIndex = LEVEL_ORDER.indexOf(user.level);
    const nextLevel = currentLevelIndex < LEVEL_ORDER.length - 1 
      ? LEVEL_ORDER[currentLevelIndex + 1] 
      : null;

    const nextRequirements = nextLevel ? LEVEL_REQUIREMENTS[nextLevel] : null;

    const canUnlockTest = nextRequirements
      ? user.totalXP >= nextRequirements.xp && user.totalTrophy >= nextRequirements.trophy
      : false;

    res.json({
      currentLevel: user.level,
      xp: user.totalXP,
      trophy: user.totalTrophy,
      nextLevel: nextLevel || null,
      requirements: nextRequirements || null,
      canUnlockTest,
      progressToNext: nextRequirements
        ? {
            xp: Math.min(user.totalXP, nextRequirements.xp),
            xpNeeded: Math.max(0, nextRequirements.xp - user.totalXP),
            trophy: Math.min(user.totalTrophy, nextRequirements.trophy),
            trophyNeeded: Math.max(0, nextRequirements.trophy - user.totalTrophy),
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Error getting level status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// 3. GET LEARNING PATH
// ========================
router.get('/learning-path', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    console.log('📍 GET /learning-path userId:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', { id: user.id, level: user.level, totalXP: user.totalXP });

    // Get all topics for current level
    const topics = await prisma.topic.findMany({
      where: { level: user.level },
      orderBy: { order: 'asc' },
      include: {
        userProgress: {
          where: { userId },
        },
      },
    });

    console.log('📚 Topics found:', topics.length, 'for level:', user.level);

    // Build response
    const topicsWithProgress = topics.map((topic) => {
      const progressMap = new Map(
        topic.userProgress.map((p) => [p.skillType, p])
      );

      return {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        order: topic.order,
        quiz: progressMap.get('QUIZ')
          ? {
              done: progressMap.get('QUIZ')!.completed,
              score: progressMap.get('QUIZ')!.score,
              attempts: progressMap.get('QUIZ')!.attempts,
            }
          : { done: false, attempts: 0 },
        writing: progressMap.get('WRITING')
          ? {
              done: progressMap.get('WRITING')!.completed,
              score: progressMap.get('WRITING')!.score,
              attempts: progressMap.get('WRITING')!.attempts,
            }
          : { done: false, attempts: 0 },
        pronunciation: progressMap.get('PRONUNCIATION')
          ? {
              done: progressMap.get('PRONUNCIATION')!.completed,
              score: progressMap.get('PRONUNCIATION')!.score,
              attempts: progressMap.get('PRONUNCIATION')!.attempts,
            }
          : { done: false, attempts: 0 },
      };
    });

    // Calculate stats
    const totalSkills = topicsWithProgress.length * 3;
    const completedSkills = topicsWithProgress.reduce(
      (sum, topic) =>
        sum +
        (topic.quiz.done ? 1 : 0) +
        (topic.writing.done ? 1 : 0) +
        (topic.pronunciation.done ? 1 : 0),
      0
    );

    res.json({
      level: user.level,
      totalTopics: topicsWithProgress.length,
      completedSkills,
      totalSkills,
      progressPercentage: Math.round((completedSkills / totalSkills) * 100),
      topics: topicsWithProgress,
      xp: user.totalXP,
      trophy: user.totalTrophy,
    });
  } catch (error) {
    console.error('❌ Error getting learning path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// 4. GET TOPIC PROGRESS
// ========================
router.get('/topic-progress/:topicId', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { topicId } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id: parseInt(topicId) },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        topicId: parseInt(topicId),
      },
    });

    const progressMap = new Map(progress.map((p) => [p.skillType, p]));

    res.json({
      topic: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        level: topic.level,
      },
      progress: {
        quiz: progressMap.get('QUIZ')
          ? {
              done: progressMap.get('QUIZ')!.completed,
              score: progressMap.get('QUIZ')!.score,
              fullScore: 100,
              attempts: progressMap.get('QUIZ')!.attempts,
              completedAt: progressMap.get('QUIZ')!.completedAt,
              xpGained: progressMap.get('QUIZ')!.score
                ? Math.floor(progressMap.get('QUIZ')!.score! / 10)
                : 0,
            }
          : { done: false, attempts: 0, xpGained: 0 },
        writing: progressMap.get('WRITING')
          ? {
              done: progressMap.get('WRITING')!.completed,
              score: progressMap.get('WRITING')!.score,
              fullScore: 100,
              attempts: progressMap.get('WRITING')!.attempts,
              completedAt: progressMap.get('WRITING')!.completedAt,
              xpGained: progressMap.get('WRITING')!.score
                ? Math.floor(progressMap.get('WRITING')!.score! / 12)
                : 0,
            }
          : { done: false, attempts: 0, xpGained: 0 },
        pronunciation: progressMap.get('PRONUNCIATION')
          ? {
              done: progressMap.get('PRONUNCIATION')!.completed,
              score: progressMap.get('PRONUNCIATION')!.score,
              fullScore: 100,
              attempts: progressMap.get('PRONUNCIATION')!.attempts,
              completedAt: progressMap.get('PRONUNCIATION')!.completedAt,
              xpGained: progressMap.get('PRONUNCIATION')!.score
                ? Math.floor(progressMap.get('PRONUNCIATION')!.score! / 11)
                : 0,
            }
          : { done: false, attempts: 0, xpGained: 0 },
      },
      canProceedToNext: 
        progressMap.get('QUIZ')?.completed ||
        progressMap.get('WRITING')?.completed ||
        progressMap.get('PRONUNCIATION')?.completed,
    });
  } catch (error) {
    console.error('❌ Error getting topic progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// 4. GET ANSWER HISTORY (for collapsed view)
// ========================
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { topicId, skillType } = req.query;

    if (!topicId || !skillType) {
      return res.status(400).json({ error: 'topicId and skillType are required' });
    }

    console.log('📋 Getting history for:', { userId, topicId, skillType });

    const history = await prisma.userAnswerHistory.findMany({
      where: {
        userId,
        topicId: parseInt(topicId as string),
        skillType: skillType as string,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Latest 50 answers
    });

    console.log('✅ History found:', history.length);

    res.json(history);
  } catch (error) {
    console.error('❌ Error getting history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
