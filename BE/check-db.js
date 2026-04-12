const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const users = await prisma.user.count();
    const topics = await prisma.topic.count();
    const questions = await prisma.question.count();
    const sessions = await prisma.quizSession.count();

    console.log('\n📊 Database Summary:');
    console.log(`  Users: ${users}`);
    console.log(`  Topics: ${topics}`);
    console.log(`  Questions: ${questions}`);
    console.log(`  Quiz Sessions: ${sessions}`);

    if (topics > 0) {
      const topicList = await prisma.topic.findMany({ select: { id: true, name: true, level: true } });
      console.log('\n📚 Topics:');
      topicList.forEach(t => console.log(`  - [${t.level}] ${t.name}`));
    }

    if (questions > 0) {
      const qList = await prisma.question.findMany({ 
        select: { id: true, questionText: true, topicId: true },
        take: 5
      });
      console.log('\n❓ Questions (first 5):');
      qList.forEach(q => console.log(`  - [Topic ${q.topicId}] ${q.questionText.substring(0, 50)}...`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
