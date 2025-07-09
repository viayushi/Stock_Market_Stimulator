import axios from 'axios';

const API_BASE = '/api/portfolio';

export const getHoldings = async () => {
  const res = await axios.get(`${API_BASE}/holdings`, { withCredentials: true });
  return res.data;
};

export const getPositions = async () => {
  const res = await axios.get(`${API_BASE}/positions`, { withCredentials: true });
  return res.data;
};

export const getFunds = async () => {
  const res = await axios.get(`${API_BASE}/funds`, { withCredentials: true });
  return res.data;
};

export const getPnL = async () => {
  const res = await axios.get(`${API_BASE}/pnl`, { withCredentials: true });
  return res.data;
};

export const getTransactions = async () => {
  const res = await axios.get('/api/transactions');
  return res.data;
};

// Get real-time price for a symbol
export const getRealTimePrice = async (symbol) => {
  try {
    const res = await axios.get(`${API_BASE}/price/${symbol}`);
    return res.data.price;
  } catch (error) {
    console.error('Price fetch error:', error);
    throw new Error('Failed to fetch price');
  }
};

// Get chart data for a symbol
export const getChartData = async (symbol) => {
  try {
    const res = await axios.get(`${API_BASE}/chart/${symbol}`);
    return res.data;
  } catch (error) {
    console.error('Chart data fetch error:', error);
    throw new Error('Failed to fetch chart data');
  }
}; 