const axios = require('axios');
const UPSTOX_ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN;
const UPSTOX_API_BASE = 'https://api-v2.upstox.com';
const Portfolio = require('../models/portfolio.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

exports.placeOrder = async (req, res) => {
  try {
    const order = req.body;
    const response = await axios.post(`${UPSTOX_API_BASE}/order/place`, order, {
      headers: {
        'Authorization': `Bearer ${UPSTOX_ACCESS_TOKEN}`,
        'Api-Version': '2.0',
        'Accept': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
};

exports.modifyOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const updates = req.body;
    const response = await axios.put(`${UPSTOX_API_BASE}/order/modify/${orderId}`, updates, {
      headers: {
        'Authorization': `Bearer ${UPSTOX_ACCESS_TOKEN}`,
        'Api-Version': '2.0',
        'Accept': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to modify order', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const response = await axios.delete(`${UPSTOX_API_BASE}/order/cancel/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${UPSTOX_ACCESS_TOKEN}`,
        'Api-Version': '2.0',
        'Accept': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const response = await axios.get(`${UPSTOX_API_BASE}/order/status/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${UPSTOX_ACCESS_TOKEN}`,
        'Api-Version': '2.0',
        'Accept': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order status', error: error.message });
  }
};

exports.getOrderBook = async (req, res) => {
  try {
    const response = await axios.get(`${UPSTOX_API_BASE}/order/book`, {
      headers: {
        'Authorization': `Bearer ${UPSTOX_ACCESS_TOKEN}`,
        'Api-Version': '2.0',
        'Accept': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order book', error: error.message });
  }
};

exports.getTradeBook = async (req, res) => {
  try {
    const response = await axios.get(`${UPSTOX_API_BASE}/trade/book`, {
      headers: {
        'Authorization': `Bearer ${UPSTOX_ACCESS_TOKEN}`,
        'Api-Version': '2.0',
        'Accept': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get trade book', error: error.message });
  }
};

// Simulated buy/sell order endpoint
exports.placeSimOrder = async (req, res) => {
  try {
    const { symbol, action, quantity, price } = req.body;
    if (!symbol || !['buy', 'sell'].includes(action) || !quantity || !price) {
      return res.status(400).json({ message: 'Invalid order parameters' });
    }
    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({ message: 'Quantity and price must be positive' });
    }
    const userId = req.user.userId;
    const portfolio = await Portfolio.findOne({ user: userId });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    let cash = portfolio.cash;
    let holdings = portfolio.holdings || new Map();
    let holding = holdings.get(symbol) || { quantity: 0, averagePrice: 0 };
    let totalCost = quantity * price;
    if (action === 'buy') {
      if (cash < totalCost) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }
      // Update average price
      const newQty = holding.quantity + quantity;
      const newAvg = (holding.quantity * holding.averagePrice + totalCost) / newQty;
      holdings.set(symbol, { quantity: newQty, averagePrice: newAvg });
      portfolio.cash = cash - totalCost;
    } else if (action === 'sell') {
      if (holding.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient quantity to sell' });
      }
      // Calculate realized P&L
      const realizedPnL = (price - holding.averagePrice) * quantity;
      const newQty = holding.quantity - quantity;
      if (newQty > 0) {
        holdings.set(symbol, { quantity: newQty, averagePrice: holding.averagePrice });
      } else {
        holdings.delete(symbol);
      }
      portfolio.cash = cash + quantity * price;
    }
    portfolio.holdings = holdings;
    await portfolio.save();
    // Record transaction
    const txn = new Transaction({
      user: userId,
      symbol,
      action,
      quantity,
      price,
      totalCost: totalCost,
      timestamp: new Date()
    });
    await txn.save();
    res.json({
      message: 'Order executed',
      portfolio: { cash: portfolio.cash, holdings: Array.from(holdings.entries()) },
      transaction: txn
    });
  } catch (error) {
    res.status(500).json({ message: 'Order failed', error: error.message });
  }
}; 