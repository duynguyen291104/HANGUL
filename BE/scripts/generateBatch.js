#!/usr/bin/env node

/**
 *  BATCH VOCABULARY GENERATOR (5000+ vocab)
 * 
 * Generates ALL vocabulary for system:
 * - NEWBIE: 10 topics × 40 = 400 vocab
 * - BEGINNER: 10 topics × 40 = 400 vocab  
 * - INTERMEDIATE: 10 topics × 40 = 400 vocab
 * TOTAL: ~1200 vocab (easily scalable to 5000+)
 * 
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generateBatch.js
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Comprehensive topic map for scaling
const VOCAB_PLAN = {
  NEWBIE: [
    { topic: 'greeting', count: 50 },
    { topic: 'food', count: 50 },
    { topic: 'family', count: 50 },
    { topic: 'numbers', count: 50 },
    { topic: 'daily', count: 50 },
    { topic: 'colors', count: 40 },
    { topic: 'animals', count: 40 },
    { topic: 'school', count: 40 },
    { topic: 'place', count: 40 },
    { topic: 'weather', count: 40 }
  ],
  BEGINNER: [
    { topic: 'school_advanced', count: 50 },
    { topic: 'transportation', count: 50 },
    { topic: 'shopping', count: 50 },
    { topic: 'sports', count: 50 },
    { topic: 'body', count: 50 },
    { topic: 'emotions', count: 40 },
    { topic: 'hobbies', count: 40 },
    { topic: 'jobs', count: 40 },
    { topic: 'relationships', count: 40 },
    { topic: 'money', count: 40 }
  ],
  INTERMEDIATE: [
    { topic: 'business', count: 50 },
    { topic: 'politics', count: 50 },
    { topic: 'culture', count: 50 },
    { topic: 'technology', count: 50 },
    { topic: 'environment', count: 50 },
    { topic: 'health', count: 40 },
    { topic: 'travel', count: 40 },
    { topic: 'literature', count: 40 },
    { topic: 'art', count: 40 },
    { topic: 'science', count: 40 }
  ]
};

async function generateTopic(level, topic, count) {
  console.log(`  🤖 ${topic.padEnd(20)} [${count} vocab]...`);

  const prompt = `Generate exactly ${count} Korean vocabulary items for topic "${topic}" at "${level}" CEFR level.

Return ONLY valid JSON array:
[
  {
    "korean": "단어",
    "english": "word",
    "vietnamese": "từ",
    "romanization": "daneeo",
    "type": "noun|verb|adjective|expression",
    "difficulty": ${level === 'NEWBIE' ? '1-2' : level === 'BEGINNER' ? '1-3' : '2-4'},
    "frequency": "high|medium|low"
  }
]

Must have ALL fields. No missing quotes. Valid JSON only.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.6,
      max_tokens: 4000,
      timeout: 30000
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.log(`     Invalid JSON`);
      return [];
    }

    const vocab = JSON.parse(jsonMatch[0]);

    // Validate
    for (const item of vocab) {
      if (!item.korean || !item.english || !item.vietnamese) {
        return [];
      }
      item.level = level;
      item.topic = topic;
    }

    console.log(`     ${vocab.length} vocab`);
    return vocab;

  } catch (error) {
    console.log(`     Error`);
    return [];
  }
}

async function generateLevel(level) {
  console.log(`\n ${level} Level\n`);

  const plan = VOCAB_PLAN[level];
  let levelVocab = [];
  let totalCount = 0;

  for (const { topic, count } of plan) {
    const vocab = await generateTopic(level, topic, count);
    levelVocab = [...levelVocab, ...vocab];
    totalCount += count;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save by topic
  const levelDir = path.join(__dirname, `../data/${level.toLowerCase()}`);
  fs.mkdirSync(levelDir, { recursive: true });

  const byTopic = {};
  for (const item of levelVocab) {
    if (!byTopic[item.topic]) byTopic[item.topic] = [];
    byTopic[item.topic].push(item);
  }

  for (const [topic, items] of Object.entries(byTopic)) {
    const file = path.join(levelDir, `${topic}.json`);
    fs.writeFileSync(file, JSON.stringify(items, null, 2));
  }

  console.log(`\n ${level}: ${levelVocab.length} vocab (planned: ${totalCount})`);
  return levelVocab.length;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error(' OPENAI_API_KEY not set');
    process.exit(1);
  }

  console.log('\n BATCH VOCABULARY GENERATOR\n');
  console.log(' Generation Plan:');
  console.log(`   NEWBIE: ${VOCAB_PLAN.NEWBIE.length} topics`);
  console.log(`   BEGINNER: ${VOCAB_PLAN.BEGINNER.length} topics`);
  console.log(`   INTERMEDIATE: ${VOCAB_PLAN.INTERMEDIATE.length} topics`);
  console.log(`   TOTAL: ~1200 vocab (easily scale to 5000+)\n`);

  let total = 0;

  // Generate each level
  for (const level of ['NEWBIE', 'BEGINNER', 'INTERMEDIATE']) {
    const count = await generateLevel(level);
    total += count;
  }

  console.log(`\n🎉 Generation Complete!`);
  console.log(`    Total: ${total} vocab`);
  console.log(`   ⏭️  Merge command:`);
  console.log(`       cd /home/ngocduy/HANGUL/BE && node scripts/mergeVocabulary.js\n`);
}

main().catch(error => {
  console.error('💥 Error:', error.message);
  process.exit(1);
});
