import axios from 'axios';

const API_BASE = '/api/market';

export const getStockList = async () => {
  const res = await axios.get(`${API_BASE}/stocks`);
  return res.data;
};

export const getGainersLosers = async () => {
  const res = await axios.get(`${API_BASE}/gainers-losers`);
  return res.data;
};

export const getInstruments = async () => {
  const res = await axios.get(`${API_BASE}/instruments`);
  return res.data;
};

export const getStockDetails = async (symbol) => {
  const res = await axios.get(`${API_BASE}/stock/${encodeURIComponent(symbol)}`);
  return res.data;
};

export const getCandles = async (symbol, interval = '1d', range = '1mo') => {
  const res = await axios.get(`${API_BASE}/candles/${encodeURIComponent(symbol)}`, {
    params: { interval, range }
  });
  return res.data;
};

export const getLivePrices = async (symbols) => {
  const res = await axios.get(`${API_BASE}/quote`, { params: { symbols: symbols.join(',') } });
  return res.data;
}; 