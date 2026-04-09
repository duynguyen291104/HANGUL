import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// AI Backend URL - Flask running on port 5001
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:5001';

// Camera detection route - processes image and sends to Flask AI
router.post('/detect', async (req: Request, res: Response): Promise<any> => {
  try {
    const { image } = req.body; // base64 image data

    if (!image) {
      return res.status(400).json({ error: 'Image data required' });
    }

    console.log(` [${new Date().toISOString()}] Sending image to Flask AI detection...`);
    
    try {
      // Call Flask AI detection backend
      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/detect`,
        { image },
        { 
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const detectedObjects = aiResponse.data.objects || [];
      
      console.log(` Detected ${detectedObjects.length} objects`);
      
      // Format results to match frontend expectations
      const response = {
        success: true,
        detections: detectedObjects,  // Frontend expects "detections" not "objects"
        timestamp: new Date().toISOString(),
        count: detectedObjects.length,
      };

      return res.json(response);
    } catch (aiError: any) {
      console.error(` AI Backend error: ${aiError.message}`);
      
      // Return error response
      return res.status(502).json({
        success: false,
        message: 'AI backend unavailable',
        error: aiError.message,
        objects: [],
      });
    }
  } catch (error: any) {
    console.error(` Detection error: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: 'Detection failed',
      message: error.message 
    });
  }
});

module.exports = router;
