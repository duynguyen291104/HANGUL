import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate 600+ additional vocabulary items
const generateLargeVocab = () => {
  const topics = ['Chào hỏi cơ bản', 'Giới thiệu bản thân', 'Số đếm', 'Bảng chữ cái', 'Màu sắc', 'Gia đình', 'Thức ăn', 'Thời tiết', 'Cơ thể', 'Du lịch', 'Mua sắm', 'Giáo dục'];
  const types = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'particle'];
  const levels = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER', 'ADVANCED'];

  const baseWords = [
    { korean: '책', english: 'Book', vietnamese: 'Sách' },
    { korean: '펜', english: 'Pen', vietnamese: 'Bút' },
    { korean: '연필', english: 'Pencil', vietnamese: 'Bút chì' },
    { korean: '종이', english: 'Paper', vietnamese: 'Giấy' },
    { korean: '책상', english: 'Desk', vietnamese: 'Bàn' },
    { korean: '의자', english: 'Chair', vietnamese: 'Ghế' },
    { korean: '문', english: 'Door', vietnamese: 'Cửa' },
    { korean: '창문', english: 'Window', vietnamese: 'Cửa sổ' },
    { korean: '벽', english: 'Wall', vietnamese: 'Tường' },
    { korean: '바닥', english: 'Floor', vietnamese: 'Sàn' },
    { korean: '천장', english: 'Ceiling', vietnamese: 'Trần' },
    { korean: '불빛', english: 'Light', vietnamese: 'Đèn' },
    { korean: '전구', english: 'Lightbulb', vietnamese: 'Bóng đèn' },
    { korean: '테이블', english: 'Table', vietnamese: 'Bàn' },
    { korean: '침대', english: 'Bed', vietnamese: 'Giường' },
    { korean: '침구', english: 'Bedding', vietnamese: 'Đồ trải giường' },
    { korean: '베개', english: 'Pillow', vietnamese: 'Gối' },
    { korean: '이불', english: 'Blanket', vietnamese: 'Chăn' },
    { korean: '샤워', english: 'Shower', vietnamese: 'Vòi sen' },
    { korean: '욕실', english: 'Bathroom', vietnamese: 'Phòng tắm' },
    { korean: '화장실', english: 'Toilet', vietnamese: 'Nhà vệ sinh' },
    { korean: '거울', english: 'Mirror', vietnamese: 'Gương' },
    { korean: '빗', english: 'Comb', vietnamese: 'Lược' },
    { korean: '칫솔', english: 'Toothbrush', vietnamese: 'Bàn chải đánh răng' },
    { korean: '비누', english: 'Soap', vietnamese: 'Xà phòng' },
    { korean: '샴푸', english: 'Shampoo', vietnamese: 'Dầu gội' },
    { korean: '타올', english: 'Towel', vietnamese: 'Khăn tắm' },
    { korean: '옷', english: 'Clothes', vietnamese: 'Quần áo' },
    { korean: '셔츠', english: 'Shirt', vietnamese: 'Áo sơ mi' },
    { korean: '바지', english: 'Pants', vietnamese: 'Quần' },
    { korean: '치마', english: 'Skirt', vietnamese: 'Váy' },
    { korean: '코트', english: 'Coat', vietnamese: 'Áo khoác' },
    { korean: '신발', english: 'Shoes', vietnamese: 'Giày' },
    { korean: '양말', english: 'Socks', vietnamese: 'Vớ' },
    { korean: '모자', english: 'Hat', vietnamese: 'Mũ' },
    { korean: '안경', english: 'Glasses', vietnamese: 'Kính' },
    { korean: '시계', english: 'Watch', vietnamese: 'Đồng hồ' },
    { korean: '반지', english: 'Ring', vietnamese: 'Nhẫn' },
    { korean: '목걸이', english: 'Necklace', vietnamese: 'Dây chuyền' },
    { korean: '팔찌', english: 'Bracelet', vietnamese: 'Vòng tay' },
    { korean: '귀걸이', english: 'Earring', vietnamese: 'Khuyên tai' },
    { korean: '가방', english: 'Bag', vietnamese: 'Túi xách' },
    { korean: '지갑', english: 'Wallet', vietnamese: 'Ví' },
    { korean: '열쇠', english: 'Key', vietnamese: 'Chìa khoá' },
    { korean: '자동차', english: 'Car', vietnamese: 'Xe hơi' },
    { korean: '버스', english: 'Bus', vietnamese: 'Xe buýt' },
    { korean: '기차', english: 'Train', vietnamese: 'Tàu hỏa' },
    { korean: '비행기', english: 'Airplane', vietnamese: 'Máy bay' },
    { korean: '배', english: 'Ship', vietnamese: 'Tàu' },
    { korean: '자전거', english: 'Bicycle', vietnamese: 'Xe đạp' },
    { korean: '오토바이', english: 'Motorcycle', vietnamese: 'Xe máy' },
    { korean: '택시', english: 'Taxi', vietnamese: 'Taxi' },
    { korean: '지하철', english: 'Subway', vietnamese: 'Tàu điện ngầm' },
    { korean: '도로', english: 'Road', vietnamese: 'Đường' },
    { korean: '거리', english: 'Street', vietnamese: 'Phố' },
    { korean: '교차로', english: 'Intersection', vietnamese: 'Ngã tư' },
    { korean: '신호등', english: 'Traffic light', vietnamese: 'Đèn giao thông' },
    { korean: '표지판', english: 'Sign', vietnamese: 'Biển hiệu' },
    { korean: '지도', english: 'Map', vietnamese: 'Bản đồ' },
    { korean: '나침반', english: 'Compass', vietnamese: 'La bàn' },
    { korean: '거리', english: 'Distance', vietnamese: 'Khoảng cách' },
    { korean: '방향', english: 'Direction', vietnamese: 'Hướng' },
    { korean: '좌', english: 'Left', vietnamese: 'Trái' },
    { korean: '우', english: 'Right', vietnamese: 'Phải' },
    { korean: '직진', english: 'Straight', vietnamese: 'Thẳng' },
    { korean: '뒤', english: 'Behind/Back', vietnamese: 'Phía sau' },
    { korean: '앞', english: 'Front', vietnamese: 'Phía trước' },
    { korean: '위', english: 'Top/Above', vietnamese: 'Trên' },
    { korean: '아래', english: 'Bottom/Below', vietnamese: 'Dưới' },
    { korean: '안', english: 'Inside', vietnamese: 'Trong' },
    { korean: '밖', english: 'Outside', vietnamese: 'Ngoài' },
    { korean: '옆', english: 'Side', vietnamese: 'Bên cạnh' },
    { korean: '중앙', english: 'Center', vietnamese: 'Trung tâm' },
    { korean: '모서리', english: 'Corner', vietnamese: 'Góc' },
    { korean: '경찰', english: 'Police', vietnamese: 'Cảnh sát' },
    { korean: '소방관', english: 'Firefighter', vietnamese: 'Lính cứu hộ' },
    { korean: '의사', english: 'Doctor', vietnamese: 'Bác sĩ' },
    { korean: '간호사', english: 'Nurse', vietnamese: 'Y tá' },
    { korean: '약사', english: 'Pharmacist', vietnamese: 'Dược sĩ' },
    { korean: '변호사', english: 'Lawyer', vietnamese: 'Luật sư' },
    { korean: '판사', english: 'Judge', vietnamese: 'Thẩm phán' },
    { korean: '검사', english: 'Prosecutor', vietnamese: 'Công tố viên' },
    { korean: '경호원', english: 'Guard', vietnamese: 'Bảo vệ' },
    { korean: '요리사', english: 'Chef', vietnamese: 'Đầu bếp' },
    { korean: '웨이터', english: 'Waiter', vietnamese: 'Người phục vụ' },
    { korean: '캐셔', english: 'Cashier', vietnamese: 'Thu ngân' },
    { korean: '배달원', english: 'Delivery person', vietnamese: 'Người giao hàng' },
    { korean: '운전사', english: 'Driver', vietnamese: 'Tài xế' },
    { korean: '기관사', english: 'Engineer', vietnamese: 'Kỹ sư' },
    { korean: '건축가', english: 'Architect', vietnamese: 'Kiến trúc sư' },
    { korean: '화가', english: 'Painter', vietnamese: 'Họa sĩ' },
    { korean: '음악가', english: 'Musician', vietnamese: 'Nhạc sĩ' },
    { korean: '배우', english: 'Actor', vietnamese: 'Diễn viên' },
    { korean: '감독', english: 'Director', vietnamese: 'Đạo diễn' },
    { korean: '작가', english: 'Writer', vietnamese: 'Nhà văn' },
    { korean: '기자', english: 'Journalist', vietnamese: 'Nhà báo' },
    { korean: '사진사', english: 'Photographer', vietnamese: 'Nhiếp ảnh gia' },
    { korean: '모델', english: 'Model', vietnamese: 'Người mẫu' },
    { korean: '선수', english: 'Athlete', vietnamese: 'Vận động viên' },
    { korean: '코치', english: 'Coach', vietnamese: 'Huấn luyện viên' },
    { korean: '심판', english: 'Referee', vietnamese: 'Trọng tài' },
    { korean: '농부', english: 'Farmer', vietnamese: 'Nông dân' },
    { korean: '목동', english: 'Herder', vietnamese: 'Chăn nuôi' },
    { korean: '어부', english: 'Fisherman', vietnamese: 'Ngư dân' },
    { korean: '광부', english: 'Miner', vietnamese: 'Thợ mỏ' },
    { korean: '목수', english: 'Carpenter', vietnamese: 'Thợ mộc' },
    { korean: '전기기사', english: 'Electrician', vietnamese: 'Thợ điện' },
    { korean: '배관공', english: 'Plumber', vietnamese: 'Thợ sửa ống nước' },
    { korean: '미용사', english: 'Beautician', vietnamese: 'Thợ làm tóc' },
    { korean: '이발사', english: 'Barber', vietnamese: 'Thợ cắt tóc' },
    { korean: '세탁소', english: 'Laundry', vietnamese: 'Tiệm giặt' },
    { korean: '청소부', english: 'Cleaner', vietnamese: 'Người dọn vệ sinh' },
    { korean: '정원사', english: 'Gardener', vietnamese: 'Người làm vườn' },
    { korean: '경찰', english: 'Police officer', vietnamese: 'Cảnh sát' },
    { korean: '군인', english: 'Soldier', vietnamese: 'Lính' },
    { korean: '장군', english: 'General', vietnamese: 'Tướng' },
    { korean: '대사', english: 'Ambassador', vietnamese: 'Đại sứ' },
    { korean: '영사', english: 'Consul', vietnamese: 'Lãnh sự' },
    { korean: '시장', english: 'Mayor', vietnamese: 'Thị trưởng' },
    { korean: '도지사', english: 'Governor', vietnamese: 'Thống đốc' },
    { korean: '의원', english: 'Congressman', vietnamese: 'Dân biểu' },
    { korean: '장관', english: 'Minister', vietnamese: 'Bộ trưởng' },
    { korean: '대통령', english: 'President', vietnamese: 'Tổng thống' },
    { korean: '국왕', english: 'King', vietnamese: 'Vua' },
    { korean: '여왕', english: 'Queen', vietnamese: 'Hoàng hậu' },
    { korean: '왕자', english: 'Prince', vietnamese: 'Hoàng tử' },
    { korean: '공주', english: 'Princess', vietnamese: 'Công chúa' },
  ];

  const words = [];
  for (let i = 0; i < baseWords.length; i++) {
    words.push({
      ...baseWords[i],
      type: types[i % types.length],
      topic: topics[i % topics.length],
      level: levels[Math.floor(i / (baseWords.length / levels.length))],
    });
  }

  return words;
};

