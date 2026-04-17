import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import prisma from '../../lib/prisma';

const router = Router();

// ========================
// LEVEL REQUIREMENTS
// ========================
const LEVEL_REQUIREMENTS: Record<string, { xp: number; trophy: number }> = {
  // English level names (Frontend uses these)
  'NEWBIE': { xp: 0, trophy: 0 },
  'BEGINNER': { xp: 1500, trophy: 500 },
  'INTERMEDIATE': { xp: 2500, trophy: 1000 },
  'UPPER': { xp: 3500, trophy: 2000 },
  'ADVANCED': { xp: 5000, trophy: 4000 },
  // Vietnamese level names (Legacy support)
  'CỰC_CƠ_BẢN': { xp: 0, trophy: 0 },
  'CƠ_BẢN': { xp: 1500, trophy: 500 },
  'TRUNG_CẤP': { xp: 2500, trophy: 1000 },
  'NÂNG_CAO': { xp: 3500, trophy: 2000 },
  'LÃO_LUYỆN': { xp: 5000, trophy: 4000 },
};

const LEVEL_ORDER = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER', 'ADVANCED'];

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

    // Update level and lock it
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        level,
        levelLocked: true,
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

    // Calculate correct count for QUIZ (from LearningHistory with skillType='quiz')
    const quizHistoryItems = await prisma.learningHistory.findMany({
      where: { 
        userId,
        skillType: 'quiz',
      },
      select: { topicId: true, isCorrect: true },
    });
    
    console.log(`🔍 QUIZ DEBUG: Found ${quizHistoryItems.length} quiz history items for user ${userId}`);
    if (quizHistoryItems.length > 0) {
      console.log('   Sample:', quizHistoryItems.slice(0, 3));
    }

    const quizCorrectMap = new Map<number, number>();
    const quizTotalMap = new Map<number, number>();

    for (const item of quizHistoryItems) {
      if (!quizTotalMap.has(item.topicId)) {
        quizTotalMap.set(item.topicId, 0);
      }
      quizTotalMap.set(item.topicId, quizTotalMap.get(item.topicId)! + 1);

      if (item.isCorrect) {
        if (!quizCorrectMap.has(item.topicId)) {
          quizCorrectMap.set(item.topicId, 0);
        }
        quizCorrectMap.set(item.topicId, quizCorrectMap.get(item.topicId)! + 1);
      }
    }

    // Calculate correct count for WRITING (from LearningHistory with skillType='writing' or 'WRITING')
    const writingHistoryItems = await prisma.learningHistory.findMany({
      where: { 
        userId,
        skillType: { in: ['writing', 'WRITING'] },
      },
      select: { topicId: true, accuracy: true },
    });

    const writingCorrectMap = new Map<number, number>();
    const writingTotalMap = new Map<number, number>();

    for (const item of writingHistoryItems) {
      const isCorrect = item.accuracy && item.accuracy >= 80; // Consider >= 80 as correct

      if (!writingTotalMap.has(item.topicId)) {
        writingTotalMap.set(item.topicId, 0);
      }
      writingTotalMap.set(item.topicId, writingTotalMap.get(item.topicId)! + 1);

      if (isCorrect) {
        if (!writingCorrectMap.has(item.topicId)) {
          writingCorrectMap.set(item.topicId, 0);
        }
        writingCorrectMap.set(item.topicId, writingCorrectMap.get(item.topicId)! + 1);
      }
    }

    // Calculate correct count for PRONUNCIATION (from LearningHistory with skillType='PRONUNCIATION')
    const pronunciationHistoryItems = await prisma.learningHistory.findMany({
      where: { 
        userId,
        skillType: 'PRONUNCIATION',
      },
      select: { topicId: true, accuracy: true },
    });

    const pronunciationCorrectMap = new Map<number, number>();
    const pronunciationTotalMap = new Map<number, number>();

    for (const item of pronunciationHistoryItems) {
      const isCorrect = item.accuracy && item.accuracy >= 80; // Consider >= 80 as correct

      if (!pronunciationTotalMap.has(item.topicId)) {
        pronunciationTotalMap.set(item.topicId, 0);
      }
      pronunciationTotalMap.set(item.topicId, pronunciationTotalMap.get(item.topicId)! + 1);

      if (isCorrect) {
        if (!pronunciationCorrectMap.has(item.topicId)) {
          pronunciationCorrectMap.set(item.topicId, 0);
        }
        pronunciationCorrectMap.set(item.topicId, pronunciationCorrectMap.get(item.topicId)! + 1);
      }
    }

    // Build response with correct counts
    const topicsWithProgress = topics.map((topic) => {
      const quizCorrect = quizCorrectMap.get(topic.id) || 0;
      const quizTotal = quizTotalMap.get(topic.id) || 0;
      const quizDone = quizTotal > 0 && quizCorrect === quizTotal;

      const writingCorrect = writingCorrectMap.get(topic.id) || 0;
      const writingTotal = writingTotalMap.get(topic.id) || 0;
      const writingDone = writingTotal > 0 && writingCorrect === writingTotal;

      const pronunciationCorrect = pronunciationCorrectMap.get(topic.id) || 0;
      const pronunciationTotal = pronunciationTotalMap.get(topic.id) || 0;
      const pronunciationDone = pronunciationTotal > 0 && pronunciationCorrect === pronunciationTotal;

      return {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        order: topic.order,
        quiz: {
          done: quizDone,
          correct: quizCorrect,
          total: quizTotal,
          progress: `${quizCorrect}/${quizTotal}`,
        },
        writing: {
          done: writingDone,
          correct: writingCorrect,
          total: writingTotal,
          progress: `${writingCorrect}/${writingTotal}`,
        },
        pronunciation: {
          done: pronunciationDone,
          correct: pronunciationCorrect,
          total: pronunciationTotal,
          progress: `${pronunciationCorrect}/${pronunciationTotal}`,
        },
      };
    });

    // Calculate stats - only count as complete when correct === total
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
      stats: {
        message: '✅ Progress tính chỉ Đúng, không tính Sai',
      }
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

