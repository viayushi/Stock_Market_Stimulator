const BASE_URL = 'https://api.twelvedata.com';

// Get current API key
const getApiKey = () => {
  if (typeof window !== 'undefined' && window.TWELVE_DATA_API_KEY) {
    return window.TWELVE_DATA_API_KEY;
  }
  return '47e81b17c0fa419792d26280ee49b3a7'; // Updated API key
};

// Fetch real-time price for a symbol
export const getRealTimePrice = async (symbol) => {
  try {
    const apiKey = getApiKey();
    if (apiKey === '47e81b17c0fa419792d26280ee49b3a7') {
      console.warn('Using default API key. Please set your Twelve Data API key.');
    }

    const response = await fetch(
      `${BASE_URL}/price?symbol=${symbol}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'API error');
    }
    
    return {
      price: parseFloat(data.price),
      timestamp: new Date().getTime(),
      symbol: data.symbol
    };
  } catch (error) {
    console.error('Error fetching real-time price:', error);
    throw error;
  }
};

// Fetch historical OHLC data
export const getHistoricalData = async (symbol, interval = '1day', outputsize = 30) => {
  try {
    const apiKey = getApiKey();
    if (apiKey === '47e81b17c0fa419792d26280ee49b3a7') {
      console.warn('Using default API key. Please set your Twelve Data API key.');
    }

    const response = await fetch(
      `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'API error');
    }
    
    // Transform data for amCharts
    return data.values.map(item => ({
      date: new Date(item.datetime).getTime(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume) || 0
    })).reverse(); // Reverse to get chronological order
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

// Fetch quote data (includes OHLC, volume, etc.)
export const getQuote = async (symbol) => {
  try {
    const apiKey = getApiKey();
    if (apiKey === '47e81b17c0fa419792d26280ee49b3a7') {
      console.warn('Using default API key. Please set your Twelve Data API key.');
    }

    const response = await fetch(
      `${BASE_URL}/quote?symbol=${symbol}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'API error');
    }
    
    return {
      symbol: data.symbol,
      price: parseFloat(data.close),
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      volume: parseInt(data.volume),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      timestamp: new Date(data.timestamp).getTime()
    };
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw error;
  }
};

// Search for symbols
export const searchSymbols = async (query) => {
  try {
    const apiKey = getApiKey();
    if (apiKey === '47e81b17c0fa419792d26280ee49b3a7') {
      console.warn('Using default API key. Please set your Twelve Data API key.');
    }

    const response = await fetch(
      `${BASE_URL}/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'API error');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error searching symbols:', error);
    throw error;
  }
};

// Get exchange rates (for currency pairs)
export const getExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    const apiKey = getApiKey();
    if (apiKey === '47e81b17c0fa419792d26280ee49b3a7') {
      console.warn('Using default API key. Please set your Twelve Data API key.');
    }

    const response = await fetch(
      `${BASE_URL}/exchange_rate?symbol=${fromCurrency}/${toCurrency}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'API error');
    }
    
    return {
      rate: parseFloat(data.rate),
      fromCurrency: data.from_currency,
      toCurrency: data.to_currency,
      timestamp: new Date(data.timestamp).getTime()
    };
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
};

// Set API key (call this function to set your API key)
export const setApiKey = (apiKey) => {
  if (typeof window !== 'undefined') {
    window.TWELVE_DATA_API_KEY = apiKey;
  }
};

// Export getApiKey function
export { getApiKey }; 