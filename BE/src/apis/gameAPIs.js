// ========================
// GAME ECONOMY APIs
// ========================

function registerGameAPIs(app, prisma, authenticate) {
  // ===== QUIZ ENGINE =====
  
  // Generate quiz questions
  app.get('/api/quiz/generate', authenticate, async (req, res) => {
    try {
      const { level = 'NEWBIE', limit = 10 } = req.query;
      const numQuestions = Math.min(parseInt(limit), 20);

      const vocabulary = await prisma.vocabulary.findMany({
        where: { level: level.toString() },
        take: numQuestions,
        include: { examples: true },
      });

      if (vocabulary.length === 0) {
        return res.json([]);
      }

      // Generate quiz questions from vocabulary
      const quiz = vocabulary.map((vocab, index) => {
        const wrongAnswers = vocabulary
          .filter((v) => v.id !== vocab.id)
          .slice(0, 3)
          .map((v) => v.english);

        const options = [vocab.english, ...wrongAnswers].sort(() => Math.random() - 0.5);

        return {
          id: vocab.id,
          type: 'multiple_choice',
          question: vocab.korean,
          romanization: vocab.romanization,
          correctAnswer: vocab.english,
          options: options,
          difficulty: index < 3 ? 'easy' : index < 7 ? 'medium' : 'hard',
        };
      });

      res.json(quiz);
    } catch (error) {
      console.error('Error generating quiz:', error);
      res.status(500).json({ error: 'Failed to generate quiz' });
    }
  });

  // Submit quiz answers and award trophy/xp
  app.post('/api/quiz/submit', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const { score, totalQuestions } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate rewards
      const trophyReward = score * 10;
      const xpReward = score * 5;

      // Update user stats
      const stats = await prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          trophy: trophyReward,
          xp: xpReward,
          quizCount: 1,
        },
        update: {
          trophy: { increment: trophyReward },
          xp: { increment: xpReward },
          quizCount: { increment: 1 },
        },
      });

      // Update user rank if xp changed
      await updateUserRank(userId, stats.xp, prisma);

      // Update daily quests
      await updateDailyQuests(userId, 'quiz', prisma);

      res.json({
        trophy: trophyReward,
        xp: xpReward,
        totalTrophy: stats.trophy,
        totalXp: stats.xp,
        message: `🎉 +${trophyReward} Trophy, +${xpReward} XP`,
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  });

  // ===== WRITING PRACTICE =====

  // Submit writing answer
  app.post('/api/writing/submit', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const { input, correct } = req.body;

      // Simple similarity score (can be improved with NLP library)
      const score = calculateSimilarity(input, correct);

      let trophyReward = 0;
      if (score >= 80) trophyReward = 15;
      else if (score >= 50) trophyReward = 5;

      // Update user stats
      const stats = await prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          trophy: trophyReward,
          xp: 20,
          writeCount: 1,
        },
        update: {
          trophy: { increment: trophyReward },
          xp: { increment: 20 },
          writeCount: { increment: 1 },
        },
      });

      // Update daily quests
      await updateDailyQuests(userId, 'writing', prisma);

      res.json({
        accuracy: score,
        trophy: trophyReward,
        xp: 20,
        feedback:
          score >= 80
            ? '🌟 Xuất sắc!'
            : score >= 50
            ? '👍 Tốt, hãy tiếp tục cố gắng'
            : '💪 Hãy thử lại',
      });
    } catch (error) {
      console.error('Error submitting writing:', error);
      res.status(500).json({ error: 'Failed to submit writing' });
    }
  });

  // ===== PRONUNCIATION PRACTICE =====

  // Submit pronunciation recording
  app.post('/api/pronunciation/submit', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const { transcript, correct } = req.body;

      // Calculate pronunciation accuracy
      const accuracy = calculateSimilarity(transcript, correct);

      let trophyReward = 0;
      let xpReward = 0;

      if (accuracy >= 80) {
        trophyReward = 20;
        xpReward = 30;
      } else if (accuracy >= 60) {
        trophyReward = 10;
        xpReward = 15;
      }

      // Update user stats
      const stats = await prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          trophy: trophyReward,
          xp: xpReward,
          speakCount: 1,
        },
        update: {
          trophy: { increment: trophyReward },
          xp: { increment: xpReward },
          speakCount: { increment: 1 },
        },
      });

      // Update user rank
      await updateUserRank(userId, stats.xp, prisma);

      // Update daily quests
      await updateDailyQuests(userId, 'speaking', prisma);

      res.json({
        accuracy,
        fluency: Math.max(50, accuracy - 10),
        trophy: trophyReward,
        xp: xpReward,
        feedback:
          accuracy >= 80
            ? ' Phát âm rất tốt!'
            : accuracy >= 60
            ? '📢 Hãy cố gắng rõ hơn'
            : '🔊 Thử lại bạn nhé',
      });
    } catch (error) {
      console.error('Error submitting pronunciation:', error);
      res.status(500).json({ error: 'Failed to submit pronunciation' });
    }
  });

  // ===== DAILY QUEST SYSTEM =====

  // Get user daily quests
  app.get('/api/quests/daily', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const today = new Date().toDateString();

      // Get all daily quests
      const quests = await prisma.dailyQuest.findMany();

      // Get user's progress on quests
      const userQuests = await prisma.userQuest.findMany({
        where: { userId },
      });

      const questsWithProgress = quests.map((quest) => {
        const userQuest = userQuests.find((uq) => uq.questId === quest.id);
        return {
          ...quest,
          progress: userQuest?.progress || 0,
          completed: userQuest?.completed || false,
        };
      });

      res.json(questsWithProgress);
    } catch (error) {
      console.error('Error fetching quests:', error);
      res.status(500).json({ error: 'Failed to fetch quests' });
    }
  });

  // ===== TOURNAMENT SYSTEM =====

  // Join tournament
  app.post('/api/tournament/join', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);

      // Check if user has enough trophy
      const stats = await prisma.userStats.findUnique({
        where: { userId },
      });

      if (!stats || stats.trophy < 1000) {
        return res.status(403).json({
          error: 'Not enough trophy to join tournament',
          currentTrophy: stats?.trophy || 0,
          requiredTrophy: 1000,
        });
      }

      // Find active tournament
      const tournament = await prisma.tournament.findFirst({
        where: {
          startAt: { lte: new Date() },
          endAt: { gte: new Date() },
        },
      });

      if (!tournament) {
        return res.status(404).json({ error: 'No active tournament found' });
      }

      // Check if already joined
      const existing = await prisma.tournamentPlayer.findFirst({
        where: { userId, tournamentId: tournament.id },
      });

      if (existing) {
        return res.json({ message: 'Already joined this tournament', tournament });
      }

      // Add to tournament
      await prisma.tournamentPlayer.create({
        data: {
          userId,
          tournamentId: tournament.id,
        },
      });

      res.json({
        success: true,
        message: '🎉 Joined tournament successfully!',
        tournament: {
          name: tournament.name,
          description: tournament.description,
          endAt: tournament.endAt,
        },
      });
    } catch (error) {
      console.error('Error joining tournament:', error);
      res.status(500).json({ error: 'Failed to join tournament' });
    }
  });

  // Get tournament leaderboard
  app.get('/api/tournament/leaderboard', async (req, res) => {
    try {
      const tournament = await prisma.tournament.findFirst({
        where: {
          startAt: { lte: new Date() },
          endAt: { gte: new Date() },
        },
        include: {
          players: {
            include: { user: true },
            orderBy: { score: 'desc' },
            take: 50,
          },
        },
      });

      if (!tournament) {
        return res.json([]);
      }

      const leaderboard = tournament.players.map((p, index) => ({
        rank: index + 1,
        userId: p.user.id,
        userName: p.user.name,
        score: p.score,
        medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '',
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Submit tournament quiz score
  app.post('/api/tournament/submit-score', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const { score } = req.body;

      const tournament = await prisma.tournament.findFirst({
        where: {
          startAt: { lte: new Date() },
          endAt: { gte: new Date() },
        },
      });

      if (!tournament) {
        return res.status(404).json({ error: 'No active tournament' });
      }

      const player = await prisma.tournamentPlayer.findFirst({
        where: { userId, tournamentId: tournament.id },
      });

      if (!player) {
        return res.status(403).json({ error: 'Not a tournament participant' });
      }

      // Update player score
      const updated = await prisma.tournamentPlayer.update({
        where: { id: player.id },
        data: {
          score: { increment: score },
        },
      });

      res.json({
        success: true,
        score: updated.score,
        message: `+${score} points added!`,
      });
    } catch (error) {
      console.error('Error submitting tournament score:', error);
      res.status(500).json({ error: 'Failed to submit score' });
    }
  });

  // ===== MATCHMAKING SYSTEM =====

  // Find opponent for battle
  app.post('/api/matchmaking/find', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);

      // Get user's rank
      const userRank = await prisma.userRank.findUnique({
        where: { userId },
        include: { rank: true },
      });

      if (!userRank) {
        return res.status(404).json({ error: 'User rank not found' });
      }

      // Find another player with same rank
      const opponent = await prisma.userRank.findFirst({
        where: {
          rankId: userRank.rankId,
          userId: { not: userId },
        },
        include: { user: true },
      });

      if (!opponent) {
        return res.json({ message: 'No opponent found, matching with lower rank' });
      }

      // Create battle room
      const battleRoom = await prisma.battleRoom.create({
        data: {
          player1Id: userId,
          player2Id: opponent.userId,
        },
      });

      res.json({
        battleId: battleRoom.id,
        opponent: {
          id: opponent.user.id,
          name: opponent.user.name,
          level: opponent.user.level,
        },
        status: 'matched',
      });
    } catch (error) {
      console.error('Error in matchmaking:', error);
      res.status(500).json({ error: 'Matchmaking failed' });
    }
  });

  // Submit battle score
  app.post('/api/battle/submit-score', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const { battleId, score } = req.body;

      const battle = await prisma.battleRoom.findUnique({
        where: { id: battleId },
      });

      if (!battle) {
        return res.status(404).json({ error: 'Battle not found' });
      }

      let updatedBattle;
      if (battle.player1Id === userId) {
        updatedBattle = await prisma.battleRoom.update({
          where: { id: battleId },
          data: { player1Score: score },
        });
      } else {
        updatedBattle = await prisma.battleRoom.update({
          where: { id: battleId },
          data: { player2Score: score },
        });
      }

      // Check if both players submitted
      if (updatedBattle.player1Score > 0 && updatedBattle.player2Score > 0) {
        // Determine winner
        const winnerId =
          updatedBattle.player1Score > updatedBattle.player2Score
            ? updatedBattle.player1Id
            : updatedBattle.player1Score < updatedBattle.player2Score
            ? updatedBattle.player2Id
            : null;

        // Award trophy to winner
        if (winnerId) {
          await prisma.userStats.upsert({
            where: { userId: winnerId },
            create: { userId: winnerId, trophy: 50, xp: 30 },
            update: { trophy: { increment: 50 }, xp: { increment: 30 } },
          });

          // Award to loser
          const loserId = winnerId === battle.player1Id ? battle.player2Id : battle.player1Id;
          await prisma.userStats.upsert({
            where: { userId: loserId },
            create: { userId: loserId, trophy: 10, xp: 10 },
            update: { trophy: { increment: 10 }, xp: { increment: 10 } },
          });
        }

        // Update battle status
        await prisma.battleRoom.update({
          where: { id: battleId },
          data: { status: 'finished', winnerId, endedAt: new Date() },
        });
      }

      res.json({ success: true, battle: updatedBattle });
    } catch (error) {
      console.error('Error submitting battle score:', error);
      res.status(500).json({ error: 'Failed to submit battle score' });
    }
  });

  // ===== LEARNING MAP / PROGRESS TREE =====

  // Get learning map for user's level
  app.get('/api/learning-map/:level', authenticate, async (req, res) => {
    try {
      const { level } = req.params;
      const userId = parseInt(req.userId);

      const path = await prisma.learningPath.findFirst({
        where: { level: level.toString() },
        include: {
          nodes: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!path) {
        return res.json({ nodes: [] });
      }

      // Get user progress
      const userProgress = await prisma.userNodeProgress.findMany({
        where: { userId },
      });

      const nodesWithProgress = path.nodes.map((node) => {
        const progress = userProgress.find((p) => p.nodeId === node.id);
        return {
          ...node,
          completed: progress?.completed || false,
          locked: false, // Can improve with prerequisite logic
        };
      });

      res.json({
        pathName: path.name,
        nodes: nodesWithProgress,
      });
    } catch (error) {
      console.error('Error fetching learning map:', error);
      res.status(500).json({ error: 'Failed to fetch learning map' });
    }
  });

  // Complete learning node
  app.post('/api/learning-node/complete', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const { nodeId } = req.body;

      const progress = await prisma.userNodeProgress.upsert({
        where: {
          userId_nodeId: { userId, nodeId },
        },
        create: { userId, nodeId, completed: true, completedAt: new Date() },
        update: { completed: true, completedAt: new Date() },
      });

      // Award trophy for completing node
      await prisma.userStats.upsert({
        where: { userId },
        create: { userId, trophy: 50, xp: 50 },
        update: { trophy: { increment: 50 }, xp: { increment: 50 } },
      });

      res.json({
        success: true,
        message: '🎉 Node completed! +50 Trophy +50 XP',
        progress,
      });
    } catch (error) {
      console.error('Error completing node:', error);
      res.status(500).json({ error: 'Failed to complete node' });
    }
  });

  // ===== USER STATS / PROFILE =====

  // Get user stats
  app.get('/api/user/stats', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.userId);

      const stats = await prisma.userStats.findUnique({
        where: { userId },
      });

      const rank = await prisma.userRank.findUnique({
        where: { userId },
        include: { rank: true },
      });

      res.json({
        stats: stats || {
          trophy: 0,
          xp: 0,
          quizCount: 0,
          writeCount: 0,
          speakCount: 0,
        },
        rank: rank?.rank.name || 'Bronze',
        unlockTournament: stats && stats.trophy >= 1000,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });
}