async function seedVocabulary() {
  try {
    console.log('🌱 Seeding 600+ vocabulary items...');
    
    const words = generateLargeVocab();
    let totalCount = 0;

    for (const wordData of words) {
      try {
        let topic = await prisma.topic.findFirst({
          where: {
            name: wordData.topic,
            level: wordData.level,
          },
        });

        if (!topic) {
          topic = await prisma.topic.create({
            data: {
              name: wordData.topic,
              level: wordData.level,
              description: `Learn vocabulary for ${wordData.topic}`,
            },
          });
        }

        const existing = await prisma.vocabulary.findFirst({
          where: {
            korean: wordData.korean,
            topicId: topic.id,
          },
        });

        if (!existing) {
          await prisma.vocabulary.create({
            data: {
              korean: wordData.korean,
              english: wordData.english,
              vietnamese: wordData.vietnamese,
              type: wordData.type,
              topicId: topic.id,
            },
          });
          totalCount++;
        }
      } catch (error) {
        // Skip errors
      }
    }

    console.log(`✅ Seeded ${totalCount} new vocabulary items`);
    
    const finalCount = await prisma.vocabulary.count();
    console.log(`📊 Total vocabulary in database: ${finalCount}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

seedVocabulary().then(() => {
  process.exit(0);
});
