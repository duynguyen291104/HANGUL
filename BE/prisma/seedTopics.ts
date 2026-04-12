// This script seeds the Topic table with data from the JSON vocabulary files
// Run with: npx ts-node prisma/seedTopics.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Topic mapping from file names to readable names
const TOPIC_MAPPING: Record<string, { name: string; level: string; description: string }> = {
  // NEWBIE Level (10 topics)
  'greeting': { name: 'Chào hỏi cơ bản', level: 'NEWBIE', description: 'Học cách chào hỏi và giới thiệu bản thân' },
  'introduction': { name: 'Giới thiệu bản thân', level: 'NEWBIE', description: 'Nói về tên, tuổi, quốc tịch' },
  'numbers': { name: 'Số đếm', level: 'NEWBIE', description: 'Học các con số từ 0-100' },
  'alphabet': { name: 'Bảng chữ cái', level: 'NEWBIE', description: 'Học Hangul từ A-Z' },
  'colors': { name: 'Màu sắc', level: 'NEWBIE', description: 'Học tên các màu cơ bản' },
  'family': { name: 'Gia đình', level: 'NEWBIE', description: 'Thành viên gia đình và mối quan hệ' },
  'friends': { name: 'Bạn bè', level: 'NEWBIE', description: 'Giao tiếp với bạn bè' },
  'objects': { name: 'Đồ vật xung quanh', level: 'NEWBIE', description: 'Tên các vật dụng hàng ngày' },
  'school': { name: 'Trường học', level: 'NEWBIE', description: 'Từ vựng về trường học' },
  'jobs': { name: 'Nghề nghiệp đơn giản', level: 'NEWBIE', description: 'Các nghề nghiệp phổ biến' },

  // BEGINNER Level (8 topics)
  'daily_routine': { name: 'Sinh Hoạt Hàng Ngày', level: 'BEGINNER', description: 'Từ vựng hàng ngày cho giao tiếp cơ bản' },
  'hobbies': { name: 'Sở thích', level: 'BEGINNER', description: 'Nói về sở thích và các hoạt động yêu thích' },
  'shopping': { name: 'Đi mua sắm', level: 'BEGINNER', description: 'Từ vựng mua sắm và lựa chọn hàng hóa' },
  'eating_out': { name: 'Ăn uống ngoài', level: 'BEGINNER', description: 'Đặt hàng và gọi đồ ăn' },
  'travel_basics': { name: 'Du lịch cơ bản', level: 'BEGINNER', description: 'Cơ bản về du lịch và điểm đến' },
  'transportation': { name: 'Phương tiện di chuyển', level: 'BEGINNER', description: 'Các phương tiện vận chuyển' },
  'time_and_schedule': { name: 'Thời gian & lịch trình', level: 'BEGINNER', description: 'Nói về thời gian và lịch trình' },
  'texting': { name: 'Viết tin nhắn', level: 'BEGINNER', description: 'Giao tiếp qua tin nhắn' },

  // INTERMEDIATE Level (6 topics)
  'daily_extended': { name: 'Các tình huống hàng ngày nâng cao', level: 'INTERMEDIATE', description: 'Các tình huống hàng ngày phức tạp hơn' },
  'work_and_study': { name: 'Công việc và học tập', level: 'INTERMEDIATE', description: 'Từ vựng liên quan đến công việc và học tập' },
  'culture': { name: 'Văn hóa và truyền thống', level: 'INTERMEDIATE', description: 'Nói về văn hóa và truyền thống' },
  'health': { name: 'Sức khỏe và y tế', level: 'INTERMEDIATE', description: 'Các vấn đề sức khỏe' },
  'emotions': { name: 'Cảm xúc và tâm trạng', level: 'INTERMEDIATE', description: 'Diễn đạt cảm xúc và tâm trạng' },
  'grammar_intermediate': { name: 'Ngữ pháp trung cấp', level: 'INTERMEDIATE', description: 'Các mẫu ngữ pháp trung cấp' },

  // UPPER Level (5 topics)
  'business': { name: 'Kinh doanh cơ bản', level: 'UPPER', description: 'Từ vựng kinh doanh cơ bản' },
  'technology': { name: 'Công nghệ', level: 'UPPER', description: 'Từ vựng công nghệ thông tin' },
  'current_affairs': { name: 'Sự kiện thời sự', level: 'UPPER', description: 'Nói về tin tức và sự kiện' },
  'society': { name: 'Xã hội', level: 'UPPER', description: 'Vấn đề xã hội' },
  'grammar_upper': { name: 'Ngữ pháp trên trung cấp', level: 'UPPER', description: 'Các mẫu ngữ pháp trên trung cấp' },

  // ADVANCED Level (4 topics)
  'advanced_business': { name: 'Chiến lược kinh doanh', level: 'ADVANCED', description: 'Từ vựng kinh doanh nâng cao' },
  'academia': { name: 'Học thuật và nghiên cứu', level: 'ADVANCED', description: 'Từ vựng học thuật và nghiên cứu' },
  'politics': { name: 'Chính trị và chính sách', level: 'ADVANCED', description: 'Từ vựng chính trị' },
  'grammar_advanced': { name: 'Ngữ pháp nâng cao', level: 'ADVANCED', description: 'Các mẫu ngữ pháp nâng cao' },
};

async function seedTopics() {
  try {
    console.log('🌱 Seeding topics from vocabulary JSON files...');

    let topicCount = 0;

    for (const [_, topicInfo] of Object.entries(TOPIC_MAPPING)) {
      // Check if topic already exists
      const existingTopic = await prisma.topic.findFirst({
        where: { name: topicInfo.name, level: topicInfo.level },
      });

      if (existingTopic) {
        console.log(`✅ Topic "${topicInfo.name}" already exists (Level: ${topicInfo.level})`);
        continue;
      }

      // Create new topic
      const topic = await prisma.topic.create({
        data: {
          name: topicInfo.name,
          level: topicInfo.level,
          description: topicInfo.description,
          order: topicCount,
        },
      });

      console.log(`✨ Created topic: "${topic.name}" (ID: ${topic.id}, Level: ${topic.level})`);
      topicCount++;
    }

    console.log(`\n✅ Successfully seeded ${topicCount} topics!`);
    console.log('Topics are now ready to use in your learning map.');
  } catch (error) {
    console.error('❌ Error seeding topics:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTopics();
