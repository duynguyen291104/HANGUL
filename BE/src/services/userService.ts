const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateUserXP = async (userId: string, xpAmount: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXP: true, currentStreak: true, lastCheckinDate: true },
  });

  if (!user) throw new Error('User not found');

  const newXP = (user.totalXP || 0) + xpAmount;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCheckin = user.lastCheckinDate ? new Date(user.lastCheckinDate) : null;
  if (lastCheckin) lastCheckin.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = user.currentStreak || 0;

  if (!lastCheckin) {
    newStreak = 1;
  } else if (lastCheckin.getTime() === today.getTime()) {
    // Already checked in today
  } else if (lastCheckin.getTime() === yesterday.getTime()) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalXP: newXP,
      currentStreak: newStreak,
      lastCheckinDate: today,
    },
    select: {
      id: true,
      totalXP: true,
      currentStreak: true,
      lastCheckinDate: true,
      level: true,
    },
  });

  return updatedUser;
};

module.exports = { updateUserXP };
export {};  // ← thêm dòng này