import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import tradingService from '../../services/tradingService';
import { toast } from 'react-hot-toast';

const TradeModal = ({ 
  isOpen, 
  onClose, 
  symbol, 
  action, 
  currentPrice, 
  balance, 
  holdings,
  onTradeSuccess 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(currentPrice || 0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tradeCosts, setTradeCosts] = useState(null);

  const isBuy = action === 'buy';
  const isSell = action === 'sell';
  const currentHolding = holdings?.[symbol] || { quantity: 0, averagePrice: 0 };

  useEffect(() => {
    if (currentPrice) {
      setPrice(currentPrice);
    }
  }, [currentPrice]);

  useEffect(() => {
    if (price && quantity) {
      const costs = tradingService.calculateTradeCosts(price, quantity, action);
      setTradeCosts(costs);
    }
  }, [price, quantity, action]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!quantity || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    } else if (!Number.isInteger(Number(quantity))) {
      newErrors.quantity = 'Quantity must be a whole number';
    }

    if (!price || price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (isBuy && tradeCosts && tradeCosts.totalCost > balance) {
      newErrors.balance = 'Insufficient funds for this trade';
    }

    if (isSell && quantity > currentHolding.quantity) {
      newErrors.quantity = `You only have ${currentHolding.quantity} shares of ${symbol}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuantityChange = (value) => {
    const newQuantity = Math.max(1, parseInt(value) || 1);
    setQuantity(newQuantity);
  };

  const handlePriceChange = (value) => {
    const newPrice = Math.max(0, parseFloat(value) || 0);
    setPrice(newPrice);
  };

  const handleTrade = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = tradingService.formatOrderData(symbol, action, quantity, price);
      
      const result = await tradingService.executeTrade(orderData);
      
      toast.success(`${action.toUpperCase()} order executed successfully!`);
      
      if (onTradeSuccess) {
        onTradeSuccess(result);
      }
      
      onClose();
    } catch (error) {
      toast.error(error.message || 'Trade execution failed');
    } finally {
      setLoading(false);
    }
  };

  const getMaxQuantity = () => {
    if (isBuy) {
      return Math.floor((balance - (tradeCosts?.commission || 0)) / price);
    } else {
      return currentHolding.quantity;
    }
  };

  const quickQuantityButtons = [1, 10, 50, 100, 500];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isBuy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {isBuy ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isBuy ? 'Buy' : 'Sell'} {symbol}
                </h2>
                <p className="text-sm text-gray-400">
                  {isBuy ? 'Purchase shares' : 'Sell shares'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Price */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Price</span>
                <span className="text-2xl font-bold text-white">${currentPrice?.toFixed(2)}</span>
              </div>
              {currentPrice && price !== currentPrice && (
                <div className="mt-2 text-sm text-gray-400">
                  You're trading at ${price.toFixed(2)} per share
                </div>
              )}
            </div>

            {/* Quantity Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Quantity
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                  min="1"
                />
                <button
                  onClick={() => handleQuantityChange(getMaxQuantity())}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Max
                </button>
              </div>
              {errors.quantity && (
                <p className="text-sm text-red-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.quantity}
                </p>
              )}
              
              {/* Quick Quantity Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickQuantityButtons.map((qty) => (
                  <button
                    key={qty}
                    onClick={() => handleQuantityChange(qty)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Price per Share
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.price && (
                <p className="text-sm text-red-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.price}
                </p>
              )}
            </div>

            {/* Trade Summary */}
            {tradeCosts && (
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Trade Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Cost</span>
                    <span className="text-white">${tradeCosts.baseCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Commission</span>
                    <span className="text-white">${tradeCosts.commission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fees</span>
                    <span className="text-white">${tradeCosts.fees.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-300">Total Cost</span>
                      <span className="text-white">${tradeCosts.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Check */}
            {isBuy && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Available Balance</span>
                  <span className="text-white">${balance.toFixed(2)}</span>
                </div>
                {tradeCosts && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Remaining After Trade</span>
                    <span className={`${tradeCosts.totalCost > balance ? 'text-red-400' : 'text-green-400'}`}>
                      ${(balance - tradeCosts.totalCost).toFixed(2)}
                    </span>
                  </div>
                )}
                {errors.balance && (
                  <p className="text-sm text-red-400 mt-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.balance}
                  </p>
                )}
              </div>
            )}

            {/* Holdings Info for Sell */}
            {isSell && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Holdings</span>
                  <span className="text-white">{currentHolding.quantity} shares</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Average Price</span>
                  <span className="text-white">${currentHolding.averagePrice.toFixed(2)}</span>
                </div>
                {quantity > currentHolding.quantity && (
                  <p className="text-sm text-red-400 mt-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Insufficient shares
                  </p>
                )}
              </div>
            )}

            {/* Error Display */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">
                  Please fix the errors above before proceeding
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex space-x-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleTrade}
              disabled={loading || Object.keys(errors).length > 0}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                loading || Object.keys(errors).length > 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : isBuy
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{isBuy ? 'Buy' : 'Sell'} Shares</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradeModal; 