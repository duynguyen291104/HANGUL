// Seed script to create sample questions for each topic
// Run with: npx ts-node prisma/seedQuestions.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample questions for different topics
const SAMPLE_QUESTIONS = [
  {
    topicName: 'Chào hỏi cơ bản',
    questions: [
      {
        questionText: 'How do you say "Hello" in Korean?',
        correctAnswer: '안녕하세요',
        options: ['안녕하세요', '감사합니다', '사랑해요', '죄송합니다'],
        language_from: 'english',
        language_to: 'korean',
        difficulty: 'easy',
      },
      {
        questionText: 'What does "안녕하세요" mean?',
        correctAnswer: 'Hello',
        options: ['Hello', 'Thank you', 'I love you', 'Sorry'],
        language_from: 'korean',
        language_to: 'english',
        difficulty: 'easy',
      },
      {
        questionText: 'How do you say goodbye in Korean?',
        correctAnswer: '안녕히 가세요',
        options: ['안녕히 가세요', '좋은 아침', '좋은 밤', '반가워요'],
        language_from: 'english',
        language_to: 'korean',
        difficulty: 'easy',
      },
      {
        questionText: 'What does "반가워요" mean?',
        correctAnswer: 'Nice to meet you',
        options: ['Nice to meet you', 'Goodbye', 'Good morning', 'Good night'],
        language_from: 'korean',
        language_to: 'english',
        difficulty: 'easy',
      },
      {
        questionText: 'How do you say "Good morning" in Korean?',
        correctAnswer: '좋은 아침',
        options: ['좋은 밤', '안녕하세요', '좋은 아침', '반가워요'],
        language_from: 'english',
        language_to: 'korean',
        difficulty: 'easy',
      },
      {
        questionText: 'What does "좋은 밤" mean?',
        correctAnswer: 'Good night',
        options: ['Good morning', 'Good afternoon', 'Good night', 'Goodbye'],
        language_from: 'korean',
        language_to: 'english',
        difficulty: 'easy',
      },
      {
        questionText: 'How do you say "Thank you" in Korean?',
        correctAnswer: '감사합니다',
        options: ['안녕하세요', '감사합니다', '사랑해요', '죄송합니다'],
        language_from: 'english',
        language_to: 'korean',
        difficulty: 'easy',
      },
      {
        questionText: 'What does "죄송합니다" mean?',
        correctAnswer: 'Sorry',
        options: ['Thank you', 'Goodbye', 'Sorry', 'I love you'],
        language_from: 'korean',
        language_to: 'english',
        difficulty: 'easy',
      },
    ],
  },
  {
    topicName: 'Giới thiệu bản thân',
    questions: [
      {
        questionText: 'How do you ask "What is your name?" in Korean?',
        correctAnswer: '이름이 뭐예요?',
        options: ['이름이 뭐예요?', '나이가 뭐예요?', '직업이 뭐예요?', '어느 나라예요?'],
        language_from: 'english',
        language_to: 'korean',
        difficulty: 'medium',
      },
      {
        questionText: 'What does "나이가 뭐예요?" mean?',
        correctAnswer: 'How old are you?',
        options: ['What is your name?', 'How old are you?', 'What is your job?', 'Where are you from?'],
        language_from: 'korean',
        language_to: 'english',
        difficulty: 'medium',
      },
    ],
  },
];

async function seedQuestions() {
  try {
    console.log('🌱 Seeding sample questions for topics...');

    let questionCount = 0;

    for (const topicData of SAMPLE_QUESTIONS) {
      // Find topic by name
      const topic = await prisma.topic.findFirst({
        where: { name: topicData.topicName },
      });

      if (!topic) {
        console.log(`⚠️ Topic "${topicData.topicName}" not found, skipping...`);
        continue;
      }

      for (const questionData of topicData.questions) {
        // Check if question already exists
        const existingQuestion = await prisma.question.findFirst({
          where: {
            questionText: questionData.questionText,
            topicId: topic.id,
          },
        });

        if (existingQuestion) {
          console.log(`✅ Question already exists: "${questionData.questionText}"`);
          continue;
        }

        // Create question
        const question = await prisma.question.create({
          data: {
            questionText: questionData.questionText,
            correctAnswer: questionData.correctAnswer,
            options: questionData.options,
            language_from: questionData.language_from,
            language_to: questionData.language_to,
            difficulty: questionData.difficulty,
            topicId: topic.id,
            isActive: true,
          },
        });

        console.log(`✨ Created question: "${question.questionText}" (Topic: ${topic.name})`);
        questionCount++;
      }
    }

    console.log(`\n✅ Successfully seeded ${questionCount} questions!`);
    console.log('Questions are now ready for quizzes.');
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedQuestions();
