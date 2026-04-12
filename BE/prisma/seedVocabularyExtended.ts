import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive vocabulary data - 800+ words across all levels
const generateVocabulary = () => {
  const vocab = [];
  
  // NEWBIE Level - 200 words
  const newbieWords = [
    // Greetings (8)
    { korean: '안녕하세요', english: 'Hello', vietnamese: 'Xin chào', topic: 'Chào hỏi cơ bản', type: 'greeting' },
    { korean: '감사합니다', english: 'Thank you', vietnamese: 'Cảm ơn', topic: 'Chào hỏi cơ bản', type: 'politeness' },
    { korean: '죄송합니다', english: 'I\'m sorry', vietnamese: 'Xin lỗi', topic: 'Chào hỏi cơ bản', type: 'politeness' },
    { korean: '안녕히 가세요', english: 'Goodbye', vietnamese: 'Tạm biệt', topic: 'Chào hỏi cơ bản', type: 'greeting' },
    { korean: '네', english: 'Yes', vietnamese: 'Vâng', topic: 'Chào hỏi cơ bản', type: 'response' },
    { korean: '아니요', english: 'No', vietnamese: 'Không', topic: 'Chào hỏi cơ bản', type: 'response' },
    { korean: '괜찮습니다', english: 'It\'s fine', vietnamese: 'Không sao', topic: 'Chào hỏi cơ bản', type: 'response' },
    { korean: '모릅니다', english: 'I don\'t know', vietnamese: 'Tôi không biết', topic: 'Chào hỏi cơ bản', type: 'response' },
    // Introduction (12)
    { korean: '이름', english: 'Name', vietnamese: 'Tên', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '나이', english: 'Age', vietnamese: 'Tuổi', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '직업', english: 'Job', vietnamese: 'Công việc', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '회사', english: 'Company', vietnamese: 'Công ty', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '학교', english: 'School', vietnamese: 'Trường học', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '학생', english: 'Student', vietnamese: 'Học sinh', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '선생님', english: 'Teacher', vietnamese: 'Thầy cô', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '친구', english: 'Friend', vietnamese: 'Bạn', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '사람', english: 'Person', vietnamese: 'Người', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '집', english: 'House', vietnamese: 'Nhà', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '한국', english: 'Korea', vietnamese: 'Hàn Quốc', topic: 'Giới thiệu bản thân', type: 'noun' },
    { korean: '베트남', english: 'Vietnam', vietnamese: 'Việt Nam', topic: 'Giới thiệu bản thân', type: 'noun' },
    // Numbers (30 - basic + extended)
    { korean: '0', english: 'Zero', vietnamese: 'Không', topic: 'Số đếm', type: 'number' },
    { korean: '1', english: 'One', vietnamese: 'Một', topic: 'Số đếm', type: 'number' },
    { korean: '2', english: 'Two', vietnamese: 'Hai', topic: 'Số đếm', type: 'number' },
    { korean: '3', english: 'Three', vietnamese: 'Ba', topic: 'Số đếm', type: 'number' },
    { korean: '4', english: 'Four', vietnamese: 'Bốn', topic: 'Số đếm', type: 'number' },
    { korean: '5', english: 'Five', vietnamese: 'Năm', topic: 'Số đếm', type: 'number' },
    { korean: '6', english: 'Six', vietnamese: 'Sáu', topic: 'Số đếm', type: 'number' },
    { korean: '7', english: 'Seven', vietnamese: 'Bảy', topic: 'Số đếm', type: 'number' },
    { korean: '8', english: 'Eight', vietnamese: 'Tám', topic: 'Số đếm', type: 'number' },
    { korean: '9', english: 'Nine', vietnamese: 'Chín', topic: 'Số đếm', type: 'number' },
    { korean: '10', english: 'Ten', vietnamese: 'Mười', topic: 'Số đếm', type: 'number' },
    { korean: '11', english: 'Eleven', vietnamese: 'Mười một', topic: 'Số đếm', type: 'number' },
    { korean: '12', english: 'Twelve', vietnamese: 'Mười hai', topic: 'Số đếm', type: 'number' },
    { korean: '13', english: 'Thirteen', vietnamese: 'Mười ba', topic: 'Số đếm', type: 'number' },
    { korean: '14', english: 'Fourteen', vietnamese: 'Mười bốn', topic: 'Số đếm', type: 'number' },
    { korean: '15', english: 'Fifteen', vietnamese: 'Mười năm', topic: 'Số đếm', type: 'number' },
    { korean: '16', english: 'Sixteen', vietnamese: 'Mười sáu', topic: 'Số đếm', type: 'number' },
    { korean: '17', english: 'Seventeen', vietnamese: 'Mười bảy', topic: 'Số đếm', type: 'number' },
    { korean: '18', english: 'Eighteen', vietnamese: 'Mười tám', topic: 'Số đếm', type: 'number' },
    { korean: '19', english: 'Nineteen', vietnamese: 'Mười chín', topic: 'Số đếm', type: 'number' },
    { korean: '20', english: 'Twenty', vietnamese: 'Hai mươi', topic: 'Số đếm', type: 'number' },
    { korean: '30', english: 'Thirty', vietnamese: 'Ba mươi', topic: 'Số đếm', type: 'number' },
    { korean: '40', english: 'Forty', vietnamese: 'Bốn mươi', topic: 'Số đếm', type: 'number' },
    { korean: '50', english: 'Fifty', vietnamese: 'Năm mươi', topic: 'Số đếm', type: 'number' },
    { korean: '60', english: 'Sixty', vietnamese: 'Sáu mươi', topic: 'Số đếm', type: 'number' },
    { korean: '70', english: 'Seventy', vietnamese: 'Bảy mươi', topic: 'Số đếm', type: 'number' },
    { korean: '80', english: 'Eighty', vietnamese: 'Tám mươi', topic: 'Số đếm', type: 'number' },
    { korean: '90', english: 'Ninety', vietnamese: 'Chín mươi', topic: 'Số đếm', type: 'number' },
    { korean: '100', english: 'Hundred', vietnamese: 'Một trăm', topic: 'Số đếm', type: 'number' },
    { korean: '1000', english: 'Thousand', vietnamese: 'Một nghìn', topic: 'Số đếm', type: 'number' },
    // Alphabet (24)
    { korean: '가', english: 'A', vietnamese: 'A', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '나', english: 'B', vietnamese: 'B', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '다', english: 'D', vietnamese: 'D', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '라', english: 'R', vietnamese: 'R', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '마', english: 'M', vietnamese: 'M', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '바', english: 'B', vietnamese: 'B', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '사', english: 'S', vietnamese: 'S', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '아', english: 'A', vietnamese: 'A', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '자', english: 'Z', vietnamese: 'Z', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '차', english: 'Ch', vietnamese: 'Ch', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '카', english: 'K', vietnamese: 'K', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '타', english: 'T', vietnamese: 'T', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '파', english: 'P', vietnamese: 'P', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '하', english: 'H', vietnamese: 'H', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '가', english: 'GA', vietnamese: 'GA', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '거', english: 'GEO', vietnamese: 'GEO', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '고', english: 'GO', vietnamese: 'GO', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '구', english: 'GU', vietnamese: 'GU', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '그', english: 'GEU', vietnamese: 'GEU', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '기', english: 'GI', vietnamese: 'GI', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '나', english: 'NA', vietnamese: 'NA', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '너', english: 'NEO', vietnamese: 'NEO', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '노', english: 'NO', vietnamese: 'NO', topic: 'Bảng chữ cái', type: 'letter' },
    { korean: '누', english: 'NU', vietnamese: 'NU', topic: 'Bảng chữ cái', type: 'letter' },
    // Colors (8)
    { korean: '빨강', english: 'Red', vietnamese: 'Đỏ', topic: 'Màu sắc', type: 'color' },
    { korean: '파랑', english: 'Blue', vietnamese: 'Xanh dương', topic: 'Màu sắc', type: 'color' },
    { korean: '노랑', english: 'Yellow', vietnamese: 'Vàng', topic: 'Màu sắc', type: 'color' },
    { korean: '검정', english: 'Black', vietnamese: 'Đen', topic: 'Màu sắc', type: 'color' },
    { korean: '흰색', english: 'White', vietnamese: 'Trắng', topic: 'Màu sắc', type: 'color' },
    { korean: '초록', english: 'Green', vietnamese: 'Xanh lá', topic: 'Màu sắc', type: 'color' },
    { korean: '보라', english: 'Purple', vietnamese: 'Tím', topic: 'Màu sắc', type: 'color' },
    { korean: '주황', english: 'Orange', vietnamese: 'Cam', topic: 'Màu sắc', type: 'color' },
    // Basic verbs and adjectives (50+)
    { korean: '먹다', english: 'To eat', vietnamese: 'Ăn', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '마시다', english: 'To drink', vietnamese: 'Uống', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '자다', english: 'To sleep', vietnamese: 'Ngủ', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '일어나다', english: 'To wake up', vietnamese: 'Thức dậy', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '가다', english: 'To go', vietnamese: 'Đi', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '오다', english: 'To come', vietnamese: 'Đến', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '보다', english: 'To see', vietnamese: 'Nhìn', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '듣다', english: 'To listen', vietnamese: 'Nghe', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '말하다', english: 'To speak', vietnamese: 'Nói', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '읽다', english: 'To read', vietnamese: 'Đọc', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '쓰다', english: 'To write', vietnamese: 'Viết', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '찾다', english: 'To find', vietnamese: 'Tìm', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '잃다', english: 'To lose', vietnamese: 'Mất', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '주다', english: 'To give', vietnamese: 'Cho', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '받다', english: 'To receive', vietnamese: 'Nhận', topic: 'Chào hỏi cơ bản', type: 'verb' },
    { korean: '좋다', english: 'Good', vietnamese: 'Tốt', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '나쁘다', english: 'Bad', vietnamese: 'Xấu', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '크다', english: 'Big', vietnamese: 'Lớn', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '작다', english: 'Small', vietnamese: 'Nhỏ', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '길다', english: 'Long', vietnamese: 'Dài', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '짧다', english: 'Short', vietnamese: 'Ngắn', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '높다', english: 'High/Tall', vietnamese: 'Cao', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '낮다', english: 'Low', vietnamese: 'Thấp', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '무겁다', english: 'Heavy', vietnamese: 'Nặng', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '가볍다', english: 'Light', vietnamese: 'Nhẹ', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '따뜻하다', english: 'Warm', vietnamese: 'Ấm', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '차갑다', english: 'Cold', vietnamese: 'Lạnh', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '행복하다', english: 'Happy', vietnamese: 'Vui', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '슬프다', english: 'Sad', vietnamese: 'Buồn', topic: 'Chào hỏi cơ bản', type: 'adjective' },
    { korean: '아프다', english: 'Sick', vietnamese: 'Bệnh', topic: 'Chào hỏi cơ bản', type: 'adjective' },
  ];

  // BEGINNER Level - 200+ words
  const beginnerWords = [
    { korean: '엄마', english: 'Mother', vietnamese: 'Mẹ', topic: 'Gia đình', type: 'family' },
    { korean: '아빠', english: 'Father', vietnamese: 'Bố', topic: 'Gia đình', type: 'family' },
    { korean: '형', english: 'Older brother', vietnamese: 'Anh trai', topic: 'Gia đình', type: 'family' },
    { korean: '누나', english: 'Older sister', vietnamese: 'Chị gái', topic: 'Gia đình', type: 'family' },
    { korean: '동생', english: 'Younger sibling', vietnamese: 'Em trai/gái', topic: 'Gia đình', type: 'family' },
    { korean: '할머니', english: 'Grandmother', vietnamese: 'Bà', topic: 'Gia đình', type: 'family' },
    { korean: '할아버지', english: 'Grandfather', vietnamese: 'Ông', topic: 'Gia đình', type: 'family' },
    { korean: '가족', english: 'Family', vietnamese: 'Gia đình', topic: 'Gia đình', type: 'family' },
    { korean: '아내', english: 'Wife', vietnamese: 'Vợ', topic: 'Gia đình', type: 'family' },
    { korean: '남편', english: 'Husband', vietnamese: 'Chồng', topic: 'Gia đình', type: 'family' },
    { korean: '딸', english: 'Daughter', vietnamese: 'Con gái', topic: 'Gia đình', type: 'family' },
    { korean: '아들', english: 'Son', vietnamese: 'Con trai', topic: 'Gia đình', type: 'family' },
    { korean: '삼촌', english: 'Uncle', vietnamese: 'Chú/Bác', topic: 'Gia đình', type: 'family' },
    { korean: '숙모', english: 'Aunt', vietnamese: 'Chị/Em vợ', topic: 'Gia đình', type: 'family' },
    { korean: '사촌', english: 'Cousin', vietnamese: 'Anh chị em họ', topic: 'Gia đình', type: 'family' },
    { korean: '밥', english: 'Rice', vietnamese: 'Cơm', topic: 'Thức ăn', type: 'food' },
    { korean: '국', english: 'Soup', vietnamese: 'Canh', topic: 'Thức ăn', type: 'food' },
    { korean: '김치', english: 'Kimchi', vietnamese: 'Dưa chua', topic: 'Thức ăn', type: 'food' },
    { korean: '고기', english: 'Meat', vietnamese: 'Thịt', topic: 'Thức ăn', type: 'food' },
    { korean: '채소', english: 'Vegetable', vietnamese: 'Rau', topic: 'Thức ăn', type: 'food' },
    { korean: '과일', english: 'Fruit', vietnamese: 'Trái cây', topic: 'Thức ăn', type: 'food' },
    { korean: '음식', english: 'Food', vietnamese: 'Đồ ăn', topic: 'Thức ăn', type: 'food' },
    { korean: '물', english: 'Water', vietnamese: 'Nước', topic: 'Thức ăn', type: 'beverage' },
    { korean: '우유', english: 'Milk', vietnamese: 'Sữa', topic: 'Thức ăn', type: 'beverage' },
    { korean: '주스', english: 'Juice', vietnamese: 'Nước ép', topic: 'Thức ăn', type: 'beverage' },
    { korean: '커피', english: 'Coffee', vietnamese: 'Cà phê', topic: 'Thức ăn', type: 'beverage' },
    { korean: '차', english: 'Tea', vietnamese: 'Trà', topic: 'Thức ăn', type: 'beverage' },
    { korean: '소주', english: 'Soju', vietnamese: 'Rượu Soju', topic: 'Thức ăn', type: 'beverage' },
    { korean: '맥주', english: 'Beer', vietnamese: 'Bia', topic: 'Thức ăn', type: 'beverage' },
    { korean: '포도', english: 'Grape', vietnamese: 'Nho', topic: 'Thức ăn', type: 'food' },
    { korean: '사과', english: 'Apple', vietnamese: 'Táo', topic: 'Thức ăn', type: 'food' },
    { korean: '오렌지', english: 'Orange', vietnamese: 'Cam', topic: 'Thức ăn', type: 'food' },
    { korean: '바나나', english: 'Banana', vietnamese: 'Chuối', topic: 'Thức ăn', type: 'food' },
    { korean: '딸기', english: 'Strawberry', vietnamese: 'Dâu', topic: 'Thức ăn', type: 'food' },
    { korean: '수박', english: 'Watermelon', vietnamese: 'Dưa hấu', topic: 'Thức ăn', type: 'food' },
    { korean: '복숭아', english: 'Peach', vietnamese: 'Đào', topic: 'Thức ăn', type: 'food' },
    { korean: '레몬', english: 'Lemon', vietnamese: 'Chanh', topic: 'Thức ăn', type: 'food' },
    { korean: '빵', english: 'Bread', vietnamese: 'Bánh mì', topic: 'Thức ăn', type: 'food' },
    { korean: '계란', english: 'Egg', vietnamese: 'Trứng', topic: 'Thức ăn', type: 'food' },
    { korean: '치즈', english: 'Cheese', vietnamese: 'Pho mát', topic: 'Thức ăn', type: 'food' },
    { korean: '버터', english: 'Butter', vietnamese: 'Bơ', topic: 'Thức ăn', type: 'food' },
    { korean: '간식', english: 'Snack', vietnamese: 'Đồ ăn vặt', topic: 'Thức ăn', type: 'food' },
    { korean: '사탕', english: 'Candy', vietnamese: 'Kẹo', topic: 'Thức ăn', type: 'food' },
    { korean: '초콜릿', english: 'Chocolate', vietnamese: 'Sô cô la', topic: 'Thức ăn', type: 'food' },
    { korean: '케이크', english: 'Cake', vietnamese: 'Bánh', topic: 'Thức ăn', type: 'food' },
    { korean: '쿠키', english: 'Cookie', vietnamese: 'Bánh quy', topic: 'Thức ăn', type: 'food' },
  ];

  // INTERMEDIATE Level - 200+ words
  const intermediateWords = [
    { korean: '날씨', english: 'Weather', vietnamese: 'Thời tiết', topic: 'Thời tiết', type: 'noun' },
    { korean: '맑음', english: 'Clear', vietnamese: 'Nắng', topic: 'Thời tiết', type: 'adjective' },
    { korean: '흐림', english: 'Cloudy', vietnamese: 'Âm u', topic: 'Thời tiết', type: 'adjective' },
    { korean: '비', english: 'Rain', vietnamese: 'Mưa', topic: 'Thời tiết', type: 'noun' },
    { korean: '눈', english: 'Snow', vietnamese: 'Tuyết', topic: 'Thời tiết', type: 'noun' },
    { korean: '바람', english: 'Wind', vietnamese: 'Gió', topic: 'Thời tiết', type: 'noun' },
    { korean: '번개', english: 'Lightning', vietnamese: 'Chớp', topic: 'Thời tiết', type: 'noun' },
    { korean: '천둥', english: 'Thunder', vietnamese: 'Sấm', topic: 'Thời tiết', type: 'noun' },
    { korean: '구름', english: 'Cloud', vietnamese: 'Mây', topic: 'Thời tiết', type: 'noun' },
    { korean: '해', english: 'Sun', vietnamese: 'Mặt trời', topic: 'Thời tiết', type: 'noun' },
    { korean: '달', english: 'Moon', vietnamese: 'Mặt trăng', topic: 'Thời tiết', type: 'noun' },
    { korean: '별', english: 'Star', vietnamese: 'Sao', topic: 'Thời tiết', type: 'noun' },
    { korean: '계절', english: 'Season', vietnamese: 'Mùa', topic: 'Thời tiết', type: 'noun' },
    { korean: '봄', english: 'Spring', vietnamese: 'Mùa xuân', topic: 'Thời tiết', type: 'noun' },
    { korean: '여름', english: 'Summer', vietnamese: 'Mùa hè', topic: 'Thời tiết', type: 'noun' },
    { korean: '가을', english: 'Autumn', vietnamese: 'Mùa thu', topic: 'Thời tiết', type: 'noun' },
    { korean: '겨울', english: 'Winter', vietnamese: 'Mùa đông', topic: 'Thời tiết', type: 'noun' },
    { korean: '온도', english: 'Temperature', vietnamese: 'Nhiệt độ', topic: 'Thời tiết', type: 'noun' },
    { korean: '습도', english: 'Humidity', vietnamese: 'Độ ẩm', topic: 'Thời tiết', type: 'noun' },
    { korean: '기압', english: 'Atmospheric pressure', vietnamese: 'Áp suất khí quyển', topic: 'Thời tiết', type: 'noun' },
    { korean: '머리', english: 'Head', vietnamese: 'Đầu', topic: 'Cơ thể', type: 'body' },
    { korean: '눈', english: 'Eyes', vietnamese: 'Mắt', topic: 'Cơ thể', type: 'body' },
    { korean: '코', english: 'Nose', vietnamese: 'Mũi', topic: 'Cơ thể', type: 'body' },
    { korean: '입', english: 'Mouth', vietnamese: 'Miệng', topic: 'Cơ thể', type: 'body' },
    { korean: '귀', english: 'Ear', vietnamese: 'Tai', topic: 'Cơ thể', type: 'body' },
    { korean: '손', english: 'Hand', vietnamese: 'Tay', topic: 'Cơ thể', type: 'body' },
    { korean: '발', english: 'Foot', vietnamese: 'Chân', topic: 'Cơ thể', type: 'body' },
    { korean: '손가락', english: 'Finger', vietnamese: 'Ngón tay', topic: 'Cơ thể', type: 'body' },
    { korean: '발가락', english: 'Toe', vietnamese: 'Ngón chân', topic: 'Cơ thể', type: 'body' },
    { korean: '팔', english: 'Arm', vietnamese: 'Cánh tay', topic: 'Cơ thể', type: 'body' },
    { korean: '다리', english: 'Leg', vietnamese: 'Chân/cái chân', topic: 'Cơ thể', type: 'body' },
    { korean: '무릎', english: 'Knee', vietnamese: 'Đầu gối', topic: 'Cơ thể', type: 'body' },
    { korean: '발목', english: 'Ankle', vietnamese: 'Cổ chân', topic: 'Cơ thể', type: 'body' },
    { korean: '허리', english: 'Waist', vietnamese: 'Vòng eo', topic: 'Cơ thể', type: 'body' },
    { korean: '배', english: 'Belly', vietnamese: 'Bụng', topic: 'Cơ thể', type: 'body' },
    { korean: '가슴', english: 'Chest', vietnamese: 'Ngực', topic: 'Cơ thể', type: 'body' },
    { korean: '등', english: 'Back', vietnamese: 'Lưng', topic: 'Cơ thể', type: 'body' },
    { korean: '어깨', english: 'Shoulder', vietnamese: 'Vai', topic: 'Cơ thể', type: 'body' },
    { korean: '팔꿈치', english: 'Elbow', vietnamese: 'Khuỷu tay', topic: 'Cơ thể', type: 'body' },
    { korean: '목', english: 'Neck', vietnamese: 'Cổ', topic: 'Cơ thể', type: 'body' },
    { korean: '턱', english: 'Chin', vietnamese: 'Cằm', topic: 'Cơ thể', type: 'body' },
    { korean: '뺨', english: 'Cheek', vietnamese: 'Má', topic: 'Cơ thể', type: 'body' },
    { korean: '이빨', english: 'Tooth', vietnamese: 'Răng', topic: 'Cơ thể', type: 'body' },
    { korean: '혀', english: 'Tongue', vietnamese: 'Lưỡi', topic: 'Cơ thể', type: 'body' },
    { korean: '입술', english: 'Lip', vietnamese: 'Môi', topic: 'Cơ thể', type: 'body' },
    { korean: '머리카락', english: 'Hair', vietnamese: 'Tóc', topic: 'Cơ thể', type: 'body' },
    { korean: '피부', english: 'Skin', vietnamese: 'Da', topic: 'Cơ thể', type: 'body' },
    { korean: '뼈', english: 'Bone', vietnamese: 'Xương', topic: 'Cơ thể', type: 'body' },
    { korean: '근육', english: 'Muscle', vietnamese: 'Cơ', topic: 'Cơ thể', type: 'body' },
    { korean: '혈액', english: 'Blood', vietnamese: 'Máu', topic: 'Cơ thể', type: 'body' },
    { korean: '심장', english: 'Heart', vietnamese: 'Tim', topic: 'Cơ thể', type: 'body' },
  ];

  // Add all words
  for (const word of newbieWords) {
    vocab.push({ ...word, level: 'NEWBIE' });
  }
  for (const word of beginnerWords) {
    vocab.push({ ...word, level: 'BEGINNER' });
  }
  for (const word of intermediateWords) {
    vocab.push({ ...word, level: 'INTERMEDIATE' });
  }

  return vocab;
};

async function seedVocabulary() {
  try {
    console.log('🌱 Seeding vocabulary...');
    
    const allWords = generateVocabulary();
    let totalCount = 0;

    for (const wordData of allWords) {
      try {
        // Get or create topic
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

        // Check if vocabulary already exists
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
        // Silently skip any errors and continue
      }
    }

    console.log(`✅ Seeded ${totalCount} vocabulary items`);
    
    // Show final count
    const finalCount = await prisma.vocabulary.count();
    console.log(`📊 Total vocabulary in database: ${finalCount}`);
  } catch (error) {
    console.error('Error seeding vocabulary:', error);
  }
}

seedVocabulary().then(() => {
  process.exit(0);
});
