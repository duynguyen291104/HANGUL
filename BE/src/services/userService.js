// User Service - Handle all user-related database operations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user by email (for login/register)
async function getUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Create new user (for registration)
async function createUser(userData) {
  try {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        name: userData.fullName || userData.email.split('@')[0],
        level: 'NEWBIE',
        totalXP: 0,
        currentStreak: 0,
      },
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Get user profile with all details
async function getUserProfile(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            achievement: {
              select: {
                id: true,
                name: true,
                description: true,
                badge: true,
              },
            },
          },
        },
        quizSessions: {
          select: { score: true, correctAnswers: true, totalQuestions: true },
        },
        vocabularyLearned: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Calculate stats
    const quizCompletedCount = user.quizSessions.length;
    const vocabLearnedCount = user.vocabularyLearned.length;
    const avgQuizScore =
      quizCompletedCount > 0
        ? Math.round(
            user.quizSessions.reduce((sum, s) => sum + (s.score || 0), 0) /
              quizCompletedCount
          )
        : 0;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      level: user.level,
      role: user.role,
      totalXP: user.totalXP,
      currentStreak: user.currentStreak,
      joinedAt: user.createdAt,
      achievements: user.achievements,
      stats: {
        quizCompleted: quizCompletedCount,
        vocabLearned: vocabLearnedCount,
        avgQuizScore,
      },
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// Update user profile
async function updateUserProfile(userId, updates) {
  try {
    const allowedFields = ['name', 'email'];
    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        role: true,
        totalXP: true,
        currentStreak: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Update user XP and level
async function updateUserXP(userId, xpAmount) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, level: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const newXP = user.totalXP + xpAmount;

    // Determine level based on XP (example progression)
    const levels = [
      { name: 'NEWBIE', minXP: 0 },
      { name: 'BEGINNER', minXP: 100 },
      { name: 'INTERMEDIATE', minXP: 300 },
      { name: 'UPPER_INTERMEDIATE', minXP: 700 },
      { name: 'ADVANCED', minXP: 1500 },
    ];

    let newLevel = user.level;
    for (const levelInfo of levels) {
      if (newXP >= levelInfo.minXP) {
        newLevel = levelInfo.name;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: newXP,
        level: newLevel,
      },
      select: {
        id: true,
        totalXP: true,
        level: true,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error updating user XP:', error);
    throw error;
  }
}

// Update user streak
async function updateUserStreak(userId, isActive) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, maxStreak: true, lastActiveDate: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = user.currentStreak;
    let newMaxStreak = user.maxStreak;

    if (isActive) {
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

      if (!lastActive) {
        // First activity
        newStreak = 1;
      } else {
        lastActive.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Same day - no change
          newStreak = user.currentStreak;
        } else if (daysDiff === 1) {
          // Consecutive day
          newStreak = user.currentStreak + 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
      }

      newMaxStreak = Math.max(newStreak, user.maxStreak);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        lastActiveDate: today,
      },
      select: {
        id: true,
        currentStreak: true,
        maxStreak: true,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error updating user streak:', error);
    throw error;
  }
}

// Get user achievements
async function getUserAchievements(userId) {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: {
            id: true,
            name: true,
            description: true,
            badge: true,
          },
        },
      },
      orderBy: { unlockedAt: 'desc' },
    });

    return userAchievements;
  } catch (error) {
    console.error('Error getting user achievements:', error);
    throw error;
  }
}

// Unlock achievement for user
async function unlockAchievement(userId, achievementId) {
  try {
    // Check if already unlocked
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (existing) {
      return { message: 'Achievement already unlocked', unlocked: false };
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Unlock achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
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

    // Add reward XP
    await updateUserXP(userId, achievement.reward);

    return { message: 'Achievement unlocked!', unlocked: true, data: userAchievement };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
}

// Get all achievements
async function getAllAchievements() {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { name: 'asc' },
    });

    return achievements;
  } catch (error) {
    console.error('Error getting achievements:', error);
    throw error;
  }
}

// Check and unlock achievements based on user progress
async function checkAndUnlockAchievements(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        quizSessions: { where: { status: 'COMPLETED' } },
        vocabulary: true,
        userAchievements: true,
      },
    });

    if (!user) {
      return [];
    }

    const unlockedAchievements = [];
    const userAchievementIds = user.userAchievements.map((ua) => ua.achievementId);

    // Check various achievement conditions
    const achievementChecks = [
      {
        id: 1,
        condition: user.quizSessions.length >= 1,
        name: 'First Quiz',
      },
      {
        id: 2,
        condition: user.quizSessions.length >= 10,
        name: 'Quiz Master',
      },
      {
        id: 3,
        condition: user.vocabulary.length >= 50,
        name: 'Vocabulary Expert',
      },
      {
        id: 4,
        condition: user.totalXP >= 1000,
        name: 'Thousand XP',
      },
    ];

    for (const check of achievementChecks) {
      if (check.condition && !userAchievementIds.includes(check.id)) {
        const result = await unlockAchievement(userId, check.id);
        if (result.unlocked) {
          unlockedAchievements.push(result.data);
        }
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

module.exports = {
  getUserByEmail,
  createUser,
  getUserProfile,
  updateUserProfile,
  updateUserXP,
  updateUserStreak,
  getUserAchievements,
  unlockAchievement,
  getAllAchievements,
  checkAndUnlockAchievements,
  getUserById: async (userId) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  },
  updateUserLevel: async (userId, level) => {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { level },
      });
      return user;
    } catch (error) {
      console.error('Error updating user level:', error);
      throw error;
    }
  },
};
