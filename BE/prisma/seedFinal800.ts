import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vocabulary = [
  // Technology (40 words)
  { korean: '컴퓨터', english: 'Computer', vietnamese: 'Máy tính', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '노트북', english: 'Laptop', vietnamese: 'Máy tính xách tay', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '스마트폰', english: 'Smartphone', vietnamese: 'Điện thoại thông minh', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '태블릿', english: 'Tablet', vietnamese: 'Máy tính bảng', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '키보드', english: 'Keyboard', vietnamese: 'Bàn phím', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '마우스', english: 'Mouse', vietnamese: 'Chuột', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '모니터', english: 'Monitor', vietnamese: 'Màn hình', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '프린터', english: 'Printer', vietnamese: 'Máy in', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '카메라', english: 'Camera', vietnamese: 'Máy ảnh', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '비디오카메라', english: 'Video camera', vietnamese: 'Máy quay phim', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '마이크', english: 'Microphone', vietnamese: 'Microphone', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '스피커', english: 'Speaker', vietnamese: 'Loa', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '헤드폰', english: 'Headphones', vietnamese: 'Tai nghe', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '이어폰', english: 'Earphones', vietnamese: 'Tai nghe nhét', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '와이파이', english: 'WiFi', vietnamese: 'WiFi', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '블루투스', english: 'Bluetooth', vietnamese: 'Bluetooth', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '인터넷', english: 'Internet', vietnamese: 'Internet', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '소프트웨어', english: 'Software', vietnamese: 'Phần mềm', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '하드웨어', english: 'Hardware', vietnamese: 'Phần cứng', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '파일', english: 'File', vietnamese: 'Tệp', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '폴더', english: 'Folder', vietnamese: 'Thư mục', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '버튼', english: 'Button', vietnamese: 'Nút', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '화면', english: 'Screen', vietnamese: 'Màn hình', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '바탕화면', english: 'Desktop', vietnamese: 'Màn hình nền', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '메뉴', english: 'Menu', vietnamese: 'Menu', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '아이콘', english: 'Icon', vietnamese: 'Biểu tượng', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '이메일', english: 'Email', vietnamese: 'Email', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '비밀번호', english: 'Password', vietnamese: 'Mật khẩu', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '사용자명', english: 'Username', vietnamese: 'Tên người dùng', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '사이트', english: 'Website', vietnamese: 'Trang web', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '앱', english: 'Application', vietnamese: 'Ứng dụng', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },
  { korean: '클라우드', english: 'Cloud', vietnamese: 'Đám mây', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '서버', english: 'Server', vietnamese: 'Máy chủ', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '데이터베이스', english: 'Database', vietnamese: 'Cơ sở dữ liệu', type: 'noun', level: 'UPPER', topic: 'Công nghệ' },
  { korean: '프로그래밍', english: 'Programming', vietnamese: 'Lập trình', type: 'noun', level: 'UPPER', topic: 'Công nghệ' },
  { korean: '코드', english: 'Code', vietnamese: 'Mã', type: 'noun', level: 'UPPER', topic: 'Công nghệ' },
  { korean: '에러', english: 'Error', vietnamese: 'Lỗi', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '백업', english: 'Backup', vietnamese: 'Sao lưu', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '업데이트', english: 'Update', vietnamese: 'Cập nhật', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '인스톨', english: 'Install', vietnamese: 'Cài đặt', type: 'noun', level: 'INTERMEDIATE', topic: 'Công nghệ' },
  { korean: '다운로드', english: 'Download', vietnamese: 'Tải xuống', type: 'noun', level: 'BEGINNER', topic: 'Công nghệ' },

  // School & Education (40 words)
  { korean: '학교', english: 'School', vietnamese: 'Trường học', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '대학교', english: 'University', vietnamese: 'Đại học', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '교실', english: 'Classroom', vietnamese: 'Lớp học', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '학생', english: 'Student', vietnamese: 'Học sinh', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '선생님', english: 'Teacher', vietnamese: 'Giáo viên', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '책', english: 'Book', vietnamese: 'Sách', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '노트', english: 'Notebook', vietnamese: 'Sổ ghi chép', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '펜', english: 'Pen', vietnamese: 'Bút', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '연필', english: 'Pencil', vietnamese: 'Bút chì', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '지우개', english: 'Eraser', vietnamese: 'Cục tẩy', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '연필깎이', english: 'Pencil sharpener', vietnamese: 'Dao gọt bút chì', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '자', english: 'Ruler', vietnamese: 'Thước', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '삼각자', english: 'Triangle ruler', vietnamese: 'Thước tam giác', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '나침반', english: 'Compass', vietnamese: 'La bàn', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '끌', english: 'Glue', vietnamese: 'Keo dán', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '가위', english: 'Scissors', vietnamese: 'Kéo', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '테이프', english: 'Tape', vietnamese: 'Băng keo', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '지도', english: 'Map', vietnamese: 'Bản đồ', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '글로브', english: 'Globe', vietnamese: 'Quả địa cầu', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '칠판', english: 'Blackboard', vietnamese: 'Bảng đen', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '휴지통', english: 'Trash can', vietnamese: 'Thùng rác', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '졸업', english: 'Graduation', vietnamese: 'Tốt nghiệp', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '시험', english: 'Exam', vietnamese: 'Bài kiểm tra', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '성적', english: 'Grade', vietnamese: 'Điểm', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '과제', english: 'Assignment', vietnamese: 'Bài tập', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '레포트', english: 'Report', vietnamese: 'Báo cáo', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '발표', english: 'Presentation', vietnamese: 'Thuyết trình', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '토론', english: 'Discussion', vietnamese: 'Thảo luận', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '강의', english: 'Lecture', vietnamese: 'Bài giảng', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '세미나', english: 'Seminar', vietnamese: 'Hội thảo', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '워크숍', english: 'Workshop', vietnamese: 'Hội thảo thực hành', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '도서관', english: 'Library', vietnamese: 'Thư viện', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '실험실', english: 'Laboratory', vietnamese: 'Phòng thí nghiệm', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '운동장', english: 'Playground', vietnamese: 'Sân chơi', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '카페테리아', english: 'Cafeteria', vietnamese: 'Quán cơm', type: 'noun', level: 'BEGINNER', topic: 'Trường học' },
  { korean: '기숙사', english: 'Dormitory', vietnamese: 'Ký túc xá', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '장학금', english: 'Scholarship', vietnamese: 'Học bổng', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '학비', english: 'Tuition', vietnamese: 'Học phí', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '전공', english: 'Major', vietnamese: 'Chuyên ngành', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
  { korean: '부전공', english: 'Minor', vietnamese: 'Phụ ngành', type: 'noun', level: 'INTERMEDIATE', topic: 'Trường học' },
];

async function seed() {
  try {
    console.log('🌱 Seeding final batch to reach 800+ vocabulary...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const word of vocabulary) {
      try {
        let topic = await prisma.topic.findFirst({
          where: {
            name: word.topic,
            level: word.level,
          },
        });

        if (!topic) {
          topic = await prisma.topic.create({
            data: {
              name: word.topic,
              level: word.level,
              description: `Learn vocabulary for ${word.topic}`,
            },
          });
        }

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
          createdCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        // Silent skip
      }
    }

    const totalVocab = await prisma.vocabulary.count();
    const totalTopics = await prisma.topic.count();

    console.log('\n✅ Final seed completed!');
    console.log(`📊 New vocabulary created: ${createdCount}`);
    console.log(`⏭️  Vocabulary skipped: ${skippedCount}`);
    console.log(`\n🎉 TOTAL VOCABULARY IN DATABASE: ${totalVocab}`);
    console.log(`📖 TOTAL TOPICS: ${totalTopics}`);
    console.log(`\n✨ Target reached: ${totalVocab >= 800 ? 'YES! 800+ vocabulary items' : `Almost there: ${totalVocab} items`}`);
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(console.error);
