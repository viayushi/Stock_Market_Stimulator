const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const portfolioController = require('../controllers/portfolio.controller');

// Get current holdings
router.get('/holdings', protect, portfolioController.getHoldings);
// Get live positions (open trades)
router.get('/positions', protect, portfolioController.getPositions);
// Get funds/margin
router.get('/funds', protect, portfolioController.getFunds);
// Get P&L per position
router.get('/pnl', protect, portfolioController.getPnL);

module.exports = router; 