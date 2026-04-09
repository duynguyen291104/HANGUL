import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
// GET VOCABULARY BY USER LEVEL (for tournaments/games)
// ========================
router.get('/by-level/tournament', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's level
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { limit = 10 } = req.query;

    // Get vocabulary for user's level
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        level: user.level,
        isActive: true,
      },
      take: parseInt(limit as string),
      orderBy: { id: 'desc' },
      include: {
        topic: true,
      },
    });

    return res.json({
      userLevel: user.level,
      count: vocabulary.length,
      data: vocabulary,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch vocabulary by level' });
  }
});

// ========================
// GET ALL VOCABULARY
// ========================
router.get('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { level, topic, limit = 50 } = req.query;

    const where: any = { isActive: true };
    if (level) where.level = level;
    if (topic) where.topicId = parseInt(topic as string);

    const vocabulary = await prisma.vocabulary.findMany({
      where,
      take: parseInt(limit as string),
      include: {
        topic: true,
      },
    });

    return res.json(vocabulary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// ========================
// GET VOCABULARY BY ID
// ========================
router.get('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: parseInt(id) },
      include: {
        topic: true,
      },
    });

    if (!vocabulary) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    return res.json(vocabulary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// ========================
// ADD VOCABULARY TO USER (LEARNING)
// ========================
router.post('/:id/learn', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const vocabId = parseInt(id);

    // Check if vocabulary exists
    const vocab = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
    });

    if (!vocab) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    // Add to user's vocabulary (using many-to-many relation)
    // Note: You may need to use connect if there's a junction table
    const updatedVocab = await prisma.vocabulary.update({
      where: { id: vocabId },
      data: {
        usersLearned: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });

    return res.json({
      message: 'Vocabulary added to learning list',
      vocabulary: updatedVocab,
    });
  } catch (error: any) {
    console.error(error);
    // Handle case where user-vocab relationship already exists
    if (error.code === 'P2025') {
      return res.status(400).json({ error: 'Vocabulary already in learning list' });
    }
    return res.status(500).json({ error: 'Failed to add vocabulary' });
  }
});

// ========================
// ADMIN: CREATE VOCABULARY
// ========================
router.post('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create vocabulary' });
    }

    const { korean, english, vietnamese, romanization, audioUrl, imageUrl, level, topicId } =
      req.body;

    if (!korean || !english || !vietnamese || !topicId) {
      return res.status(400).json({ error: 'Missing required fields: korean, english, vietnamese, topicId' });
    }

    const vocabulary = await prisma.vocabulary.create({
      data: {
        korean,
        english,
        vietnamese,
        romanization: romanization || '',
        audioUrl,
        imageUrl,
        level: level || 'NEWBIE',
        topic: {
          connect: { id: parseInt(topicId) }
        },
      },
    });

    return res.status(201).json(vocabulary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create vocabulary' });
  }
});

// ========================
// ADMIN: BULK CREATE VOCABULARY
// ========================
router.post('/bulk/create', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create vocabulary' });
    }

    const { vocabularies } = req.body;

    if (!Array.isArray(vocabularies) || vocabularies.length === 0) {
      return res.status(400).json({ error: 'Invalid vocabulary list' });
    }

    const created = await prisma.vocabulary.createMany({
      data: vocabularies,
    });

    return res.status(201).json({
      message: `Created ${created.count} vocabulary items`,
      count: created.count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create vocabulary' });
  }
});

// ========================
// ADMIN: UPDATE VOCABULARY
// ========================
router.put('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update vocabulary' });
    }

    const { id } = req.params;
    const { korean, english, romanization, audioUrl, imageUrl, level } = req.body;

    const vocabulary = await prisma.vocabulary.update({
      where: { id: parseInt(id) },
      data: {
        korean,
        english,
        romanization,
        audioUrl,
        imageUrl,
        level,
        version: { increment: 1 },
      },
    });

    return res.json(vocabulary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update vocabulary' });
  }
});

// ========================
// ADMIN: SOFT DELETE VOCABULARY
// ========================
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete vocabulary' });
    }

    const { id } = req.params;

    const vocabulary = await prisma.vocabulary.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    return res.json({
      message: 'Vocabulary soft deleted',
      vocabulary,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});

module.exports = router;
