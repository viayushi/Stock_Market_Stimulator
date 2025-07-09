const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');

// All routes are public (no auth middleware)
router.get('/quote', marketController.getLivePrices);
router.get('/stock/:symbol', marketController.getStockDetails);
router.get('/candles/:symbol', marketController.getCandles);
router.get('/stocks', marketController.getStockList);
router.get('/gainers-losers', marketController.getGainersLosers);
router.get('/instruments', marketController.getInstruments);

module.exports = router; 