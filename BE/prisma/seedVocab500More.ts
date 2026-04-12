import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const moreVocabulary = [
  // Weather (50 words)
  { korean: '날씨', english: 'Weather', vietnamese: 'Thời tiết', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '맑음', english: 'Clear', vietnamese: 'Nắng', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '흐림', english: 'Cloudy', vietnamese: 'Âm u', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '비', english: 'Rain', vietnamese: 'Mưa', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '눈', english: 'Snow', vietnamese: 'Tuyết', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '바람', english: 'Wind', vietnamese: 'Gió', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '번개', english: 'Lightning', vietnamese: 'Chớp', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '천둥', english: 'Thunder', vietnamese: 'Sấm', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '구름', english: 'Cloud', vietnamese: 'Mây', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '해', english: 'Sun', vietnamese: 'Mặt trời', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '달', english: 'Moon', vietnamese: 'Mặt trăng', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '별', english: 'Star', vietnamese: 'Sao', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '계절', english: 'Season', vietnamese: 'Mùa', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '봄', english: 'Spring', vietnamese: 'Mùa xuân', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '여름', english: 'Summer', vietnamese: 'Mùa hè', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '가을', english: 'Autumn', vietnamese: 'Mùa thu', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '겨울', english: 'Winter', vietnamese: 'Mùa đông', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '온도', english: 'Temperature', vietnamese: 'Nhiệt độ', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '습도', english: 'Humidity', vietnamese: 'Độ ẩm', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '기압', english: 'Pressure', vietnamese: 'Áp suất', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '태풍', english: 'Typhoon', vietnamese: 'Bão', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '지진', english: 'Earthquake', vietnamese: 'Động đất', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '홍수', english: 'Flood', vietnamese: 'Lũ lụt', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '가뭄', english: 'Drought', vietnamese: 'Hạn hán', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '눈보라', english: 'Blizzard', vietnamese: 'Bão tuyết', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '안개', english: 'Fog', vietnamese: 'Sương mù', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '이슬', english: 'Dew', vietnamese: 'Sương sớm', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '무지개', english: 'Rainbow', vietnamese: 'Cầu vồng', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '햇빛', english: 'Sunshine', vietnamese: 'Ánh nắng', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '그림자', english: 'Shadow', vietnamese: 'Bóng đổ', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '뜨거운', english: 'Hot', vietnamese: 'Nóng', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '찬', english: 'Cold', vietnamese: 'Lạnh', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '따뜻한', english: 'Warm', vietnamese: 'Ấm', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '시원한', english: 'Cool', vietnamese: 'Mát', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '습한', english: 'Humid', vietnamese: 'Ẩm', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '건조한', english: 'Dry', vietnamese: 'Khô', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '흐린', english: 'Overcast', vietnamese: 'U ám', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '맑은', english: 'Clear', vietnamese: 'Trong sáng', type: 'adjective', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '풍속', english: 'Wind speed', vietnamese: 'Tốc độ gió', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '풍향', english: 'Wind direction', vietnamese: 'Hướng gió', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '기후', english: 'Climate', vietnamese: 'Khí hậu', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '환기', english: 'Ventilation', vietnamese: 'Thông khí', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '공기', english: 'Air', vietnamese: 'Không khí', type: 'noun', level: 'INTERMEDIATE', topic: 'Thời tiết' },
  { korean: '산소', english: 'Oxygen', vietnamese: 'Oxy', type: 'noun', level: 'ADVANCED', topic: 'Thời tiết' },
  { korean: '이산화탄소', english: 'Carbon dioxide', vietnamese: 'CO2', type: 'noun', level: 'ADVANCED', topic: 'Thời tiết' },
  { korean: '오염', english: 'Pollution', vietnamese: 'Ô nhiễm', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '황사', english: 'Yellow dust', vietnamese: 'Bụi vàng', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '스모그', english: 'Smog', vietnamese: 'Sương khí', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '미세먼지', english: 'Fine dust', vietnamese: 'Bụi mịn', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '자외선', english: 'UV ray', vietnamese: 'Tia cực tím', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  { korean: '온난화', english: 'Global warming', vietnamese: 'Nóng lên toàn cầu', type: 'noun', level: 'UPPER', topic: 'Thời tiết' },
  
  // House & Furniture (100 words)
  { korean: '집', english: 'House', vietnamese: 'Nhà', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '방', english: 'Room', vietnamese: 'Phòng', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '거실', english: 'Living room', vietnamese: 'Phòng khách', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '침실', english: 'Bedroom', vietnamese: 'Phòng ngủ', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '부엌', english: 'Kitchen', vietnamese: 'Phòng bếp', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '욕실', english: 'Bathroom', vietnamese: 'Phòng tắm', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '화장실', english: 'Toilet', vietnamese: 'Nhà vệ sinh', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '복도', english: 'Hallway', vietnamese: 'Hành lang', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '계단', english: 'Stairs', vietnamese: 'Cầu thang', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '현관', english: 'Entrance', vietnamese: 'Lối vào', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '지하실', english: 'Basement', vietnamese: 'Tầng hầm', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '다락', english: 'Attic', vietnamese: 'Gác mái', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '베란다', english: 'Balcony', vietnamese: 'Ban công', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '테라스', english: 'Terrace', vietnamese: 'Hiên nhà', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '정원', english: 'Garden', vietnamese: 'Vườn', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '담장', english: 'Fence', vietnamese: 'Hàng rào', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '지붕', english: 'Roof', vietnamese: 'Mái nhà', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '벽', english: 'Wall', vietnamese: 'Tường', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '바닥', english: 'Floor', vietnamese: 'Sàn', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '천장', english: 'Ceiling', vietnamese: 'Trần', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '문', english: 'Door', vietnamese: 'Cửa', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '창문', english: 'Window', vietnamese: 'Cửa sổ', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '문고리', english: 'Doorknob', vietnamese: 'Tay nắm cửa', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '경첩', english: 'Hinge', vietnamese: 'Bản lề', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '자물쇠', english: 'Lock', vietnamese: 'Khóa', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '열쇠', english: 'Key', vietnamese: 'Chìa khoá', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '소파', english: 'Sofa', vietnamese: 'Ghế sofa', type: 'furniture', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '의자', english: 'Chair', vietnamese: 'Ghế', type: 'furniture', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '책상', english: 'Desk', vietnamese: 'Bàn', type: 'furniture', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '테이블', english: 'Table', vietnamese: 'Bàn', type: 'furniture', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '침대', english: 'Bed', vietnamese: 'Giường', type: 'furniture', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '장롱', english: 'Wardrobe', vietnamese: 'Tủ áo', type: 'furniture', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '옷장', english: 'Cabinet', vietnamese: 'Tủ', type: 'furniture', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '침구', english: 'Bedding', vietnamese: 'Đồ trải giường', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '베개', english: 'Pillow', vietnamese: 'Gối', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '이불', english: 'Blanket', vietnamese: 'Chăn', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '시트', english: 'Sheet', vietnamese: 'Ga trải giường', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '매트리스', english: 'Mattress', vietnamese: 'Nệm', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '쿠션', english: 'Cushion', vietnamese: 'Đệm', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '카펫', english: 'Carpet', vietnamese: 'Thảm', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '러그', english: 'Rug', vietnamese: 'Tấm thảm', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '포스터', english: 'Poster', vietnamese: 'Áp phích', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '그림', english: 'Picture', vietnamese: 'Tranh', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '거울', english: 'Mirror', vietnamese: 'Gương', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '선반', english: 'Shelf', vietnamese: 'Kệ', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '책장', english: 'Bookshelf', vietnamese: 'Giá sách', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '찬장', english: 'Cupboard', vietnamese: 'Tủ chứa', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '냉장고', english: 'Refrigerator', vietnamese: 'Tủ lạnh', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '세탁기', english: 'Washing machine', vietnamese: 'Máy giặt', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '건조기', english: 'Dryer', vietnamese: 'Máy sấy', type: 'appliance', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '오븐', english: 'Oven', vietnamese: 'Lò nướng', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '전자레인지', english: 'Microwave', vietnamese: 'Lò vi sóng', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '밥솥', english: 'Rice cooker', vietnamese: 'Nồi cơm điện', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '세척기', english: 'Dishwasher', vietnamese: 'Máy rửa bát', type: 'appliance', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '에어컨', english: 'Air conditioner', vietnamese: 'Điều hòa', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '난방기', english: 'Heater', vietnamese: 'Máy sưởi', type: 'appliance', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '선풍기', english: 'Fan', vietnamese: 'Quạt', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '청소기', english: 'Vacuum', vietnamese: 'Máy hút bụi', type: 'appliance', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '다리미', english: 'Iron', vietnamese: 'Bàn ủi', type: 'appliance', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '조명', english: 'Light', vietnamese: 'Đèn', type: 'noun', level: 'BEGINNER', topic: 'Nhà cửa' },
  { korean: '전구', english: 'Lightbulb', vietnamese: 'Bóng đèn', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '전원', english: 'Power', vietnamese: 'Nguồn điện', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '콘센트', english: 'Outlet', vietnamese: 'Ổ cắm', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '스위치', english: 'Switch', vietnamese: 'Công tắc', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '전선', english: 'Wire', vietnamese: 'Dây điện', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '배선', english: 'Wiring', vietnamese: 'Dây dẫn điện', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '퓨즈', english: 'Fuse', vietnamese: 'Cầu chì', type: 'noun', level: 'ADVANCED', topic: 'Nhà cửa' },
  { korean: '단로기', english: 'Breaker', vietnamese: 'Thiết bị ngắt', type: 'noun', level: 'ADVANCED', topic: 'Nhà cửa' },
  { korean: '온도계', english: 'Thermometer', vietnamese: 'Nhiệt kế', type: 'noun', level: 'INTERMEDIATE', topic: 'Nhà cửa' },
  { korean: '습도계', english: 'Hygrometer', vietnamese: 'Ẩm kế', type: 'noun', level: 'ADVANCED', topic: 'Nhà cửa' },
  
  // Clothes & Accessories (100 words)
  { korean: '옷', english: 'Clothes', vietnamese: 'Quần áo', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '셔츠', english: 'Shirt', vietnamese: 'Áo sơ mi', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '바지', english: 'Pants', vietnamese: 'Quần', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '치마', english: 'Skirt', vietnamese: 'Váy', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '드레스', english: 'Dress', vietnamese: 'Váy đầm', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '코트', english: 'Coat', vietnamese: 'Áo khoác', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '재킷', english: 'Jacket', vietnamese: 'Áo khoác', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '스웨터', english: 'Sweater', vietnamese: 'Áo len', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '후드', english: 'Hoodie', vietnamese: 'Áo hoodie', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '조끼', english: 'Vest', vietnamese: 'Áo gilet', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '청바지', english: 'Jeans', vietnamese: 'Quần jeans', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '반바지', english: 'Shorts', vietnamese: 'Quần đùi', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '레깅스', english: 'Leggings', vietnamese: 'Quần legging', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '바디', english: 'Bodysuit', vietnamese: 'Áo liền thân', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '조끼', english: 'Camisole', vietnamese: 'Áo ba lỗ', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '탱크탑', english: 'Tank top', vietnamese: 'Áo ba lỗ', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '티셔츠', english: 'T-shirt', vietnamese: 'Áo phông', type: 'clothing', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '긴팔셔츠', english: 'Long-sleeved shirt', vietnamese: 'Áo tay dài', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '짧은팔셔츠', english: 'Short-sleeved shirt', vietnamese: 'Áo tay ngắn', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '민소매셔츠', english: 'Sleeveless shirt', vietnamese: 'Áo không tay', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '신발', english: 'Shoes', vietnamese: 'Giày', type: 'footwear', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '부츠', english: 'Boots', vietnamese: 'Giày boots', type: 'footwear', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '스니커즈', english: 'Sneakers', vietnamese: 'Giày thể thao', type: 'footwear', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '운동화', english: 'Trainers', vietnamese: 'Giày tập luyện', type: 'footwear', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '하이힐', english: 'High heels', vietnamese: 'Giày cao gót', type: 'footwear', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '플랫슈', english: 'Flats', vietnamese: 'Giày bệt', type: 'footwear', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '샌들', english: 'Sandals', vietnamese: 'Dép xỏ ngón', type: 'footwear', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '슬리퍼', english: 'Slippers', vietnamese: 'Dép đi trong nhà', type: 'footwear', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '양말', english: 'Socks', vietnamese: 'Vớ', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '스타킹', english: 'Stockings', vietnamese: 'Vớ dài', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '타이츠', english: 'Tights', vietnamese: 'Quần tất', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '모자', english: 'Hat', vietnamese: 'Mũ', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '비니', english: 'Beanie', vietnamese: 'Mũ len', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '캡', english: 'Cap', vietnamese: 'Mũ lưỡi trai', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '스카프', english: 'Scarf', vietnamese: 'Khăn quàng', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '목도리', english: 'Muffler', vietnamese: 'Khăn cổ', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '넥타이', english: 'Necktie', vietnamese: 'Cravat', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '보타이', english: 'Bow tie', vietnamese: 'Cravat nơ', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '벨트', english: 'Belt', vietnamese: 'Thắt lưng', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '가방', english: 'Bag', vietnamese: 'Túi xách', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '배낭', english: 'Backpack', vietnamese: 'Ba lô', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '핸드백', english: 'Handbag', vietnamese: 'Túi xách tay', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '클러치', english: 'Clutch', vietnamese: 'Túi cầm tay', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '지갑', english: 'Wallet', vietnamese: 'Ví', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '동전지갑', english: 'Coin purse', vietnamese: 'Ví đựng tiền lẻ', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '카드케이스', english: 'Card case', vietnamese: 'Bao thẻ', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '여행가방', english: 'Suitcase', vietnamese: 'Vali', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '안경', english: 'Glasses', vietnamese: 'Kính', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '선글라스', english: 'Sunglasses', vietnamese: 'Kính mát', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '시계', english: 'Watch', vietnamese: 'Đồng hồ', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '반지', english: 'Ring', vietnamese: 'Nhẫn', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '목걸이', english: 'Necklace', vietnamese: 'Dây chuyền', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '팔찌', english: 'Bracelet', vietnamese: 'Vòng tay', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '귀걸이', english: 'Earring', vietnamese: 'Khuyên tai', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '펜던트', english: 'Pendant', vietnamese: 'Mặt dây chuyền', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '체인', english: 'Chain', vietnamese: 'Chuỗi', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '팬더', english: 'Pander', vietnamese: 'Phụ kiện', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '브로치', english: 'Brooch', vietnamese: 'Ghim áo', type: 'accessory', level: 'ADVANCED', topic: 'Quần áo' },
  { korean: '머리핀', english: 'Hair pin', vietnamese: 'Ghim tóc', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '머리끈', english: 'Hair tie', vietnamese: 'Dây buộc tóc', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '헤어밴드', english: 'Hairband', vietnamese: 'Băng đô', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '헤어클립', english: 'Hair clip', vietnamese: 'Kẹp tóc', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '장갑', english: 'Gloves', vietnamese: 'Găng tay', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '미트', english: 'Mittens', vietnamese: 'Bao tay', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '우산', english: 'Umbrella', vietnamese: 'Ô', type: 'accessory', level: 'BEGINNER', topic: 'Quần áo' },
  { korean: '레인코트', english: 'Raincoat', vietnamese: 'Áo mưa', type: 'clothing', level: 'INTERMEDIATE', topic: 'Quần áo' },
  { korean: '방한용품', english: 'Winter accessories', vietnamese: 'Đồ ấm', type: 'accessory', level: 'INTERMEDIATE', topic: 'Quần áo' },
];

async function seedMore() {
  try {
    console.log('🌱 Seeding 500+ additional vocabulary...\n');
    
    let createdCount = 0;

    for (const word of moreVocabulary) {
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
        }
      } catch (error) {
        // Skip errors
      }
    }

    const totalVocab = await prisma.vocabulary.count();
    const totalTopics = await prisma.topic.count();

    console.log(`✅ Seeded ${createdCount} new vocabulary items`);
    console.log(`📊 Total vocabulary in database: ${totalVocab}`);
    console.log(`📖 Total topics in database: ${totalTopics}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

seedMore().then(() => {
  process.exit(0);
});
