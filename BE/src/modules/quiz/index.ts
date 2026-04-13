import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { saveUserProgress, addUserXP, checkLevelTestUnlock } from '../../utils/progressHelper';

const router = Router();

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
      console.log('❌ No user in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📋 req.user:', req.user);
    const userId = (req.user as any).id;
    
    if (!userId) {
      console.log('❌ No user ID found in token');
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }

    const { numberOfQuestions = 10, topic, topicId, difficulty } = req.body;

    console.log('🎯 /quiz/start called with:', { userId, topicId, topic, numberOfQuestions });

    // Query questions based on filters
    const where: any = { isActive: true };
    if (topic) where.topicId = parseInt(topic);
    if (topicId) where.topicId = parseInt(topicId);
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      take: numberOfQuestions,
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        questionText: true,
        options: true,
        language_from: true,
        language_to: true,
        explanation: true,
        explanation_vi: true,
        difficulty: true,
      },
    });

    console.log(`📚 Found ${questions.length} questions with filters:`, where);

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions available' });
    }

    // Create quiz session with topicId
    const sessionData: any = {
      userId,
      totalQuestions: questions.length,
    };

    if (topicId) {
      sessionData.topicId = parseInt(topicId);
    }

    console.log('💾 Creating session with data:', sessionData);

    const session = await prisma.quizSession.create({
      data: sessionData,
    });

    console.log('✅ Session created:', session);

    // Return questions WITHOUT correct answers
    const questionsForUser = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      language_from: q.language_from,
      language_to: q.language_to,
      explanation: q.explanation,
      explanation_vi: q.explanation_vi,
    }));

    res.json({
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      questions: questionsForUser,
    });
  } catch (error) {
    console.error('❌ QUIZ START ERROR:', error instanceof Error ? error.message : error);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to start quiz',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// ========================
// SUBMIT QUIZ ANSWER (from Vocabulary)
// ========================
router.post('/answer', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = (req.user as any).id;
    const { sessionId, vocabularyId, selectedAnswer } = req.body;

    console.log('📝 /quiz/answer called:', { userId, sessionId, vocabularyId, selectedAnswer });

    // Validate input
    if (!sessionId || !vocabularyId || !selectedAnswer) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, vocabularyId, selectedAnswer' });
    }

    // Get quiz session
    const session = await prisma.quizSession.findUnique({
      where: { id: parseInt(sessionId) },
    });

    if (!session) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    // Verify this is the user's session
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized - session belongs to different user' });
    }

    // Get vocabulary (the correct answer source)
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: parseInt(vocabularyId) },
    });

    if (!vocabulary) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    // Check answer (compare against Vietnamese meaning)
    const normalizeAnswer = (str: string) => str.toLowerCase().trim();
    const isCorrect = normalizeAnswer(selectedAnswer) === normalizeAnswer(vocabulary.vietnamese);

    console.log(`🔍 Answer check: "${selectedAnswer}" vs "${vocabulary.vietnamese}" = ${isCorrect ? '✅' : '❌'}`);

    // Save answer record
    const answer = await prisma.quizAnswer.create({
      data: {
        sessionId: parseInt(sessionId),
        userId,
        questionId: parseInt(vocabularyId), // Store vocabulary ID as questionId
        selectedAnswer,
        isCorrect,
      },
    });

    console.log(`💾 Answer saved: ${answer.id}`);

    // Update session score (1 point per correct answer)
    const updatedSession = await prisma.quizSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        correctAnswers: isCorrect ? { increment: 1 } : undefined,
        score: isCorrect ? { increment: 1 } : undefined, // 1 point per correct
      },
    });

    console.log(`📊 Session updated: ${updatedSession.correctAnswers}/${updatedSession.totalQuestions} correct`);

    // Calculate percentage
    const percentage = Math.round((updatedSession.correctAnswers / updatedSession.totalQuestions) * 100);

    res.json({
      success: true,
      isCorrect,
      correctAnswer: vocabulary.vietnamese, // Now safe - answer is submitted already
      vocabularyId: vocabulary.id,
      korean: vocabulary.korean,
      english: vocabulary.english,
      vietnamese: vocabulary.vietnamese,
      // Current session stats
      correctAnswers: updatedSession.correctAnswers,
      totalQuestions: updatedSession.totalQuestions,
      percentage,
      message: isCorrect ? '✅ Correct!' : `❌ Incorrect. Answer: ${vocabulary.vietnamese}`,
    });
  } catch (error) {
    console.error('❌ ANSWER SUBMISSION ERROR:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: 'Failed to submit answer',
      details: error instanceof Error ? error.message : String(error),
    });
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

    const userId = (req.user as any).id;
    const { sessionId } = req.params;

    console.log('🏁 /quiz/end called:', { userId, sessionId });

    // Get session
    const session = await prisma.quizSession.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        answers: true,
        topic: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    // Verify ownership
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Calculate final stats
    const finalPercentage = Math.round((session.correctAnswers / session.totalQuestions) * 100);
    const isPassed = finalPercentage >= 70; // 70% = pass

    console.log(`✅ Quiz ended: ${session.correctAnswers}/${session.totalQuestions} = ${finalPercentage}% | Passed: ${isPassed}`);

    // Save progress
    await saveUserProgress(userId, session.topicId!, 'QUIZ', finalPercentage, isPassed);

    // Award XP based on score
    const xpGained = await addUserXP(userId, 'QUIZ', finalPercentage);

    // Check if user unlocked next level test
    await checkLevelTestUnlock(userId);

    // Update session
    const updatedSession = await prisma.quizSession.update({
      where: { id: parseInt(sessionId) },
      data: { endedAt: new Date() },
    });

    // Get updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, totalTrophy: true, level: true },
    });

    console.log(`🏆 User awarded ${xpGained} XP for quiz completion`);

    res.json({
      success: true,
      message: isPassed ? '🎉 Quiz Passed!' : '😔 Quiz Not Passed',
      sessionId: session.id,
      topicId: session.topicId,
      topicName: session.topic?.name || 'Unknown',
      correctAnswers: session.correctAnswers,
      totalQuestions: session.totalQuestions,
      percentage: finalPercentage,
      isPassed,
      xpGained,
      totalXP: updatedUser?.totalXP,
      totalTrophy: updatedUser?.totalTrophy,
      level: updatedUser?.level,
      completedAt: updatedSession.endedAt,
    });
  } catch (error) {
    console.error('❌ END QUIZ ERROR:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: 'Failed to end quiz',
      details: error instanceof Error ? error.message : String(error),
    });
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
// SUBMIT QUIZ RESULTS & UPDATE XP ONLY
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

    // Calculate XP only (10 XP per correct answer)
    const correctAnswers = score;
    const xpGained = correctAnswers * 10;

    // Update user's XP in database ONLY (no trophy from quiz)
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        totalXP: {
          increment: xpGained,
        },
      },
    });

    console.log(`✅ Quiz completed: ${score}/${totalQuestions} correct | +${xpGained} XP | Total XP: ${updatedUser.totalXP}`);

    res.json({
      message: 'Quiz completed successfully',
      score,
      totalQuestions,
      xpGained,
      totalXP: updatedUser.totalXP,
    });
  } catch (error) {
    console.error('❌ QUIZ SUBMIT ERROR:', error);
    res.status(500).json({ error: 'Failed to submit quiz results' });
  }
});

