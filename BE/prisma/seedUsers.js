const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Seeding test users...\n');

    const testUsers = [
      { email: 'demo@example.com', password: 'password123', name: 'Demo User' },
      { email: 'tuheo@gmail.com', password: 'password123', name: 'Tu Heo' },
      { email: 'user3@example.com', password: 'password123', name: 'User Three' },
      { email: 'user4@example.com', password: 'password123', name: 'User Four' },
      { email: 'user5@example.com', password: 'password123', name: 'User Five' },
      { email: 'user6@example.com', password: 'password123', name: 'User Six' },
    ];

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            level: 'NEWBIE',
          },
        });

        // Create initial stats
        await prisma.userStats.create({
          data: {
            userId: user.id,
            xp: 0,
            trophy: 0,
          },
        });

        // Create initial rank (Bronze)
        const bronzeRank = await prisma.rank.findFirst({
          where: { name: 'Bronze' },
        });

        if (bronzeRank) {
          await prisma.userRank.create({
            data: {
              userId: user.id,
              rankId: bronzeRank.id,
            },
          });
        }

        // Create daily quests for user
        const quests = await prisma.dailyQuest.findMany();
        for (const quest of quests) {
          await prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              progress: 0,
              completed: false,
            },
          });
        }

        console.log(` Created user: ${user.name} (ID: ${user.id})`);
      } else {
        console.log(` User already exists: ${userData.email}`);
      }
    }

    console.log('\n User seeding completed!\n');
  } catch (error) {
    console.error(' Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
