// @ts-nocheck
const { Router } = require('express');

const router3 = Router();

router3.get('/', (_req: any, res: any) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HANGUL Backend API',
    version: '0.1.0',
  });
});

module.exports = router3;
