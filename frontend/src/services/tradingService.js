import axios from 'axios';
import realTimeService from './realTimeService';

class TradingService {
  constructor() {
    this.baseURL = '/api/trading';
  }

  // Execute a trade (buy/sell)
  async executeTrade(orderData) {
    try {
      const response = await axios.post(`${this.baseURL}/execute`, orderData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Notify real-time service about the trade
      if (realTimeService.socket && realTimeService.isConnected) {
        realTimeService.socket.emit('trade_executed', {
          symbol: orderData.symbol,
          action: orderData.action,
          quantity: orderData.quantity,
          price: orderData.price,
          timestamp: new Date().toISOString(),
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Trade execution error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Trade execution failed. Please try again.');
    }
  }

  // Get order history
  async getOrderHistory(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`${this.baseURL}/orders?${params}`);
      return response.data;
    } catch (error) {
      console.error('Order history fetch error:', error);
      throw new Error('Failed to fetch order history');
    }
  }

  // Cancel an order
  async cancelOrder(orderId) {
    try {
      const response = await axios.post(`${this.baseURL}/cancel/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Order cancellation error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to cancel order');
    }
  }

  // Get pending orders
  async getPendingOrders() {
    try {
      const response = await axios.get(`${this.baseURL}/pending`);
      return response.data;
    } catch (error) {
      console.error('Pending orders fetch error:', error);
      throw new Error('Failed to fetch pending orders');
    }
  }

  // Place a limit order
  async placeLimitOrder(orderData) {
    try {
      const response = await axios.post(`${this.baseURL}/limit`, orderData);
      return response.data;
    } catch (error) {
      console.error('Limit order placement error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to place limit order');
    }
  }

  // Place a stop loss order
  async placeStopLossOrder(orderData) {
    try {
      const response = await axios.post(`${this.baseURL}/stop-loss`, orderData);
      return response.data;
    } catch (error) {
      console.error('Stop loss order placement error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to place stop loss order');
    }
  }

  // Get trade analytics
  async getTradeAnalytics(symbol, period = '1d') {
    try {
      const response = await axios.get(`${this.baseURL}/analytics/${symbol}?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Trade analytics fetch error:', error);
      throw new Error('Failed to fetch trade analytics');
    }
  }

  // Get portfolio performance
  async getPortfolioPerformance(period = '1m') {
    try {
      const response = await axios.get(`${this.baseURL}/performance?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Portfolio performance fetch error:', error);
      throw new Error('Failed to fetch portfolio performance');
    }
  }

  // Get risk metrics
  async getRiskMetrics() {
    try {
      const response = await axios.get(`${this.baseURL}/risk-metrics`);
      return response.data;
    } catch (error) {
      console.error('Risk metrics fetch error:', error);
      throw new Error('Failed to fetch risk metrics');
    }
  }

  // Validate trade order
  async validateOrder(orderData) {
    try {
      const response = await axios.post(`${this.baseURL}/validate`, orderData);
      return response.data;
    } catch (error) {
      console.error('Order validation error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Order validation failed');
    }
  }

  // Get market depth
  async getMarketDepth(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/market-depth/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Market depth fetch error:', error);
      throw new Error('Failed to fetch market depth');
    }
  }

  // Get trade recommendations
  async getTradeRecommendations(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/recommendations/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Trade recommendations fetch error:', error);
      throw new Error('Failed to fetch trade recommendations');
    }
  }

  // Calculate trade costs
  calculateTradeCosts(price, quantity, action = 'buy') {
    const baseCost = price * quantity;
    const commission = Math.max(1, baseCost * 0.001); // 0.1% commission, minimum $1
    const fees = baseCost * 0.0001; // 0.01% fees
    
    const totalCost = baseCost + commission + fees;
    
    return {
      baseCost,
      commission,
      fees,
      totalCost,
      costPerShare: totalCost / quantity,
    };
  }

  // Validate trade parameters
  validateTradeParams(symbol, action, quantity, price) {
    const errors = [];

    if (!symbol || symbol.trim() === '') {
      errors.push('Symbol is required');
    }

    if (!['buy', 'sell'].includes(action)) {
      errors.push('Action must be either "buy" or "sell"');
    }

    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      errors.push('Quantity must be a positive integer');
    }

    if (!price || price <= 0) {
      errors.push('Price must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Format order data for API
  formatOrderData(symbol, action, quantity, price, orderType = 'market') {
    return {
      symbol: symbol.toUpperCase(),
      action,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      orderType,
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
const tradingService = new TradingService();

export default tradingService; 