// ========================
// HELPER: Generate Quiz from Vocabulary
// ========================
async function generateQuizFromVocabulary(
  vocabularies: any[],
  level: string,
  limit: number
) {
  if (vocabularies.length === 0) {
    return [];
  }

  // Shuffle and select unique questions
  const shuffled = vocabularies.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(limit, vocabularies.length));

  // Create quiz questions from vocabulary
  const questions = selected.map((vocab, idx) => {
    // Get wrong answers from other vocabularies
    const wrongAnswers = shuffled
      .filter((v) => v.id !== vocab.id)
      .slice(0, 3)
      .map((v) => v.vietnamese);

    // Mix correct answer with wrong answers
    const options = [vocab.vietnamese, ...wrongAnswers]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    // Find correct answer index
    const correctIndex = options.indexOf(vocab.vietnamese);

    return {
      id: vocab.id,
      type: 'multiple-choice',
      question: `${vocab.korean} (${vocab.english}) - Tiếng Việt là gì?`,
      korean: vocab.korean,
      english: vocab.english,
      options,
      difficulty: level === 'BEGINNER' ? 'medium' : 'easy',
      level: level || 'NEWBIE',
      // ❌ NEVER send correctAnswer to frontend
      // correctIndex is stored on backend for validation only
    };
  });

  return questions;
}

