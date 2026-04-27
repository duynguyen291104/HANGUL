// Database Seeding Script - Populate with development data
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const koreanVocabulary = [
  // Topics and Vocabulary Data
  {
    topic: { name: 'Greetings', level: 'NEWBIE' },
    items: [
      { korean: '안녕하세요', english: 'Hello (formal)', romanization: 'annyeonghaseyo', level: 'NEWBIE' },
      { korean: '안녕', english: 'Hello (informal)', romanization: 'annyeong', level: 'NEWBIE' },
      { korean: '감사합니다', english: 'Thank you (formal)', romanization: 'gamsa-hamnida', level: 'NEWBIE' },
      { korean: '고마워', english: 'Thank you (informal)', romanization: 'gomawo', level: 'NEWBIE' },
      { korean: '좋은 아침입니다', english: 'Good morning', romanization: 'joheun achim-imnida', level: 'NEWBIE' },
      { korean: '좋은 밤입니다', english: 'Good night', romanization: 'joheun bam-imnida', level: 'NEWBIE' },
    ],
  },
  {
    topic: { name: 'Numbers', level: 'NEWBIE' },
    items: [
      { korean: '하나', english: 'One', romanization: 'hana', level: 'NEWBIE' },
      { korean: '둘', english: 'Two', romanization: 'dul', level: 'NEWBIE' },
      { korean: '셋', english: 'Three', romanization: 'set', level: 'NEWBIE' },
      { korean: '넷', english: 'Four', romanization: 'net', level: 'NEWBIE' },
      { korean: '다섯', english: 'Five', romanization: 'daseot', level: 'NEWBIE' },
      { korean: '여섯', english: 'Six', romanization: 'yeoseot', level: 'NEWBIE' },
      { korean: '일곱', english: 'Seven', romanization: 'ilgop', level: 'NEWBIE' },
      { korean: '여덟', english: 'Eight', romanization: 'yeodeol', level: 'NEWBIE' },
      { korean: '아홉', english: 'Nine', romanization: 'ahop', level: 'NEWBIE' },
      { korean: '열', english: 'Ten', romanization: 'yeol', level: 'NEWBIE' },
    ],
  },
  {
    topic: { name: 'Family', level: 'BEGINNER' },
    items: [
      { korean: '엄마', english: 'Mother', romanization: 'eomma', level: 'BEGINNER' },
      { korean: '아버지', english: 'Father', romanization: 'abeoji', level: 'BEGINNER' },
      { korean: '형', english: 'Older brother', romanization: 'hyeong', level: 'BEGINNER' },
      { korean: '누나', english: 'Older sister', romanization: 'nuna', level: 'BEGINNER' },
      { korean: '동생', english: 'Younger sibling', romanization: 'dongsaeng', level: 'BEGINNER' },
      { korean: '할머니', english: 'Grandmother', romanization: 'halmeoni', level: 'BEGINNER' },
      { korean: '할아버지', english: 'Grandfather', romanization: 'harabeoji', level: 'BEGINNER' },
    ],
  },
  {
    topic: { name: 'Food', level: 'INTERMEDIATE' },
    items: [
      { korean: '밥', english: 'Rice', romanization: 'bap', level: 'INTERMEDIATE' },
      { korean: '국', english: 'Soup', romanization: 'guk', level: 'INTERMEDIATE' },
      { korean: '김밥', english: 'Kimbap', romanization: 'gimbap', level: 'INTERMEDIATE' },
      { korean: '불고기', english: 'Bulgogi', romanization: 'bulgogi', level: 'INTERMEDIATE' },
      { korean: '비빔밥', english: 'Bibimbap', romanization: 'bibimbap', level: 'INTERMEDIATE' },
      { korean: '라면', english: 'Ramen', romanization: 'ramyeon', level: 'INTERMEDIATE' },
    ],
  },
  {
    topic: { name: 'Colors', level: 'BEGINNER' },
    items: [
      { korean: '빨간색', english: 'Red', romanization: 'ppalgan-saek', level: 'BEGINNER' },
      { korean: '파란색', english: 'Blue', romanization: 'paran-saek', level: 'BEGINNER' },
      { korean: '노란색', english: 'Yellow', romanization: 'noran-saek', level: 'BEGINNER' },
      { korean: '초록색', english: 'Green', romanization: 'choroksaek', level: 'BEGINNER' },
      { korean: '검은색', english: 'Black', romanization: 'geomeun-saek', level: 'BEGINNER' },
      { korean: '흰색', english: 'White', romanization: 'huinsaek', level: 'BEGINNER' },
    ],
  },
];

