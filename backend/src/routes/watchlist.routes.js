const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const Watchlist = require('../models/watchlist.model');

// Get user's watchlist
router.get('/', protect, async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user.userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user.userId, symbols: [] });
    }
    res.json(watchlist.symbols);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch watchlist', error: error.message });
  }
});

// Add symbol to watchlist
router.post('/', protect, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: 'Symbol required' });
    let watchlist = await Watchlist.findOne({ user: req.user.userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user.userId, symbols: [symbol] });
    } else if (!watchlist.symbols.includes(symbol)) {
      watchlist.symbols.push(symbol);
      await watchlist.save();
    }
    res.json(watchlist.symbols);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to watchlist', error: error.message });
  }
});

// Remove symbol from watchlist
router.delete('/', protect, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: 'Symbol required' });
    let watchlist = await Watchlist.findOne({ user: req.user.userId });
    if (watchlist && watchlist.symbols.includes(symbol)) {
      watchlist.symbols = watchlist.symbols.filter(s => s !== symbol);
      await watchlist.save();
    }
    res.json(watchlist ? watchlist.symbols : []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove from watchlist', error: error.message });
  }
});

module.exports = router; 