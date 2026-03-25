import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedVocabulary() {
  console.log('🌱 Starting vocabulary seed from JSON files...');

  const dataDir = path.join(__dirname, '../data');
  let totalSeeded = 0;
  let totalSkipped = 0;
  const topicMap = new Map<string, number>();

  // Scan all level directories
  const levels = fs.readdirSync(dataDir);

  for (const level of levels) {
    const levelPath = path.join(dataDir, level);
    const stat = fs.statSync(levelPath);

    if (!stat.isDirectory()) continue;

    console.log(`\n📂 Processing level: ${level.toUpperCase()}`);

    // Scan all JSON files in the level directory
    const files = fs.readdirSync(levelPath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(levelPath, file);
      const topicName = file.replace('.json', '');

      console.log(`   📄 Reading ${file}...`);

      try {
        // Create or get topic
        let topicId: number;
        const topicKey = `${level}:${topicName}`;

        if (topicMap.has(topicKey)) {
          topicId = topicMap.get(topicKey)!;
        } else {
          const existingTopic = await prisma.topic.findFirst({
            where: {
              name: topicName,
              level: level.toUpperCase(),
            },
          });

          if (existingTopic) {
            topicId = existingTopic.id;
          } else {
            const newTopic = await prisma.topic.create({
              data: {
                name: topicName,
                level: level.toUpperCase(),
                description: `${topicName.charAt(0).toUpperCase() + topicName.slice(1)} vocabulary for ${level} level`,
              },
            });
            topicId = newTopic.id;
          }
          topicMap.set(topicKey, topicId);
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (!Array.isArray(data)) {
          console.warn(`   ⚠️  Skipping ${file} - not an array`);
          continue;
        }

        // Insert each vocabulary item
        for (const item of data) {
          try {
            // Check if word already exists
            const existing = await prisma.vocabulary.findFirst({
              where: {
                korean: item.korean,
                topicId: topicId,
              },
            });

            if (existing) {
              totalSkipped++;
              continue;
            }

            // Create the vocabulary entry
            const vocabData = await prisma.vocabulary.create({
              data: {
                korean: item.korean,
                english: item.english,
                vietnamese: item.vietnamese || item.english,
                romanization: item.romanization || '',
                type: item.type || 'noun',
                level: level.toUpperCase(),
                topicId: topicId,
                tags: item.tags || [topicName],
              },
            });

            // Create examples if they exist
            if (item.examples && Array.isArray(item.examples)) {
              for (const example of item.examples) {
                await prisma.vocabExample.create({
                  data: {
                    korean: example.korean,
                    english: example.english || '',
                    vietnamese: example.vietnamese || example.english || '',
                    vocabId: vocabData.id,
                  },
                });
              }
            }

            totalSeeded++;
          } catch (error) {
            console.warn(`   ⚠️  Error creating vocab "${item.korean}":`, (error as Error).message);
          }
        }

        console.log(`   ✅ Processed ${file} - found ${data.length} items`);
      } catch (error) {
        console.error(`   ❌ Error reading ${file}:`, error);
      }
    }
  }

  console.log('\n========================================');
  console.log(`📊 Seed Summary:`);
  console.log(`   ✅ Total seeded: ${totalSeeded}`);
  console.log(`   ⏭️  Total skipped (duplicates): ${totalSkipped}`);
  console.log(`   📈 Total in database: ${totalSeeded + totalSkipped}`);
  console.log('========================================\n');

  await prisma.$disconnect();
}

seedVocabulary().catch(error => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
