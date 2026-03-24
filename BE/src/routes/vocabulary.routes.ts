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
// GET ALL VOCABULARY
// ========================
router.get('/', async (req: AuthRequest, res: Response) => {
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

    res.json(vocabulary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// ========================
// GET VOCABULARY BY ID
// ========================
router.get('/:id', async (req: AuthRequest, res: Response) => {
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

    res.json(vocabulary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// ========================
// ADD VOCABULARY TO USER (LEARNING)
// ========================
router.post('/:id/learn', async (req: AuthRequest, res: Response) => {
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

    res.json({
      message: 'Vocabulary added to learning list',
      vocabulary: updatedVocab,
    });
  } catch (error: any) {
    console.error(error);
    // Handle case where user-vocab relationship already exists
    if (error.code === 'P2025') {
      return res.status(400).json({ error: 'Vocabulary already in learning list' });
    }
    res.status(500).json({ error: 'Failed to add vocabulary' });
  }
});

// ========================
// ADMIN: CREATE VOCABULARY
// ========================
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create vocabulary' });
    }

    const { korean, english, romanization, audioUrl, imageUrl, level, topicId } =
      req.body;

    if (!korean || !english || !topicId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vocabulary = await prisma.vocabulary.create({
      data: {
        korean,
        english,
        romanization: romanization || '',
        audioUrl,
        imageUrl,
        level,
        topicId,
      },
    });

    res.status(201).json(vocabulary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create vocabulary' });
  }
});

// ========================
// ADMIN: BULK CREATE VOCABULARY
// ========================
router.post('/bulk/create', async (req: AuthRequest, res: Response) => {
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

    res.status(201).json({
      message: `Created ${created.count} vocabulary items`,
      count: created.count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create vocabulary' });
  }
});

// ========================
// ADMIN: UPDATE VOCABULARY
// ========================
router.put('/:id', async (req: AuthRequest, res: Response) => {
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

    res.json(vocabulary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update vocabulary' });
  }
});

// ========================
// ADMIN: SOFT DELETE VOCABULARY
// ========================
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete vocabulary' });
    }

    const { id } = req.params;

    const vocabulary = await prisma.vocabulary.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({
      message: 'Vocabulary soft deleted',
      vocabulary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});

module.exports = router;
