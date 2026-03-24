const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HANGUL Backend API',
    version: '0.1.0',
  });
});

module.exports = router;
