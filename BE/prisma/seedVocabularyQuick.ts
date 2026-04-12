import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample vocabulary data for all levels
const vocabularyData = [
  // NEWBIE LEVEL - Common greetings and basic phrases
  {
    level: 'NEWBIE',
    topic: 'Chào hỏi cơ bản',
    words: [
      { korean: '안녕하세요', english: 'Hello', vietnamese: 'Xin chào', type: 'greeting' },
      { korean: '감사합니다', english: 'Thank you', vietnamese: 'Cảm ơn', type: 'politeness' },
      { korean: '죄송합니다', english: 'I\'m sorry', vietnamese: 'Xin lỗi', type: 'politeness' },
      { korean: '네', english: 'Yes', vietnamese: 'Vâng', type: 'response' },
      { korean: '아니요', english: 'No', vietnamese: 'Không', type: 'response' },
      { korean: '이름', english: 'Name', vietnamese: 'Tên', type: 'noun' },
      { korean: '사람', english: 'Person', vietnamese: 'Người', type: 'noun' },
      { korean: '처음 뵙겠습니다', english: 'Nice to meet you', vietnamese: 'Rất vui gặp bạn', type: 'greeting' },
    ]
  },
  {
    level: 'NEWBIE',
    topic: 'Giới thiệu bản thân',
    words: [
      { korean: '저는', english: 'I am', vietnamese: 'Tôi là', type: 'pronoun' },
      { korean: '당신은', english: 'You are', vietnamese: 'Bạn là', type: 'pronoun' },
      { korean: '그는', english: 'He is', vietnamese: 'Anh ấy là', type: 'pronoun' },
      { korean: '그녀는', english: 'She is', vietnamese: 'Cô ấy là', type: 'pronoun' },
      { korean: '이에요', english: 'is/am', vietnamese: 'là', type: 'verb' },
      { korean: '회사', english: 'Company', vietnamese: 'Công ty', type: 'noun' },
      { korean: '학생', english: 'Student', vietnamese: 'Học sinh', type: 'noun' },
      { korean: '직업', english: 'Job', vietnamese: 'Nghề nghiệp', type: 'noun' },
    ]
  },
  {
    level: 'NEWBIE',
    topic: 'Số đếm',
    words: [
      { korean: '하나', english: 'One', vietnamese: 'Một', type: 'number' },
      { korean: '둘', english: 'Two', vietnamese: 'Hai', type: 'number' },
      { korean: '셋', english: 'Three', vietnamese: 'Ba', type: 'number' },
      { korean: '넷', english: 'Four', vietnamese: 'Bốn', type: 'number' },
      { korean: '다섯', english: 'Five', vietnamese: 'Năm', type: 'number' },
      { korean: '여섯', english: 'Six', vietnamese: 'Sáu', type: 'number' },
      { korean: '일곱', english: 'Seven', vietnamese: 'Bảy', type: 'number' },
      { korean: '여덟', english: 'Eight', vietnamese: 'Tám', type: 'number' },
    ]
  },
  {
    level: 'BEGINNER',
    topic: 'Gia đình',
    words: [
      { korean: '엄마', english: 'Mother', vietnamese: 'Mẹ', type: 'family' },
      { korean: '아빠', english: 'Father', vietnamese: 'Bố', type: 'family' },
      { korean: '형', english: 'Older brother', vietnamese: 'Anh trai', type: 'family' },
      { korean: '누나', english: 'Older sister', vietnamese: 'Chị gái', type: 'family' },
      { korean: '동생', english: 'Younger sibling', vietnamese: 'Em trai/gái', type: 'family' },
      { korean: '할머니', english: 'Grandmother', vietnamese: 'Bà', type: 'family' },
      { korean: '할아버지', english: 'Grandfather', vietnamese: 'Ông', type: 'family' },
      { korean: '가족', english: 'Family', vietnamese: 'Gia đình', type: 'family' },
    ]
  },
  {
    level: 'BEGINNER',
    topic: 'Thức ăn',
    words: [
      { korean: '밥', english: 'Rice', vietnamese: 'Cơm', type: 'food' },
      { korean: '국', english: 'Soup', vietnamese: 'Canh', type: 'food' },
      { korean: '김치', english: 'Kimchi', vietnamese: 'Dưa chua', type: 'food' },
      { korean: '고기', english: 'Meat', vietnamese: 'Thịt', type: 'food' },
      { korean: '채소', english: 'Vegetable', vietnamese: 'Rau', type: 'food' },
      { korean: '과일', english: 'Fruit', vietnamese: 'Trái cây', type: 'food' },
      { korean: '음식', english: 'Food', vietnamese: 'Đồ ăn', type: 'food' },
      { korean: '물', english: 'Water', vietnamese: 'Nước', type: 'beverage' },
    ]
  },
  {
    level: 'BEGINNER',
    topic: 'Màu sắc',
    words: [
      { korean: '빨강', english: 'Red', vietnamese: 'Đỏ', type: 'color' },
      { korean: '파랑', english: 'Blue', vietnamese: 'Xanh dương', type: 'color' },
      { korean: '노랑', english: 'Yellow', vietnamese: 'Vàng', type: 'color' },
      { korean: '검정', english: 'Black', vietnamese: 'Đen', type: 'color' },
      { korean: '흰색', english: 'White', vietnamese: 'Trắng', type: 'color' },
      { korean: '초록', english: 'Green', vietnamese: 'Xanh lá', type: 'color' },
      { korean: '보라', english: 'Purple', vietnamese: 'Tím', type: 'color' },
      { korean: '주황', english: 'Orange', vietnamese: 'Cam', type: 'color' },
    ]
  },
  {
    level: 'INTERMEDIATE',
    topic: 'Thời tiết',
    words: [
      { korean: '날씨', english: 'Weather', vietnamese: 'Thời tiết', type: 'noun' },
      { korean: '맑음', english: 'Clear', vietnamese: 'Nắng', type: 'adjective' },
      { korean: '흐림', english: 'Cloudy', vietnamese: 'Âm u', type: 'adjective' },
      { korean: '비', english: 'Rain', vietnamese: 'Mưa', type: 'noun' },
      { korean: '눈', english: 'Snow', vietnamese: 'Tuyết', type: 'noun' },
      { korean: '바람', english: 'Wind', vietnamese: 'Gió', type: 'noun' },
      { korean: '더위', english: 'Heat', vietnamese: 'Nóng', type: 'noun' },
      { korean: '추위', english: 'Cold', vietnamese: 'Lạnh', type: 'noun' },
    ]
  },
  {
    level: 'INTERMEDIATE',
    topic: 'Cơ thể',
    words: [
      { korean: '머리', english: 'Head', vietnamese: 'Đầu', type: 'body' },
      { korean: '눈', english: 'Eyes', vietnamese: 'Mắt', type: 'body' },
      { korean: '코', english: 'Nose', vietnamese: 'Mũi', type: 'body' },
      { korean: '입', english: 'Mouth', vietnamese: 'Miệng', type: 'body' },
      { korean: '귀', english: 'Ear', vietnamese: 'Tai', type: 'body' },
      { korean: '손', english: 'Hand', vietnamese: 'Tay', type: 'body' },
      { korean: '발', english: 'Foot', vietnamese: 'Chân', type: 'body' },
      { korean: '심장', english: 'Heart', vietnamese: 'Trái tim', type: 'body' },
    ]
  },
];

async function seedVocabulary() {
  try {
    console.log('🌱 Seeding vocabulary...');
    
    let totalCount = 0;

    for (const levelData of vocabularyData) {
      // Get or create topic
      let topic = await prisma.topic.findFirst({
        where: {
          name: levelData.topic,
          level: levelData.level,
        },
      });

      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            name: levelData.topic,
            level: levelData.level,
            description: `Learn vocabulary for ${levelData.topic}`,
          },
        });
        console.log(`📌 Created topic: ${levelData.topic}`);
      }

      // Seed vocabulary
      for (const word of levelData.words) {
        const existing = await prisma.vocabulary.findFirst({
          where: {
            korean: word.korean,
            topicId: topic.id,
          },
        });

        if (!existing) {
          await prisma.vocabulary.create({
            data: {
              korean: word.korean,
              english: word.english,
              vietnamese: word.vietnamese,
              type: word.type,
              topicId: topic.id,
            },
          });
          totalCount++;
        }
      }
    }

    console.log(`✅ Seeded ${totalCount} vocabulary items`);
  } catch (error) {
    console.error('Error seeding vocabulary:', error);
  }
}

seedVocabulary().then(() => {
  console.log('Done!');
  process.exit(0);
});