// ===== HELPER FUNCTIONS =====

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const editDistance = getEditDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let k = 0; k <= s1.length; k++) {
    let lastValue = k;
    for (let l = 0; l <= s2.length; l++) {
      if (k === 0) {
        costs[l] = l;
      } else if (l > 0) {
        let newValue = costs[l - 1];
        if (s1.charAt(k - 1) !== s2.charAt(l - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[l]) + 1;
        }
        costs[l - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (k > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function updateUserRank(userId, xp, prisma) {
  try {
    const rank = await prisma.rank.findFirst({
      where: {
        minXp: { lte: xp },
        maxXp: { gte: xp },
      },
    });

    if (rank) {
      await prisma.userRank.upsert({
        where: { userId },
        create: { userId, rankId: rank.id },
        update: { rankId: rank.id },
      });
    }
  } catch (error) {
    console.error('Error updating rank:', error);
  }
}

async function updateDailyQuests(userId, type, prisma) {
  try {
    const today = new Date().toDateString();

    const quests = await prisma.userQuest.findMany({
      where: {
        userId,
        completed: false,
        quest: { type },
      },
      include: { quest: true },
    });

    for (const userQuest of quests) {
      const newProgress = userQuest.progress + 1;

      await prisma.userQuest.update({
        where: { id: userQuest.id },
        data: {
          progress: newProgress,
          completed: newProgress >= userQuest.quest.goal,
          completedAt: newProgress >= userQuest.quest.goal ? new Date() : null,
        },
      });

      // Award trophy if completed
      if (newProgress >= userQuest.quest.goal) {
        await prisma.userStats.upsert({
          where: { userId },
          create: {
            userId,
            trophy: userQuest.quest.rewardTrophy,
            xp: userQuest.quest.rewardXp,
          },
          update: {
            trophy: { increment: userQuest.quest.rewardTrophy },
            xp: { increment: userQuest.quest.rewardXp },
          },
        });
      }
    }
  } catch (error) {
    console.error('Error updating quests:', error);
  }
}

module.exports = registerGameAPIs;
