import { Router, Request, Response } from 'express';

const router = Router();

// Pronunciation route stubs - implement based on your needs
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Pronunciation routes' });
});

module.exports = router;
