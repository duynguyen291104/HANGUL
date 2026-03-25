#!/usr/bin/env node

/**
 * Script để enhance vocabulary files
 * Thêm examples và tags vào newbie/ và beginner/ files
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = '/home/ngocduy/HANGUL/BE/data';
const LEVELS = ['newbie', 'beginner'];

// Hàm sinh example sentences
function generateExamples(vocab) {
  const { korean, vietnamese, english, topic } = vocab;
  
  // Tạo examples dựa trên topic
  const examples = [];
  
  // Mẫu câu cơ bản cho các topic khác nhau
  const exampleTemplates = {
    greeting: [
      {
        korean: `${korean}. 저는 ${vocab.korean === '안녕하세요' ? '새로운 친구입니다' : '학생입니다'}.`,
        vietnamese: `${vietnamese}. Tôi là học sinh.`,
        english: `${english}. I am a student.`
      }
    ],
    food: [
      {
        korean: `나는 ${korean}을/를 먹는다.`,
        vietnamese: `Tôi ăn ${vietnamese}.`,
        english: `I eat ${english}.`
      }
    ],
    family: [
      {
        korean: `나의 ${korean}는 착하다.`,
        vietnamese: `${vietnamese} của tôi rất tốt.`,
        english: `My ${english} is nice.`
      }
    ],
    school: [
      {
        korean: `${korean}에서 공부한다.`,
        vietnamese: `Học tập tại ${vietnamese}.`,
        english: `Study at ${english}.`
      }
    ],
    transportation: [
      {
        korean: `${korean}를 타다.`,
        vietnamese: `Đi bằng ${vietnamese}.`,
        english: `Take the ${english}.`
      }
    ],
    shopping: [
      {
        korean: `${korean}를 사다.`,
        vietnamese: `Mua ${vietnamese}.`,
        english: `Buy ${english}.`
      }
    ],
    sports: [
      {
        korean: `${korean}를 하다.`,
        vietnamese: `Chơi ${vietnamese}.`,
        english: `Play ${english}.`
      }
    ],
    body: [
      {
        korean: `나의 ${korean}는 건강하다.`,
        vietnamese: `${vietnamese} của tôi khỏe.`,
        english: `My ${english} is healthy.`
      }
    ],
    daily: [
      {
        korean: `매일 ${korean}한다.`,
        vietnamese: `Hàng ngày ${vietnamese}.`,
        english: `${english} every day.`
      }
    ],
    numbers: [
      {
        korean: `숫자: ${korean}`,
        vietnamese: `Số: ${vietnamese}`,
        english: `Number: ${english}`
      }
    ]
  };

  // Lấy examples từ template hoặc tạo generic
  if (exampleTemplates[topic]) {
    return exampleTemplates[topic];
  }
  
  // Generic example nếu không có template
  return [
    {
      korean: `${korean}는 중요하다.`,
      vietnamese: `${vietnamese} rất quan trọng.`,
      english: `${english} is important.`
    }
  ];
}

// Hàm tạo tags từ topic
function generateTags(vocab) {
  const { topic, type, level } = vocab;
  const tags = [topic];
  
  // Thêm tags dựa trên type
  if (type === 'noun') tags.push('noun', 'thing');
  if (type === 'verb') tags.push('verb', 'action');
  if (type === 'adjective') tags.push('adjective', 'description');
  if (type === 'expression') tags.push('expression', 'phrase');
  
  // Thêm tags dựa trên level
  if (level === 'NEWBIE') tags.push('beginner');
  if (level === 'BEGINNER') tags.push('intermediate');
  
  return [...new Set(tags)]; // Remove duplicates
}

// Main function
async function enhanceFiles() {
  console.log('🔧 Enhancing vocabulary files...\n');
  
  try {
    for (const level of LEVELS) {
      const levelDir = path.join(DATA_DIR, level);
      
      if (!fs.existsSync(levelDir)) {
        console.log(`⏭️  Skipping ${level} (not found)`);
        continue;
      }
      
      const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(levelDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        let vocabs = JSON.parse(content);
        
        // Ensure it's an array
        if (!Array.isArray(vocabs)) {
          vocabs = [vocabs];
        }
        
        console.log(` Processing: ${level}/${file}`);
        
        // Enhance each vocab
        vocabs = vocabs.map(vocab => {
          // Add examples if not exist
          if (!vocab.examples) {
            vocab.examples = generateExamples(vocab);
          }
          
          // Add tags if not exist
          if (!vocab.tags) {
            vocab.tags = generateTags(vocab);
          }
          
          return vocab;
        });
        
        // Write back
        fs.writeFileSync(filePath, JSON.stringify(vocabs, null, 2), 'utf8');
        console.log(`    Enhanced ${vocabs.length} items\n`);
      }
    }
    
    console.log('✨ Enhancement complete!\n');
    
    // Delete vocabularies.json
    const vocabPath = path.join(DATA_DIR, 'vocabularies.json');
    if (fs.existsSync(vocabPath)) {
      fs.unlinkSync(vocabPath);
      console.log('🗑️  Deleted: /data/vocabularies.json\n');
    }
    
    console.log(' All done! Summary:');
    console.log('    Added examples to all vocab items');
    console.log('    Added tags to all vocab items');
    console.log('    Deleted vocabularies.json\n');
    
  } catch (error) {
    console.error(' Error:', error.message);
    process.exit(1);
  }
}

enhanceFiles();
