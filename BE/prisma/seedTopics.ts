// This script seeds the Topic table with data from the JSON vocabulary files
// Run with: npx ts-node prisma/seedTopics.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Topic mapping from file names to readable names
const TOPIC_MAPPING: Record<string, { name: string; level: string; description: string }> = {
  // NEWBIE Level (5 topics)
  body: { name: 'Cơ Thể', level: 'NEWBIE', description: 'Học các bộ phận cơ thể và sức khỏe' },
  school: { name: 'Trường Học', level: 'NEWBIE', description: 'Từ vựng liên quan đến trường học và giáo dục' },
  shopping: { name: 'Mua Sắm', level: 'NEWBIE', description: 'Từ vựng mua sắm và lựa chọn hàng hóa' },
  sports: { name: 'Thể Thao', level: 'NEWBIE', description: 'Các loại thể thao và hoạt động ngoài trời' },
  transportation: { name: 'Giao Thông', level: 'NEWBIE', description: 'Các phương tiện vận chuyển và du lịch' },
  
  // BEGINNER Level (5 topics)
  daily: { name: 'Sinh Hoạt Hàng Ngày', level: 'BEGINNER', description: 'Từ vựng hàng ngày cho giao tiếp cơ bản' },
  family: { name: 'Gia Đình', level: 'BEGINNER', description: 'Các thành viên gia đình và quan hệ' },
  food: { name: 'Thực Phẩm', level: 'BEGINNER', description: 'Các loại thực phẩm và đồ uống' },
  greeting: { name: 'Chào Hỏi', level: 'BEGINNER', description: 'Các cách chào hỏi và lễ phép' },
  numbers: { name: 'Số Đếm', level: 'BEGINNER', description: 'Học các con số từ 0 đến 100' },
  
  // INTERMEDIATE Level (5 topics)
  daily_life_extended: { name: 'Sinh Hoạt Mở Rộng', level: 'INTERMEDIATE', description: 'Các tình huống hàng ngày nâng cao' },
  study_and_work: { name: 'Học Tập và Công Việc', level: 'INTERMEDIATE', description: 'Từ vựng liên quan đến học tập và công việc' },
  travel_and_culture: { name: 'Du Lịch và Văn Hóa', level: 'INTERMEDIATE', description: 'Từ vựng du lịch và trao đổi văn hóa' },
  health_and_emotions: { name: 'Sức Khỏe và Cảm Xúc', level: 'INTERMEDIATE', description: 'Các vấn đề sức khỏe và cảm xúc' },
  grammar_patterns: { name: 'Mẫu Ngữ Pháp', level: 'INTERMEDIATE', description: 'Các mẫu ngữ pháp trung cấp' },
  
  // ADVANCED Level (5 topics)
  business_strategy: { name: 'Chiến Lược Kinh Doanh', level: 'ADVANCED', description: 'Từ vựng kinh doanh và quản lý' },
  technology_and_data: { name: 'Công Nghệ và Dữ Liệu', level: 'ADVANCED', description: 'Từ vựng công nghệ thông tin' },
  academic_and_media: { name: 'Học Thuật và Truyền Thông', level: 'ADVANCED', description: 'Từ vựng học thuật và báo chí' },
  society_and_policy: { name: 'Xã Hội và Chính Sách', level: 'ADVANCED', description: 'Từ vựng xã hội và chính sách công' },
  advanced_grammar: { name: 'Ngữ Pháp Nâng Cao', level: 'ADVANCED', description: 'Các mẫu ngữ pháp nâng cao' },
  
  // EXPERT Level (5 topics)
  law_and_institutions: { name: 'Pháp Luật và Thể Chế', level: 'EXPERT', description: 'Từ vựng pháp luật và hành chính' },
  philosophy_and_ethics: { name: 'Triết Học và Đạo Đức', level: 'EXPERT', description: 'Từ vựng triết học và đạo đức' },
  literature_and_criticism: { name: 'Văn Học và Phê Bình', level: 'EXPERT', description: 'Từ vựng văn học và phê bình' },
  global_issues_and_discourse: { name: 'Vấn Đề Toàn Cầu', level: 'EXPERT', description: 'Từ vựng về vấn đề toàn cầu' },
  expert_grammar: { name: 'Ngữ Pháp Chuyên Gia', level: 'EXPERT', description: 'Các mẫu ngữ pháp chuyên gia' },
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
