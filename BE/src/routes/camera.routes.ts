import { Router, Request, Response } from 'express';

const router = Router();

// Camera detection route stubs - implement based on your needs
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    // This will call the Flask AI service
    // POST to http://localhost:5001/api/detect-camera
    // Placeholder response
    res.json({
      objects: [
        {
          name: 'cup',
          korean: '컵',
          romanization: 'keop',
          confidence: 0.95,
        },
      ],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Detection failed' });
  }
});

module.exports = router;
