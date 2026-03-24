const express = require("express");
const router = express.Router();
const writingController = require("../controllers/writingController");

/**
 * Public routes (no auth required for demo)
 */

// Generate a writing task
// GET /api/writing/generate?level=BEGINNER&topic=greeting
router.get("/generate", writingController.generateTask);

// Check writing and get feedback
// POST /api/writing/check
router.post("/check", writingController.checkWriting);

// Quick demo (generate + check in one call)
// POST /api/writing/demo
router.post("/demo", writingController.demoWriting);

/**
 * Authenticated routes (middleware passed from server)
 */

// Get user's writing statistics
// GET /api/writing/stats
router.get("/stats", writingController.getStats);

module.exports = router;
