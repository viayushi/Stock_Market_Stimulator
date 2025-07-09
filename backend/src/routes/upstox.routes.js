const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const axios = require('axios');

// Upstox API configuration
const UPSTOX_API_BASE = 'https://api-v2.upstox.com';
const UPSTOX_WS_URL = 'wss://ws-api.upstox.com/index/ddf/stream/v1';

// --- Upstox API Credentials ---
const UPSTOX_API_KEY = '5137b41b-de26-49e9-a142-d26b42ad9ec1';
const UPSTOX_API_SECRET = '3qfot8al7w';
const UPSTOX_ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0MkNBUlciLCJqdGkiOiI2ODZlMDg3MWIxMjJjNDdkOTBlNWRmODIiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc1MjA0MTU4NSwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzUyMDk4NDAwfQ.Ylz25-N2gVfntVzH2krS0h9f_ijHvBw8ff9e5Zie69s';

// Get Upstox WebSocket URL
router.get('/ws-url', protect, (req, res) => {
  res.json({ wsUrl: UPSTOX_WS_URL });
});

// Get Upstox access token (OAuth flow)
router.post('/auth', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://api-v2.upstox.com/index/dialog/authorize/token', {
      client_id: process.env.UPSTOX_CLIENT_ID,
      client_secret: process.env.UPSTOX_CLIENT_SECRET,
      redirect_uri: process.env.UPSTOX_REDIRECT_URI,
      grant_type: 'authorization_code',
      code: code
    });

    res.json({
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token
    });
  } catch (error) {
    console.error('Upstox auth error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to authenticate with Upstox', error: error.message });
  }
});

// Get historical data
router.get('/historical/:symbol', protect, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1D', from_date, to_date } = req.query;
    const accessToken = req.headers['x-upstox-token'];

    if (!accessToken) {
      return res.status(401).json({ message: 'Upstox access token required' });
    }

    const response = await axios.get(`${UPSTOX_API_BASE}/index/historical-candle/${symbol}/${interval}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Api-Version': '2.0'
      },
      params: {
        from_date,
        to_date
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Upstox historical data error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch historical data', error: error.message });
  }
});

// Get market status
router.get('/market-status', protect, async (req, res) => {
  try {
    const accessToken = req.headers['x-upstox-token'];

    if (!accessToken) {
      return res.status(401).json({ message: 'Upstox access token required' });
    }

    const response = await axios.get(`${UPSTOX_API_BASE}/index/market-status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Api-Version': '2.0'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Upstox market status error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch market status', error: error.message });
  }
});

// In-memory cache for instruments
let instrumentCache = {
  NSE: null,
  BSE: null,
  lastFetched: 0
};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Helper to get company logo URL (using Clearbit as example)
function getLogoUrl(symbol, name) {
  // Try to use company domain if available, else fallback to placeholder
  // For demo, use a static placeholder or Clearbit logo API
  // You can improve this mapping as needed
  return `https://logo.clearbit.com/${name.replace(/\s+/g, '').toLowerCase()}.com`;
}

