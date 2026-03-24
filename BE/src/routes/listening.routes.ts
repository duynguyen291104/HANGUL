import { Router, Request, Response } from 'express';

const router = Router();

// Listening route stubs - implement based on your needs
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Listening routes' });
});

module.exports = router;
