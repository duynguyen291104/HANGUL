import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AchievementType = 
  | 'QUIZ_COUNT'
  | 'VOCAB_COUNT'
  | 'XP_COUNT'
  | 'STREAK_7'
  | 'STREAK_30';

const ACHIEVEMENT_CONFIG = {
  QUIZ_COUNT: { target: 10, title: 'COMPLETE_10_QUIZZES' },
  VOCAB_COUNT: { target: 50, title: 'LEARN_50_VOCAB' },
  XP_COUNT: { target: 1000, title: 'EARN_1000_XP' },
  STREAK_7: { target: 7, title: 'MAINTAIN_7_STREAK' },
  STREAK_30: { target: 30, title: 'MAINTAIN_30_STREAK' },
};

/**
 * Update user achievement progress
 * Call this whenever user completes a quiz, learns vocabulary, earns XP, etc.
 */
export async function updateAchievementProgress(
  userId: number,
  achievementType: AchievementType,
  increment: number = 1
) {
  try {
    const achievements = await prisma.achievement.findMany({
      where: {
        criteria: achievementType,
      },
    });

    if (achievements.length === 0) return;

    for (const achievement of achievements) {
      let userAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.id,
        },
      });

      // Create if doesn't exist
      if (!userAchievement) {
        userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 0,
          },
        });
      }

      // Update progress
      const newProgress = userAchievement.progress + increment;
      const isCompleted = newProgress >= achievement.target;

      await prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: {
          progress: Math.min(newProgress, achievement.target),
          completed: isCompleted,
          completedAt: isCompleted && !userAchievement.completed 
            ? new Date() 
            : userAchievement.completedAt,
        },
      });
    }
  } catch (error) {
    console.error('Error updating achievement progress:', error);
  }
}

/**
 * Get user achievements with progress
 */
export async function getUserAchievements(userId: number) {
  try {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { completed: 'desc' },
    });

    return achievements.map((ua) => ({
      id: ua.id,
      achievementId: ua.achievement.id,
      title: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.badge,
      progress: ua.progress,
      target: ua.achievement.target,
      completed: ua.completed,
      completedAt: ua.completedAt,
      percentage: ua.achievement.target ? Math.round((ua.progress / ua.achievement.target) * 100) : 0,
    }));
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
}

/**
 * Initialize achievements for new user (create UserAchievement records for all achievements)
 */
export async function initializeUserAchievements(userId: number) {
  try {
    const achievements = await prisma.achievement.findMany();

    for (const achievement of achievements) {
      const exists = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.id,
        },
      });

      if (!exists) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 0,
            completed: false,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error initializing user achievements:', error);
  }
}
