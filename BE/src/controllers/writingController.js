const {
  generateWritingTask,
  checkWriting,
  saveWritingResult,
  getUserWritingStats,
} = require("../services/writingService");

/**
 * Generate a new writing task
 * GET /api/writing/generate?level=BEGINNER&topic=greeting
 */
exports.generateTask = async (req, res) => {
  try {
    const { level = "BEGINNER", topic } = req.query;

    if (!topic) {
      return res.status(400).json({
        error: "Topic is required",
        example: "?level=BEGINNER&topic=greeting",
      });
    }

    const task = await generateWritingTask(level, topic, 3);

    res.json({
      success: true,
      task,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Generate task error:", error);
    res.status(500).json({
      error: "Failed to generate writing task",
      message: error.message,
    });
  }
};

/**
 * Check user's writing and provide feedback
 * POST /api/writing/check
 * Body: {
 *   userId: "user-uuid",
 *   userText: "Hello my name is...",
 *   topic: "greeting",
 *   level: "BEGINNER"
 * }
 */
exports.checkWriting = async (req, res) => {
  try {
    const { userId, userText, topic, level = "BEGINNER" } = req.body;

    if (!userText || !topic) {
      return res.status(400).json({
        error: "userText and topic are required",
      });
    }

    if (userText.trim().length < 3) {
      return res.status(400).json({
        error: "Please write at least 3 characters",
      });
    }

    // Check writing
    const checkResult = await checkWriting(userText, topic, level);

    // Save to database if userId provided
    if (userId) {
      const taskData = { topic, level };
      await saveWritingResult(userId, taskData, userText, checkResult);
    }

    res.json({
      success: true,
      result: checkResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Check writing error:", error);
    res.status(500).json({
      error: "Failed to check writing",
      message: error.message,
    });
  }
};

/**
 * Get user's writing statistics
 * GET /api/writing/stats
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const stats = await getUserWritingStats(userId);

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      error: "Failed to get statistics",
      message: error.message,
    });
  }
};

/**
 * Quick demo: Generate task + check writing in one call
 * POST /api/writing/demo
 * Body: {
 *   level: "BEGINNER",
 *   topic: "greeting",
 *   userText: "Hello my name is John"
 * }
 */
exports.demoWriting = async (req, res) => {
  try {
    const {
      level = "BEGINNER",
      topic = "greeting",
      userText = "Hello. My name is John.",
    } = req.body;

    // Generate task
    const task = await generateWritingTask(level, topic, 3);

    // Check writing
    const checkResult = await checkWriting(userText, topic, level);

    res.json({
      success: true,
      task,
      userText,
      checkResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Demo writing error:", error);
    res.status(500).json({
      error: "Failed to run demo",
      message: error.message,
    });
  }
};
