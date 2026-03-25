#!/usr/bin/env node

/**
 *  VOCABULARY MERGER & NORMALIZER
 * Merge all NEWBIE topics → merge & import to PostgreSQL
 * 
 * Usage: node scripts/mergeVocabulary.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function mergeVocabularyFiles() {
  console.log(' Starting vocabulary merge...\n');

  const baseDir = path.join(__dirname, '../data');
  const levels = ['newbie', 'beginner', 'intermediate'];
  const allFiles = [];

  // 1️⃣ Load & merge all JSON files from all levels
  console.log(`📂 Scanning levels: ${levels.join(', ')}\n`);
  
  for (const level of levels) {
    const levelDir = path.join(baseDir, level);
    if (!fs.existsSync(levelDir)) {
      console.log(`   ⏭️  ${level}: not found\n`);
      continue;
    }
    
    const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.json'));
    console.log(`   📂 ${level}:`);
    
    for (const file of files) {
      const filePath = path.join(levelDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`       ${file}: ${data.length} vocab`);
      allFiles.push(...data);
    }
  }

  // 2️⃣ Normalize & deduplicate
  console.log('\n Normalizing data...');
  const uniqueKorean = new Set();
  const normalized = [];

  for (const item of allFiles) {
    // Skip duplicates (by Korean text)
    if (uniqueKorean.has(item.korean)) {
      console.log(`     Duplicate: ${item.korean}`);
      continue;
    }
    
    uniqueKorean.add(item.korean);
    
    // Normalize structure
    normalized.push({
      korean: item.korean.trim(),
      english: item.english.trim(),
      vietnamese: item.vietnamese.trim(),
      romanization: item.romanization.trim(),
      type: item.type || 'noun',
      level: item.level || 'NEWBIE',
      topic: item.topic || 'general',
      difficulty: item.difficulty || 1,
      frequency: item.frequency || 'medium',
    });
  }

  console.log(` Normalized: ${normalized.length} items (removed ${allFiles.length - normalized.length} duplicates)\n`);

  // 3️⃣ Import to database
  console.log('💾 Importing to PostgreSQL...\n');

  let imported = 0;
  let skipped = 0;

  for (const vocab of normalized) {
    try {
      // Get or create topic
      let topic = await prisma.topic.findFirst({
        where: { name: vocab.topic, level: vocab.level }
      });

      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            name: vocab.topic,
            description: `Learn about ${vocab.topic}`,
            level: vocab.level,
            order: 0,
          }
        });
        console.log(`  ➕ Created topic: ${vocab.topic}`);
      }

      // Check if vocab already exists
      const existing = await prisma.vocabulary.findFirst({
        where: {
          korean: vocab.korean,
          topicId: topic.id
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create vocabulary
      await prisma.vocabulary.create({
        data: {
          korean: vocab.korean,
          english: vocab.english,
          vietnamese: vocab.vietnamese,
          romanization: vocab.romanization,
          type: vocab.type,
          level: vocab.level,
          topicId: topic.id,
        }
      });

      imported++;

      if (imported % 20 === 0) {
        console.log(`   ${imported} vocab imported...`);
      }

    } catch (error) {
      console.error(` Error importing "${vocab.korean}":`, error.message);
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`    Imported: ${imported}`);
  console.log(`   ⏭️  Skipped (existing): ${skipped}`);
  console.log(`    Total: ${imported + skipped}\n`);

  // 4️⃣ Verify
  const totalVocab = await prisma.vocabulary.count();
  const totalTopics = await prisma.topic.count();

  console.log(' Database stats:');
  console.log(`    Total vocabulary: ${totalVocab}`);
  console.log(`   🏷️  Total topics: ${totalTopics}`);

  const topicStats = await prisma.topic.findMany({
    select: {
      name: true,
      level: true,
      _count: { select: { vocabulary: true } }
    }
  });

  console.log('\n📋 Topics breakdown:');
  for (const t of topicStats) {
    console.log(`   ${t.name} (${t.level}): ${t._count.vocabulary} vocab`);
  }

  await prisma.$disconnect();
  console.log('\n✨ Done! Database ready to use.\n');
}

// Run
mergeVocabularyFiles().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