// ========================
// ========================
// 6. GET LEARNING HISTORY (Quiz questions review)
// ========================
router.get('/learning-history', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { topicId, skillType, limit = 50 } = req.query;

    console.log('📋 Getting learning history for:', { userId, topicId, skillType, limitParam: limit });

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const where: any = { userId };
    if (topicId) {
      const parsedTopicId = parseInt(topicId as string);
      if (isNaN(parsedTopicId)) {
        return res.status(400).json({ error: 'Invalid topicId' });
      }
      where.topicId = parsedTopicId;
    }
    if (skillType) {
      // Normalize skillType to uppercase for case-insensitive matching
      where.skillType = (skillType as string).toUpperCase();
    }

    const limitNum = parseInt(limit as string) || 50;

    console.log('🔍 Query params:', { where, limitNum });

    const history = await prisma.learningHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      include: {
        topic: { select: { id: true, name: true, slug: true } },
      },
    });

    console.log('✅ Learning history found:', history.length);

    // Return data with fields relevant to each skillType
    res.json({
      success: true,
      count: history.length,
      data: history.map((item) => {
        // Common fields for all skill types
        const baseData = {
          id: item.id,
          skillType: item.skillType,
          createdAt: item.createdAt,
          topicId: item.topicId,
          topicName: item.topic?.name,
        };

        // Add skill-specific fields (normalize to uppercase for comparison)
        const normalizedSkillType = item.skillType?.toUpperCase() || 'QUIZ';
        if (normalizedSkillType === 'QUIZ') {
          return {
            ...baseData,
            questionText: item.questionText,
            correctAnswer: item.correctAnswer,
            selectedAnswer: item.selectedAnswer || null,
            isCorrect: item.isCorrect || null,
          };
        } else if (normalizedSkillType === 'WRITING' || normalizedSkillType === 'PRONUNCIATION') {
          return {
            ...baseData,
            korean: item.korean,
            vietnamese: item.vietnamese,
            accuracy: item.accuracy,
          };
        } else {
          return baseData;
        }
      }),
    });
  } catch (error) {
    console.error('❌ Error getting learning history:', error);
    
    // Return detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to fetch learning history',
      details: errorMessage,
    });
  }
});

