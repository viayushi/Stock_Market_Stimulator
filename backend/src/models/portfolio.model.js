const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cash: {
    type: Number,
    required: true,
    default: 10000
  },
  holdings: {
    type: Map,
    of: {
      quantity: Number,
      averagePrice: Number
    },
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Portfolio', portfolioSchema); 