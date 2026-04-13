import prisma from '../src/lib/prisma';

const topic1Vocab = [
  { korean: '안녕하세요', english: 'Hello (formal)', vietnamese: 'Xin chào (lịch sự)', romanization: 'annyeonghaseyo', level: 'NEWBIE' },
  { korean: '안녕', english: 'Hi',vietnamese: 'Xin chào', romanization: 'annyeong', level: 'NEWBIE' },
  { korean: '반갑습니다', english: 'Nice to meet you', vietnamese: 'Rất vui được gặp bạn', romanization: 'bangapseumnida', level: 'NEWBIE' },
  { korean: '이름이 뭐예요', english: 'What is your name?', vietnamese: 'Tên bạn là gì?', romanization: 'ireumi mwoyeyo', level: 'BEGINNER' },
  { korean: '저는 학생이에요', english: 'I am a student', vietnamese: 'Tôi là một học sinh', romanization: 'jeoneun haksaengieyo', level: 'BEGINNER' },
  { korean: '직업이 뭐예요', english: 'What is your job?', vietnamese: 'Công việc của bạn là gì?', romanization: 'jigeopi mwoyeyo', level: 'INTERMEDIATE' },
  { korean: '어디에서 왔어요', english: 'Where are you from?', vietnamese: 'Bạn đến từ đâu?', romanization: 'eodieseo watsseoyeo', level: 'INTERMEDIATE' },
  { korean: '만나서 반가워요', english: 'Glad to meet you', vietnamese: 'Vui được gặp bạn', romanization: 'mannaseo bangawoyeo', level: 'BEGINNER' },
  { korean: '안녕히 가세요', english: 'Goodbye (formal)', vietnamese: 'Tạm biệt (lịch sự)', romanization: 'annyeonghi gaseyo', level: 'NEWBIE' },
  { korean: '나중에 봐요', english: 'See you later', vietnamese: 'Gặp bạn sau', romanization: 'najunge bwayeo', level: 'BEGINNER' },
  { korean: '좋은 하루 되세요', english: 'Have a good day', vietnamese: 'Chúc bạn một ngày tốt lành', romanization: 'joheun haru dwaeseyo', level: 'INTERMEDIATE' },
  { korean: '감사합니다', english: 'Thank you', vietnamese: 'Cảm ơn', romanization: 'gamsahamnida', level: 'NEWBIE' },
  { korean: '천만에요', english: 'You\'re welcome', vietnamese: 'Không có gì', romanization: 'cheonmaneyo', level: 'BEGINNER' },
  { korean: '죄송합니다', english: 'I\'m sorry', vietnamese: 'Tôi rất xin lỗi', romanization: 'joesonghamnida', level: 'INTERMEDIATE' },
  { korean: '괜찮아요', english: 'It\'s okay', vietnamese: 'Không sao',romanization: 'gwaenchanhayo', level: 'BEGINNER' },
];

async function main() {
  console.log('Seeding Topic 1 (Greeting) with vocabulary...');
  
  for (const vocab of topic1Vocab) {
    await prisma.vocabulary.create({
      data: {
        korean: vocab.korean,
        english: vocab.english,
        vietnamese: vocab.vietnamese,
        romanization: vocab.romanization,
        level: vocab.level,
        topicId: 1,
        isActive: true,
      },
    });
    console.log(`✓ Added: ${vocab.korean}`);
  }
  
  console.log('✓✓✓ Topic 1 seeded with 15 vocabulary items!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
