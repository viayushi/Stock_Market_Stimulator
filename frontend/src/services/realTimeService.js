import io from 'socket.io-client';
import axios from 'axios';

class RealTimeService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket && this.isConnected) return;

    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('Connected to real-time service');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time service');
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    this.socket.on('reconnect_failed', () => {
      console.log('Failed to reconnect to real-time service');
    });

    this.socket.on('price_update', (data) => {
      this.notifySubscribers('price_update', data);
    });

    this.socket.on('chart_update', (data) => {
      this.notifySubscribers('chart_update', data);
    });

    this.socket.on('trade_executed', (data) => {
      this.notifySubscribers('trade_executed', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  notifySubscribers(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  subscribeToSymbol(symbol) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_symbol', { symbol });
    }
  }

  unsubscribeFromSymbol(symbol) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_symbol', { symbol });
    }
  }

  // Get real-time price from multiple sources
  async getRealTimePrice(symbol) {
    try {
      // Try primary API first
      const response = await axios.get(`/api/market/price/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time price:', error);
      // Return mock price data for development/testing
      return this.generateMockPriceData(symbol);
    }
  }

  // Generate mock price data for development
  generateMockPriceData(symbol) {
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const currentPrice = basePrice + change;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      timestamp: new Date().toISOString()
    };
  }

  // Get batch prices for multiple symbols
  async getBatchPrices(symbols) {
    try {
      const response = await axios.get(`/api/market/prices?symbols=${symbols.join(',')}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch prices:', error);
      // Return mock batch price data for development/testing
      return symbols.map(symbol => this.generateMockPriceData(symbol));
    }
  }

  // Get detailed quote information
  async getQuote(symbol) {
    try {
      const response = await axios.get(`/api/market/quote/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Return mock quote data for development/testing
      return this.generateMockQuoteData(symbol);
    }
  }

  // Generate mock quote data for development
  generateMockQuoteData(symbol) {
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const currentPrice = basePrice + change;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      open: parseFloat((basePrice + (Math.random() - 0.5) * 5).toFixed(2)),
      high: parseFloat((currentPrice + Math.random() * 5).toFixed(2)),
      low: parseFloat((currentPrice - Math.random() * 5).toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      pe: parseFloat((10 + Math.random() * 30).toFixed(2)),
      dividend: parseFloat((Math.random() * 5).toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }

  // Get historical data for charts
  async getHistoricalData(symbol, interval = '1min', outputsize = 100) {
    try {
      const response = await axios.get(`/api/market/historical/${symbol}?interval=${interval}&outputsize=${outputsize}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Return mock data for development/testing
      return this.generateMockHistoricalData(symbol, outputsize);
    }
  }

  // Generate mock historical data for development
  generateMockHistoricalData(symbol, count = 100) {
    const data = [];
    const basePrice = 100 + Math.random() * 200; // Random base price between 100-300
    let currentPrice = basePrice;
    
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60000); // 1 minute intervals
      
      // Generate realistic price movement
      const change = (Math.random() - 0.5) * 2; // Random change between -1 and +1
      currentPrice = Math.max(1, currentPrice + change);
      
      const volatility = Math.random() * 2;
      const high = currentPrice + volatility;
      const low = Math.max(1, currentPrice - volatility);
      const open = currentPrice + (Math.random() - 0.5) * 1;
      const close = currentPrice;
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({
        date: date.toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume
      });
    }
    
    return data;
  }

  // Get technical indicators
  async getTechnicalIndicators(symbol, indicators = ['sma', 'ema', 'rsi', 'macd']) {
    try {
      const response = await axios.get(`/api/market/indicators/${symbol}?indicators=${indicators.join(',')}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      throw error;
    }
  }

  // Search for symbols
  async searchSymbols(query) {
    try {
      const response = await axios.get(`/api/market/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching symbols:', error);
      // Return mock search results for development/testing
      return this.generateMockSearchResults(query);
    }
  }

  // Generate mock search results for development
  generateMockSearchResults(query) {
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'AMD', name: 'Advanced Micro Devices' },
      { symbol: 'INTC', name: 'Intel Corporation' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
      { symbol: 'JNJ', name: 'Johnson & Johnson' },
      { symbol: 'V', name: 'Visa Inc.' },
      { symbol: 'PG', name: 'Procter & Gamble Co.' },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc.' }
    ];
    
    const filtered = mockStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, 10);
  }

  // Get market overview
  async getMarketOverview() {
    try {
      const response = await axios.get('/api/market/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching market overview:', error);
      throw error;
    }
  }

  // Get top gainers and losers
  async getTopMovers() {
    try {
      const response = await axios.get('/api/market/top-movers');
      return response.data;
    } catch (error) {
      console.error('Error fetching top movers:', error);
      throw error;
    }
  }
}

// Create singleton instance
const realTimeService = new RealTimeService();

export default realTimeService; 