// Alpha Vantage API Service for Real-time Stock Data
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Get API key from environment or localStorage
const getApiKey = () => {
  return localStorage.getItem('alphaVantageApiKey') || 'demo'; // Use 'demo' for testing
};

// Set API key
export const setApiKey = (apiKey) => {
  localStorage.setItem('alphaVantageApiKey', apiKey);
};

// Get real-time quote for a symbol
export const getQuote = async (symbol) => {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new Error('No data available for this symbol');
    }
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: new Date().getTime()
    };
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw error;
  }
};

// Get historical daily data
export const getDailyData = async (symbol, outputsize = 'compact') => {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No historical data available for this symbol');
    }
    
    // Transform data for amCharts
    const chartData = Object.entries(timeSeries).map(([date, values]) => ({
      date: new Date(date).getTime(),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse(); // Reverse to get chronological order
    
    return chartData;
  } catch (error) {
    console.error('Error fetching daily data:', error);
    throw error;
  }
};

// Get intraday data (1min, 5min, 15min, 30min, 60min)
export const getIntradayData = async (symbol, interval = '5min', outputsize = 'compact') => {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    const timeSeries = data[`Time Series (${interval})`];
    if (!timeSeries) {
      throw new Error('No intraday data available for this symbol');
    }
    
    // Transform data for amCharts
    const chartData = Object.entries(timeSeries).map(([datetime, values]) => ({
      date: new Date(datetime).getTime(),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse(); // Reverse to get chronological order
    
    return chartData;
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    throw error;
  }
};

// Search for symbols
export const searchSymbols = async (keywords) => {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    const bestMatches = data['bestMatches'] || [];
    return bestMatches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      marketOpen: match['5. marketOpen'],
      marketClose: match['6. marketClose'],
      timezone: match['7. timezone'],
      currency: match['8. currency'],
      matchScore: parseFloat(match['9. matchScore'])
    }));
  } catch (error) {
    console.error('Error searching symbols:', error);
    throw error;
  }
};

// Get company overview
export const getCompanyOverview = async (symbol) => {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    if (!data.Symbol) {
      throw new Error('No company data available for this symbol');
    }
    
    return {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      exchange: data.Exchange,
      currency: data.Currency,
      country: data.Country,
      sector: data.Sector,
      industry: data.Industry,
      marketCap: data.MarketCapitalization,
      peRatio: data.PERatio,
      dividendYield: data.DividendYield,
      eps: data.EPS,
      beta: data.Beta,
      fiftyTwoWeekHigh: data['52WeekHigh'],
      fiftyTwoWeekLow: data['52WeekLow']
    };
  } catch (error) {
    console.error('Error fetching company overview:', error);
    throw error;
  }
};

// Get top gainers and losers
export const getTopMovers = async () => {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    return {
      topGainers: data['top_gainers'] || [],
      topLosers: data['top_losers'] || [],
      mostActivelyTraded: data['most_actively_traded'] || []
    };
  } catch (error) {
    console.error('Error fetching top movers:', error);
    throw error;
  }
};

// Batch fetch quotes for multiple symbols
export const batchFetchQuotes = async (symbols) => {
  const quotes = {};
  const promises = symbols.map(async (symbol) => {
    try {
      const quote = await getQuote(symbol);
      quotes[symbol] = quote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      quotes[symbol] = null;
    }
  });
  
  await Promise.all(promises);
  return quotes;
};

// Generate demo data for testing (when API key is not available)
export const generateDemoData = (symbol, basePrice = 100) => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days
  
  let currentPrice = basePrice;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Realistic price movement
    const volatility = 0.03; // 3% daily volatility
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const open = currentPrice;
    currentPrice += change;
    
    const high = Math.max(open, currentPrice) + Math.random() * currentPrice * 0.02;
    const low = Math.min(open, currentPrice) - Math.random() * currentPrice * 0.02;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      date: date.getTime(),
      open: open,
      high: high,
      low: low,
      close: currentPrice,
      volume: volume
    });
  }
  
  return data;
};

// Get demo quote for testing
export const getDemoQuote = (symbol) => {
  const basePrices = {
    'AAPL': 150,
    'MSFT': 300,
    'GOOGL': 2500,
    'AMZN': 3000,
    'TSLA': 800,
    'META': 300,
    'NVDA': 400,
    'NFLX': 500,
    'AMD': 100,
    'INTC': 50
  };
  
  const basePrice = basePrices[symbol] || 100;
  const change = (Math.random() - 0.5) * basePrice * 0.05;
  const changePercent = (change / basePrice) * 100;
  
  return {
    symbol: symbol,
    price: basePrice + change,
    change: change,
    changePercent: changePercent,
    open: basePrice,
    high: basePrice + Math.abs(change) * 1.5,
    low: basePrice - Math.abs(change) * 1.5,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    previousClose: basePrice,
    timestamp: new Date().getTime()
  };
}; 