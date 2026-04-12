const OpenAI = require("openai");

// Create OpenAI client if API key is available
const client = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// This will be passed in from server
let prisma = null;

const setPrisma = (prismaInstance) => {
  prisma = prismaInstance;
};

/**
 * Generate a writing task from vocabulary
 * @param {string} level - NEWBIE, BEGINNER, INTERMEDIATE
 * @param {string} topic - vocabulary topic
 * @param {number} sentenceCount - number of sentences to write (default 3)
 */
async function generateWritingTask(level, topic, sentenceCount = 3) {
  if (!client) {
    throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
  }
  
  const promptMap = {
    NEWBIE: `You are an English writing teacher for beginners (A1 level).

Create a simple writing task using the topic "${topic}".

Requirements:
- Very simple (A1 beginner level)
- Ask student to write ${sentenceCount} sentences
- Use common topics they already know
- Make it fun and relatable

Return ONLY valid JSON (no markdown, no code blocks):
{
  "prompt": "Write 3 simple sentences about...",
  "vocabulary_hints": ["word1", "word2"],
  "example": "My name is...",
  "difficulty": 1
}`,

    BEGINNER: `You are an English writing teacher for elementary students (A2 level).

Create a writing task using the topic "${topic}".

Requirements:
- A2 beginner level (can use simple past tense)
- Ask student to write ${sentenceCount} sentences or 1 short paragraph
- Include 2-3 vocabulary hints
- Make it engaging

Return ONLY valid JSON:
{
  "prompt": "Write about... Use the past tense.",
  "vocabulary_hints": ["word1", "word2", "word3"],
  "example": "Yesterday I...",
  "difficulty": 2
}`,

    INTERMEDIATE: `You are an English writing teacher for intermediate students (B1 level).

Create a writing task using the topic "${topic}".

Requirements:
- B1 intermediate level
- Ask student to write a paragraph or short story
- Include 3-4 vocabulary hints
- Challenge them to use different tenses

Return ONLY valid JSON:
{
  "prompt": "Write a paragraph about...",
  "vocabulary_hints": ["word1", "word2", "word3", "word4"],
  "example": "I have always wanted to...",
  "difficulty": 3
}`,
  };

  const prompt = promptMap[level] || promptMap.NEWBIE;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from AI response");
  }

  const taskData = JSON.parse(jsonMatch[0]);

  return {
    level,
    topic,
    prompt: taskData.prompt,
    hints: taskData.vocabulary_hints || [],
    example: taskData.example || "",
    difficulty: taskData.difficulty || 1,
  };
}

/**
 * Check and score user's writing
 * @param {string} userText - User's written text
 * @param {string} topic - Topic being practiced
 * @param {string} level - User's level
 */
async function checkWriting(userText, topic, level = "BEGINNER") {
  if (!client) {
    throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
  }
  
  const systemPrompt = `You are a professional English teacher specializing in ${level} level students.

Your job is to:
1. Check the grammar, spelling, and structure
2. Identify ALL mistakes clearly
3. Provide corrections
4. Give helpful feedback (${level === "NEWBIE" ? "very simple" : "simple"} explanation)
5. Score 0-10 based on accuracy and fluency

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks):
{
  "score": 7,
  "corrected": "corrected version of full text",
  "mistakes": [
    {
      "original": "I am student",
      "correct": "I am a student",
      "rule": "Use article 'a' before singular nouns"
    }
  ],
  "feedback": "Good effort! Remember to use articles...",
  "strengths": ["You used past tense correctly"],
  "improvements": ["Add more detail", "Check spelling"],
  "level_tips": "${
    level === "NEWBIE"
      ? "Focus on simple present tense and basic vocabulary"
      : level === "BEGINNER"
        ? "Try to use past tense and longer sentences"
        : "Challenge yourself with complex structures"
  }"
}`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}\nLevel: ${level}\n\nUser wrote: "${userText}"\n\nPlease check and score this writing.`,
      },
    ],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from AI response");
  }

  const result = JSON.parse(jsonMatch[0]);

  return {
    score: Math.max(0, Math.min(10, result.score || 0)),
    corrected: result.corrected || userText,
    mistakes: result.mistakes || [],
    feedback: result.feedback || "",
    strengths: result.strengths || [],
    improvements: result.improvements || [],
    levelTips: result.level_tips || "",
  };
}

/**
 * Save writing practice result to database
 */
async function saveWritingResult(userId, taskData, userText, checkResult) {
  try {
    // Get or create topic
    let topic = await prisma.topic.findUnique({
      where: { name: taskData.topic },
    });

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: taskData.topic,
          level: taskData.level,
          description: taskData.topic,
        },
      });
    }

    // Create writing practice record
    const writingPractice = await prisma.writingPractice.create({
      data: {
        userId,
        topicId: topic.id,
        userText,
        score: checkResult.score,
        corrected: checkResult.corrected,
        feedback: JSON.stringify(checkResult),
        level: taskData.level,
      },
    });

    return writingPractice;
  } catch (error) {
    console.error("Error saving writing result:", error);
    // Don't throw, just log - we still want to return the result
    return null;
  }
}

/**
 * Get writing statistics for a user
 */
async function getUserWritingStats(userId) {
  const practices = await prisma.writingPractice.findMany({
    where: { userId },
    include: {
      topic: true,
    },
  });

  if (practices.length === 0) {
    return {
      totalPractices: 0,
      averageScore: 0,
      byLevel: {},
      byTopic: {},
    };
  }

  const byLevel = {};
  const byTopic = {};
  let totalScore = 0;

  practices.forEach((p) => {
    // By level
    if (!byLevel[p.level]) {
      byLevel[p.level] = { count: 0, totalScore: 0 };
    }
    byLevel[p.level].count += 1;
    byLevel[p.level].totalScore += p.score;

    // By topic
    if (!byTopic[p.topic.name]) {
      byTopic[p.topic.name] = { count: 0, totalScore: 0 };
    }
    byTopic[p.topic.name].count += 1;
    byTopic[p.topic.name].totalScore += p.score;

    totalScore += p.score;
  });

  // Calculate averages
  Object.keys(byLevel).forEach((level) => {
    byLevel[level].averageScore =
      byLevel[level].totalScore / byLevel[level].count;
  });

  Object.keys(byTopic).forEach((topic) => {
    byTopic[topic].averageScore =
      byTopic[topic].totalScore / byTopic[topic].count;
  });

  return {
    totalPractices: practices.length,
    averageScore: totalScore / practices.length,
    byLevel,
    byTopic,
    recentPractices: practices.slice(-5),
  };
}

module.exports = {
  setPrisma,
  generateWritingTask,
  checkWriting,
  saveWritingResult,
  getUserWritingStats,
};
