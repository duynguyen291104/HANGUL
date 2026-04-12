// Achievement Service - Handle all achievement-related operations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all achievements
async function getAllAchievements() {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { name: 'asc' },
    });

    return achievements;
  } catch (error) {
    console.error('Error getting all achievements:', error);
    throw error;
  }
}

// Get user's unlocked achievements
async function getUserUnlockedAchievements(userId) {
  try {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            reward: true,
          },
        },
      },
      orderBy: { unlockedAt: 'desc' },
    });

    return achievements.map((ua) => ({
      ...ua.achievement,
      unlockedAt: ua.unlockedAt,
    }));
  } catch (error) {
    console.error('Error getting user achievements:', error);
    throw error;
  }
}

// Get user's progress towards achievements
async function getUserAchievementProgress(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        quizSessions: { where: { status: 'COMPLETED' } },
        vocabulary: true,
        userAchievements: { select: { achievementId: true } },
      },
    });

    if (!user) {
      return null;
    }

    const unlockedIds = user.userAchievements.map((ua) => ua.achievementId);

    const achievements = await prisma.achievement.findMany({});

    const progressData = allAchievements.map((achievement) => {
      const isUnlocked = unlockedIds.includes(achievement.id);
      let progress = 0;
      let target = 1;

      // Calculate progress based on achievement criteria
      switch (achievement.criteria) {
        case 'FIRST_QUIZ':
          progress = user.quizSessions.length > 0 ? 1 : 0;
          target = 1;
          break;
        case 'QUIZ_MASTER':
          progress = Math.min(user.quizSessions.length, 10);
          target = 10;
          break;
        case 'VOCAB_EXPERT':
          progress = Math.min(user.vocabulary.length, 50);
          target = 50;
          break;
        case 'THOUSAND_XP':
          progress = Math.min(user.totalXP, 1000);
          target = 1000;
          break;
        case 'PERFECT_SCORE':
          progress = user.quizSessions.filter((s) => s.score === 100).length > 0 ? 1 : 0;
          target = 1;
          break;
        case 'SEVEN_DAY_STREAK':
          progress = Math.min(user.currentStreak, 7);
          target = 7;
          break;
        default:
          progress = isUnlocked ? 1 : 0;
          target = 1;
      }

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        reward: achievement.reward,
        isUnlocked,
        progress,
        target,
        percentage: Math.round((progress / target) * 100),
      };
    });

    return progressData;
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    throw error;
  }
}

// Check and award achievements
async function checkAndAwardAchievements(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        quizSessions: { where: { status: 'COMPLETED' } },
        vocabulary: true,
        userAchievements: { select: { achievementId: true } },
      },
    });

    if (!user) {
      return [];
    }

    const unlockedIds = user.userAchievements.map((ua) => ua.achievementId);
    const newAchievements = [];

    // Define achievement unlock conditions
    const achievementConditions = [
      {
        id: 1,
        criteria: 'FIRST_QUIZ',
        condition: user.quizSessions.length >= 1,
      },
      {
        id: 2,
        criteria: 'QUIZ_MASTER',
        condition: user.quizSessions.length >= 10,
      },
      {
        id: 3,
        criteria: 'VOCAB_EXPERT',
        condition: user.vocabulary.length >= 50,
      },
      {
        id: 4,
        criteria: 'THOUSAND_XP',
        condition: user.totalXP >= 1000,
      },
      {
        id: 5,
        criteria: 'PERFECT_SCORE',
        condition: user.quizSessions.some((s) => s.score === 100),
      },
      {
        id: 6,
        criteria: 'SEVEN_DAY_STREAK',
        condition: user.currentStreak >= 7,
      },
    ];

    // Check each condition
    for (const achievement of achievementConditions) {
      if (achievement.condition && !unlockedIds.includes(achievement.id)) {
        // Unlock achievement
        const result = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            unlockedAt: new Date(),
          },
          include: {
            achievement: {
              select: {
                name: true,
                icon: true,
                reward: true,
              },
            },
          },
        });

        // Award XP
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalXP: {
              increment: result.achievement.reward,
            },
          },
        });

        newAchievements.push({
          name: result.achievement.name,
          icon: result.achievement.icon,
          reward: result.achievement.reward,
          unlockedAt: result.unlockedAt,
        });
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

// Get achievement statistics
async function getAchievementStats() {
  try {
    const [totalAchievements, totalUnlocked, avgPerUser] = await Promise.all([
      prisma.achievement.count(),
      prisma.userAchievement.count(),
      prisma.achievement.aggregate({
        _count: true,
        where: { isActive: true },
      }),
    ]);

    const mostUnlockedAchievements = await prisma.userAchievement.groupBy({
      by: ['achievementId'],
      _count: true,
      orderBy: {
        _count: {
          achievementId: 'desc',
        },
      },
      take: 5,
    });

    const achievementDetails = await prisma.achievement.findMany({
      where: {
        id: {
          in: mostUnlockedAchievements.map((a) => a.achievementId),
        },
      },
    });

    const achievementMap = {};
    achievementDetails.forEach((a) => {
      achievementMap[a.id] = a;
    });

    const mostUnlocked = mostUnlockedAchievements.map((a) => ({
      name: achievementMap[a.achievementId].name,
      unlockedCount: a._count,
    }));

    return {
      totalAchievements,
      totalUnlocked,
      avgPerUser: Math.round(totalUnlocked / (await prisma.user.count()) || 0),
      mostUnlocked,
    };
  } catch (error) {
    console.error('Error getting achievement stats:', error);
    throw error;
  }
}

// Create new achievement (admin only)
async function createAchievement(data) {
  try {
    const achievement = await prisma.achievement.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        reward: data.reward || 100,
        criteria: data.criteria,
      },
    });

    return achievement;
  } catch (error) {
    console.error('Error creating achievement:', error);
    throw error;
  }
}

// Update achievement (admin only)
async function updateAchievement(achievementId, data) {
  try {
    const achievement = await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        name: data.name || undefined,
        description: data.description || undefined,
        icon: data.icon || undefined,
        reward: data.reward || undefined,
        criteria: data.criteria || undefined,
      },
    });

    return achievement;
  } catch (error) {
    console.error('Error updating achievement:', error);
    throw error;
  }
}

module.exports = {
  getAllAchievements,
  getUserUnlockedAchievements,
  getUserAchievementProgress,
  checkAndAwardAchievements,
  getAchievementStats,
  createAchievement,
  updateAchievement,
};
