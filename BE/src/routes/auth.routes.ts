const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ========================
// REGISTER
// ========================
router.post('/register', async (req, res) => {
  try {
    console.log(' REGISTER REQUEST BODY:', req.body);

    const { email, name, password } = req.body;

    // Validate input
    if (!email || !name || !password) {
      console.warn(' Missing required fields:', { email: !!email, name: !!name, password: !!password });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn(' Email already exists:', email);
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(' Password hashed successfully');

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'USER',
      },
    });
    console.log(' User created with ID:', user.id);

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        totalXP: user.totalXP || 0,
      },
      token,
    });
  } catch (error) {
    console.error(' REGISTER ERROR:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ========================
// LOGIN
// ========================
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 LOGIN REQUEST BODY:', req.body);

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.warn(' Missing email or password');
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(' User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(' Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);
    console.log(' Login successful for:', email);

    res.json({
      message: 'Login successful',
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      level: user.level,
      levelLocked: user.levelLocked || false,
      xp: user.totalXP,
      token,
    });
  } catch (error) {
    console.error(' LOGIN ERROR:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// ========================
// GET CURRENT USER
// ========================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        level: true,
        totalXP: true,
        currentStreak: true,
        lastCheckinDate: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ========================
// UPDATE USER LEVEL
// ========================
router.post('/update-level', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const { level } = req.body;
    if (!level) {
      return res.status(400).json({ error: 'Level is required' });
    }

    const validLevels = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER', 'ADVANCED'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    // Update user level in database
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { level, levelLocked: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        level: true,
        levelLocked: true,
        totalXP: true,
        currentStreak: true,
        avatar: true,
      },
    });

    res.json({
      message: 'Level updated successfully',
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update level' });
  }
});

// ========================
// SEED TEST USER (DEV ONLY)
// ========================
router.post('/seed-test-user', async (req, res) => {
  try {
    console.log('🌱 Seeding test user...');

    // Check if test user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (existingUser) {
      return res.json({
        message: 'Test user already exists',
        email: 'test@example.com',
        password: 'password123',
      });
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'USER',
        level: 'NEWBIE',
        levelLocked: true,
        totalXP: 0,
        currentStreak: 0,
      },
    });

    // Create user stats
    await prisma.userStats.create({
      data: {
        userId: user.id,
        trophy: 0,
        xp: 0,
      },
    });

    console.log(' Test user created:', user.email);

    res.json({
      message: 'Test user created successfully',
      email: 'test@example.com',
      password: 'password123',
      userId: user.id,
    });
  } catch (error) {
    console.error(' SEED ERROR:', error);
    res.status(500).json({ error: 'Failed to seed test user' });
  }
});

module.exports = router;
