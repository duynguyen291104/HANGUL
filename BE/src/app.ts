const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { prisma } = require('./lib/prisma');
require('dotenv').config();

// Import module routes (new modular structure)
// Note: Using .default because modules export as ES6 but app.ts uses CommonJS require()
const authRouter = require('./modules/auth/auth.routes').default;
const userRouter = require('./modules/user/index').default;
const vocabularyRouter = require('./modules/vocabulary/index').default;
const quizRouter = require('./modules/quiz/index').default;
const pronunciationRouter = require('./modules/pronunciation/index').default;
const cameraRouter = require('./modules/camera/index').default;
const topicRouter = require('./modules/topic/index').default;
const writingRouter = require('./modules/writing/index').default;
const leaderboardRouter = require('./modules/leaderboard/index').default;
const achievementsRouter = require('./modules/achievements/index').default;
const learningPathRouter = require('./modules/learning-path/controller').default;

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store active connections
const tournamentPlayers = new Map();

// ========================
// SOCKET.IO EVENTS
// ========================
io.on('connection', (socket: any) => {
  console.log(`🎮 Tournament player connected: ${socket.id}`);

  // Join tournament room
  socket.on('tournament:join', (data: any) => {
    const { userId, name } = data;
    tournamentPlayers.set(userId, { socketId: socket.id, name });
    socket.join('tournament');
    console.log(`📍 ${name} joined tournament room`);
  });

  // When player scores updated
  socket.on('tournament:score-update', async (data: any) => {
    const { userId } = data;
    try {
      const updatedLeaderboard = await prisma.user.findMany({
        where: { totalTrophy: { gte: 1000 } },
        select: {
          id: true,
          name: true,
          avatar: true,
          totalTrophy: true,
          level: true,
          totalXP: true,
        },
        orderBy: [{ totalTrophy: 'desc' }, { totalXP: 'desc' }],
        take: 100,
      });
      const formatted = updatedLeaderboard.map((user: any, idx: number) => ({
        rank: idx + 1,
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        trophy: user.totalTrophy,
        level: user.level,
        xp: user.totalXP,
      }));
      io.to('tournament').emit('tournament:leaderboard-updated', formatted);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);
    for (let [userId, player] of tournamentPlayers) {
      if (player.socketId === socket.id) {
        tournamentPlayers.delete(userId);
        console.log(`🚪 ${player.name} left tournament`);
        break;
      }
    }
  });
});

// Export io for use in routes
module.exports.io = io;
// Allow multiple frontend URLs for development
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: function (origin: string | undefined, callback: any) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========================
// ROUTES
// ========================
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/user', authenticate, learningPathRouter);
app.use('/api/learning-path', authenticate, learningPathRouter);  // Add this for history endpoint
app.use('/api/user', authenticate, userRouter);
app.use('/api/vocabulary', authenticate, vocabularyRouter);
app.use('/api/quiz', quizRouter);  // Allow public access to GET /questions
app.use('/api/writing', authenticate, writingRouter);
app.use('/api/topic', authenticate, topicRouter);

// Semi-public routes (some endpoints public, some protected)
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/achievements', achievementsRouter);

// Camera detection route (requires authentication for saving)
app.use('/api/camera', authenticate, cameraRouter);

// Pronunciation route (public for testing)
app.use('/api/pronunciation', pronunciationRouter);

// ========================
// 404 HANDLER
// ========================
// @ts-ignore
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========================
// ERROR HANDLER (Must be last)
// ========================
app.use(errorHandler);

// ========================
// START SERVER
// ========================
server.listen(PORT, () => {
  console.log(` HANGUL Backend running on port ${PORT}`);
  console.log(`🎮 Socket.IO running for tournament`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
