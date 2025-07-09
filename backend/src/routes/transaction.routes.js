const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

// Get all transactions for the authenticated user
router.get('/', protect, transactionController.getTransactions);

module.exports = router; 