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
// START QUIZ SESSION
// ========================
router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { numberOfQuestions = 10, topic, difficulty } = req.body;

    // Query questions based on filters
    const where: any = { isActive: true };
    if (topic) where.topicId = parseInt(topic);
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      take: numberOfQuestions,
      orderBy: {
        id: 'asc', // Could use 'random()' if DB supports it
      },
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions available' });
    }

    // Create quiz session
    const session = await prisma.quizSession.create({
      data: {
        userId: req.user.id,
        totalQuestions: questions.length,
      },
    });

    // Return questions WITHOUT correct answers
    const questionsForUser = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      language_from: q.language_from,
      language_to: q.language_to,
    }));

    res.json({
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      questions: questionsForUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// ========================
// SUBMIT QUIZ ANSWER
// ========================
router.post('/answer', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId, questionId, selectedAnswer } = req.body;

    if (!sessionId || !questionId || !selectedAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get question
    const question = await prisma.question.findUnique({
      where: { id: parseInt(questionId) },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check answer
    const isCorrect = selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase();

    // Save answer
    const answer = await prisma.quizAnswer.create({
      data: {
        sessionId: parseInt(sessionId),
        userId: req.user.id,
        questionId: parseInt(questionId),
        selectedAnswer,
        isCorrect,
      },
    });

    // Update session score if correct
    if (isCorrect) {
      await prisma.quizSession.update({
        where: { id: parseInt(sessionId) },
        data: {
          score: { increment: 10 },
          correctAnswers: { increment: 1 },
        },
      });
    }

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      message: isCorrect ? 'Correct!' : 'Incorrect',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// ========================
// END QUIZ SESSION
// ========================
router.post('/end/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.params;

    const session = await prisma.quizSession.update({
      where: { id: parseInt(sessionId) },
      data: { endedAt: new Date() },
      include: {
        answers: true,
      },
    });

    res.json({
      message: 'Quiz completed',
      session,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to end quiz' });
  }
});

// ========================
// GET USER QUIZ HISTORY
// ========================
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 20 } = req.query;

    const sessions = await prisma.quizSession.findMany({
      where: { userId: req.user.id },
      include: {
        answers: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

// ========================
// SUBMIT QUIZ RESULTS & UPDATE TROPHY
// ========================
router.post('/submit', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { score, totalQuestions } = req.body;

    // Validate input
    if (score === undefined || totalQuestions === undefined) {
      return res.status(400).json({ error: 'Missing score or totalQuestions' });
    }

    // Calculate trophy: +10 per correct answer
    const trophyGained = score * 10;

    // Update user's trophy in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        trophy: {
          increment: trophyGained,
        },
      },
    });

    console.log(`✅ Quiz completed: ${score}/${totalQuestions} correct | +${trophyGained} trophy | Total trophy: ${updatedUser.trophy}`);

    res.json({
      message: 'Quiz completed successfully',
      score,
      totalQuestions,
      trophy: trophyGained,
      xp: 0,
      totalTrophy: updatedUser.trophy,
    });
  } catch (error) {
    console.error('❌ QUIZ SUBMIT ERROR:', error);
    res.status(500).json({ error: 'Failed to submit quiz results' });
  }
});

// ========================
// GENERATE QUIZ QUESTIONS FROM DATABASE
// ========================
router.get('/generate', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { level = 'NEWBIE', limit = 10 } = req.query;
    const numLimit = Math.min(parseInt(limit as string) || 10, 50);

    // Fetch vocabulary from database by level
    const vocabularies = await prisma.vocabulary.findMany({
      where: {
        level: (level as string).toUpperCase(),
        isActive: true,
      },
      take: numLimit * 2, // Get more to ensure variety
    });

    if (vocabularies.length === 0) {
      return res.status(404).json({ error: `No vocabulary found for level: ${level}` });
    }

    // Shuffle and select unique questions
    const shuffled = vocabularies.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(numLimit, vocabularies.length));

    // Create quiz questions from vocabulary
    const questions = selected.map((vocab, idx) => {
      // Get wrong answers from other vocabularies
      const wrongAnswers = shuffled
        .filter((v) => v.id !== vocab.id && v.id !== selected[idx]?.id)
        .slice(0, 3)
        .map((v) => v.vietnamese);

      // Mix correct answer with wrong answers
      const options = [vocab.vietnamese, ...wrongAnswers]
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      return {
        id: vocab.id,
        type: 'multiple-choice',
        question: `${vocab.korean} (${vocab.english}) - Tiếng Việt là gì?`,
        korean: vocab.korean,
        english: vocab.english,
        vietnamese: vocab.vietnamese,
        romanization: vocab.romanization || '',
        correctAnswer: vocab.vietnamese,
        options,
        difficulty: level === 'BEGINNER' ? 'medium' : 'easy',
        level: level || 'NEWBIE',
      };
    });

    console.log(`✅ Generated ${questions.length} quiz questions for level: ${level} (from database)`);
    res.json(questions);
  } catch (error) {
    console.error('❌ GENERATE QUIZ ERROR:', error);
    res.status(500).json({ error: 'Failed to generate quiz questions' });
  }
});

export default router;
