const axios = require('axios');
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const path = require('path');
const fs = require('fs');

function toTwelveDataSymbol(symbol) {
  if (symbol.startsWith('NSE_EQ|')) {
    return symbol.replace('NSE_EQ|', '') + '.NSE';
  }
  if (/^(NSE|BSE):/.test(symbol)) {
    const [ex, sym] = symbol.split(':');
    return `${sym}.${ex}`;
  }
  return symbol;
}

exports.getInstruments = (req, res) => {
  const stocksPath = path.join(__dirname, '../data/nse_stocks.json');
  try {
    const stocks = JSON.parse(fs.readFileSync(stocksPath, 'utf-8'));
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load stock list', error: error.message });
  }
};

exports.getLivePrices = async (req, res) => {
  try {
    const rawSymbols = req.query.symbols || req.query.symbol;
    if (!rawSymbols) return res.status(400).json({ message: 'No symbol(s) provided' });
    const symbolsArr = rawSymbols.split(',').map(s => s.trim()).filter(Boolean);
    const tdSymbols = symbolsArr.map(toTwelveDataSymbol).join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbols)}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await axios.get(url);
    let data = response.data;
    // Always return an object: { SYMBOL: { price, change, pct, ... } }
    let result = {};
    if (Array.isArray(symbolsArr) && symbolsArr.length === 1) {
      // Single symbol: wrap in object
      const s = symbolsArr[0];
      result[s] = {
        price: data.close || data.price,
        change: data.change,
        pct: data.percent_change,
        ...data
      };
    } else {
      // Multiple symbols
      for (const s of symbolsArr) {
        const tdSym = toTwelveDataSymbol(s);
        const d = data[tdSym];
        result[s] = d ? {
          price: d.close || d.price,
          change: d.change,
          pct: d.percent_change,
          ...d
        } : null;
      }
    }
    res.json(result);
  } catch (error) {
    console.error('getLivePrices error:', error.message, error.response?.data);
    res.status(500).json({ message: 'Failed to fetch quote', error: error.response?.data || error.message });
  }
};

exports.getGainersLosers = (req, res) => {
  res.json({
    gainers: [
      { symbol: 'NSE_EQ|RELIANCE', change: 5.2 },
      { symbol: 'NSE_EQ|TCS', change: 4.1 }
    ],
    losers: [
      { symbol: 'NSE_EQ|INFY', change: -3.7 },
      { symbol: 'NSE_EQ|HDFCBANK', change: -2.9 }
    ]
  });
};

exports.getStockDetails = async (req, res) => {
  try {
    const symbol = toTwelveDataSymbol(req.params.symbol);
    if (!symbol) return res.status(400).json({ message: 'No symbol provided' });
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await axios.get(url);
    const d = response.data;
    res.json({
      price: d.close || d.price,
      change: d.change,
      pct: d.percent_change,
      ...d
    });
  } catch (error) {
    console.error('getStockDetails error:', error.message, error.response?.data);
    res.status(500).json({ message: 'Failed to fetch stock details', error: error.response?.data || error.message });
  }
};

exports.getCandles = async (req, res) => {
  try {
    const symbol = toTwelveDataSymbol(req.params.symbol);
    const interval = req.query.interval || '5min';
    const start_date = req.query.from;
    const end_date = req.query.to;
    let url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&apikey=${TWELVE_DATA_API_KEY}`;
    if (start_date) url += `&start_date=${start_date}`;
    if (end_date) url += `&end_date=${end_date}`;
    const response = await axios.get(url);
    if (response.data && Array.isArray(response.data.values)) {
      // Map to consistent format
      const candles = response.data.values.map(c => ({
        open: +c.open,
        high: +c.high,
        low: +c.low,
        close: +c.close,
        volume: +c.volume || 0,
        datetime: c.datetime || c.date || c.timestamp
      }));
      res.json(candles);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('getCandles error:', error.message, error.response?.data);
    res.status(500).json({ message: 'Failed to fetch candles', error: error.response?.data || error.message });
  }
};

exports.getStockList = (req, res) => {
  const stocksPath = path.join(__dirname, '../data/nse_stocks.json');
  try {
    const stocks = JSON.parse(fs.readFileSync(stocksPath, 'utf-8'));
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load stock list', error: error.message });
  }
}; 