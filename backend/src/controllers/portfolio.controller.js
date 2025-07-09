const axios = require('axios');
const UPSTOX_ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN;
const UPSTOX_API_BASE = 'https://api-v2.upstox.com';
const Portfolio = require('../models/portfolio.model');

exports.getHoldings = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.userId });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    res.json({ holdings: portfolio.holdings, cash: portfolio.cash });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch holdings', error: error.message });
  }
};

exports.getPositions = async (req, res) => {
  // Simulate open positions from holdings
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.userId });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    const positions = [];
    for (const [symbol, data] of portfolio.holdings.entries()) {
      if (data.quantity > 0) {
        positions.push({ symbol, quantity: data.quantity, averagePrice: data.averagePrice });
      }
    }
    res.json({ positions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch positions', error: error.message });
  }
};

exports.getFunds = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.userId });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    res.json({ cash: portfolio.cash });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch funds', error: error.message });
  }
};

exports.getPnL = async (req, res) => {
  // Simulate P&L as 0 for all holdings for now
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.userId });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    const pnl = [];
    for (const [symbol, data] of portfolio.holdings.entries()) {
      pnl.push({ symbol, unrealizedPnL: 0 });
    }
    res.json({ pnl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch P&L', error: error.message });
  }
}; 