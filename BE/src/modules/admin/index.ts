import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ========================
// ADMIN STATS
// ========================
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [totalVocab, totalQuestions, totalUsers, totalTopics] = await Promise.all([
      prisma.vocabulary.count(),
      prisma.question.count(),
      prisma.user.count(),
      prisma.topic.count(),
    ]);

    res.json({
      totalVocab,
      totalQuestions,
      totalUsers,
      totalTopics,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ========================
// VOCABULARY CRUD
// ========================

// GET all vocabulary with filtering
router.get('/vocabulary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { level, topic, limit = 100 } = req.query;

    const where: any = { isActive: true };
    if (level) where.level = level;
    if (topic) where.topicId = parseInt(topic as string);

    const vocabulary = await prisma.vocabulary.findMany({
      where,
      take: parseInt(limit as string),
      include: { topic: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// POST create vocabulary
router.post('/vocabulary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { korean, english, vietnamese, level, topicId, romanization, type } = req.body;

    if (!korean || !english || !topicId) {
      return res.status(400).json({ error: 'Missing required fields: korean, english, topicId' });
    }

    const vocabulary = await prisma.vocabulary.create({
      data: {
        korean,
        english,
        vietnamese: vietnamese || '',
        romanization: romanization || '',
        type: type || 'noun',
        level: level || 'NEWBIE',
        topic: { connect: { id: parseInt(topicId) } },
        isActive: true,
      },
      include: { topic: true },
    });

    res.status(201).json(vocabulary);
  } catch (error) {
    console.error('Error creating vocabulary:', error);
    res.status(500).json({ error: 'Failed to create vocabulary', details: error instanceof Error ? error.message : '' });
  }
});

// PUT update vocabulary
router.put('/vocabulary/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { korean, english, vietnamese, level, topicId, romanization, type } = req.body;

    const vocabulary = await prisma.vocabulary.update({
      where: { id: parseInt(id) },
      data: {
        ...(korean && { korean }),
        ...(english && { english }),
        ...(vietnamese && { vietnamese }),
        ...(level && { level }),
        ...(romanization && { romanization }),
        ...(type && { type }),
        ...(topicId && { topicId: parseInt(topicId) }),
      },
      include: { topic: true },
    });

    res.json(vocabulary);
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    res.status(500).json({ error: 'Failed to update vocabulary' });
  }
});

// DELETE vocabulary
router.delete('/vocabulary/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    await prisma.vocabulary.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Vocabulary deleted' });
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});

// ========================
// QUESTIONS CRUD
// ========================

router.get('/questions', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { difficulty, topic, limit = 100 } = req.query;

    const where: any = { isActive: true };
    if (difficulty) where.difficulty = difficulty;
    if (topic) where.topicId = parseInt(topic as string);

    const questions = await prisma.question.findMany({
      where,
      take: parseInt(limit as string),
      include: { topic: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/questions', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { questionText, options, correctAnswer, difficulty, topicId, explanation, explanation_vi } = req.body;

    if (!questionText || !options || !correctAnswer || !topicId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const question = await prisma.question.create({
      data: {
        questionText,
        options,
        correctAnswer,
        difficulty: difficulty || 'easy',
        language_from: 'korean',
        language_to: 'english',
        topic: { connect: { id: parseInt(topicId) } },
        explanation: explanation || '',
        explanation_vi: explanation_vi || '',
        isActive: true,
      },
      include: { topic: true },
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/questions/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { questionText, options, correctAnswer, difficulty, explanation, explanation_vi } = req.body;

    const question = await prisma.question.update({
      where: { id: parseInt(id) },
      data: {
        ...(questionText && { questionText }),
        ...(options && { options }),
        ...(correctAnswer && { correctAnswer }),
        ...(difficulty && { difficulty }),
        ...(explanation && { explanation }),
        ...(explanation_vi && { explanation_vi }),
      },
      include: { topic: true },
    });

    res.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    await prisma.question.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
