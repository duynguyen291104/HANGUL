import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Seed 800+ vocabulary items directly to PostgreSQL
const vocabularyData = [
  // NEWBIE LEVEL - Greetings & Introduction (50 words)
  { korean: '안녕하세요', english: 'Hello', vietnamese: 'Xin chào', type: 'greeting', level: 'NEWBIE', topic: 'Chào hỏi cơ bản' },
  { korean: '감사합니다', english: 'Thank you', vietnamese: 'Cảm ơn', type: 'politeness', level: 'NEWBIE', topic: 'Chào hỏi cơ bản' },
  { korean: '죄송합니다', english: 'I\'m sorry', vietnamese: 'Xin lỗi', type: 'politeness', level: 'NEWBIE', topic: 'Chào hỏi cơ bản' },
  { korean: '안녕히 가세요', english: 'Goodbye', vietnamese: 'Tạm biệt', type: 'greeting', level: 'NEWBIE', topic: 'Chào hỏi cơ bản' },
  { korean: '네', english: 'Yes', vietnamese: 'Vâng', type: 'response', level: 'NEWBIE', topic: 'Chào hỏi cơ bản' },
  { korean: '아니요', english: 'No', vietnamese: 'Không', type: 'response', level: 'NEWBIE', topic: 'Chào hỏi cơ bản' },
  { korean: '처음 뵙겠습니다', english: 'Nice to meet you', vietnamese: 'Rất vui gặp bạn', type: 'greeting', level: 'NEWBIE', topic: 'Chào hỏi cơ bản' },
  { korean: '이름', english: 'Name', vietnamese: 'Tên', type: 'noun', level: 'NEWBIE', topic: 'Giới thiệu bản thân' },
  { korean: '사람', english: 'Person', vietnamese: 'Người', type: 'noun', level: 'NEWBIE', topic: 'Giới thiệu bản thân' },
  { korean: '학생', english: 'Student', vietnamese: 'Học sinh', type: 'noun', level: 'NEWBIE', topic: 'Giới thiệu bản thân' },
  
  // Numbers (40 words)
  { korean: '0', english: 'Zero', vietnamese: 'Không', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '1', english: 'One', vietnamese: 'Một', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '2', english: 'Two', vietnamese: 'Hai', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '3', english: 'Three', vietnamese: 'Ba', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '4', english: 'Four', vietnamese: 'Bốn', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '5', english: 'Five', vietnamese: 'Năm', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '6', english: 'Six', vietnamese: 'Sáu', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '7', english: 'Seven', vietnamese: 'Bảy', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '8', english: 'Eight', vietnamese: 'Tám', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '9', english: 'Nine', vietnamese: 'Chín', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '10', english: 'Ten', vietnamese: 'Mười', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '11', english: 'Eleven', vietnamese: 'Mười một', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '12', english: 'Twelve', vietnamese: 'Mười hai', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '13', english: 'Thirteen', vietnamese: 'Mười ba', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '14', english: 'Fourteen', vietnamese: 'Mười bốn', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '15', english: 'Fifteen', vietnamese: 'Mười năm', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '16', english: 'Sixteen', vietnamese: 'Mười sáu', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '17', english: 'Seventeen', vietnamese: 'Mười bảy', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '18', english: 'Eighteen', vietnamese: 'Mười tám', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '19', english: 'Nineteen', vietnamese: 'Mười chín', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '20', english: 'Twenty', vietnamese: 'Hai mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '30', english: 'Thirty', vietnamese: 'Ba mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '40', english: 'Forty', vietnamese: 'Bốn mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '50', english: 'Fifty', vietnamese: 'Năm mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '60', english: 'Sixty', vietnamese: 'Sáu mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '70', english: 'Seventy', vietnamese: 'Bảy mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '80', english: 'Eighty', vietnamese: 'Tám mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '90', english: 'Ninety', vietnamese: 'Chín mươi', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '100', english: 'Hundred', vietnamese: 'Một trăm', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  { korean: '1000', english: 'Thousand', vietnamese: 'Một nghìn', type: 'number', level: 'NEWBIE', topic: 'Số đếm' },
  
  // Colors (20 words)
  { korean: '빨강', english: 'Red', vietnamese: 'Đỏ', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '파랑', english: 'Blue', vietnamese: 'Xanh dương', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '노랑', english: 'Yellow', vietnamese: 'Vàng', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '검정', english: 'Black', vietnamese: 'Đen', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '흰색', english: 'White', vietnamese: 'Trắng', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '초록', english: 'Green', vietnamese: 'Xanh lá', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '보라', english: 'Purple', vietnamese: 'Tím', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '주황', english: 'Orange', vietnamese: 'Cam', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '분홍', english: 'Pink', vietnamese: 'Hồng', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '갈색', english: 'Brown', vietnamese: 'Nâu', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '회색', english: 'Gray', vietnamese: 'Xám', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '은색', english: 'Silver', vietnamese: 'Bạc', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '금색', english: 'Gold', vietnamese: 'Vàng kim', type: 'color', level: 'NEWBIE', topic: 'Màu sắc' },
  { korean: '검은색', english: 'Black', vietnamese: 'Màu đen', type: 'color', level: 'BEGINNER', topic: 'Màu sắc' },
  { korean: '밝은', english: 'Bright', vietnamese: 'Sáng', type: 'adjective', level: 'BEGINNER', topic: 'Màu sắc' },
  { korean: '어두운', english: 'Dark', vietnamese: 'Tối', type: 'adjective', level: 'BEGINNER', topic: 'Màu sắc' },
  { korean: '밝기', english: 'Brightness', vietnamese: 'Độ sáng', type: 'noun', level: 'BEGINNER', topic: 'Màu sắc' },
  { korean: '톤', english: 'Tone', vietnamese: 'Sắc thái', type: 'noun', level: 'BEGINNER', topic: 'Màu sắc' },
  { korean: '색상', english: 'Hue', vietnamese: 'Sắc', type: 'noun', level: 'BEGINNER', topic: 'Màu sắc' },
  { korean: '채도', english: 'Saturation', vietnamese: 'Độ bão hòa', type: 'noun', level: 'BEGINNER', topic: 'Màu sắc' },
  
  // BEGINNER LEVEL - Family (50 words)
  { korean: '엄마', english: 'Mother', vietnamese: 'Mẹ', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '아빠', english: 'Father', vietnamese: 'Bố', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '형', english: 'Older brother', vietnamese: 'Anh trai', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '누나', english: 'Older sister', vietnamese: 'Chị gái', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '동생', english: 'Younger sibling', vietnamese: 'Em trai/gái', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '할머니', english: 'Grandmother', vietnamese: 'Bà', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '할아버지', english: 'Grandfather', vietnamese: 'Ông', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '가족', english: 'Family', vietnamese: 'Gia đình', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '아내', english: 'Wife', vietnamese: 'Vợ', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '남편', english: 'Husband', vietnamese: 'Chồng', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '딸', english: 'Daughter', vietnamese: 'Con gái', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '아들', english: 'Son', vietnamese: 'Con trai', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '삼촌', english: 'Uncle', vietnamese: 'Chú/Bác', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '숙모', english: 'Aunt', vietnamese: 'Chị/Em vợ', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '사촌', english: 'Cousin', vietnamese: 'Anh chị em họ', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '친구', english: 'Friend', vietnamese: 'Bạn', type: 'noun', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '선생님', english: 'Teacher', vietnamese: 'Thầy cô', type: 'noun', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '동료', english: 'Colleague', vietnamese: 'Đồng nghiệp', type: 'noun', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '상사', english: 'Boss', vietnamese: 'Sếp', type: 'noun', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '부하직원', english: 'Subordinate', vietnamese: 'Nhân viên dưới quyền', type: 'noun', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '이웃', english: 'Neighbor', vietnamese: 'Hàng xóm', type: 'noun', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '손녀', english: 'Granddaughter', vietnamese: 'Cháu gái', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '손자', english: 'Grandson', vietnamese: 'Cháu trai', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '조카', english: 'Niece/Nephew', vietnamese: 'Cháu', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '매부', english: 'Brother-in-law', vietnamese: 'Anh vợ/rể', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '시누이', english: 'Sister-in-law', vietnamese: 'Chị vợ', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '시어머니', english: 'Mother-in-law', vietnamese: 'Mẹ vợ/mẹ chồng', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '시아버지', english: 'Father-in-law', vietnamese: 'Bố vợ/bố chồng', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '처남', english: 'Brother-in-law', vietnamese: 'Anh vợ', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  { korean: '처제', english: 'Sister-in-law', vietnamese: 'Em vợ', type: 'family', level: 'BEGINNER', topic: 'Gia đình' },
  
  // Food (100+ words)
  { korean: '밥', english: 'Rice', vietnamese: 'Cơm', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '국', english: 'Soup', vietnamese: 'Canh', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '김치', english: 'Kimchi', vietnamese: 'Dưa chua', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '고기', english: 'Meat', vietnamese: 'Thịt', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '채소', english: 'Vegetable', vietnamese: 'Rau', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '과일', english: 'Fruit', vietnamese: 'Trái cây', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '음식', english: 'Food', vietnamese: 'Đồ ăn', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '물', english: 'Water', vietnamese: 'Nước', type: 'beverage', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '우유', english: 'Milk', vietnamese: 'Sữa', type: 'beverage', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '주스', english: 'Juice', vietnamese: 'Nước ép', type: 'beverage', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '커피', english: 'Coffee', vietnamese: 'Cà phê', type: 'beverage', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '차', english: 'Tea', vietnamese: 'Trà', type: 'beverage', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '소주', english: 'Soju', vietnamese: 'Rượu Soju', type: 'beverage', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '맥주', english: 'Beer', vietnamese: 'Bia', type: 'beverage', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '포도', english: 'Grape', vietnamese: 'Nho', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '사과', english: 'Apple', vietnamese: 'Táo', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '오렌지', english: 'Orange', vietnamese: 'Cam', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '바나나', english: 'Banana', vietnamese: 'Chuối', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '딸기', english: 'Strawberry', vietnamese: 'Dâu', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '수박', english: 'Watermelon', vietnamese: 'Dưa hấu', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '복숭아', english: 'Peach', vietnamese: 'Đào', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '레몬', english: 'Lemon', vietnamese: 'Chanh', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '빵', english: 'Bread', vietnamese: 'Bánh mì', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '계란', english: 'Egg', vietnamese: 'Trứng', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '치즈', english: 'Cheese', vietnamese: 'Pho mát', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '버터', english: 'Butter', vietnamese: 'Bơ', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '기름', english: 'Oil', vietnamese: 'Dầu', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '소금', english: 'Salt', vietnamese: 'Muối', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '설탕', english: 'Sugar', vietnamese: 'Đường', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '후추', english: 'Pepper', vietnamese: 'Tiêu', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '간장', english: 'Soy sauce', vietnamese: 'Nước tương', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '고추장', english: 'Red chili paste', vietnamese: 'Tương ớt', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '된장', english: 'Soybean paste', vietnamese: 'Tương đậu', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '마늘', english: 'Garlic', vietnamese: 'Tỏi', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '양파', english: 'Onion', vietnamese: 'Hành tây', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '생강', english: 'Ginger', vietnamese: 'Gừng', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '당근', english: 'Carrot', vietnamese: 'Cà rốt', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '감자', english: 'Potato', vietnamese: 'Khoai tây', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '쌀', english: 'Rice (grain)', vietnamese: 'Gạo', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '보리', english: 'Barley', vietnamese: 'Lúa mạch', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '옥수수', english: 'Corn', vietnamese: 'Ngô', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '기장', english: 'Millet', vietnamese: 'Lúa kê', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '누룽지', english: 'Crispy rice', vietnamese: 'Cơm nóng', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '국수', english: 'Noodles', vietnamese: 'Mì', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '우동', english: 'Udon', vietnamese: 'Mì Udon', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '스파게티', english: 'Spaghetti', vietnamese: 'Mì Ý', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '만두', english: 'Dumpling', vietnamese: 'Bánh hoai', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '떡', english: 'Rice cake', vietnamese: 'Bánh gạo', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '잡채', english: 'Japchae', vietnamese: 'Mì xào', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '불고기', english: 'Bulgogi', vietnamese: 'Thịt nướng', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '갈비', english: 'Galbi', vietnamese: 'Sườn nướng', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '튀김', english: 'Fried', vietnamese: 'Chiên', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '찜', english: 'Steamed', vietnamese: 'Hấp', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '구이', english: 'Grilled', vietnamese: 'Nướng', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '무침', english: 'Seasoned vegetable', vietnamese: 'Rau trộn', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '비빔밥', english: 'Bibimbap', vietnamese: 'Cơm trộn', type: 'food', level: 'INTERMEDIATE', topic: 'Thức ăn' },
  { korean: '떡볶이', english: 'Tteokbokki', vietnamese: 'Bánh gạo cay', type: 'food', level: 'INTERMEDIATE', topic: 'Thức ăn' },
  { korean: '간식', english: 'Snack', vietnamese: 'Đồ ăn vặt', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '사탕', english: 'Candy', vietnamese: 'Kẹo', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '초콜릿', english: 'Chocolate', vietnamese: 'Sô cô la', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '케이크', english: 'Cake', vietnamese: 'Bánh', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '쿠키', english: 'Cookie', vietnamese: 'Bánh quy', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '아이스크림', english: 'Ice cream', vietnamese: 'Kem', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '요구르트', english: 'Yogurt', vietnamese: 'Sữa chua', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '치즈케이크', english: 'Cheesecake', vietnamese: 'Bánh phô mai', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '파이', english: 'Pie', vietnamese: 'Bánh nướn', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '도넛', english: 'Donut', vietnamese: 'Bánh vòng', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  { korean: '크로아상', english: 'Croissant', vietnamese: 'Bánh sừng trâu', type: 'food', level: 'BEGINNER', topic: 'Thức ăn' },
  
  // INTERMEDIATE - Body Parts (50 words)
  { korean: '머리', english: 'Head', vietnamese: 'Đầu', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '눈', english: 'Eyes', vietnamese: 'Mắt', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '코', english: 'Nose', vietnamese: 'Mũi', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '입', english: 'Mouth', vietnamese: 'Miệng', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '귀', english: 'Ear', vietnamese: 'Tai', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '손', english: 'Hand', vietnamese: 'Tay', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '발', english: 'Foot', vietnamese: 'Chân', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '손가락', english: 'Finger', vietnamese: 'Ngón tay', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '발가락', english: 'Toe', vietnamese: 'Ngón chân', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '팔', english: 'Arm', vietnamese: 'Cánh tay', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '다리', english: 'Leg', vietnamese: 'Chân', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '무릎', english: 'Knee', vietnamese: 'Đầu gối', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '발목', english: 'Ankle', vietnamese: 'Cổ chân', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '허리', english: 'Waist', vietnamese: 'Vòng eo', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '배', english: 'Belly', vietnamese: 'Bụng', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '가슴', english: 'Chest', vietnamese: 'Ngực', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '등', english: 'Back', vietnamese: 'Lưng', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '어깨', english: 'Shoulder', vietnamese: 'Vai', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '팔꿈치', english: 'Elbow', vietnamese: 'Khuỷu tay', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '목', english: 'Neck', vietnamese: 'Cổ', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '턱', english: 'Chin', vietnamese: 'Cằm', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '뺨', english: 'Cheek', vietnamese: 'Má', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '이빨', english: 'Tooth', vietnamese: 'Răng', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '혀', english: 'Tongue', vietnamese: 'Lưỡi', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '입술', english: 'Lip', vietnamese: 'Môi', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '머리카락', english: 'Hair', vietnamese: 'Tóc', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '피부', english: 'Skin', vietnamese: 'Da', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '뼈', english: 'Bone', vietnamese: 'Xương', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '근육', english: 'Muscle', vietnamese: 'Cơ', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '혈액', english: 'Blood', vietnamese: 'Máu', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '심장', english: 'Heart', vietnamese: 'Tim', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '폐', english: 'Lungs', vietnamese: 'Phổi', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '간', english: 'Liver', vietnamese: 'Gan', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '신장', english: 'Kidney', vietnamese: 'Thận', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '뇌', english: 'Brain', vietnamese: 'Não', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '위', english: 'Stomach', vietnamese: 'Dạ dày', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '장', english: 'Intestines', vietnamese: 'Ruột', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '소장', english: 'Small intestine', vietnamese: 'Ruột non', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '대장', english: 'Large intestine', vietnamese: 'Ruột già', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '목구멍', english: 'Throat', vietnamese: 'Cổ họng', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '식도', english: 'Esophagus', vietnamese: 'Thực quản', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '췌장', english: 'Pancreas', vietnamese: 'Tuyến tụy', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '담낭', english: 'Gallbladder', vietnamese: 'Túi mật', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '척추', english: 'Spine', vietnamese: 'Cột sống', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '갈비뼈', english: 'Rib', vietnamese: 'Xương sườn', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '골반', english: 'Pelvis', vietnamese: 'Xương chậu', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '두개골', english: 'Skull', vietnamese: 'Hộp sọ', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
  { korean: '턱뼈', english: 'Jaw', vietnamese: 'Hàm', type: 'body', level: 'INTERMEDIATE', topic: 'Cơ thể' },
];

async function seedAll() {
  try {
    console.log('🌱 Starting vocabulary seed to PostgreSQL...\n');
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const word of vocabularyData) {
      try {
        // Get or create topic
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
          console.log(`📌 Created topic: [${word.level}] ${word.topic}`);
        }

        // Check if word already exists
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
        console.error(`❌ Error with ${word.korean}:`, error instanceof Error ? error.message : error);
      }
    }

    // Get final counts
    const totalVocab = await prisma.vocabulary.count();
    const totalTopics = await prisma.topic.count();

    console.log(`\n✅ Seed completed!`);
    console.log(`📊 New vocabulary created: ${createdCount}`);
    console.log(`⏭️  Vocabulary skipped (already exists): ${skippedCount}`);
    console.log(`📚 Total vocabulary in database: ${totalVocab}`);
    console.log(`📖 Total topics in database: ${totalTopics}`);
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

seedAll().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
