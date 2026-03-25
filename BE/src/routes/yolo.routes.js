const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

// ========================
// YOLO DETECTIONS CRUD
// ========================

// Save detection to database
router.post('/save', async (req, res) => {
  try {
    const { label, confidence, bbox, sessionId, frameNumber, videoUrl, source } = req.body;
    const userId = req.user?.id || null;

    const detection = await prisma.yOLODetection.create({
      data: {
        userId,
        label,
        confidence: parseFloat(confidence),
        bbox: JSON.stringify(bbox),
        sessionId,
        frameNumber: frameNumber ? parseInt(frameNumber) : null,
        videoUrl,
        source: source || 'webcam',
      },
    });

    // Update user detection stats
    if (userId) {
      await updateDetectionStats(userId, label);
    }

    res.json({ success: true, id: detection.id });
  } catch (error) {
    console.error(' Save detection error:', error);
    res.status(500).json({ error: 'Failed to save detection' });
  }
});

// Batch save detections
router.post('/batch-save', async (req, res) => {
  try {
    const { detections, sessionId } = req.body;
    const userId = req.user?.id || null;

    const created = await prisma.yOLODetection.createMany({
      data: detections.map(det => ({
        userId,
        label: det.label,
        confidence: parseFloat(det.confidence),
        bbox: JSON.stringify(det.bbox),
        sessionId: sessionId || det.sessionId,
        frameNumber: det.frameNumber ? parseInt(det.frameNumber) : null,
        videoUrl: det.videoUrl,
        source: det.source || 'webcam',
      })),
    });

    // Update stats
    if (userId) {
      const labels = new Set(detections.map(d => d.label));
      for (const label of labels) {
        await updateDetectionStats(userId, label);
      }
    }

    res.json({ success: true, count: created.count });
  } catch (error) {
    console.error(' Batch save error:', error);
    res.status(500).json({ error: 'Failed to batch save detections' });
  }
});

// Sync from YOLO Flask server (receives detections from Python)
router.post('/sync-backend', async (req, res) => {
  try {
    const { detections, user_id } = req.body;
    const userId = user_id || req.user?.id || 1; // Default to user 1 if not provided

    if (!detections || detections.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const created = await prisma.yOLODetection.createMany({
      data: detections.map(det => ({
        userId,
        label: det.label,
        confidence: parseFloat(det.confidence),
        bbox: JSON.stringify(det.bbox),
        frameNumber: det.frame_number ? parseInt(det.frame_number) : null,
        source: 'webcam',
      })),
      skipDuplicates: false,
    });

    // Update stats
    if (userId) {
      const labels = new Set(detections.map(d => d.label));
      for (const label of labels) {
        await updateDetectionStats(userId, label);
      }
    }

    res.json({ success: true, count: created.count });
  } catch (error) {
    console.error(' Sync backend error:', error);
    res.status(500).json({ error: 'Failed to sync detections' });
  }
});

// Get user detections
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0, label, sessionId } = req.query;

    const where = { userId: parseInt(userId) };
    if (label) where.label = label;
    if (sessionId) where.sessionId = sessionId;

    const detections = await prisma.yOLODetection.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.yOLODetection.count({ where });

    res.json({
      count: detections.length,
      total,
      limit,
      offset,
      detections: detections.map(d => ({
        ...d,
        bbox: typeof d.bbox === 'string' ? JSON.parse(d.bbox) : d.bbox,
        confidence: parseFloat(d.confidence),
      })),
    });
  } catch (error) {
    console.error(' Get detections error:', error);
    res.status(500).json({ error: 'Failed to fetch detections' });
  }
});

// Get detection stats
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await prisma.detectionStats.findUnique({
      where: { userId: parseInt(userId) },
    });

    if (!stats) {
      return res.json({
        totalDetections: 0,
        uniqueLabels: 0,
        sessionsCount: 0,
        topLabel: null,
        topLabelCount: 0,
      });
    }

    res.json(stats);
  } catch (error) {
    console.error(' Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get label statistics
router.get('/labels/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const detections = await prisma.yOLODetection.groupBy({
      by: ['label'],
      where: { userId: parseInt(userId) },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    res.json({
      count: detections.length,
      labels: detections.map(d => ({
        label: d.label,
        count: d._count.id,
        percentage: 0, // Will be calculated on frontend
      })),
    });
  } catch (error) {
    console.error(' Get labels error:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// Get daily statistics
router.get('/daily/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const detections = await prisma.yOLODetection.findMany({
      where: {
        userId: parseInt(userId),
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    // Aggregate by date
    const dailyStats = {};
    detections.forEach(d => {
      const date = new Date(d.createdAt).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    res.json({
      days: parseInt(days),
      stats: Object.entries(dailyStats).map(([date, count]) => ({
        date,
        count,
      })),
    });
  } catch (error) {
    console.error(' Get daily stats error:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
});

// ========================
// BATCH PROCESSING
// ========================

// Create batch job
router.post('/batch/create', async (req, res) => {
  try {
    const { name, inputPath, inputType, fileCount } = req.body;
    const userId = req.user?.id || null;

    const job = await prisma.batchJob.create({
      data: {
        userId,
        name,
        inputPath,
        inputType,
        fileCount,
        status: 'pending',
      },
    });

    res.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error(' Create batch job error:', error);
    res.status(500).json({ error: 'Failed to create batch job' });
  }
});

// Get batch jobs
router.get('/batch/jobs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const jobs = await prisma.batchJob.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ count: jobs.length, jobs });
  } catch (error) {
    console.error(' Get batch jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch batch jobs' });
  }
});

// Update batch job progress
router.patch('/batch/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, progress, resultCount, errorMessage } = req.body;

    const job = await prisma.batchJob.update({
      where: { id: jobId },
      data: {
        status: status || undefined,
        progress: progress !== undefined ? progress : undefined,
        resultCount: resultCount !== undefined ? resultCount : undefined,
        errorMessage: errorMessage || undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });

    res.json({ success: true, job });
  } catch (error) {
    console.error(' Update batch job error:', error);
    res.status(500).json({ error: 'Failed to update batch job' });
  }
});

// ========================
// HELPER FUNCTIONS
// ========================

async function updateDetectionStats(userId, newLabel) {
  try {
    let stats = await prisma.detectionStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await prisma.detectionStats.create({
        data: {
          userId,
          totalDetections: 1,
          uniqueLabels: 1,
          topLabel: newLabel,
          topLabelCount: 1,
        },
      });
    } else {
      // Update total detections
      const newTotal = stats.totalDetections + 1;

      // Check label count
      const labelCount = await prisma.yOLODetection.count({
        where: { userId, label: newLabel },
      });

      // Get top label
      const topLabels = await prisma.yOLODetection.groupBy({
        by: ['label'],
        where: { userId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      });

      const topLabel = topLabels[0]?.label || newLabel;
      const topLabelCount = topLabels[0]?._count.id || labelCount;

      // Get unique labels count
      const uniqueLabels = await prisma.yOLODetection.groupBy({
        by: ['label'],
        where: { userId },
      });

      await prisma.detectionStats.update({
        where: { userId },
        data: {
          totalDetections: newTotal,
          uniqueLabels: uniqueLabels.length,
          topLabel,
          topLabelCount,
        },
      });
    }
  } catch (error) {
    console.error('  Error updating stats:', error);
  }
}

module.exports = router;
