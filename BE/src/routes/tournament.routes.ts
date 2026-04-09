// @ts-nocheck
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ========================
// GET /api/tournament/leaderboard
// Get tournament leaderboard (authenticated version)
// ========================
router.get('/leaderboard', async (_req: any, res: any) => {
  try {
    const leaderboard = await prisma.user.findMany({
      where: { trophy: { gte: 1000 } },
      select: {
        id: true,
        name: true,
        avatar: true,
        trophy: true,
        level: true,
        totalXP: true,
      },
      orderBy: [{ trophy: 'desc' }, { totalXP: 'desc' }],
      take: 100,
    });
    const formatted = leaderboard.map((user: any, idx: number) => ({
      rank: idx + 1,
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      trophy: user.trophy,
      level: user.level,
      xp: user.totalXP,
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json([]);
  }
});

// ========================
// POST /api/tournament/save-score
// Save tournament game score and update trophy
// Score: +10 points per correct answer
// ========================
router.post('/save-score', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { gameType, correctAnswers: _correctAnswers, totalQuestions: _totalQuestions, score } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!gameType || score === undefined) {
      return res.status(400).json({ error: 'Missing gameType or score' });
    }

    // Update user trophy with new score
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        trophy: {
          increment: score, // Add score to trophy
        },
      },
      select: {
        id: true,
        name: true,
        trophy: true,
        totalXP: true,
        level: true,
        avatar: true,
      },
    });

    // Create tournament score record in TournamentPlayer
    const tournamentScore = await prisma.tournamentPlayer?.create?.({
      data: {
        userId,
        tournamentId: '1', // Use a default or get from params
        score,
      },
    }).catch(() => null); // Handle if model doesn't exist yet

    res.json({
      success: true,
      message: 'Score saved successfully',
      user,
      tournamentScore,
    });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// ========================
// POST /api/tournament/join
// Join tournament (requires trophy >= 1000)
// ========================
router.post('/join', async (req: any, res: any) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, trophy: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has enough trophy to join tournament
    if ((user.trophy || 0) < 1000) {
      return res.status(403).json({
        error: 'Không đủ điều kiện tham gia giải đấu',
        requiredTrophy: 1000,
        currentTrophy: user.trophy,
      });
    }

    // Check if user already joined (create a tournament participation record)
    // For now, we'll just return success as the user qualifies
    res.json({
      success: true,
      message: 'Tham gia giải đấu thành công',
      userId: user.id,
      name: user.name,
      trophy: user.trophy,
    });
  } catch (error) {
    console.error('Lỗi tham gia giải đấu:', error);
    res.status(500).json({ error: 'Không thể tham gia giải đấu' });
  }
});

// ========================
// GET /api/tournament/status
// Get tournament status for current user
// ========================
router.get('/status', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        trophy: true,
        name: true,
        totalXP: true,
        level: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const eligible = (user.trophy || 0) >= 1000;

    res.json({
      userId: user.id,
      name: user.name,
      trophy: user.trophy,
      xp: user.totalXP,
      level: user.level,
      eligible,
      message: eligible
        ? 'Bạn đủ điều kiện tham gia giải đấu'
        : `Bạn cần ${1000 - (user.trophy || 0)} điểm nữa để tham gia giải đấu`,
    });
  } catch (error) {
    console.error('Lỗi lấy trạng thái giải đấu:', error);
    res.status(500).json({ error: 'Không thể lấy trạng thái giải đấu' });
  }
});

module.exports = router;
