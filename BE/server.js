const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Import Services
const quizService = require('./src/services/quizService');
const vocabularyService = require('./src/services/vocabularyService');
const userService = require('./src/services/userService');
const leaderboardService = require('./src/services/leaderboardService');
const achievementService = require('./src/services/achievementService');
const registerGameAPIs = require('./src/apis/gameAPIs');
const writingRoutes = require('./src/routes/writingRoutes');
const { setPrisma: setWritingPrisma } = require('./src/services/writingService');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Initialize writing service with prisma
setWritingPrisma(prisma);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Simple Auth Middleware (extracts userId from token or header)
const authenticate = (req, res, next) => {
  // Try to get userId from multiple sources
  let userId = req.headers['x-user-id'] || req.body.userId;
  
  // Try to parse from token (format: demo-token-{userId})
  if (!userId && req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    const match = token?.match(/demo-token-(\d+)/);
    if (match) {
      userId = match[1];
    }
  }
  
  // Default to 1 for demo
  userId = userId || 1;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  req.userId = parseInt(userId);
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HANGUL Backend API',
    version: '0.1.0',
  });
});

// ==================== AUTH ENDPOINTS ====================
// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const user = await userService.createUser({
      email,
      password,
      fullName: fullName || email.split('@')[0],
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Get user by email
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password (simple check for demo)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Return user data with token (JWT in production)
    res.json({
      message: 'Login successful',
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      level: user.level,
      xp: user.xp,
      token: `demo-token-${user.id}`, // In production use JWT
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await userService.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: 'USER',
      level: user.level,
      totalXP: user.xp,
      currentStreak: user.currentStreak || 0,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

// Update user level
app.post('/api/auth/update-level', authenticate, async (req, res) => {
  try {
    const { level } = req.body;
    
    if (!level) {
      return res.status(400).json({ error: 'Level is required' });
    }
    
    const validLevels = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER', 'ADVANCED'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }
    
    // Update user level
    const user = await userService.updateUserLevel(req.userId, level);
    
    res.json({
      message: 'Level updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: 'USER',
        level: user.level,
        totalXP: user.xp,
      },
    });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ error: error.message || 'Failed to update level' });
  }
});

