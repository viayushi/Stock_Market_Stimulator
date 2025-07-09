const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const Portfolio = require('../models/portfolio.model');
const Transaction = require('../models/transaction.model');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const axios = require('axios');

// Get user's portfolio
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    let portfolio = await Portfolio.findOne({ user: userId }).populate('user', '_id');
    let user = await User.findById(userId);
    if (!portfolio) {
      // Always create with 5 crore for new users
      portfolio = await Portfolio.create({
        user: userId,
        cash: 50000000,
        holdings: {}
      });
      console.log('Force created new portfolio with 5cr for user:', req.user.userId);
    } 
    if (user && user.firstLogin) {
      // On first login, reset portfolio to 5cr and empty holdings
      if (portfolio) {
        portfolio.cash = 50000000;
        portfolio.holdings = {};
        await portfolio.save();
        console.log('Reset portfolio to 5cr for first login user:', req.user.userId);
      }
      user.firstLogin = false;
      await user.save();
    } else if (portfolio && (!portfolio.holdings || Object.keys(portfolio.holdings).length === 0) && portfolio.cash !== 50000000) {
      portfolio.cash = 50000000;
      await portfolio.save();
      console.log('Force reset cash to 5cr for user:', req.user.userId);
    }
    res.json(portfolio);
  } catch (error) {
    console.error('PORTFOLIO ERROR:', error);
    res.status(500).json({ message: 'Error fetching portfolio', error: error.message });
  }
});

// Execute a trade
router.post('/trade', protect, async (req, res) => {
  try {
    const { symbol, action, quantity, price } = req.body;
    
    if (!symbol || !action || !quantity || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const tradePrice = parseFloat(price);
    if (!tradePrice || isNaN(tradePrice) || tradePrice <= 0) {
      return res.status(400).json({ message: 'Invalid price provided' });
    }

    const portfolio = await Portfolio.findOne({ user: mongoose.Types.ObjectId(req.user.userId) });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const totalCost = tradePrice * quantity;
    const newHoldings = { ...portfolio.holdings };
    let newCash = portfolio.cash;

    if (action === 'buy') {
      if (portfolio.cash < totalCost) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }
      
      if (newHoldings[symbol]) {
        const currentQuantity = newHoldings[symbol].quantity;
        const currentValue = newHoldings[symbol].averagePrice * currentQuantity;
        const newAveragePrice = (currentValue + totalCost) / (currentQuantity + quantity);
        newHoldings[symbol] = {
          quantity: currentQuantity + quantity,
          averagePrice: newAveragePrice,
        };
      } else {
        newHoldings[symbol] = {
          quantity,
          averagePrice: tradePrice,
        };
      }
      newCash = portfolio.cash - totalCost;
    } else if (action === 'sell') {
      if (!newHoldings[symbol] || newHoldings[symbol].quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient shares' });
      }
      
      const currentQuantity = newHoldings[symbol].quantity;
      if (currentQuantity === quantity) {
        delete newHoldings[symbol];
      } else {
        newHoldings[symbol] = {
          ...newHoldings[symbol],
          quantity: currentQuantity - quantity,
        };
      }
      newCash = portfolio.cash + totalCost;
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    portfolio.cash = newCash;
    portfolio.holdings = newHoldings;
    await portfolio.save();

    const transaction = new Transaction({
      user: mongoose.Types.ObjectId(req.user.userId),
      symbol,
      action,
      quantity,
      price: tradePrice,
      totalCost,
      timestamp: new Date()
    });
    await transaction.save();

    res.json({
      message: 'Trade executed successfully',
      portfolio,
      transaction
    });
  } catch (error) {
    console.error('TRADE ERROR:', error);
    res.status(500).json({ message: 'Error executing trade', error: error.message });
  }
});

// Get transaction history
router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: new mongoose.Types.ObjectId(req.user.userId) })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(transactions);
  } catch (error) {
    console.error('TRANSACTIONS ERROR:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Dummy portfolio data for now
router.get('/dummy', (req, res) => {
  res.json({
    cash: 100000,
    stocks: [],
  });
});

// Get real-time price for a symbol
router.get('/price/:symbol', protect, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const apiKey = '50bb7d52f88a4f669418b7f83dd37149';
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
    const priceRes = await axios.get(url);
    const price = parseFloat(priceRes.data.close);
    if (!price || isNaN(price)) {
      return res.status(400).json({ message: 'Invalid or unavailable price for symbol.' });
    }
    res.json({ symbol, price });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching price', error: error.message });
  }
});

// Batch price endpoint
router.get('/prices', protect, async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : [];
    if (!symbols.length) return res.status(400).json({ message: 'No symbols provided' });

    const apiKey = '50bb7d52f88a4f669418b7f83dd37149';
    const url = `https://api.twelvedata.com/quote?symbol=${symbols.join(',')}&apikey=${apiKey}`;
    const response = await axios.get(url);

    // Twelve Data returns an object with symbol keys
    const data = {};
    for (const symbol of symbols) {
      const stock = response.data[symbol];
      data[symbol] = stock && stock.close ? parseFloat(stock.close) : null;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prices', error: error.message });
  }
});

// Chart endpoint
router.get('/chart/:symbol', protect, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const apiKey = '50bb7d52f88a4f669418b7f83dd37149';
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=60&apikey=${apiKey}`;
    const response = await axios.get(url);
    res.json(response.data.values || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chart data', error: error.message });
  }
});

// Upstox WebSocket URL endpoint (real implementation)
router.get('/upstox/ws-url', async (req, res) => {
  try {
    // 1. Get access token (OAuth2)
    const apiKey = process.env.UPSTOX_API_KEY;
    const apiSecret = process.env.UPSTOX_API_SECRET;
    const redirectUri = process.env.UPSTOX_REDIRECT_URI;
    const authCode = process.env.UPSTOX_AUTH_CODE; // This should be obtained via OAuth login flow

    if (!apiKey || !apiSecret || !redirectUri || !authCode) {
      return res.status(500).json({ error: 'Upstox API credentials or auth code missing in environment variables.' });
    }

    // Exchange auth code for access token
    const tokenRes = await axios.post('https://api.upstox.com/v2/login/authorization/token', {
      code: authCode,
      client_id: apiKey,
      client_secret: apiSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to obtain Upstox access token.' });
    }

    // 2. Get authorized WebSocket URL
    const wsRes = await axios.get('https://api.upstox.com/v3/market-data/feeds/authorize', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    const wsUrl = wsRes.data?.data?.authorized_redirect_uri;
    if (!wsUrl) {
      return res.status(500).json({ error: 'Failed to obtain Upstox WebSocket URL.' });
    }
    res.json({ wsUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 