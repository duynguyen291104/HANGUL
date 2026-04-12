// Leaderboard Service - Handle all leaderboard and ranking operations
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get top users (leaderboard)
async function getTopUsers(filters = {}) {
  try {
    const { level = 'ALL', timeframe = 'all', limit = 100, offset = 0 } = filters;

    const where = {};

    if (level && level !== 'ALL') {
      where.level = level;
    }

    // Calculate date range based on timeframe
    let startDate = null;
    if (timeframe === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    let users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        totalXP: true,
        currentStreak: true,
        createdAt: true,
        role: true,
      },
      orderBy: { totalXP: 'desc' },
      skip: offset,
      take: limit,
    });

    // If filtering by timeframe, recalculate based on recent activity
    if (startDate) {
      const userIds = users.map((u) => u.id);

      const recentXP = await prisma.quizSession.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
        _sum: {
          score: true,
        },
      });

      const xpMap = {};
      recentXP.forEach((item) => {
        xpMap[item.userId] = item._sum.score || 0;
      });

      users = users.map((user) => ({
        ...user,
        recentXP: xpMap[user.id] || 0,
      }));

      // Sort by recent XP for timeframe queries
      if (timeframe !== 'all') {
        users.sort((a, b) => b.recentXP - a.recentXP);
      }
    }

    // Add rank
    const rankedUsers = users.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
    }));

    return rankedUsers;
  } catch (error) {
    console.error('Error getting top users:', error);
    throw error;
  }
}

// Get user's rank and position
async function getUserRank(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        totalXP: true,
        currentStreak: true,
        level: true,
      },
    });

    if (!user) {
      return null;
    }

    // Count users with more XP
    const betterUsers = await prisma.user.count({
      where: {
        totalXP: { gt: user.totalXP },
      },
    });

    const rank = betterUsers + 1;

    // Get total users
    const totalUsers = await prisma.user.count();

    const percentile = Math.round((1 - rank / totalUsers) * 100);

    return {
      userId,
      name: user.name,
      rank,
      totalXP: user.totalXP,
      level: user.level,
      currentStreak: user.currentStreak,
      totalUsers,
      percentile,
    };
  } catch (error) {
    console.error('Error getting user rank:', error);
    throw error;
  }
}

// Get leaderboard by level
async function getLeaderboardByLevel(level) {
  try {
    const users = await prisma.user.findMany({
      where: {
        level,
      },
      select: {
        id: true,
        name: true,
        totalXP: true,
        currentStreak: true,
        level: true,
      },
      orderBy: { totalXP: 'desc' },
      take: 100,
    });

    const rankedUsers = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    return rankedUsers;
  } catch (error) {
    console.error('Error getting leaderboard by level:', error);
    throw error;
  }
}

// Get top users this week
async function getWeeklyLeaderboard(limit = 50) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userScores = await prisma.quizSession.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: {
        score: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      take: limit,
    });

    const userIds = userScores.map((item) => item.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        level: true,
        currentStreak: true,
      },
    });

    const userMap = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    const leaderboard = userScores
      .map((score, index) => ({
        rank: index + 1,
        ...userMap[score.userId],
        weeklyXP: score._sum.score || 0,
        sessionsCompleted: score._count,
      }))
      .filter((user) => user.name);

    return leaderboard;
  } catch (error) {
    console.error('Error getting weekly leaderboard:', error);
    throw error;
  }
}

// Get top users this month
async function getMonthlyLeaderboard(limit = 50) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userScores = await prisma.quizSession.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        score: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      take: limit,
    });

    const userIds = userScores.map((item) => item.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        level: true,
        currentStreak: true,
      },
    });

    const userMap = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    const leaderboard = userScores
      .map((score, index) => ({
        rank: index + 1,
        ...userMap[score.userId],
        monthlyXP: score._sum.score || 0,
        sessionsCompleted: score._count,
      }))
      .filter((user) => user.name);

    return leaderboard;
  } catch (error) {
    console.error('Error getting monthly leaderboard:', error);
    throw error;
  }
}

// Get user's friends/nearby users on leaderboard
async function getNearbyUsers(userId, range = 5) {
  try {
    const userRank = await getUserRank(userId);

    if (!userRank) {
      return [];
    }

    const startRank = Math.max(1, userRank.rank - range);
    const endRank = userRank.rank + range;

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        totalXP: true,
        currentStreak: true,
        level: true,
      },
      orderBy: { totalXP: 'desc' },
    });

    const nearbyUsers = users
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }))
      .filter((user) => user.rank >= startRank && user.rank <= endRank);

    return nearbyUsers;
  } catch (error) {
    console.error('Error getting nearby users:', error);
    throw error;
  }
}

// Get leaderboard statistics
async function getLeaderboardStats() {
  try {
    const [totalUsers, activeUsers, avgXP, avgStreak] = await Promise.all([
      prisma.user.count(),
      prisma.user.count(),
      prisma.user.aggregate({
        _avg: { totalXP: true },
      }),
      prisma.user.aggregate({
        _avg: { currentStreak: true },
      }),
    ]);

    const topUser = await prisma.user.findFirst({
      orderBy: { totalXP: 'desc' },
      select: {
        name: true,
        totalXP: true,
      },
    });

    return {
      totalUsers,
      activeUsers,
      avgXP: Math.round(avgXP._avg.totalXP || 0),
      avgStreak: Math.round(avgStreak._avg.currentStreak || 0),
      topUser,
    };
  } catch (error) {
    console.error('Error getting leaderboard stats:', error);
    throw error;
  }
}

module.exports = {
  getTopUsers,
  getUserRank,
  getLeaderboardByLevel,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getNearbyUsers,
  getLeaderboardStats,
};
