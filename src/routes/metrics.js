const express = require('express');
const metrics = require('../observability/metrics');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json(metrics.snapshot());
});

module.exports = router;
