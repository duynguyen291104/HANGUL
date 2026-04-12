// Quiz Service - Handle all quiz-related database operations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get quiz questions by difficulty level
async function getQuizQuestions(level, count = 10) {
  try {
    const questions = await prisma.question.findMany({
      where: {
        difficulty: level,
      },
      take: count,
      select: {
        id: true,
        questionText: true,
        options: true,
        difficulty: true,
        topicId: true,
      },
    });
    return questions;
  } catch (error) {
    console.error('Error getting quiz questions:', error);
    throw error;
  }
}

// Create a new quiz session
async function createQuizSession(userId) {
  try {
    const session = await prisma.quizSession.create({
      data: {
        userId,
        totalQuestions: 10,
        correctAnswers: 0,
        score: 0,
      },
      include: {
        answers: true,
      },
    });
    return session;
  } catch (error) {
    console.error('Error creating quiz session:', error);
    throw error;
  }
}

// Submit an answer to a quiz question
async function submitQuizAnswer(sessionId, questionId, userAnswer) {
  try {
    // Get the question to check correct answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = userAnswer === question.correctAnswer;

    // Save the answer
    const answer = await prisma.quizAnswer.create({
      data: {
        sessionId,
        questionId,
        userAnswer,
        isCorrect,
      },
    });

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      answerId: answer.id,
    };
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

// Complete a quiz session and calculate score
async function completeQuizSession(sessionId) {
  try {
    // Get all answers for this session
    const answers = await prisma.quizAnswer.findMany({
      where: { sessionId },
    });

    if (answers.length === 0) {
      throw new Error('No answers found for this session');
    }

    // Calculate score
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalCount = answers.length;
    const score = Math.round((correctCount / totalCount) * 100);

    // Update session with completion
    const completedSession = await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        status: 'COMPLETED',
        score,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            totalXP: true,
            currentStreak: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                correctAnswer: true,
              },
            },
          },
        },
      },
    });

    return {
      sessionId: completedSession.id,
      score,
      correctCount,
      totalCount,
      answers: completedSession.answers,
    };
  } catch (error) {
    console.error('Error completing quiz session:', error);
    throw error;
  }
}

// Get quiz history for a user
async function getUserQuizHistory(userId, limit = 10) {
  try {
    const history = await prisma.quizSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      orderBy: { endedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        score: true,
        startedAt: true,
        endedAt: true,
        status: true,
        answers: {
          select: {
            isCorrect: true,
          },
        },
      },
    });

    return history.map((session) => ({
      ...session,
      correctCount: session.answers.filter((a) => a.isCorrect).length,
      totalCount: session.answers.length,
    }));
  } catch (error) {
    console.error('Error getting quiz history:', error);
    throw error;
  }
}

// Get a single quiz session details
async function getQuizSession(sessionId) {
  try {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                options: true,
                difficulty: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    return session;
  } catch (error) {
    console.error('Error getting quiz session:', error);
    throw error;
  }
}

module.exports = {
  getQuizQuestions,
  createQuizSession,
  submitQuizAnswer,
  completeQuizSession,
  getUserQuizHistory,
  getQuizSession,
};