// ==================== QUIZ ENDPOINTS ====================
app.post('/api/quiz/start', authenticate, async (req, res) => {
  try {
    const { level = 'BEGINNER', count = 10 } = req.body;
    
    // Create quiz session
    const session = await quizService.createQuizSession(req.userId);
    
    // Get questions
    const questions = await quizService.getQuizQuestions(level, count);
    
    res.json({
      sessionId: session.id,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        difficulty: q.difficulty,
        options: q.options,
        // Don't send correct answer to frontend
      })),
      message: 'Quiz session started'
    });
  } catch (error) {
    console.error('Quiz start error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quiz/answer', authenticate, async (req, res) => {
  try {
    const { sessionId, questionId, userAnswer } = req.body;
    
    if (!sessionId || !questionId || userAnswer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await quizService.submitQuizAnswer(sessionId, questionId, userAnswer);
    
    res.json({
      isCorrect: result.isCorrect,
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
      xpEarned: result.isCorrect ? 10 : 0
    });
  } catch (error) {
    console.error('Quiz answer error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quiz/end/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await quizService.completeQuizSession(sessionId);
    
    // Award XP to user
    const xpEarned = Math.floor((session.correctAnswers / session.totalQuestions) * 100);
    await userService.updateUserXP(req.userId, xpEarned);
    
    // Check for achievement unlocks
    await achievementService.checkAndAwardAchievements(req.userId);
    
    res.json({
      sessionId: session.id,
      score: ((session.correctAnswers / session.totalQuestions) * 100).toFixed(2),
      correctAnswers: session.correctAnswers,
      totalQuestions: session.totalQuestions,
      xpEarned
    });
  } catch (error) {
    console.error('Quiz end error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quiz/history', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const history = await quizService.getUserQuizHistory(req.userId, parseInt(limit));
    
    res.json({
      sessions: history,
      total: history.length
    });
  } catch (error) {
    console.error('Quiz history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== VOCABULARY ENDPOINTS ====================
app.get('/api/vocabulary', authenticate, async (req, res) => {
  try {
    const { level, topic, page = 1, limit = 20 } = req.query;
    
    const vocab = await vocabularyService.getVocabulary({
      level,
      topicId: topic ? parseInt(topic) : null,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      vocabulary: vocab,
      page: parseInt(page),
      limit: parseInt(limit),
      total: vocab.length
    });
  } catch (error) {
    console.error('Vocabulary fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vocabulary/topics', authenticate, async (req, res) => {
  try {
    const topics = await vocabularyService.getAllTopics();
    
    res.json({
      topics,
      total: topics.length
    });
  } catch (error) {
    console.error('Topics fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vocabulary/by-level/:level', authenticate, async (req, res) => {
  try {
    const { level } = req.params;
    const vocab = await vocabularyService.getVocabularyByLevel(level);
    
    res.json({
      vocabulary: vocab,
      level,
      total: vocab.length
    });
  } catch (error) {
    console.error('Vocabulary by level error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vocabulary/learn', authenticate, async (req, res) => {
  try {
    const { vocabId } = req.body;
    
    if (!vocabId) {
      return res.status(400).json({ error: 'vocabId is required' });
    }
    
    const result = await vocabularyService.addToUserLearning(req.userId, vocabId);
    
    res.json({
      message: 'Vocabulary added to learning list',
      isNew: result.count === 1
    });
  } catch (error) {
    console.error('Add vocabulary error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vocabulary/my-list', authenticate, async (req, res) => {
  try {
    const userVocab = await vocabularyService.getUserVocabulary(req.userId);
    const stats = await vocabularyService.getVocabularyStats(req.userId);
    
    res.json({
      vocabulary: userVocab,
      stats,
      total: userVocab.length
    });
  } catch (error) {
    console.error('User vocabulary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER PROFILE ENDPOINTS ====================
app.get('/api/user/profile/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await userService.getUserProfile(parseInt(userId));
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/profile', authenticate, async (req, res) => {
  try {
    const profile = await userService.getUserProfile(req.userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (email) updates.email = email;
    
    const updatedUser = await userService.updateUserProfile(req.userId, updates);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/xp', authenticate, async (req, res) => {
  try {
    const { xpAmount } = req.body;
    
    if (!xpAmount || xpAmount <= 0) {
      return res.status(400).json({ error: 'Valid xpAmount is required' });
    }
    
    const updatedUser = await userService.updateUserXP(req.userId, xpAmount);
    
    res.json({
      message: 'XP updated',
      user: updatedUser
    });
  } catch (error) {
    console.error('XP update error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/streak', authenticate, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ error: 'isActive is required' });
    }
    
    const updatedUser = await userService.updateUserStreak(req.userId, isActive);
    
    res.json({
      message: 'Streak updated',
      user: updatedUser
    });
  } catch (error) {
    console.error('Streak update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEADERBOARD ENDPOINTS ====================
app.get('/api/leaderboard/top', authenticate, async (req, res) => {
  try {
    const { level, limit = 50 } = req.query;
    const users = await leaderboardService.getTopUsers({
      level: level || null,
      limit: parseInt(limit),
      timeframe: 'all'
    });
    
    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard/weekly', authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const users = await leaderboardService.getWeeklyLeaderboard(parseInt(limit));
    
    res.json({
      users,
      period: 'weekly',
      total: users.length
    });
  } catch (error) {
    console.error('Weekly leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard/monthly', authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const users = await leaderboardService.getMonthlyLeaderboard(parseInt(limit));
    
    res.json({
      users,
      period: 'monthly',
      total: users.length
    });
  } catch (error) {
    console.error('Monthly leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard/rank/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const rank = await leaderboardService.getUserRank(parseInt(userId));
    
    res.json(rank);
  } catch (error) {
    console.error('User rank error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard/nearby', authenticate, async (req, res) => {
  try {
    const { range = 10 } = req.query;
    const nearby = await leaderboardService.getNearbyUsers(req.userId, parseInt(range));
    
    res.json({
      users: nearby,
      range: parseInt(range)
    });
  } catch (error) {
    console.error('Nearby users error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard/stats', authenticate, async (req, res) => {
  try {
    const stats = await leaderboardService.getLeaderboardStats();
    
    res.json(stats);
  } catch (error) {
    console.error('Leaderboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACHIEVEMENT ENDPOINTS ====================
app.get('/api/achievements', authenticate, async (req, res) => {
  try {
    const achievements = await achievementService.getAllAchievements();
    
    res.json({
      achievements,
      total: achievements.length
    });
  } catch (error) {
    console.error('Achievements fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/achievements/unlocked', authenticate, async (req, res) => {
  try {
    const achievements = await achievementService.getUserUnlockedAchievements(req.userId);
    
    res.json({
      achievements,
      total: achievements.length
    });
  } catch (error) {
    console.error('Unlocked achievements error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/achievements/progress', authenticate, async (req, res) => {
  try {
    const progress = await achievementService.getUserAchievementProgress(req.userId);
    
    res.json({
      progress,
      total: progress.length
    });
  } catch (error) {
    console.error('Achievement progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/achievements/check', authenticate, async (req, res) => {
  try {
    const result = await achievementService.checkAndAwardAchievements(req.userId);
    
    res.json({
      newlyUnlocked: result,
      message: `${result.length} achievement(s) unlocked!`
    });
  } catch (error) {
    console.error('Achievement check error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/achievements/stats', authenticate, async (req, res) => {
  try {
    const stats = await achievementService.getAchievementStats();
    
    res.json(stats);
  } catch (error) {
    console.error('Achievement stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 Handler
// ==================== VOCABULARY ENDPOINTS ====================
app.get('/api/vocabulary', async (req, res) => {
  try {
    const { level, topicId, limit = 20, page = 1 } = req.query;

    const where = { isActive: true };
    if (level) where.level = level;
    if (topicId) where.topicId = parseInt(topicId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vocabularies, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        include: {
          examples: true,
          topic: {
            select: { id: true, name: true, level: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vocabulary.count({ where }),
    ]);

    res.json({
      data: vocabularies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching vocabularies:', error);
    res.status(500).json({ error: 'Failed to fetch vocabularies' });
  }
});

// Get vocabulary by ID
app.get('/api/vocabulary/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: parseInt(id) },
      include: {
        examples: true,
        topic: {
          select: { id: true, name: true, level: true },
        },
      },
    });

    if (!vocabulary) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// Get vocabularies by topic
app.get('/api/topics/:topicId/vocabulary', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vocabularies, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where: {
          topicId: parseInt(topicId),
          isActive: true,
        },
        include: {
          examples: true,
          topic: {
            select: { id: true, name: true, level: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'asc' },
      }),
      prisma.vocabulary.count({
        where: {
          topicId: parseInt(topicId),
          isActive: true,
        },
      }),
    ]);

    res.json({
      data: vocabularies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching topic vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// Get topics with vocabulary count
app.get('/api/topics', async (req, res) => {
  try {
    const { level } = req.query;

    const where = level ? { level } : {};

    const topics = await prisma.topic.findMany({
      where,
      include: {
        _count: {
          select: { vocabulary: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    res.json(
      topics.map((topic) => ({
        ...topic,
        vocabularyCount: topic._count.vocabulary,
        _count: undefined,
      }))
    );
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// ========================
// REGISTER GAME APIs
// ========================
registerGameAPIs(app, prisma, authenticate);

// ========================
// REGISTER WRITING APIs
// ========================
app.use('/api/writing', writingRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(` HANGUL Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Ready to accept connections!`);
});

module.exports = app;