// ========================
// NEW: START QUIZ FROM VOCABULARY (DYNAMIC)
// ========================
router.post('/start-vocab', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = (req.user as any).id;
    const { topicId, numberOfQuestions = 10 } = req.body;

    console.log('🎯 /quiz/start-vocab called with:', { userId, topicId, numberOfQuestions });

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    // Get topic information
    const topic = await prisma.topic.findUnique({
      where: { id: parseInt(topicId) },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Fetch vocabulary from this topic
    const vocabularies = await prisma.vocabulary.findMany({
      where: {
        topicId: parseInt(topicId),
        level: topic.level,
        isActive: true,
      },
      take: numberOfQuestions * 2, // Get more for variety
    });

    console.log(`📚 Found ${vocabularies.length} vocabularies in topic: ${topic.name}`);

    if (vocabularies.length === 0) {
      return res.status(404).json({ error: `No vocabulary found for topic: ${topic.name}` });
    }

    // Generate quiz questions from vocabulary
    const questions = await generateQuizFromVocabulary(
      vocabularies,
      topic.level,
      numberOfQuestions
    );

    // Create quiz session
    const session = await prisma.quizSession.create({
      data: {
        userId,
        topicId: parseInt(topicId),
        totalQuestions: questions.length,
      },
    });

    console.log(`✅ Session created: ${session.id} for topic: ${topic.name}`);

    res.json({
      sessionId: session.id,
      topicId: topic.id,
      topicName: topic.name,
      topicLevel: topic.level,
      totalQuestions: session.totalQuestions,
      questions,
    });
  } catch (error) {
    console.error('❌ START VOCAB QUIZ ERROR:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: 'Failed to start quiz',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ========================
// GENERATE QUIZ QUESTIONS FROM DATABASE (with topicId filter)
// ========================
router.get('/generate', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { level = 'NEWBIE', topicId, limit = 10 } = req.query;
    const numLimit = Math.min(parseInt(limit as string) || 10, 50);

    // Build where clause
    const where: any = {
      isActive: true,
      level: (level as string).toUpperCase(),
    };

    if (topicId) {
      where.topicId = parseInt(topicId as string);
    }

    // Fetch vocabulary from database by level and optional topicId
    const vocabularies = await prisma.vocabulary.findMany({
      where,
      take: numLimit * 2,
    });

    if (vocabularies.length === 0) {
      const filterMsg = topicId ? ` for topicId: ${topicId}` : '';
      return res.status(404).json({ error: `No vocabulary found for level: ${level}${filterMsg}` });
    }

    // Generate questions
    const questions = await generateQuizFromVocabulary(
      vocabularies,
      level as string,
      numLimit
    );

    console.log(
      `✅ Generated ${questions.length} quiz questions for level: ${level}${topicId ? ` + topicId: ${topicId}` : ''}`
    );
    res.json(questions);
  } catch (error) {
    console.error('❌ GENERATE QUIZ ERROR:', error);
    res.status(500).json({ error: 'Failed to generate quiz questions' });
  }
});

// ========================
router.get('/user/topic-progress', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all topics
    const topics = await prisma.topic.findMany({
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
    });

    // For each topic, get user's quiz session data
    const topicProgress = await Promise.all(
      topics.map(async (topic) => {
        // Get all quiz answers from this topic
        const quizAnswers = await prisma.quizAnswer.findMany({
          where: {
            userId: req.user!.id,
            question: {
              topicId: topic.id,
            },
          },
          include: {
            question: true,
            session: true,
          },
        });

        // Check if user has completed this topic (>6 correct answers in any quiz session)
        let progress = 0;
        let isCompleted = false;

        if (quizAnswers.length > 0) {
          // Group answers by session and check each session
          const sessionMap = new Map<number, number>();
          quizAnswers.forEach((answer) => {
            const sessionId = answer.sessionId;
            const correct = answer.isCorrect ? 1 : 0;
            sessionMap.set(sessionId, (sessionMap.get(sessionId) ?? 0) + correct);
          });

          // Check if any session has >6 correct answers
          sessionMap.forEach((correctCount) => {
            if (correctCount > 6) {
              isCompleted = true;
            }
          });

          // If completed, progress is 100%, otherwise calculate based on total
          if (isCompleted) {
            progress = 100;
          } else {
            const correctCount = quizAnswers.filter((a) => a.isCorrect).length;
            progress = Math.round((correctCount / quizAnswers.length) * 100);
          }
        }

        return {
          topicId: topic.id,
          topicName: topic.name,
          level: topic.level,
          order: topic.order,
          progress,
          attemptedQuestions: quizAnswers.length,
          isCompleted,
        };
      })
    );

    res.json(topicProgress);
  } catch (error) {
    console.error('Error fetching topic progress:', error);
    res.status(500).json({ error: 'Failed to fetch topic progress' });
  }
});

