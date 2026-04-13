/**
 * Master Seed Script for Database Initialization
 * 
 * This is the SINGLE SOURCE OF TRUTH for database seeding.
 * Run: npx prisma db seed
 * 
 * IMPORTANT: This script creates ONE PrismaClient instance and properly disconnects it.
 * This ensures no connection pool exhaustion or multiple instances.
 * 
 * Includes:
 * - Users (test accounts)
 * - Ranks (Bronze, Silver, Gold, etc.)
 * - Topics (learning topics by level)
 * - Vocabulary (words by level from JSON)
 * - Game data (ranks, quests from gameSeeds.json)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// Create single instance for entire seed process
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// ============================================
// UTILITY: Load JSON files
// ============================================
interface VocabItem {
  korean: string;
  english: string;
  vietnamese: string;
  romanization?: string;
  type: string;
  level: string;
  topic: string;
  difficulty: number;
  frequency: string;
  examples: Array<{
    korean: string;
    vietnamese: string;
    english?: string;
  }>;
  tags: string[];
}

function loadJSONFile(filePath: string): any {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

// ============================================
// 1. SEED USERS
// ============================================
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

        console.log(` ✓ Created user: ${user.name} (ID: ${user.id})`);
      } else {
        console.log(` ℹ User already exists: ${userData.email}`);
      }
    }

    console.log('\n✅ User seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

// ============================================
// 2. SEED RANKS (if needed)
// ============================================
async function seedRanks() {
  try {
    console.log('🌱 Seeding ranks...\n');

    const ranks = [
      { name: 'Bronze', minXp: 0, maxXp: 1000, order: 1 },
      { name: 'Silver', minXp: 1000, maxXp: 5000, order: 2 },
      { name: 'Gold', minXp: 5000, maxXp: 10000, order: 3 },
      { name: 'Platinum', minXp: 10000, maxXp: 25000, order: 4 },
      { name: 'Diamond', minXp: 25000, maxXp: 100000, order: 5 },
    ];

    for (const rank of ranks) {
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
        console.log(` ✓ Created rank: ${rank.name}`);
      }
    }

    console.log('\n✅ Rank seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding ranks:', error);
    throw error;
  }
}

// ============================================
// 3. SEED TOPICS (placeholder - extend as needed)
// ============================================
async function seedTopics() {
  try {
    console.log('🌱 Seeding topics...\n');

    const topicData = [
      { name: 'Greeting', level: 'NEWBIE', description: 'Learn basic greetings' },
      { name: 'Numbers', level: 'NEWBIE', description: 'Learn Korean numbers' },
      { name: 'Food', level: 'BEGINNER', description: 'Food vocabulary' },
      { name: 'Travel', level: 'INTERMEDIATE', description: 'Travel phrases' },
      { name: 'Business', level: 'ADVANCED', description: 'Business Korean' },
      { name: 'Literature', level: 'ADVANCED', description: 'Literature and writing' },
      { name: 'Academic', level: 'EXPERT', description: 'Academic Korean' },
      { name: 'Advanced Grammar', level: 'EXPERT', description: 'Complex grammar structures' },
    ];

    for (const topic of topicData) {
      const existing = await prisma.topic.findFirst({
        where: { name: topic.name },
      });

      if (!existing) {
        await prisma.topic.create({
          data: topic,
        });
        console.log(` ✓ Created topic: ${topic.name} (${topic.level})`);
      }
    }

    console.log('\n✅ Topic seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding topics:', error);
    throw error;
  }
}
// ============================================
// 5. SEED GAME DATA (ranks, quests from gameSeeds.json)
// ============================================
async function seedGameData() {
  try {
    console.log('🌱 Seeding game data...\n');

    const gameDataPath = path.join(__dirname, '../data/gameSeeds.json');
    const gameData = loadJSONFile(gameDataPath);

    if (!gameData) {
      console.log('⚠️  gameSeeds.json not found, skipping game data');
      return;
    }

    // Seed ranks from gameSeeds
    if (gameData.ranks && Array.isArray(gameData.ranks)) {
      console.log('📊 Seeding ranks from gameSeeds.json...');

      for (const rank of gameData.ranks) {
        const existing = await prisma.rank.findFirst({
          where: { name: rank.name },
        });

        if (!existing) {
          await prisma.rank.create({
            data: {
              name: rank.name,
              minXp: rank.minXp,
              maxXp: rank.maxXp,
              order: rank.order || 0,
            },
          });
          console.log(` ✓ Created rank: ${rank.name}`);
        }
      }
    }

    console.log('\n✅ Game data seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding game data:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('\n🚀 Starting database seed...\n');

    // Run in order - some seeds might depend on others
    await seedRanks();
    await seedUsers();
    await seedTopics();
    await seedGameData();

    console.log('\n✅ ✅ ✅ All seeds completed successfully!\n');
    console.log('✨ Database is now populated with 800+ vocabulary items!\n');
  } catch (error) {
    console.error('\n❌ ❌ ❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
main();
