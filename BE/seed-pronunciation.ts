import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding pronunciation vocabulary...');

  try {
    // First, ensure Topic exists
    let topic = await prisma.topic.findFirst({
      where: { name: 'Greeting' }
    });

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: 'Greeting',
          description: 'Basic greeting phrases'
        }
      });
      console.log('✅ Created Topic: Greeting');
    }

    // Check if data already exists
    const existingCount = await prisma.vocabulary.count({
      where: { level: 'NEWBIE' }
    });

    if (existingCount > 0) {
      console.log(`✅ NEWBIE vocabulary already exists (${existingCount} words)`);
      return;
    }

    // Seed NEWBIE vocabulary
    const newbieVocab = [
      {
        korean: '안녕하세요',
        vietnamese: 'Xin chào',
        english: 'Hello / Good day',
        romanization: 'An-nyeong-ha-se-yo',
        level: 'NEWBIE'
      },
      {
        korean: '감사합니다',
        vietnamese: 'Cảm ơn',
        english: 'Thank you',
        romanization: 'Gam-sa-ham-ni-da',
        level: 'NEWBIE'
      },
      {
        korean: '죄송합니다',
        vietnamese: 'Xin lỗi',
        english: 'Sorry',
        romanization: 'Jwoe-song-ham-ni-da',
        level: 'NEWBIE'
      },
      {
        korean: '네',
        vietnamese: 'Vâng',
        english: 'Yes',
        romanization: 'Ne',
        level: 'NEWBIE'
      },
      {
        korean: '아니요',
        vietnamese: 'Không',
        english: 'No',
        romanization: 'A-ni-yo',
        level: 'NEWBIE'
      },
      {
        korean: '좋아요',
        vietnamese: 'Tôi thích',
        english: 'I like it',
        romanization: 'Joa-yo',
        level: 'NEWBIE'
      },
      {
        korean: '물',
        vietnamese: 'Nước',
        english: 'Water',
        romanization: 'Mul',
        level: 'NEWBIE'
      },
      {
        korean: '밥',
        vietnamese: 'Cơm',
        english: 'Rice / Meal',
        romanization: 'Bap',
        level: 'NEWBIE'
      },
      {
        korean: '친구',
        vietnamese: 'Bạn',
        english: 'Friend',
        romanization: 'Chin-gu',
        level: 'NEWBIE'
      },
      {
        korean: '학교',
        vietnamese: 'Trường học',
        english: 'School',
        romanization: 'Hak-gyo',
        level: 'NEWBIE'
      },
    ];

    for (const vocab of newbieVocab) {
      await prisma.vocabulary.create({
        data: {
          korean: vocab.korean,
          vietnamese: vocab.vietnamese,
          english: vocab.english,
          romanization: vocab.romanization,
          level: vocab.level,
          topicId: topic.id,
          type: 'noun',
          isActive: true
        }
      });
    }

    console.log(`✅ Seeded ${newbieVocab.length} NEWBIE vocabulary words`);
    console.log('🎉 Seeding complete!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
