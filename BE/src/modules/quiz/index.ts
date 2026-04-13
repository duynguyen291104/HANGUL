import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ========================
// GET QUIZ VOCABULARY BY USER LEVEL
// ========================
router.get('/vocabulary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topicId, limit = 10 } = req.query;

    // Get user with their current level
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build WHERE clause: MUST filter by user's level (NO random mixing)
    const where: any = {
      level: user.level,  // ← CRITICAL: Only same level vocabulary
      isActive: true,
    };

    if (topicId) {
      where.topicId = parseInt(topicId as string);
    }

    // Fetch vocabulary from PostgreSQL only
    const vocabulary = await prisma.vocabulary.findMany({
      where,
      take: parseInt(limit as string),
      select: {
        id: true,
        korean: true,
        english: true,
        vietnamese: true,
        romanization: true,
        level: true,
        topic: { select: { id: true, name: true } },
      },
    });

    // If no data: return empty array (NOT JSON fallback)
    if (vocabulary.length === 0) {
      return res.json({
        userLevel: user.level,
        topicId: topicId || null,
        count: 0,
        data: [],
        message: `No vocabulary available for ${user.level} level${topicId ? ' in this topic' : ''}`,
      });
    }

    res.json({
      userLevel: user.level,
      topicId: topicId || null,
      count: vocabulary.length,
      data: vocabulary,
    });
  } catch (error) {
    console.error('❌ Quiz vocabulary error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz vocabulary' });
  }
});

// ========================
// SUBMIT QUIZ ANSWERS & ADD XP
// ========================
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { answers, topicId, score } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    const userId = req.user.id;
    const correctCount = answers.filter((a: any) => a.correct).length;
    const totalCount = answers.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    // Calculate XP: 10 XP per correct answer
    const xpGained = correctCount * 10;

    // Update user XP
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: { increment: xpGained },
      },
    });

    // Save progress if topicId provided
    if (topicId) {
      const existing = await prisma.userProgress.findFirst({
        where: { userId, topicId, skillType: 'QUIZ' },
      });

      if (existing) {
        await prisma.userProgress.update({
          where: { id: existing.id },
          data: {
            completed: true,
            score: percentage,
            attempts: { increment: 1 },
          },
        });
      } else {
        await prisma.userProgress.create({
          data: {
            userId,
            topicId,
            skillType: 'QUIZ',
            completed: true,
            score: percentage,
            attempts: 1,
          },
        });
      }
    }

    res.json({
      success: true,
      xpGained,
      correctCount,
      totalCount,
      percentage,
      message: `${correctCount}/${totalCount} correct. +${xpGained} XP 🎯`,
    });
  } catch (error) {
    console.error('❌ Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;
