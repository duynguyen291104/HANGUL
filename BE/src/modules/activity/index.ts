import express, { Request, Response } from 'express';
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// GET /activity/weekly - Get weekly activity for current user
router.get('/weekly', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    const activities = await prisma.userActivity.findMany({
      where: {
        userId: parseInt(userId),
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals
    const totalSeconds = activities.reduce((sum, activity) => sum + activity.totalSeconds, 0);
    const totalHours = Math.round(totalSeconds / 3600);
    const avgSessionMinutes = activities.length > 0 
      ? Math.round((totalSeconds / activities.length) / 60) 
      : 0;

    // Group by day for daily breakdown
    const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayActivities = activities.filter(a => 
        a.date.toISOString().split('T')[0] === dateStr
      );
      
      const daySeconds = dayActivities.reduce((sum, a) => sum + a.totalSeconds, 0);
      
      return {
        date: dateStr,
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
        seconds: daySeconds,
        minutes: Math.round(daySeconds / 60),
        hours: (daySeconds / 3600).toFixed(2),
      };
    });

    res.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalSeconds,
      totalMinutes: Math.round(totalSeconds / 60),
      totalHours,
      avgSessionMinutes,
      activityCount: activities.length,
      daily: dailyBreakdown,
      activities: activities.map(a => ({
        ...a,
        hours: (a.totalSeconds / 3600).toFixed(2),
        minutes: Math.round(a.totalSeconds / 60),
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching weekly activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// POST /activity/log-time - Log time spent on learning
router.post('/log-time', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;

    const { totalSeconds, skillType = 'mixed' } = req.body;

    if (!totalSeconds || totalSeconds < 0) {
      return res.status(400).json({ error: 'Invalid totalSeconds' });
    }

    // Get today's date at midnight
    const today = startOfDay(new Date());

    // Find or create activity record for today
    const existingActivity = await prisma.userActivity.findUnique({
      where: {
        userId_date_skillType: {
          userId: parseInt(userId),
          date: today,
          skillType,
        },
      },
    });

    let activity;
    if (existingActivity) {
      // Update existing activity
      activity = await prisma.userActivity.update({
        where: {
          id: existingActivity.id,
        },
        data: {
          totalSeconds: existingActivity.totalSeconds + totalSeconds,
        },
      });
    } else {
      // Create new activity record
      activity = await prisma.userActivity.create({
        data: {
          userId: parseInt(userId),
          date: today,
          skillType,
          totalSeconds,
        },
      });
    }

    res.json({
      success: true,
      activity: {
        ...activity,
        hours: (activity.totalSeconds / 3600).toFixed(2),
        minutes: Math.round(activity.totalSeconds / 60),
      },
    });
  } catch (error) {
    console.error('❌ Error logging time:', error);
    res.status(500).json({ error: 'Failed to log time' });
  }
});

// GET /activity/today - Get today's activity
router.get('/today', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;

    const today = startOfDay(new Date());

    const activities = await prisma.userActivity.findMany({
      where: {
        userId: parseInt(userId),
        date: today,
      },
    });

    const totalSeconds = activities.reduce((sum, a) => sum + a.totalSeconds, 0);

    res.json({
      date: today.toISOString().split('T')[0],
      totalSeconds,
      minutes: Math.round(totalSeconds / 60),
      hours: (totalSeconds / 3600).toFixed(2),
      activities: activities.map(a => ({
        ...a,
        hours: (a.totalSeconds / 3600).toFixed(2),
        minutes: Math.round(a.totalSeconds / 60),
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching today activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
