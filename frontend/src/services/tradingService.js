import axios from 'axios';

export const placeSimOrder = async ({ symbol, action, quantity, price }) => {
  const res = await axios.post('/api/order/sim', { symbol, action, quantity, price }, { withCredentials: true });
  return res.data;
};

const tradingService = {
  async executeTrade(orderData) {
    // orderData: { symbol, action, quantity, price }
    return await placeSimOrder(orderData);
  },
  formatOrderData(symbol, action, quantity, price) {
    return { symbol, action, quantity, price };
  },
  calculateTradeCosts(price, quantity, action) {
    // For simulation, just return total cost (no commission)
    return {
      totalCost: price * quantity,
      commission: 0
    };
  }
};

export default tradingService; 