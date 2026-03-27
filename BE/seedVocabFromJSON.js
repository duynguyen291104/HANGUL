const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedVocabulary() {
  console.log('🌱 Seeding vocabulary from JSON files...');

  const dataDir = './data';
  let totalVocab = 0;

  // Seed NEWBIE level
  const newbieDir = path.join(dataDir, 'newbie');
  for (const file of fs.readdirSync(newbieDir)) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(newbieDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const topicName = file.replace('.json', '');
    
    // Create or find topic
    let topic = await prisma.topic.findFirst({
      where: { name: topicName }
    });
    
    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: topicName,
          level: 'NEWBIE'
        }
      });
    }
    
    for (const word of data) {
      await prisma.vocabulary.create({
        data: {
          korean: word.korean || word.word,
          vietnamese: word.vietnamese || word.meaning,
          english: word.english || '',
          romanization: word.romanization || '',
          level: 'NEWBIE',
          type: 'WORD',
          topicId: topic.id,
          isActive: true
        }
      });
      totalVocab++;
    }
    console.log(`✅ Seeded ${data.length} words from newbie/${file}`);
  }

  // Seed BEGINNER level
  const beginnerDir = path.join(dataDir, 'beginner');
  for (const file of fs.readdirSync(beginnerDir)) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(beginnerDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const topicName = file.replace('.json', '');
    
    // Create or find topic
    let topic = await prisma.topic.findFirst({
      where: { name: topicName }
    });
    
    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: topicName,
          level: 'BEGINNER'
        }
      });
    }
    
    for (const word of data) {
      await prisma.vocabulary.create({
        data: {
          korean: word.korean || word.word,
          vietnamese: word.vietnamese || word.meaning,
          english: word.english || '',
          romanization: word.romanization || '',
          level: 'BEGINNER',
          type: 'WORD',
          topicId: topic.id,
          isActive: true
        }
      });
      totalVocab++;
    }
    console.log(`✅ Seeded ${data.length} words from beginner/${file}`);
  }

  console.log(`\n✅ Total vocabulary seeded: ${totalVocab}`);
  await prisma.$disconnect();
}

seedVocabulary().catch(error => {
  console.error('Seed error:', error);
  process.exit(1);
});
