const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const userRouter = Router();
const userPrisma = new PrismaClient();

// ========================
// GET USER STATS
// ========================
userRouter.get('/stats', async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const user = await userPrisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        totalXP: true,
        trophy: true,
        currentStreak: true,
        level: true,
        lastCheckinDate: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trophyValue = user.trophy || 0;
    const isEligible = trophyValue >= 1000;

    console.log(`✅ User ${user.email}: Trophy=${trophyValue}, Eligible=${isEligible}`);

    res.json({
      userId: user.id,
      name: user.name,
      email: user.email,
      trophy: trophyValue,
      eligible: isEligible,
      // Other fields (informational only)
      xp: user.totalXP,
      streak: user.currentStreak,
      level: user.level,
      lastCheckinDate: user.lastCheckinDate,
    });
  } catch (error) {
    console.error('❌ USER STATS ERROR:', error);
    res.status(500).json({ error: 'Failed to load user stats' });
  }
});

// ========================
// GET USER PROFILE
// ========================
userRouter.get('/profile', async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const user = await userPrisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        level: true,
        levelLocked: true,
        totalXP: true,
        trophy: true,
        currentStreak: true,
        lastCheckinDate: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(' USER PROFILE ERROR:', error);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
});

// ========================
// SET LEVEL (First time selection)
// ========================
userRouter.post('/set-level', async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { level } = req.body;

    if (!level) {
      return res.status(400).json({ error: 'Level is required' });
    }

    const validLevels = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER', 'ADVANCED'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    const user = await userPrisma.user.update({
      where: { id: userId },
      data: {
        level,
        levelLocked: true,
      },
      select: {
        id: true,
        level: true,
        levelLocked: true,
      },
    });

    console.log(` Level set for user ${userId}: ${level} (locked)`);
    res.json({ message: 'Level set successfully', level: user.level, levelLocked: user.levelLocked });
  } catch (error) {
    console.error(' SET LEVEL ERROR:', error);
    res.status(500).json({ error: 'Failed to set level' });
  }
});

// ========================
// UPDATE LEVEL (From learning-map page)
// ========================
userRouter.put('/update-level', async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { level } = req.body;

    if (!level) {
      return res.status(400).json({ error: 'Level is required' });
    }

    const validLevels = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER', 'ADVANCED'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    const user = await userPrisma.user.update({
      where: { id: userId },
      data: { level },
      select: {
        id: true,
        level: true,
      },
    });

    console.log(` Level updated for user ${userId}: ${level}`);
    res.json({ message: 'Level updated successfully', level: user.level });
  } catch (error) {
    console.error(' UPDATE LEVEL ERROR:', error);
    res.status(500).json({ error: 'Failed to update level' });
  }
});

module.exports = userRouter;