// Fetch all instruments for NSE or BSE
router.get('/instruments', async (req, res) => {
  try {
    const { exchange = 'NSE' } = req.query;
    const now = Date.now();
    if (
      instrumentCache[exchange] &&
      now - instrumentCache.lastFetched < CACHE_DURATION
    ) {
      return res.json(instrumentCache[exchange]);
    }

    // Use provided credentials
    const apiKey = UPSTOX_API_KEY;
    const apiSecret = UPSTOX_API_SECRET;
    const accessToken = UPSTOX_ACCESS_TOKEN;

    // Fetch instrument list from Upstox
    const response = await axios.get(
      `https://api-v2.upstox.com/market/instruments/${exchange}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Api-Version': '2.0',
          'Accept': 'application/json',
        },
      }
    );
    // Add logo URLs
    const instrumentsWithLogos = response.data.data.map(inst => ({
      ...inst,
      logo: getLogoUrl(inst.symbol, inst.name || inst.symbol)
    }));
    instrumentCache[exchange] = instrumentsWithLogos;
    instrumentCache.lastFetched = now;
    res.json(instrumentsWithLogos);
  } catch (error) {
    console.error('Upstox instruments fetch error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch instruments', error: error.message });
  }
});

// Get quote for a symbol
router.get('/quote/:symbol', protect, async (req, res) => {
  try {
    const { symbol } = req.params;
    const accessToken = req.headers['x-upstox-token'];

    if (!accessToken) {
      return res.status(401).json({ message: 'Upstox access token required' });
    }

    const response = await axios.get(`${UPSTOX_API_BASE}/index/quote`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Api-Version': '2.0'
      },
      params: {
        symbol: symbol
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Upstox quote error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch quote', error: error.message });
  }
});

// Get popular stocks (NSE)
router.get('/popular-stocks', protect, async (req, res) => {
  try {
    const popularStocks = [
      { name: 'Tata Motors', symbol: 'TATAMOTORS', exchange: 'NSE' },
      { name: 'Reliance Industries', symbol: 'RELIANCE', exchange: 'NSE' },
      { name: 'TCS', symbol: 'TCS', exchange: 'NSE' },
      { name: 'HDFC Bank', symbol: 'HDFCBANK', exchange: 'NSE' },
      { name: 'Infosys', symbol: 'INFY', exchange: 'NSE' },
      { name: 'ICICI Bank', symbol: 'ICICIBANK', exchange: 'NSE' },
      { name: 'Hindustan Unilever', symbol: 'HINDUNILVR', exchange: 'NSE' },
      { name: 'ITC', symbol: 'ITC', exchange: 'NSE' },
      { name: 'State Bank of India', symbol: 'SBIN', exchange: 'NSE' },
      { name: 'Bharti Airtel', symbol: 'BHARTIARTL', exchange: 'NSE' },
      { name: 'Wipro', symbol: 'WIPRO', exchange: 'NSE' },
      { name: 'Larsen & Toubro', symbol: 'LT', exchange: 'NSE' },
      { name: 'Axis Bank', symbol: 'AXISBANK', exchange: 'NSE' },
      { name: 'Maruti Suzuki', symbol: 'MARUTI', exchange: 'NSE' },
      { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK', exchange: 'NSE' }
    ];

    res.json(popularStocks);
  } catch (error) {
    console.error('Popular stocks error:', error);
    res.status(500).json({ message: 'Failed to fetch popular stocks', error: error.message });
  }
});

// --- MARKET PAGE ENDPOINTS ---

// Get live stock data for a symbol
router.get('/live/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const accessToken = UPSTOX_ACCESS_TOKEN;
    const response = await axios.get(`${UPSTOX_API_BASE}/index/quote`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Api-Version': '2.0'
      },
      params: { symbol }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch live data', error: error.message });
  }
});

// Search stocks by symbol or name
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const exchange = req.query.exchange || 'NSE';
    if (!instrumentCache[exchange]) {
      return res.status(500).json({ message: 'Instrument list not loaded' });
    }
    const results = instrumentCache[exchange].filter(inst =>
      inst.symbol.toLowerCase().includes(q) ||
      (inst.name && inst.name.toLowerCase().includes(q))
    ).slice(0, 20);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Get top gainers and losers
router.get('/gainers-losers', async (req, res) => {
  try {
    const exchange = req.query.exchange || 'NSE';
    if (!instrumentCache[exchange]) {
      return res.status(500).json({ message: 'Instrument list not loaded' });
    }
    // Fetch live prices for all symbols (limit to 200 for demo)
    const symbols = instrumentCache[exchange].slice(0, 200).map(inst => inst.symbol);
    const accessToken = UPSTOX_ACCESS_TOKEN;
    const priceRes = await axios.get(`${UPSTOX_API_BASE}/index/quote`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Api-Version': '2.0'
      },
      params: { symbol: symbols.join(',') }
    });
    const quotes = priceRes.data.data || [];
    // Calculate % change
    const withChange = quotes.map(q => ({
      ...q,
      changePercent: q.open ? ((q.close - q.open) / q.open) * 100 : 0
    }));
    const gainers = [...withChange].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
    const losers = [...withChange].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
    res.json({ gainers, losers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch gainers/losers', error: error.message });
  }
});

// Screener endpoint
router.get('/screener', async (req, res) => {
  try {
    const { sector, minPrice, maxPrice, minVolume, change } = req.query;
    const exchange = req.query.exchange || 'NSE';
    if (!instrumentCache[exchange]) {
      return res.status(500).json({ message: 'Instrument list not loaded' });
    }
    let results = instrumentCache[exchange];
    if (sector) results = results.filter(inst => inst.sector && inst.sector === sector);
    if (minPrice) results = results.filter(inst => inst.close && inst.close >= parseFloat(minPrice));
    if (maxPrice) results = results.filter(inst => inst.close && inst.close <= parseFloat(maxPrice));
    if (minVolume) results = results.filter(inst => inst.volume && inst.volume >= parseFloat(minVolume));
    if (change) results = results.filter(inst => inst.changePercent && Math.abs(inst.changePercent) >= parseFloat(change));
    res.json(results.slice(0, 100));
  } catch (error) {
    res.status(500).json({ message: 'Screener failed', error: error.message });
  }
});

module.exports = router; 