// Quick script to seed a test user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedTestUser() {
  try {
    // Check if test user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (existingUser) {
      console.log('✓ Test user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        level: 'NEWBIE',
        totalXP: 0,
        currentStreak: 0,
      },
    });

    console.log('✓ Test user created successfully!');
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: password123`);
    console.log(`  User ID: ${user.id}`);

  } catch (error) {
    console.error('Error seeding test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUser();
