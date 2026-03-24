import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedGameData() {
  try {
    console.log('🌱 Starting game data seeding...\n');

    // Load seed data
    const seedDataPath = path.join(__dirname, '../data/gameSeeds.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

    // ===== SEED RANKS =====
    console.log('📊 Seeding Ranks...');
    for (const rank of seedData.ranks) {
      const existing = await prisma.rank.findUnique({
        where: { name: rank.name },
      });

      if (!existing) {
        await prisma.rank.create({
          data: {
            name: rank.name,
            minXp: rank.minXp,
            maxXp: rank.maxXp,
            order: rank.order,
          },
        });
        console.log(`  ✓ Created rank: ${rank.name}`);
      }
    }

    // ===== SEED DAILY QUESTS =====
    console.log('\n📋 Seeding Daily Quests...');
    for (const quest of seedData.dailyQuests) {
      const existing = await prisma.dailyQuest.findFirst({
        where: { title: quest.title },
      });

      if (!existing) {
        await prisma.dailyQuest.create({
          data: {
            title: quest.title,
            description: quest.description,
            type: quest.type,
            goal: quest.goal,
            rewardXp: quest.rewardXp,
            rewardTrophy: quest.rewardTrophy,
          },
        });
        console.log(`  ✓ Created quest: ${quest.title}`);
      }
    }

    // ===== SEED LEARNING PATHS =====
    console.log('\n📚 Seeding Learning Paths...');
    const levels = ['NEWBIE', 'BEGINNER'];
    
    for (const level of levels) {
      const pathName = `Duolingo Path ${level}`;
      const existing = await prisma.learningPath.findFirst({
        where: { name: pathName },
      });

      if (!existing) {
        const learningPath = await prisma.learningPath.create({
          data: {
            name: pathName,
            level: level,
            nodes: {
              create: generateNodesForLevel(level),
            },
          },
          include: {
            nodes: true,
          },
        });
        console.log(`  ✓ Created path: ${pathName} with ${learningPath.nodes.length} nodes`);
      }
    }

    // ===== SEED TOURNAMENT =====
    console.log('\n🏆 Seeding Tournament...');
    const existingTournament = await prisma.tournament.findFirst();
    if (!existingTournament) {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const tournament = await prisma.tournament.create({
        data: {
          name: 'Weekly Korean League 🏆',
          description: 'Tham gia giải đấu hàng tuần với các game thủ khác',
          startAt: now,
          endAt: endDate,
        },
      });
      console.log(`  ✓ Created tournament: ${tournament.name}`);
    }

    // ===== SEED LEAGUE =====
    console.log('\n⭐ Seeding League...');
    const existingLeague = await prisma.league.findFirst();
    if (!existingLeague) {
      const now = new Date();
      const nextMonday = new Date(now);
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()));
      
      const league = await prisma.league.create({
        data: {
          name: `Korean Masters - Week ${getWeekNumber(now)}`,
          startAt: now,
          endAt: nextMonday,
        },
      });
      console.log(`  ✓ Created league: ${league.name}`);
    }

    console.log('\n✅ Game data seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function generateNodesForLevel(level: string): any[] {
  const newbieNodes = [
    {
      title: '👋 Lời chào',
      description: 'Học cách chào hỏi trong tiếng Hàn',
      order: 1,
    },
    {
      title: '🔢 Con số',
      description: 'Học các con số từ 1-10',
      order: 2,
    },
    {
      title: '👨‍👩‍👧‍👦 Gia đình',
      description: 'Học tên các thành viên gia đình',
      order: 3,
    },
    {
      title: '🏠 Nơi ở',
      description: 'Học các địa điểm phổ biến',
      order: 4,
    },
    {
      title: '🍽️ Thức ăn',
      description: 'Học các tên đồ ăn',
      order: 5,
    },
  ];

  const beginnerNodes = [
    {
      title: '📚 Giáo dục',
      description: 'Học các từ liên quan đến trường học',
      order: 1,
    },
    {
      title: '☀️ Thời tiết',
      description: 'Học các từ về thời tiết',
      order: 2,
    },
    {
      title: '📖 Hành động',
      description: 'Học các động từ cơ bản',
      order: 3,
    },
    {
      title: '🎨 Tả thái',
      description: 'Học các tính từ miêu tả',
      order: 4,
    },
  ];

  return level === 'NEWBIE' ? newbieNodes : beginnerNodes;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

seedGameData();
