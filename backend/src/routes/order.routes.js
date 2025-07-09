const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');

// Place a new order
router.post('/', protect, orderController.placeOrder);
// Modify an order
router.put('/:orderId', protect, orderController.modifyOrder);
// Cancel an order
router.delete('/:orderId', protect, orderController.cancelOrder);
// Get order status
router.get('/:orderId', protect, orderController.getOrderStatus);
// Get order book
router.get('/book/all', protect, orderController.getOrderBook);
// Get trade book
router.get('/trades/all', protect, orderController.getTradeBook);
// Simulated buy/sell order
router.post('/sim', protect, orderController.placeSimOrder);

module.exports = router; 