// ========================
// 7. SAVE VOCABULARY FROM HISTORY (Only correct answer)
// ========================
router.post('/save-vocab-from-history', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { word, meaning, type } = req.body;

    if (!word || !meaning || !type) {
      return res.status(400).json({ error: 'Missing required fields: word, meaning, type' });
    }

    console.log('💾 Saving vocab from history:', { userId, word, meaning, type });

    // Save to SavedVocabulary
    const saved = await prisma.savedVocabulary.upsert({
      where: {
        userId_koreanWord_type: {
          userId,
          koreanWord: word,
          type: type.toLowerCase(),
        },
      },
      update: {},
      create: {
        userId,
        koreanWord: word,
        meaning,
        type: type.toLowerCase(),
      },
    });

    console.log('✅ Vocabulary saved:', { id: saved.id, korean: saved.koreanWord, type: saved.type });

    res.json({
      success: true,
      message: 'Lưu từ vựng thành công',
      saved: true,
      vocabulary: {
        id: saved.id,
        korean: saved.koreanWord,
        meaning: saved.meaning,
        type: saved.type,
      },
    });
  } catch (error) {
    console.error('❌ Error saving vocabulary from history:', error);
    res.status(500).json({ error: 'Failed to save vocabulary' });
  }
});

// ========================
// 8. GET SAVED VOCABULARY COLLECTION
// ========================
router.get('/saved-vocabulary', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { source, limit = 100 } = req.query;

    console.log('📚 Getting saved vocabulary for:', { userId, source });

    const where: any = { userId };
    if (source) {
      where.source = source as string;
    }

    const savedVocabList = await prisma.userSavedVocabulary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        vocabulary: {
          select: {
            id: true,
            korean: true,
            english: true,
            vietnamese: true,
            romanization: true,
            type: true,
            audioUrl: true,
            imageUrl: true,
            level: true,
            topic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ Saved vocabulary found:', savedVocabList.length);

    res.json({
      success: true,
      count: savedVocabList.length,
      data: savedVocabList.map((item) => ({
        id: item.id,
        savedAt: item.createdAt,
        source: item.source,
        sourceId: item.sourceId,
        isLearned: item.isLearned,
        attempts: item.attempts,
        score: item.score,
        notes: item.notes,
        vocabulary: item.vocabulary,
      })),
    });
  } catch (error) {
    console.error('❌ Error getting saved vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch saved vocabulary' });
  }
});

// ========================
// 9. DELETE SAVED VOCABULARY
// ========================
router.delete('/saved-vocabulary/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { id } = req.params;

    console.log('🗑️ Deleting saved vocabulary:', { userId, id });

    // Get the saved vocabulary to verify ownership
    const saved = await prisma.userSavedVocabulary.findUnique({
      where: { id: parseInt(id) },
    });

    if (!saved) {
      return res.status(404).json({ error: 'Saved vocabulary not found' });
    }

    // Verify ownership
    if (saved.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete it
    await prisma.userSavedVocabulary.delete({
      where: { id: parseInt(id) },
    });

    console.log('✅ Saved vocabulary deleted');

    res.json({
      success: true,
      message: 'Đã xóa từ vựng khỏi bộ sưu tập',
    });
  } catch (error) {
    console.error('❌ Error deleting saved vocabulary:', error);
    res.status(500).json({ error: 'Failed to delete saved vocabulary' });
  }
});

// ========================
// SAVE VOCABULARY WITH TYPE (for vocabulary-collection filtering)
// ========================
router.post('/save-word-to-collection', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { koreanWord, meaning, type, topicId } = req.body;

    if (!koreanWord || !meaning || !type) {
      return res.status(400).json({ error: 'koreanWord, meaning, and type are required' });
    }

    console.log('💾 Saving word to collection:', { userId, koreanWord, type });

    const saved = await prisma.savedVocabulary.upsert({
      where: {
        userId_koreanWord_type: {
          userId,
          koreanWord,
          type,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId,
        koreanWord,
        meaning,
        type,
        topicId: topicId || null,
        source: type,
      },
    });

    console.log('✅ Word saved:', saved.id);

    res.json({
      success: true,
      data: saved,
      message: `Đã lưu từ "${koreanWord}" vào bộ sưu tập`,
    });
  } catch (error: any) {
    console.error('❌ Error saving word:', error);
    res.status(500).json({ error: 'Failed to save word' });
  }
});

// ========================
// GET VOCABULARY COLLECTION (with type filtering)
// ========================
router.get('/vocabulary-collection', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { type } = req.query;

    console.log('📚 Getting vocabulary collection:', { userId, type });

    const where: any = { userId };

    // Filter by type if specified
    if (type && type !== 'all') {
      where.type = type;
    }

    const data = await prisma.savedVocabulary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        koreanWord: true,
        meaning: true,
        type: true,
        topicId: true,
        createdAt: true,
      },
    });

    console.log(`✅ Found ${data.length} words`);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error('❌ Error fetching vocabulary collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

export default router;