const quizQuestions = [
  // NEWBIE level
  { korean: '안녕하세요', english: 'Hello', difficulty: 'NEWBIE', topicId: 1, options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'] },
  { korean: '감사합니다', english: 'Thank you', difficulty: 'NEWBIE', topicId: 1, options: ['Hello', 'Thank you', 'Sorry', 'Goodbye'] },
  { korean: '하나', english: 'One', difficulty: 'NEWBIE', topicId: 2, options: ['One', 'Two', 'Three', 'Four'] },
  { korean: '둘', english: 'Two', difficulty: 'NEWBIE', topicId: 2, options: ['One', 'Two', 'Three', 'Four'] },
  { korean: '셋', english: 'Three', difficulty: 'NEWBIE', topicId: 2, options: ['One', 'Two', 'Three', 'Four'] },
  // BEGINNER level
  { korean: '엄마', english: 'Mother', difficulty: 'BEGINNER', topicId: 3, options: ['Mother', 'Father', 'Sister', 'Brother'] },
  { korean: '아버지', english: 'Father', difficulty: 'BEGINNER', topicId: 3, options: ['Mother', 'Father', 'Sister', 'Brother'] },
  { korean: '빨간색', english: 'Red', difficulty: 'BEGINNER', topicId: 5, options: ['Red', 'Blue', 'Yellow', 'Green'] },
  // INTERMEDIATE level
  { korean: '밥', english: 'Rice', difficulty: 'INTERMEDIATE', topicId: 4, options: ['Rice', 'Soup', 'Bread', 'Noodles'] },
  { korean: '불고기', english: 'Bulgogi', difficulty: 'INTERMEDIATE', topicId: 4, options: ['Bulgogi', 'Ramen', 'Soup', 'Rice'] },
];

const achievements = [
  { name: 'First Quiz', description: 'Complete your first quiz', criteria: 'completedQuizzes >= 1' },
  { name: 'Quiz Master', description: 'Complete 10 quizzes', criteria: 'completedQuizzes >= 10' },
  { name: 'Vocab Expert', description: 'Learn 50 vocabulary items', criteria: 'learnedVocab >= 50' },
  { name: 'Thousand XP', description: 'Earn 1000 XP total', criteria: 'totalXP >= 1000' },
  { name: 'Perfect Score', description: 'Get a perfect score in a quiz', criteria: 'perfectScore = true' },
  { name: '7-Day Streak', description: 'Maintain a 7-day learning streak', criteria: 'currentStreak >= 7' },
  { name: 'Beginner', description: 'Reach Beginner level', criteria: 'level = BEGINNER' },
  { name: 'Intermediate', description: 'Reach Intermediate level', criteria: 'level = INTERMEDIATE' },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional)
    console.log('Clearing existing data...');
    await prisma.quizAnswer.deleteMany({});
    await prisma.quizSession.deleteMany({});
    await prisma.handwritingAttempt.deleteMany({});
    await prisma.handwritingExercise.deleteMany({});
    await prisma.pronunciationAttempt.deleteMany({});
    await prisma.pronunciationWord.deleteMany({});
    await prisma.listeningAttempt.deleteMany({});
    await prisma.listeningQuestion.deleteMany({});
    await prisma.userAchievement.deleteMany({});
    await prisma.cameraDetection.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.feedPost.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.vocabulary.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.achievement.deleteMany({});
    await prisma.monthlyTask.deleteMany({});

    // Seed Topics and Vocabulary
    console.log('Seeding topics and vocabulary...');
    for (const topicData of koreanVocabulary) {
      const topic = await prisma.topic.create({
        data: {
          name: topicData.topic.name,
          level: topicData.topic.level,
          description: `Learn ${topicData.topic.name.toLowerCase()} in Korean`,
          order: 1,
        },
      });

      // Create vocabulary items
      for (const item of topicData.items) {
        await prisma.vocabulary.create({
          data: {
            korean: item.korean,
            english: item.english,
            romanization: item.romanization,
            level: item.level,
            topicId: topic.id,
            isActive: true,
            version: 1,
          },
        });
      }
    }
    console.log(' Topics and vocabulary seeded');

    // Seed Quiz Questions
    console.log('Seeding quiz questions...');
    const topics = await prisma.topic.findMany();
    for (const question of quizQuestions) {
      const options = JSON.stringify(question.options);
      await prisma.question.create({
        data: {
          questionText: `What is the English translation of "${question.korean}"?`,
          correctAnswer: question.english,
          options: question.options,
          difficulty: question.difficulty,
          language_from: 'korean',
          language_to: 'english',
          topicId: question.topicId,
          isActive: true,
          version: 1,
        },
      });
    }
    console.log(' Quiz questions seeded');

    // Seed Achievements
    console.log('Seeding achievements...');
    for (const achievement of achievements) {
      await prisma.achievement.create({
        data: {
          name: achievement.name,
          description: achievement.description,
          criteria: achievement.criteria,
          badge: '🏆',
        },
      });
    }
    console.log(' Achievements seeded');

    // Seed Test Users
    console.log('Seeding test users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const testUsers = [
      {
        email: 'user1@example.com',
        name: 'User One',
        totalXP: 500,
        level: 'BEGINNER',
        currentStreak: 5,
      },
      {
        email: 'user2@example.com',
        name: 'User Two',
        totalXP: 1200,
        level: 'INTERMEDIATE',
        currentStreak: 12,
      },
      {
        email: 'user3@example.com',
        name: 'User Three',
        totalXP: 250,
        level: 'NEWBIE',
        currentStreak: 2,
      },
      {
        email: 'user4@example.com',
        name: 'User Four',
        totalXP: 800,
        level: 'BEGINNER',
        currentStreak: 8,
      },
      {
        email: 'user5@example.com',
        name: 'User Five',
        totalXP: 1500,
        level: 'INTERMEDIATE',
        currentStreak: 15,
      },
    ];

    const users = [];
    for (const userData of testUsers) {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: 'USER',
          totalXP: userData.totalXP,
          level: userData.level,
          currentStreak: userData.currentStreak,
          lastCheckinDate: new Date(),
        },
      });
      users.push(user);
    }
    console.log(' Test users seeded');

    // Seed User Achievements (unlock some for each user)
    console.log('Seeding user achievements...');
    const allAchievements = await prisma.achievement.findMany();
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Unlock 2-4 random achievements for each user
      const numToUnlock = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < numToUnlock; j++) {
        const achievement = allAchievements[Math.floor(Math.random() * allAchievements.length)];
        await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: achievement.id,
            unlockedAt: new Date(),
          },
        }).catch(() => {}); // Ignore duplicates
      }
    }
    console.log(' User achievements seeded');

    // Seed User Vocabulary Learning
    console.log('Seeding user vocabulary learning...');
    const allVocab = await prisma.vocabulary.findMany();
    for (const user of users) {
      // Each user learns 10-20 random vocabulary items
      const numToLearn = Math.floor(Math.random() * 11) + 10;
      const indicesToLearn = new Set();
      while (indicesToLearn.size < numToLearn) {
        indicesToLearn.add(Math.floor(Math.random() * allVocab.length));
      }
      for (const index of indicesToLearn) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            vocabularyLearned: {
              connect: { id: allVocab[index].id },
            },
          },
        }).catch(() => {}); // Ignore if already connected
      }
    }
    console.log(' User vocabulary learning seeded');

    // Seed Quiz Sessions
    console.log('Seeding quiz sessions...');
    const allQuestions = await prisma.question.findMany();
    for (const user of users) {
      // Create 3-5 quiz sessions for each user
      const numSessions = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < numSessions; i++) {
        const session = await prisma.quizSession.create({
          data: {
            userId: user.id,
            totalQuestions: 10,
            correctAnswers: Math.floor(Math.random() * 11),
            score: Math.floor(Math.random() * 101),
            endedAt: new Date(),
          },
        });

        // Create quiz answers for this session
        for (let j = 0; j < 10; j++) {
          const question = allQuestions[Math.floor(Math.random() * allQuestions.length)];
          await prisma.quizAnswer.create({
            data: {
              sessionId: session.id,
              userId: user.id,
              questionId: question.id,
              selectedAnswer: question.correctAnswer, // 50% correct answers
              isCorrect: Math.random() > 0.5,
            },
          });
        }
      }
    }
    console.log(' Quiz sessions seeded');

    // Seed Monthly Tasks
    console.log('Seeding monthly tasks...');
    const monthlyTasks = [
      {
        name: 'Daily Learner',
        description: 'Complete one quiz daily',
        criteria: 'dailyQuizzes >= 30',
        reward: 500,
        level: 'NEWBIE',
      },
      {
        name: 'Vocabulary Builder',
        description: 'Learn 100 new vocabulary items',
        criteria: 'learnedVocab >= 100',
        reward: 1000,
        level: 'BEGINNER',
      },
      {
        name: 'Perfect Student',
        description: 'Get perfect scores in 5 quizzes',
        criteria: 'perfectScores >= 5',
        reward: 750,
        level: 'INTERMEDIATE',
      },
    ];

    for (const task of monthlyTasks) {
      await prisma.monthlyTask.create({
        data: {
          name: task.name,
          description: task.description,
          criteria: task.criteria,
          reward: task.reward,
          level: task.level,
        },
      });
    }
    console.log(' Monthly tasks seeded');

    console.log('\n✨ Database seeding complete!');
    console.log(` Topics: ${await prisma.topic.count()}`);
    console.log(` Vocabulary: ${await prisma.vocabulary.count()}`);
    console.log(` Questions: ${await prisma.question.count()}`);
    console.log(` Users: ${await prisma.user.count()}`);
    console.log(` Quiz Sessions: ${await prisma.quizSession.count()}`);
    console.log(` Achievements: ${await prisma.achievement.count()}`);
    console.log(` Monthly Tasks: ${await prisma.monthlyTask.count()}`);
  } catch (error) {
    console.error(' Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
console.log(Object.keys(prisma));

main();
