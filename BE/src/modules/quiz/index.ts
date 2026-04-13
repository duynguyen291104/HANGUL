import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { generateQuizQuestions, createQuizQuestion, getQuizQuestionWithAnswers } from '../../utils/quizGenerator';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ========================
// GENERATE QUIZ QUESTIONS DYNAMICALLY (10 questions from vocabulary)
// ========================
router.get('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topicId } = req.query;
    console.log('📝 Quiz generate request:', { userId: req.user.id, topicId, queryKeys: Object.keys(req.query) });

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    // Validate topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: parseInt(topicId as string) },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Generate 10 quiz questions dynamically from vocabulary
    const result = await generateQuizQuestions(req.user.id, parseInt(topicId as string), 10);

    if (!result.success) {
      console.error('❌ Quiz generation failed:', result);
      return res.status(400).json(result);
    }

    res.json({
      ...result,
      topicName: topic.name,
    });
  } catch (error) {
    console.error('❌ Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz questions' });
  }
});

// ========================
// SUBMIT SINGLE ANSWER (Check if correct/wrong)
// ========================
router.post('/submit-answer', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { questionId, userAnswer } = req.body;

    if (!questionId || !userAnswer) {
      return res.status(400).json({ error: 'questionId and userAnswer are required' });
    }

    // Get the vocabulary item to check correct answer
    const vocab = await prisma.vocabulary.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        korean: true,
        english: true,
        vietnamese: true,
        level: true,
      },
    });

    if (!vocab) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if the user's answer matches the correct Vietnamese translation
    const isCorrect = userAnswer.toLowerCase().trim() === vocab.vietnamese.toLowerCase().trim();

    console.log('📊 Answer check:', { 
      userAnswer, 
      correctAnswer: vocab.vietnamese, 
      isCorrect,
      korean: vocab.korean 
    });

    res.json({
      isCorrect,
      correctAnswer: vocab.vietnamese,
      questionId,
      korean: vocab.korean,
      english: vocab.english,
      explanation: `"${vocab.korean}" (${vocab.english}) nghĩa là "${vocab.vietnamese}"`,
    });
  } catch (error) {
    console.error('❌ Answer submission error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// ========================
// GET QUIZ VOCABULARY BY USER LEVEL (LEGACY - for compatibility)
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

// ========================
// GET QUESTIONS BY TOPIC (for learning map)
// ========================
router.get('/by-topic/:topicId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topicId } = req.params;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const parsedTopicId = parseInt(topicId);

    // Validate topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: parsedTopicId },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get user level
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get vocabulary for this topic and user's level
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        topicId: parsedTopicId,
        level: user.level,
        isActive: true,
      },
    });

    res.json({
      data: vocabulary,
      count: vocabulary.length,
      topic: topic.name,
    });
  } catch (error) {
    console.error('❌ Get questions by topic error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// ========================
// GET USER PROGRESS FOR QUIZ TOPIC
// ========================
router.get('/user-progress/:topicId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topicId } = req.params;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const parsedTopicId = parseInt(topicId);

    // Get total questions for this topic (so we can calculate completed count)
    const totalQuestions = await prisma.vocabulary.count({
      where: { topicId: parsedTopicId, isActive: true },
    });

    // Get user's progress for this topic
    const progress = await prisma.userProgress.findFirst({
      where: {
        userId: req.user.id,
        topicId: parsedTopicId,
        skillType: 'QUIZ',
      },
    });

    if (!progress) {
      // Return default progress (not completed)
      return res.json({
        data: {
          completed: 0,
          total: totalQuestions,
          completedQuestions: 0,
          totalQuestions: totalQuestions,
          score: 0,
          attempts: 0,
          message: 'Not started',
        },
      });
    }

    // Calculate completed count from score percentage
    const completedCount = Math.round((progress.score! / 100) * 10);

    res.json({
      data: {
        completed: completedCount,
        total: totalQuestions,
        completedQuestions: completedCount,
        totalQuestions: totalQuestions,
        score: progress.score || 0,
        attempts: progress.attempts || 0,
        message: progress.completed ? `${progress.score}% - ${progress.attempts} attempt(s)` : 'Not completed',
      },
    });
  } catch (error) {
    console.error('❌ Get user progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
