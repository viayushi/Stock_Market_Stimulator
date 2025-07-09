import axios from 'axios';

const API_URL = '/api/portfolio';

export const getPrice = (symbol) => axios.get(`${API_URL}/price/${symbol}`);
export const getPrices = (symbols) => axios.get(`${API_URL}/prices?symbols=${symbols.join(',')}`);
export const getChart = (symbol) => axios.get(`${API_URL}/chart/${symbol}`);

export const searchSymbols = async (keywords, apiKey) => {
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.bestMatches || [];
};

export const twelveDataSymbolSearch = async (query, apiKey) => {
  try {
    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'error') {
      console.error('Twelve Data API Error:', data.message);
      return [];
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error in symbol search:', error);
    return [];
  }
};

export const twelveDataQuote = async (symbol, apiKey) => {
  try {
    const formattedSymbol = formatSymbolForAPI(symbol);
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(formattedSymbol)}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'error') {
      console.error('Twelve Data Quote Error:', data.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
};

export const twelveDataTimeSeries = async (symbol, apiKey, interval = '1day', outputsize = 100) => {
  try {
    const formattedSymbol = formatSymbolForAPI(symbol);
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(formattedSymbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'error') {
      console.error('Twelve Data Time Series Error:', data.message);
      return [];
    }
    
    return data.values || [];
  } catch (error) {
    console.error('Error fetching time series:', error);
    return [];
  }
};

export const formatSymbolForAPI = (symbol) => {
  if (symbol.includes(':')) {
    return symbol;
  }
  
  const nseSymbols = [
    'RELIANCE', 'SBIN', 'ITC', 'ICICIBANK', 'AXISBANK', 'BAJFINANCE', 
    'MARUTI', 'LT', 'ULTRACEMCO', 'KOTAKBANK', 'TCS', 'INFY', 'HDFCBANK', 
    'WIPRO', 'TATAMOTORS', 'HINDUNILVR', 'BHARTIARTL', 'ASIANPAINT', 
    'HCLTECH', 'SUNPHARMA', 'GAIL', 'ONGC', 'COALINDIA', 'POWERGRID'
  ];
  
  const upperSymbol = symbol.toUpperCase();
  if (nseSymbols.includes(upperSymbol)) {
    return `NSE:${upperSymbol}`;
  }
  
  return `NSE:${upperSymbol}`;
};

export const validateSymbolFormat = (symbol) => {
  if (!symbol) return false;
  
  const parts = symbol.split(':');
  if (parts.length !== 2) return false;
  
  const [exchange, sym] = parts;
  if (!['NSE', 'BSE'].includes(exchange.toUpperCase())) return false;
  if (!sym || sym.length === 0) return false;
  
  return true;
};

export const getDisplaySymbol = (symbol, exchange) => {
  return `${exchange}:${symbol}`;
};

export const parseDisplaySymbol = (displaySymbol) => {
  const parts = displaySymbol.split(':');
  if (parts.length === 2) {
    return {
      exchange: parts[0],
      symbol: parts[1]
    };
  }
  return null;
};

export const batchFetchQuotes = async (symbols, apiKey) => {
  const quotes = {};
  const promises = symbols.map(async (symbol) => {
    try {
      const quote = await twelveDataQuote(symbol, apiKey);
      if (quote) {
        quotes[symbol] = quote;
      }
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
    }
  });
  
  await Promise.all(promises);
  return quotes;
};

export const getRealTimePrice = async (symbol, apiKey) => {
  try {
    const formattedSymbol = formatSymbolForAPI(symbol);
    const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(formattedSymbol)}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'error') {
      console.error('Twelve Data Price Error:', data.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching real-time price:', error);
    return null;
  }
};

export const getCompanyInfo = async (symbol, apiKey) => {
  try {
    const formattedSymbol = formatSymbolForAPI(symbol);
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(formattedSymbol)}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'error') {
      console.error('Twelve Data Company Info Error:', data.message);
      return null;
    }
    
    return {
      name: data.name,
      symbol: data.symbol,
      exchange: data.exchange,
      currency: data.currency,
      sector: data.sector,
      industry: data.industry,
      market_cap: data.market_cap,
      pe_ratio: data.pe_ratio,
      dividend_yield: data.dividend_yield,
      fifty_two_week_high: data.fifty_two_week_high,
      fifty_two_week_low: data.fifty_two_week_low
    };
  } catch (error) {
    console.error('Error fetching company info:', error);
    return null;
  }
}; 

export const getWatchlist = async () => {
  const res = await axios.get('/api/watchlist');
  return res.data;
};

export const addToWatchlist = async (symbol) => {
  const res = await axios.post('/api/watchlist', { symbol });
  return res.data;
};

export const removeFromWatchlist = async (symbol) => {
  const res = await axios.delete('/api/watchlist', { data: { symbol } });
  return res.data;
}; 