import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface VocabData {
  korean: string;
  vietnamese: string;
  english: string;
  romanization?: string;
  type: string;
  tags: string[];
  level: string;
  topicName: string;
  examples: Array<{
    korean: string;
    vietnamese: string;
    english?: string;
  }>;
}

async function seedVocabulary() {
  try {
    console.log(' Starting vocabulary seed...');

    // Read vocabulary data
    const dataPath = path.join(__dirname, '../data/vocabularies.json');
    const vocabDataRaw = fs.readFileSync(dataPath, 'utf-8');
    const vocabData: VocabData[] = JSON.parse(vocabDataRaw);

    console.log(`📖 Found ${vocabData.length} vocabularies to import`);

    // Get or create topics
    const topicNames = [...new Set(vocabData.map((v) => v.topicName))];
    const topics: { [key: string]: any } = {};

    for (const topicName of topicNames) {
      let topic = await prisma.topic.findFirst({
        where: { name: topicName },
      });

      if (!topic) {
        // Find the level from vocab with this topic
        const vocabWithTopic = vocabData.find((v) => v.topicName === topicName);
        topic = await prisma.topic.create({
          data: {
            name: topicName,
            description: `Learn about ${topicName}`,
            level: vocabWithTopic?.level || 'NEWBIE',
            order: topicNames.indexOf(topicName),
          },
        });
        console.log(` Created topic: ${topicName}`);
      }
      topics[topicName] = topic;
    }

    // Import vocabularies
    let successCount = 0;
    for (const vocab of vocabData) {
      try {
        const topic = topics[vocab.topicName];

        // Check if vocab already exists
        const existing = await prisma.vocabulary.findFirst({
          where: {
            korean: vocab.korean,
          },
        });

        if (existing) {
          console.log(`⏭️  Skipping ${vocab.korean} (already exists)`);
          continue;
        }

        // Create vocabulary with examples
        await prisma.vocabulary.create({
          data: {
            korean: vocab.korean,
            vietnamese: vocab.vietnamese,
            english: vocab.english,
            romanization: vocab.romanization || '',
            type: vocab.type,
            tags: vocab.tags,
            level: vocab.level,
            topicId: topic.id,
            examples: {
              create: vocab.examples.map((ex) => ({
                korean: ex.korean,
                vietnamese: ex.vietnamese,
                english: ex.english || '',
              })),
            },
          },
        });

        successCount++;
        if (successCount % 10 === 0) {
          console.log(` Created ${successCount} vocabularies...`);
        }
      } catch (error) {
        console.error(` Error importing ${vocab.korean}:`, error);
      }
    }

    console.log(`\n🎉 Successfully imported ${successCount} vocabularies!`);

    // Show stats
    const totalVocab = await prisma.vocabulary.count();
    const totalTopics = await prisma.topic.count();
    const totalExamples = await prisma.vocabExample.count();

    console.log(`\n Database Stats:`);
    console.log(`   - Total Vocabularies: ${totalVocab}`);
    console.log(`   - Total Topics: ${totalTopics}`);
    console.log(`   - Total Examples: ${totalExamples}`);
  } catch (error) {
    console.error(' Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedVocabulary();
