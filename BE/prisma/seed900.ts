import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive seed with 900+ vocabulary items from JSON...\n')

  // 1. Clear existing data
  console.log('🗑️  Cleaning up old data...')
  await prisma.vocabulary.deleteMany({})
  await prisma.topic.deleteMany({})
  await prisma.userProgress.deleteMany({})
  console.log('✅ Cleaned\n')

  // 2. Create users
  console.log('👤 Creating users...')
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('123456', 10),
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
      },
    }),
  ])
  console.log(`✅ ${users.length} users created\n`)

  // 3. Read all JSON files
  console.log('📖 Reading vocabulary from JSON files...')
  const dataDir = path.join(__dirname, 'data')
  const jsonFiles: Array<{ path: string; data: any }> = []

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        walkDir(fullPath)
      } else if (file.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
          jsonFiles.push({ path: fullPath, data })
        } catch (e) {
          console.warn(`⚠️  Failed to read ${fullPath}`)
        }
      }
    }
  }

  walkDir(dataDir)
  console.log(`✅ Found ${jsonFiles.length} JSON files\n`)

  // 4. Create topics and vocabulary
  console.log('📚 Creating topics and vocabulary...')
  let vocabCount = 0
  let topicCount = 0

  const topicsMap = new Map<string, any>()

  for (const file of jsonFiles) {
    const { topic, level, description, vocabulary } = file.data

    if (!topic || !vocabulary || !Array.isArray(vocabulary)) {
      continue
    }

    const slug = topic
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')

    // Create or get topic
    let topicRecord = topicsMap.get(slug)
    if (!topicRecord) {
      topicRecord = await prisma.topic.upsert({
        where: { slug },
        update: {},
        create: {
          name: topic,
          slug,
          description,
          level: level || 'BEGINNER',
          type: 'vocabulary',
        },
      })
      topicsMap.set(slug, topicRecord)
      topicCount++
    }

    // Create vocabulary items
    for (const vocab of vocabulary) {
      if (!vocab.korean || !vocab.english || !vocab.vietnamese) {
        continue
      }

      try {
        await prisma.vocabulary.create({
          data: {
            korean: vocab.korean,
            english: vocab.english,
            vietnamese: vocab.vietnamese,
            romanization: vocab.romanization || '',
            topicId: topicRecord.id,
            level: level || 'BEGINNER',
            type: vocab.type || 'noun',
          },
        })
        vocabCount++

        // Stop at 900 items
        if (vocabCount >= 900) {
          break
        }
      } catch (e) {
        // Duplicate or other error - skip
      }
    }

    if (vocabCount >= 900) {
      break
    }
  }

  console.log(
    `✅ Created ${topicCount} topics and ${vocabCount} vocabulary items\n`
  )

  // 5. Create user progress
  console.log('📊 Creating user progress...')
  const topics = await prisma.topic.findMany()
  for (const topic of topics) {
    for (const user of users) {
      await prisma.userProgress.upsert({
        where: {
          userId_topicId_skillType: {
            userId: user.id,
            topicId: topic.id,
            skillType: 'vocabulary',
          },
        },
        update: {},
        create: {
          userId: user.id,
          topicId: topic.id,
          skillType: 'vocabulary',
          attempts: 0,
          completed: false,
        },
      })
    }
  }
  console.log(`✅ User progress created for ${topics.length} topics\n`)

  console.log('\n✨ Seed completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - Users: ${users.length}`)
  console.log(`   - Topics: ${topicCount}`)
  console.log(`   - Vocabulary items: ${vocabCount}`)
  console.log(`   - User progress entries: ${topics.length * users.length}`)
  console.log('\n👤 Test Accounts:')
  console.log('   Email: test@example.com | Password: 123456')
  console.log('   Email: admin@example.com | Password: admin123')
  console.log('\n🌐 Available at:')
  console.log('   - Prisma Studio: http://localhost:5555')
  console.log('   - Backend API: http://localhost:5000')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
