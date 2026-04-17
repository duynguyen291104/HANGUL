import prisma from './src/lib/prisma';

async function main() {
  try {
    console.log('🌱 Starting to seed quiz questions...');

    // Get all topics
    const topics = await prisma.topic.findMany({
      include: {
        vocabulary: {
          take: 10,
        },
      },
    });

    console.log(`📚 Found ${topics.length} topics`);

    let questionsCreated = 0;

    for (const topic of topics) {
      // Get vocabulary for this topic
      const vocabItems = await prisma.vocabulary.findMany({
        where: { topicId: topic.id },
        take: 10,
      });

      if (vocabItems.length < 4) {
        console.log(`⚠️ Topic "${topic.name}" has less than 4 vocab items, skipping...`);
        continue;
      }

      // Create quiz questions
      for (let i = 0; i < Math.min(vocabItems.length, 10); i++) {
        const correctVocab = vocabItems[i];
        
        // Get 3 random wrong answers from other vocab
        const wrongAnswers = vocabItems
          .filter(v => v.id !== correctVocab.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        if (wrongAnswers.length < 3) continue;

        const optionTexts = [
          correctVocab.korean,
          wrongAnswers[0].korean,
          wrongAnswers[1].korean,
          wrongAnswers[2].korean,
        ].sort(() => Math.random() - 0.5);

        try {
          await prisma.question.create({
            data: {
              questionText: `How do you say "${correctVocab.english}" in Korean?`,
              correctAnswer: correctVocab.korean,
              options: optionTexts,
              topicId: topic.id,
              language_from: 'en',
              language_to: 'ko',
              difficulty: 'medium',
            },
          });
          questionsCreated++;
        } catch (err: any) {
          if (err.code === 'P2002') {
            // Duplicate - skip
          } else {
            console.error('Error creating question:', err.message);
          }
        }
      }

      console.log(`✓ Topic "${topic.name}": ${Math.min(vocabItems.length, 10)} questions`);
    }

    console.log(`\n✅ Quiz questions seeded: ${questionsCreated} questions created`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

main();
