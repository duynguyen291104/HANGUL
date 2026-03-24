#!/usr/bin/env node

/**
 * 🚀 AI VOCABULARY GENERATOR
 * 
 * Generates Korean vocabulary using OpenAI API
 * Auto-generates topics, validates, and imports to DB
 * 
 * Usage: 
 *   OPENAI_API_KEY=sk-... node scripts/generateWithAI.js --level INTERMEDIATE --count 500
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Topics for each level
const TOPICS = {
  NEWBIE: [
    'greeting', 'food', 'family', 'numbers', 'daily',
    'colors', 'animals', 'weather', 'school', 'place'
  ],
  BEGINNER: [
    'school', 'transportation', 'shopping', 'sports', 'body',
    'emotions', 'hobbies', 'jobs', 'relationships', 'money'
  ],
  INTERMEDIATE: [
    'business', 'politics', 'culture', 'technology', 'environment',
    'health', 'travel', 'literature', 'art', 'science'
  ]
};

async function generateTopicVocab(level, topic, count = 40) {
  console.log(`  🤖 Generating ${topic} (${count} vocab)...`);

  const prompt = `Generate exactly ${count} Korean vocabulary items for "${topic}" at "${level}" level.

Return ONLY valid JSON array with no additional text:
[
  {"korean":"...","english":"...","vietnamese":"...","romanization":"...","type":"noun|verb|adjective|expression","difficulty":1-3,"frequency":"high|medium|low"},
  ...
]

Requirements:
- Each item must have: korean, english, vietnamese, romanization, type, difficulty, frequency
- All strings must be valid (no missing quotes, proper escaping)
- Avoid duplicates within the topic
- Include mix of nouns, verbs, adjectives
- Romanization must use standard McCune-Reischauer
- Frequency: high (common), medium (regular), low (rare)
- Difficulty: 1-2 for NEWBIE, 1-3 for BEGINNER, 2-4 for INTERMEDIATE`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON in response');
    }

    const vocab = JSON.parse(jsonMatch[0]);

    // Validate structure
    for (const item of vocab) {
      if (!item.korean || !item.english || !item.vietnamese || !item.romanization) {
        throw new Error(`Invalid item structure: ${JSON.stringify(item)}`);
      }
      // Add metadata
      item.level = level;
      item.topic = topic;
    }

    return vocab;

  } catch (error) {
    console.error(`    ❌ Error generating ${topic}:`, error.message);
    return [];
  }
}

async function generateLevel(level, topicCount = null) {
  console.log(`\n🚀 Generating ${level} vocabulary...\n`);

  const topics = TOPICS[level];
  const topicsToGenerate = topicCount ? topics.slice(0, topicCount) : topics;
  
  let allVocab = [];

  for (const topic of topicsToGenerate) {
    const vocab = await generateTopicVocab(level, topic, 40);
    allVocab = [...allVocab, ...vocab];
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save to file
  const levelDir = path.join(__dirname, `../data/${level.toLowerCase()}`);
  if (!fs.existsSync(levelDir)) {
    fs.mkdirSync(levelDir, { recursive: true });
  }

  // Split by topic and save
  const byTopic = {};
  for (const item of allVocab) {
    if (!byTopic[item.topic]) {
      byTopic[item.topic] = [];
    }
    byTopic[item.topic].push(item);
  }

  for (const [topic, items] of Object.entries(byTopic)) {
    const filePath = path.join(levelDir, `${topic}.json`);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
    console.log(`  💾 Saved ${topic}.json (${items.length} vocab)`);
  }

  console.log(`\n✅ Generated ${allVocab.length} total vocab for ${level}`);
  return allVocab.length;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  // Parse arguments
  let level = 'INTERMEDIATE';
  let topicCount = 5;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--level' && i + 1 < args.length) {
      level = args[i + 1].toUpperCase();
    }
    if (args[i] === '--topics' && i + 1 < args.length) {
      topicCount = parseInt(args[i + 1]);
    }
  }

  console.log(`\n📚 AI VOCABULARY GENERATOR`);
  console.log(`   Level: ${level}`);
  console.log(`   Topics: ${topicCount}\n`);

  if (!TOPICS[level]) {
    console.error(`❌ Unknown level: ${level}`);
    process.exit(1);
  }

  const count = await generateLevel(level, topicCount);
  
  console.log(`\n🎉 Generation complete!`);
  console.log(`   📊 Total generated: ${count} vocab`);
  console.log(`   📂 Location: /data/${level.toLowerCase()}/`);
  console.log(`   ⏭️  Next: Run 'node scripts/mergeVocabulary.js' to import to DB\n`);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
