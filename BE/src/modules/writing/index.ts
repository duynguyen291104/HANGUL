import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PointSystem } from '../../utils/pointSystem';

const router = Router();
const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ========================
// GET WRITING EXERCISES
// ========================
router.get('/exercises', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { level = 'BEGINNER', topic, limit = 10 } = req.query;

    const where: any = { isActive: true };
    if (level) where.level = level;
    if (topic) where.topicId = parseInt(topic as string);

    const exercises = await prisma.handwritingExercise.findMany({
      where,
      take: parseInt(limit as string),
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: exercises,
      count: exercises.length,
    });
  } catch (error) {
    console.error('Error fetching writing exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// ========================
// SUBMIT HANDWRITING ATTEMPT
// ========================
router.post('/attempt', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { exerciseId, drawingData, score } = req.body;

    if (!exerciseId || !drawingData) {
      return res.status(400).json({ error: 'exerciseId and drawingData required' });
    }

    // Validate exercise exists
    const exercise = await prisma.handwritingExercise.findUnique({
      where: { id: parseInt(exerciseId) },
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Create attempt record
    const attempt = await prisma.handwritingAttempt.create({
      data: {
        userId: req.user.id,
        exerciseId: parseInt(exerciseId),
        drawingData: JSON.stringify(drawingData),
        score: score || 0,
      },
    });

    // Calculate XP/Trophy if score is passing (>= 70)
    const isCorrect = (score || 0) >= 70;
    const xpGained = PointSystem.calculateXP(isCorrect);

    // Update user stats
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        totalXP: {
          increment: xpGained,
        },
      },
    });

    res.json({
      success: true,
      attemptId: attempt.id,
      score: attempt.score,
      xpGained,
      message: isCorrect ? 'Great job!' : 'Keep practicing!',
    });
  } catch (error) {
    console.error('Error submitting handwriting attempt:', error);
    res.status(500).json({ error: 'Failed to submit attempt' });
  }
});

// ========================
// GET WRITING PRACTICE WORDS
// ========================
router.get('/words', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { level = 'BEGINNER', topic, limit = 20 } = req.query;

    const where: any = { isActive: true };
    if (level) where.level = level;
    if (topic) where.topicId = parseInt(topic as string);

    const vocabulary = await prisma.vocabulary.findMany({
      where,
      take: parseInt(limit as string),
      select: {
        id: true,
        korean: true,
        romanization: true,
        vietnamese: true,
        english: true,
        level: true,
        topic: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: vocabulary,
      count: vocabulary.length,
    });
  } catch (error) {
    console.error('Error fetching writing practice words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// ========================
// SUBMIT TEXT WRITING PRACTICE
// ========================
router.post('/practice', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topicId, userText, targetText, score, level = 'BEGINNER' } = req.body;

    if (!topicId || !userText) {
      return res.status(400).json({ error: 'topicId and userText required' });
    }

    // Validate topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: parseInt(topicId) },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Create writing practice record
    const practice = await prisma.writingPractice.create({
      data: {
        userId: req.user.id,
        topicId: parseInt(topicId),
        level,
        userText,
        corrected: targetText || null,
        score: score || 0,
      },
    });

    // Calculate XP if score is passing (>= 70)
    const isCorrect = (score || 0) >= 70;
    const xpGained = PointSystem.calculateXP(isCorrect);

    // Update user stats
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        totalXP: {
          increment: xpGained,
        },
      },
    });

    res.json({
      success: true,
      practiceId: practice.id,
      score: practice.score,
      xpGained,
      totalXP: updatedUser.totalXP,
      message: isCorrect ? 'Excellent!' : 'Good effort, keep going!',
    });
  } catch (error) {
    console.error('Error submitting writing practice:', error);
    res.status(500).json({ error: 'Failed to submit practice' });
  }
});

// ========================
// GET USER WRITING HISTORY
// ========================
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const practices = await prisma.writingPractice.findMany({
      where: { userId: req.user.id },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.writingPractice.count({
      where: { userId: req.user.id },
    });

    res.json({
      success: true,
      data: practices,
      total,
      count: practices.length,
    });
  } catch (error) {
    console.error('Error fetching writing history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ========================
// GET HANDWRITING ATTEMPT HISTORY
// ========================
router.get('/attempts', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const attempts = await prisma.handwritingAttempt.findMany({
      where: { userId: req.user.id },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        exercise: {
          select: { id: true, hangulChar: true, level: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.handwritingAttempt.count({
      where: { userId: req.user.id },
    });

    res.json({
      success: true,
      data: attempts,
      total,
      count: attempts.length,
    });
  } catch (error) {
    console.error('Error fetching handwriting attempts:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// ========================
// GET WRITING STATS
// ========================
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const totalPractices = await prisma.writingPractice.count({
      where: { userId: req.user.id },
    });

    const totalAttempts = await prisma.handwritingAttempt.count({
      where: { userId: req.user.id },
    });

    const avgPracticeScore = await prisma.writingPractice.aggregate({
      where: { userId: req.user.id },
      _avg: { score: true },
    });

    const avgAttemptScore = await prisma.handwritingAttempt.aggregate({
      where: { userId: req.user.id },
      _avg: { score: true },
    });

    res.json({
      success: true,
      stats: {
        totalTextPractices: totalPractices,
        totalHandwritingAttempts: totalAttempts,
        avgTextScore: Math.round((avgPracticeScore._avg.score || 0) * 100) / 100,
        avgHandwritingScore: Math.round((avgAttemptScore._avg.score || 0) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching writing stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
