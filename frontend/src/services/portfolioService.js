import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const tradeStock = async (action, symbol, quantity, price) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/portfolio/trade`, { 
      symbol, 
      action, 
      quantity, 
      price 
    });
    return res.data;
  } catch (error) {
    console.error('Trade error:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Trade failed. Please try again.');
  }
};

export const getPortfolio = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/portfolio`);
    return res.data;
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    throw new Error('Failed to fetch portfolio');
  }
};

export const getTransactions = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/portfolio/transactions`);
    return res.data;
  } catch (error) {
    console.error('Transactions fetch error:', error);
    throw new Error('Failed to fetch transactions');
  }
};

export const getPortfolioValue = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/portfolio/value`);
    return res.data;
  } catch (error) {
    console.error('Portfolio value fetch error:', error);
    throw new Error('Failed to fetch portfolio value');
  }
};

// Get real-time price for a symbol
export const getRealTimePrice = async (symbol) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/portfolio/price/${symbol}`);
    return res.data.price;
  } catch (error) {
    console.error('Price fetch error:', error);
    throw new Error('Failed to fetch price');
  }
};

// Get chart data for a symbol
export const getChartData = async (symbol) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/portfolio/chart/${symbol}`);
    return res.data;
  } catch (error) {
    console.error('Chart data fetch error:', error);
    throw new Error('Failed to fetch chart data');
  }
}; 