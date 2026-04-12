// Vocabulary Service - Handle all vocabulary-related database operations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all vocabulary items with optional filtering
async function getVocabulary(filters = {}) {
  try {
    const { level, topic, limit = 50, offset = 0 } = filters;

    const where = {
      isActive: true,
    };

    if (level) {
      where.level = level;
    }

    if (topic) {
      where.topicId = topic;
    }

    const [vocabulary, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          topic: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vocabulary.count({ where }),
    ]);

    return {
      items: vocabulary,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error getting vocabulary:', error);
    throw error;
  }
}

// Get vocabulary by level
async function getVocabularyByLevel(level) {
  try {
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        level,
      },
      select: {
        id: true,
        korean: true,
        english: true,
        romanization: true,
        level: true,
        audioUrl: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vocabulary;
  } catch (error) {
    console.error('Error getting vocabulary by level:', error);
    throw error;
  }
}

// Add vocabulary to user's learning list
async function addToUserLearning(userId, vocabularyId) {
  try {
    // Check if already exists
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        vocabulary: {
          where: { id: vocabularyId },
        },
      },
    });

    if (existing && existing.vocabulary.length > 0) {
      return { message: 'Already in learning list', added: false };
    }

    // Add to learning
    const result = await prisma.user.update({
      where: { id: userId },
      data: {
        vocabulary: {
          connect: { id: vocabularyId },
        },
      },
      include: {
        vocabulary: {
          select: {
            id: true,
            korean: true,
            english: true,
          },
        },
      },
    });

    return { message: 'Added to learning list', added: true, data: result };
  } catch (error) {
    console.error('Error adding to learning list:', error);
    throw error;
  }
}

// Get user's learned vocabulary
async function getUserVocabulary(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vocabulary: {
          select: {
            id: true,
            korean: true,
            english: true,
            romanization: true,
            level: true,
            audioUrl: true,
          },
        },
      },
    });

    return user ? user.vocabulary : [];
  } catch (error) {
    console.error('Error getting user vocabulary:', error);
    throw error;
  }
}

// Create new vocabulary (admin only)
async function createVocabulary(data) {
  try {
    const vocabulary = await prisma.vocabulary.create({
      data: {
        korean: data.korean,
        english: data.english,
        romanization: data.romanization || '',
        level: data.level || 'BEGINNER',
        topicId: data.topicId,
        audioUrl: data.audioUrl || null,
        imageUrl: data.imageUrl || null,
      },
    });

    return vocabulary;
  } catch (error) {
    console.error('Error creating vocabulary:', error);
    throw error;
  }
}

// Update vocabulary (admin only)
async function updateVocabulary(vocabularyId, data) {
  try {
    const vocabulary = await prisma.vocabulary.update({
      where: { id: vocabularyId },
      data: {
        korean: data.korean || undefined,
        english: data.english || undefined,
        romanization: data.romanization || undefined,
        level: data.level || undefined,
        topicId: data.topicId || undefined,
        audioUrl: data.audioUrl || undefined,
        imageUrl: data.imageUrl || undefined,
        version: {
          increment: 1,
        },
      },
    });

    return vocabulary;
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    throw error;
  }
}

// Delete vocabulary (soft delete)
async function deleteVocabulary(vocabularyId) {
  try {
    const vocabulary = await prisma.vocabulary.update({
      where: { id: vocabularyId },
      data: {
        isActive: false,
      },
    });

    return vocabulary;
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    throw error;
  }
}

// Get all topics
async function getAllTopics() {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        _count: {
          select: { vocabulary: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return topics;
  } catch (error) {
    console.error('Error getting topics:', error);
    throw error;
  }
}

// Get vocabulary by topic
async function getVocabularyByTopic(topicId) {
  try {
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        topicId,
        isActive: true,
      },
      select: {
        id: true,
        korean: true,
        english: true,
        romanization: true,
        level: true,
        audioUrl: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vocabulary;
  } catch (error) {
    console.error('Error getting vocabulary by topic:', error);
    throw error;
  }
}

// Get vocabulary statistics
async function getVocabularyStats(userId) {
  try {
    const [learned, byLevel] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          vocabularyLearned: {
            select: { level: true },
          },
        },
      }),
      prisma.vocabulary.groupBy({
        by: ['level'],
        _count: true,
      }),
    ]);

    const learnedCount = learned ? learned.vocabularyLearned.length : 0;
    const total = byLevel.reduce((sum, item) => sum + item._count, 0);

    return {
      learned: learnedCount,
      total,
      byLevel: byLevel.map((item) => ({
        level: item.level,
        count: item._count,
      })),
    };
  } catch (error) {
    console.error('Error getting vocabulary stats:', error);
    throw error;
  }
}

module.exports = {
  getVocabulary,
  getVocabularyByLevel,
  addToUserLearning,
  getUserVocabulary,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  getAllTopics,
  getVocabularyByTopic,
  getVocabularyStats,
};
