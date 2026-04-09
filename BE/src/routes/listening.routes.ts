import { Router, Request, Response } from 'express';

const router = Router();

// Listening route stubs - implement based on your needs
router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Listening routes' });
});

module.exports = router;