// ========================
// MARK TOPIC AS COMPLETED (Unlock next topic)
// ========================
router.post('/progress/complete-topic', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = (req.user as any).id;
    const { topicId } = req.body;

    console.log('🏆 /quiz/progress/complete-topic called:', { userId, topicId });

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    // Get the topic
    const topic = await prisma.topic.findUnique({
      where: { id: parseInt(topicId) },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get all quiz sessions for this topic
    const sessions = await prisma.quizSession.findMany({
      where: {
        userId,
        topicId: parseInt(topicId),
      },
    });

    if (sessions.length === 0) {
      return res.status(400).json({ error: 'No quiz sessions found for this topic' });
    }

    // Calculate best score
    let bestScore = 0;
    sessions.forEach((session) => {
      const score = Math.round((session.correctAnswers / session.totalQuestions) * 100);
      if (score > bestScore) {
        bestScore = score;
      }
    });

    const isCompleted = bestScore >= 70;

    console.log(`📊 Topic ${topic.name}: Best Score = ${bestScore}% | Completed: ${isCompleted}`);

    if (!isCompleted) {
      return res.status(400).json({
        error: `Topic not completed. Current best score: ${bestScore}% (need >= 70%)`,
        bestScore,
        required: 70,
      });
    }

    // Find next topic in same level
    const allTopics = await prisma.topic.findMany({
      where: { level: topic.level },
      orderBy: { order: 'asc' },
    });

    const currentIndex = allTopics.findIndex((t) => t.id === parseInt(topicId));
    const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

    console.log(`🔓 Topic completed! Next topic: ${nextTopic?.name || 'None'}`);

    res.json({
      success: true,
      message: `Topic "${topic.name}" completed successfully!`,
      completedTopic: {
        topicId: topic.id,
        topicName: topic.name,
        level: topic.level,
        bestScore,
      },
      nextTopic: nextTopic
        ? {
            topicId: nextTopic.id,
            topicName: nextTopic.name,
            level: nextTopic.level,
            isNowUnlocked: true,
          }
        : null,
      reward: {
        xpBonus: 50, // Bonus XP for completing topic
        trophy: bestScore >= 90 ? 10 : 0, // Bonus trophy if >= 90%
      },
    });
  } catch (error) {
    console.error('❌ COMPLETE TOPIC ERROR:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: 'Failed to complete topic',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ========================
// GET USER PROGRESS FOR LEARNING PATH
// ========================
router.get('/progress/topics', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = (req.user as any).id;

    console.log('📊 /quiz/progress/topics called:', { userId });

    // Get all topics ordered by level and order
    const topics = await prisma.topic.findMany({
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
    });

    // For each topic, calculate progress and unlock status
    const topicProgress = await Promise.all(
      topics.map(async (topic, index) => {
        // Get all quiz sessions for this topic
        const sessions = await prisma.quizSession.findMany({
          where: {
            userId,
            topicId: topic.id,
          },
          include: {
            answers: true,
          },
        });

        // Calculate stats
        let percentage = 0;
        let isCompleted = false;
        let bestScore = 0;
        let totalAttempts = sessions.length;

        if (sessions.length > 0) {
          // Find best session score
          sessions.forEach((session) => {
            const score = Math.round((session.correctAnswers / session.totalQuestions) * 100);
            if (score > bestScore) {
              bestScore = score;
            }
          });

          // Topic is completed if any attempt was >= 70%
          isCompleted = bestScore >= 70;
          percentage = bestScore;
        }

        // Unlock logic: unlock next topic if current is completed (>= 70%)
        // First topic is always unlocked
        const isUnlocked = index === 0 || (index > 0 && topics[index - 1]);
        const previousTopic = index > 0 ? topics[index - 1] : null;
        let isBlockedByPrevious = false;

        if (previousTopic && index > 0) {
          // Check if previous topic is completed
          const prevSessions = await prisma.quizSession.findMany({
            where: {
              userId,
              topicId: previousTopic.id,
            },
          });

          if (prevSessions.length === 0) {
            isBlockedByPrevious = true;
          } else {
            const prevBestScore = Math.max(
              ...prevSessions.map((s) => Math.round((s.correctAnswers / s.totalQuestions) * 100))
            );
            isBlockedByPrevious = prevBestScore < 70;
          }
        }

        const canAccess = index === 0 || !isBlockedByPrevious;

        return {
          topicId: topic.id,
          topicName: topic.name,
          topicLevel: topic.level,
          description: topic.description || '',
          order: topic.order,
          position: index + 1,
          totalTopics: topics.length,
          // Progress
          percentage,
          isCompleted,
          totalAttempts,
          bestScore,
          // Unlock status
          isUnlocked: canAccess,
          isLocked: !canAccess,
          lockedBy: isBlockedByPrevious ? previousTopic?.name : null,
          // Next topic info
          nextTopicId: index < topics.length - 1 ? topics[index + 1].id : null,
          nextTopicName: index < topics.length - 1 ? topics[index + 1].name : null,
        };
      })
    );

    console.log(`✅ Progress fetched for ${topicProgress.length} topics`);

    res.json({
      userId,
      totalTopics: topics.length,
      completedTopics: topicProgress.filter((t) => t.isCompleted).length,
      topics: topicProgress,
    });
  } catch (error) {
    console.error('❌ PROGRESS ERROR:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: 'Failed to fetch topic progress',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ========================
// GET QUESTIONS (Simple - from Question table)
// ========================
router.get('/questions', async (req: AuthRequest, res: Response) => {
  try {
    const { topicId, limit = 10 } = req.query;

    console.log('📋 GET /questions:', { topicId, limit });

    const where: any = { isActive: true };
    if (topicId) {
      where.topicId = Number(topicId);
    }

    const questions = await prisma.question.findMany({
      where,
      take: Number(limit),
      select: {
        id: true,
        questionText: true,
        options: true,
        difficulty: true,
        language_from: true,
        language_to: true,
        explanation: true,
        explanation_vi: true,
        // NOT getting correctAnswer - keep it secret!
      },
    });

    console.log(`✅ Found ${questions.length} questions`);

    res.json(questions);
  } catch (error) {
    console.error('❌ GET QUESTIONS ERROR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// SUBMIT ANSWER (check correctness)
// ========================
router.post('/submit-answer', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { questionId, userAnswer } = req.body;
    const userId = (req.user as any).id;

    console.log('📝 POST /submit-answer:', { userId, questionId, userAnswer });

    if (!questionId || !userAnswer) {
      return res.status(400).json({ error: 'questionId and userAnswer required' });
    }

    // Get question from DB
    const question = await prisma.question.findUnique({
      where: { id: Number(questionId) },
      select: {
        id: true,
        questionText: true,
        correctAnswer: true,
        topicId: true,
        explanation: true,
        explanation_vi: true,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check answer
    const normalize = (str: string) => str?.toLowerCase().trim() || '';
    const isCorrect = normalize(userAnswer) === normalize(question.correctAnswer);

    console.log(`✅ Answer check: "${userAnswer}" vs "${question.correctAnswer}" → ${isCorrect ? '✓' : '✗'}`);

    // Save to UserAnswerHistory for tracking
    await prisma.userAnswerHistory.create({
      data: {
        userId,
        topicId: question.topicId,
        skillType: 'QUIZ',
        question: question.questionText,
        correctAnswer: question.correctAnswer,
        userAnswer,
        isCorrect,
      },
    });

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      explanation_vi: question.explanation_vi,
      xpGained: isCorrect ? 10 : 0,
    });
  } catch (error) {
    console.error('❌ SUBMIT ANSWER ERROR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;