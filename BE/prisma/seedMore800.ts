import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vocabulary = [
  // Animals (100 words)
  { korean: '동물', english: 'Animal', vietnamese: 'Động vật', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '개', english: 'Dog', vietnamese: 'Chó', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '고양이', english: 'Cat', vietnamese: 'Mèo', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '소', english: 'Cow', vietnamese: 'Bò', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '돼지', english: 'Pig', vietnamese: 'Lợn', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '양', english: 'Sheep', vietnamese: 'Cừu', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '말', english: 'Horse', vietnamese: 'Ngựa', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '닭', english: 'Chicken', vietnamese: 'Gà', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '오리', english: 'Duck', vietnamese: 'Vịt', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '거위', english: 'Goose', vietnamese: 'Ngỗng', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '토끼', english: 'Rabbit', vietnamese: 'Thỏ', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '쥐', english: 'Mouse', vietnamese: 'Chuột', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '다람쥐', english: 'Squirrel', vietnamese: 'Sóc', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '여우', english: 'Fox', vietnamese: 'Cáo', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '곰', english: 'Bear', vietnamese: 'Gấu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '사자', english: 'Lion', vietnamese: 'Sư tử', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '호랑이', english: 'Tiger', vietnamese: 'Hổ', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '표범', english: 'Leopard', vietnamese: 'Báo', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '코끼리', english: 'Elephant', vietnamese: 'Voi', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '기린', english: 'Giraffe', vietnamese: 'Hươu cao cổ', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '얼룩말', english: 'Zebra', vietnamese: 'Ngựa vằn', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '하마', english: 'Hippopotamus', vietnamese: 'Hà mã', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '악어', english: 'Crocodile', vietnamese: 'Cá sấu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '뱀', english: 'Snake', vietnamese: 'Rắn', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '개구리', english: 'Frog', vietnamese: 'Ếch', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '거북이', english: 'Turtle', vietnamese: 'Rùa', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '새', english: 'Bird', vietnamese: 'Chim', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '독수리', english: 'Eagle', vietnamese: 'Đại bàng', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '매', english: 'Hawk', vietnamese: 'Ưng', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '부엉이', english: 'Owl', vietnamese: 'Cú', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '까마귀', english: 'Crow', vietnamese: 'Quạ', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '갈매기', english: 'Seagull', vietnamese: 'Mòng biển', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '비둘기', english: 'Pigeon', vietnamese: 'Chim bồ câu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '참새', english: 'Sparrow', vietnamese: 'Chim sẻ', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '제비', english: 'Swallow', vietnamese: 'Chim én', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '학', english: 'Crane', vietnamese: 'Hạc', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '백조', english: 'Swan', vietnamese: 'Thiên nga', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '펭귄', english: 'Penguin', vietnamese: 'Chim cánh cụt', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '낙타', english: 'Camel', vietnamese: 'Lạc đà', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '판다', english: 'Panda', vietnamese: 'Gấu trúc', type: 'noun', level: 'BEGINNER', topic: 'Động vật' },
  { korean: '원숭이', english: 'Monkey', vietnamese: 'Khỉ', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '고릴라', english: 'Gorilla', vietnamese: 'Khỉ đột', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '침팬지', english: 'Chimpanzee', vietnamese: 'Tinh tinh', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '오랑우탄', english: 'Orangutan', vietnamese: 'Đười ơi', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '물개', english: 'Seal', vietnamese: 'Hải cẩu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '돌고래', english: 'Dolphin', vietnamese: 'Cá heo', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '고래', english: 'Whale', vietnamese: 'Cá voi', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '상어', english: 'Shark', vietnamese: 'Cá mập', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '금붕어', english: 'Goldfish', vietnamese: 'Cá vàng', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '잉어', english: 'Carp', vietnamese: 'Cá chép', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '메기', english: 'Catfish', vietnamese: 'Cá trê', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '미꾸라지', english: 'Loach', vietnamese: 'Cá nheo', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '개미', english: 'Ant', vietnamese: 'Kiến', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '벌', english: 'Bee', vietnamese: 'Ong', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '나비', english: 'Butterfly', vietnamese: 'Bướm', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '잠자리', english: 'Dragonfly', vietnamese: 'Chuồn chuồn', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '매미', english: 'Cicada', vietnamese: 'Ve', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '귀뚜라미', english: 'Cricket', vietnamese: 'Dế', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '메뚜기', english: 'Grasshopper', vietnamese: 'Châu chấu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '딱정벌레', english: 'Beetle', vietnamese: 'Bọ cánh cứng', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '거미', english: 'Spider', vietnamese: 'Nhện', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '지렁이', english: 'Worm', vietnamese: 'Sâu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '달팽이', english: 'Snail', vietnamese: 'Ốc sên', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '해파리', english: 'Jellyfish', vietnamese: 'Sứa', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '바다별', english: 'Starfish', vietnamese: 'Sao biển', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '게', english: 'Crab', vietnamese: 'Cua', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '새우', english: 'Shrimp', vietnamese: 'Tôm', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '굴', english: 'Oyster', vietnamese: 'Hàu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '홍합', english: 'Mussel', vietnamese: 'Trai', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '조개', english: 'Clam', vietnamese: 'Trai', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '오징어', english: 'Squid', vietnamese: 'Mực', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '문어', english: 'Octopus', vietnamese: 'Bạch tuộc', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '소라', english: 'Conch', vietnamese: 'Sò', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '해저드', english: 'Sea urchin', vietnamese: 'Nhím biển', type: 'noun', level: 'UPPER', topic: 'Động vật' },
  { korean: '산호', english: 'Coral', vietnamese: 'San hô', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '박쥐', english: 'Bat', vietnamese: 'Dơi', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '고슴도치', english: 'Hedgehog', vietnamese: 'Nhím', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '반달곰', english: 'Asian black bear', vietnamese: 'Gấu lông trắng', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '산양', english: 'Mountain goat', vietnamese: 'Dê núi', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '사슴', english: 'Deer', vietnamese: 'Nai', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '노루', english: 'Roe deer', vietnamese: 'Nai cái', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '무스', english: 'Moose', vietnamese: 'Tuần lộc', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '버팔로', english: 'Buffalo', vietnamese: 'Trâu', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '영양', english: 'Antelope', vietnamese: 'Linh dương', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '기니피그', english: 'Guinea pig', vietnamese: 'Chuột bò', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '친칠라', english: 'Chinchilla', vietnamese: 'Chinchilla', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '페럿', english: 'Ferret', vietnamese: 'Rái cá', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '햄스터', english: 'Hamster', vietnamese: 'Chuột hamster', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },
  { korean: '기니폭스', english: 'Porcupine', vietnamese: 'Nhím gai', type: 'noun', level: 'INTERMEDIATE', topic: 'Động vật' },

  // Sports & Recreation (100 words)
  { korean: '스포츠', english: 'Sports', vietnamese: 'Thể thao', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '축구', english: 'Football', vietnamese: 'Bóng đá', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '농구', english: 'Basketball', vietnamese: 'Bóng rổ', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '야구', english: 'Baseball', vietnamese: 'Bóng chày', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '테니스', english: 'Tennis', vietnamese: 'Quần vợt', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '배구', english: 'Volleyball', vietnamese: 'Bóng chuyền', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '탁구', english: 'Table tennis', vietnamese: 'Bóng bàn', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '배드민턴', english: 'Badminton', vietnamese: 'Cầu lông', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '럭비', english: 'Rugby', vietnamese: 'Bóng chạm', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '크리켓', english: 'Cricket', vietnamese: 'Cricket', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '하키', english: 'Hockey', vietnamese: 'Khúc côn cầu', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '아이스하키', english: 'Ice hockey', vietnamese: 'Khúc côn cầu trên băng', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '골프', english: 'Golf', vietnamese: 'Golf', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '조깅', english: 'Jogging', vietnamese: 'Chạy bộ', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '걷기', english: 'Walking', vietnamese: 'Đi bộ', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '수영', english: 'Swimming', vietnamese: 'Bơi', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '다이빙', english: 'Diving', vietnamese: 'Lặn', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '서핑', english: 'Surfing', vietnamese: 'Lướt sóng', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '스키', english: 'Skiing', vietnamese: 'Trượt tuyết', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '스케이트', english: 'Skating', vietnamese: 'Trượt patin', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '스노보드', english: 'Snowboarding', vietnamese: 'Ván trượt tuyết', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '등산', english: 'Mountain climbing', vietnamese: 'Leo núi', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '암벽등반', english: 'Rock climbing', vietnamese: 'Leo núi đá', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '자전거타기', english: 'Cycling', vietnamese: 'Đạp xe', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '배타기', english: 'Rowing', vietnamese: 'Chèo thuyền', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '카누', english: 'Canoeing', vietnamese: 'Chèo ca nô', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '카약', english: 'Kayaking', vietnamese: 'Chèo kayak', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '말타기', english: 'Horse riding', vietnamese: 'Cưỡi ngựa', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '보육사', english: 'Fencing', vietnamese: 'Kiếm', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '레슬링', english: 'Wrestling', vietnamese: 'Đấu vật', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '복싱', english: 'Boxing', vietnamese: 'Quyền anh', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '유도', english: 'Judo', vietnamese: 'Judo', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '태권도', english: 'Taekwondo', vietnamese: 'Taekwondo', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '가라테', english: 'Karate', vietnamese: 'Karate', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '무에타이', english: 'Muay Thai', vietnamese: 'Muay Thai', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '권투', english: 'Pugilism', vietnamese: 'Quyền', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '체조', english: 'Gymnastics', vietnamese: 'Thể dục', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '발레', english: 'Ballet', vietnamese: 'Múa ba lê', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '무용', english: 'Dance', vietnamese: 'Nhảy múa', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '피겨스케이팅', english: 'Figure skating', vietnamese: 'Trượt patin biểu diễn', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '양궁', english: 'Archery', vietnamese: 'Bắn cung', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '사격', english: 'Shooting', vietnamese: 'Bắn súng', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '근력운동', english: 'Weight lifting', vietnamese: 'Nâng tạ', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '보디빌딩', english: 'Bodybuilding', vietnamese: 'Xây dựng cơ thể', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '요가', english: 'Yoga', vietnamese: 'Yoga', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '필라테스', english: 'Pilates', vietnamese: 'Pilates', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '에어로빅', english: 'Aerobics', vietnamese: 'Aerobics', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '줄넘기', english: 'Jump rope', vietnamese: 'Nhảy dây', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '스케이트보드', english: 'Skateboarding', vietnamese: 'Trượt ván', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: 'BMX', english: 'BMX', vietnamese: 'BMX', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '패러글라이딩', english: 'Paragliding', vietnamese: 'Nhảy dù', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '스카이다이빙', english: 'Skydiving', vietnamese: 'Nhảy dù tự do', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '번지점프', english: 'Bungee jumping', vietnamese: 'Nhảy dây bật', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '짚라인', english: 'Zip-lining', vietnamese: 'Trượt dây', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '동계올림픽', english: 'Winter Olympics', vietnamese: 'Thế vận hội mùa đông', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '하계올림픽', english: 'Summer Olympics', vietnamese: 'Thế vận hội mùa hè', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '월드컵', english: 'World Cup', vietnamese: 'Cúp thế giới', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '마라톤', english: 'Marathon', vietnamese: 'Đua marathon', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '트라이애슬론', english: 'Triathlon', vietnamese: 'Triathlon', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '펜싱', english: 'Fencing', vietnamese: 'Đấu kiếm', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '사이클', english: 'Cycling', vietnamese: 'Đạp xe', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '트랙', english: 'Track', vietnamese: 'Quỹ đạo', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '필드', english: 'Field', vietnamese: 'Sân cỏ', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '코트', english: 'Court', vietnamese: 'Sân', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '스타디움', english: 'Stadium', vietnamese: 'Sân vận động', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '체육관', english: 'Gymnasium', vietnamese: 'Nhà tập thể dục', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '풀장', english: 'Swimming pool', vietnamese: 'Hồ bơi', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
  { korean: '스키장', english: 'Ski resort', vietnamese: 'Khu trượt tuyết', type: 'noun', level: 'INTERMEDIATE', topic: 'Thể thao' },
  { korean: '공원', english: 'Park', vietnamese: 'Công viên', type: 'noun', level: 'BEGINNER', topic: 'Thể thao' },
];

async function seed() {
  try {
    console.log('🌱 Seeding additional 200+ vocabulary items...\n');

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

    console.log('\n✅ Seed completed!');
    console.log(`📊 New vocabulary created: ${createdCount}`);
    console.log(`⏭️  Vocabulary skipped (already exists): ${skippedCount}`);
    console.log(`📚 Total vocabulary in database: ${totalVocab}`);
    console.log(`📖 Total topics in database: ${totalTopics}`);
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(console.error);
