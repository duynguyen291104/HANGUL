import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PointSystem } from '../utils/pointSystem';

const prisma = new PrismaClient();

// Middleware to check if user can join tournament
export const canJoinTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!PointSystem.canJoinTournament(user.totalXP)) {
      return res.status(403).json({
        error: 'Insufficient XP',
        message: `You need 1000 XP to join tournament. Current: ${user.totalXP}`,
        currentXP: user.totalXP,
        requiredXP: 1000,
      });
    }

    next();
  } catch (error) {
    console.error('Tournament unlock check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
