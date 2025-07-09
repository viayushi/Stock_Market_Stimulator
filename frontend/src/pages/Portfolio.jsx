import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tradeStock, getPortfolio, getTransactions } from '../services/portfolioService';
import { getRealTimePrice } from '../services/twelveDataService';
import { TrendingUp, TrendingDown, DollarSign, Package, Activity, RefreshCw, Eye, EyeOff } from 'lucide-react';

const Portfolio = () => {
  const { portfolio, refreshPortfolio } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [tradeModal, setTradeModal] = useState({ open: false, symbol: '', action: '', currentPrice: 0 });
  const [quantity, setQuantity] = useState(1);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [showTransactions, setShowTransactions] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch real-time prices for all holdings
  const fetchHoldingsWithPrices = async () => {
    if (!portfolio?.holdings) return;

    const holdingsArray = Object.entries(portfolio.holdings).map(([symbol, holding]) => ({
      symbol,
      quantity: holding.quantity,
      averagePrice: holding.averagePrice,
      currentPrice: 0,
      marketValue: 0,
      pnl: 0,
      pnlPercent: 0
    }));

    // Fetch current prices for all symbols
    const pricePromises = holdingsArray.map(async (holding) => {
      try {
        const price = await getRealTimePrice(holding.symbol);
        const currentPrice = parseFloat(price);
        const marketValue = currentPrice * holding.quantity;
        const totalCost = holding.averagePrice * holding.quantity;
        const pnl = marketValue - totalCost;
        const pnlPercent = (pnl / totalCost) * 100;

        return {
          ...holding,
          currentPrice,
          marketValue,
          pnl,
          pnlPercent
        };
      } catch (error) {
        console.error(`Error fetching price for ${holding.symbol}:`, error);
        // Use average price as fallback
        const currentPrice = holding.averagePrice;
        const marketValue = currentPrice * holding.quantity;
        return {
          ...holding,
          currentPrice,
          marketValue,
          pnl: 0,
          pnlPercent: 0
        };
      }
    });

    const updatedHoldings = await Promise.all(pricePromises);
    setHoldings(updatedHoldings);

    // Calculate totals
    const total = updatedHoldings.reduce((sum, holding) => sum + holding.marketValue, 0);
    const totalPnLValue = updatedHoldings.reduce((sum, holding) => sum + holding.pnl, 0);
    
    setTotalValue(total);
    setTotalPnL(totalPnLValue);
    setLoading(false);
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (portfolio) {
      fetchHoldingsWithPrices();
      fetchTransactions();
    }
  }, [portfolio]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && portfolio?.holdings) {
      const interval = setInterval(() => {
        fetchHoldingsWithPrices();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, portfolio]);

  const handleTrade = (symbol, action, currentPrice) => {
    setTradeModal({ open: true, symbol, action, currentPrice });
    setQuantity(1);
    setTradeMessage('');
  };

  const executeTrade = async () => {
    setTradeLoading(true);
    setTradeMessage('');

    try {
      await tradeStock(
        tradeModal.action,
        tradeModal.symbol,
        parseInt(quantity),
        tradeModal.currentPrice
      );

      // Refresh portfolio data
      await refreshPortfolio();
      await fetchTransactions();
      
      setTradeMessage(`${tradeModal.action === 'buy' ? 'Buy' : 'Sell'} order executed successfully!`);
      setTimeout(() => {
        setTradeModal({ open: false, symbol: '', action: '', currentPrice: 0 });
        setTradeMessage('');
      }, 2000);
    } catch (error) {
      setTradeMessage(error.message || 'Trade failed. Please try again.');
    } finally {
      setTradeLoading(false);
    }
  };

  const closeTradeModal = () => {
    setTradeModal({ open: false, symbol: '', action: '', currentPrice: 0 });
    setTradeMessage('');
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchHoldingsWithPrices();
    await fetchTransactions();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
            <p className="text-gray-400">Track your investments and performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                autoRefresh 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Cash</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{(portfolio?.cash || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Portfolio Value</p>
                <p className="text-2xl font-bold text-blue-400">
                  ₹{totalValue.toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total P&L</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{totalPnL.toLocaleString()}
                </p>
              </div>
              {totalPnL >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Assets</p>
                <p className="text-2xl font-bold text-purple-400">
                  ₹{((portfolio?.cash || 0) + totalValue).toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Holdings */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Holdings</h2>
            </div>
            <div className="p-6">
              {holdings.length > 0 ? (
                <div className="space-y-4">
                  {holdings.map((holding) => (
                    <div key={holding.symbol} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{holding.symbol}</h3>
                          <p className="text-gray-400 text-sm">
                            {holding.quantity} shares @ ₹{holding.averagePrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">₹{holding.currentPrice.toFixed(2)}</p>
                          <p className={`text-sm ${holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toFixed(2)} ({holding.pnlPercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400 mb-3">
                        <span>Market Value: ₹{holding.marketValue.toLocaleString()}</span>
                        <span>Total Cost: ₹{(holding.averagePrice * holding.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTrade(holding.symbol, 'buy', holding.currentPrice)}
                          className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-medium"
                        >
                          Buy More
                        </button>
                        <button
                          onClick={() => handleTrade(holding.symbol, 'sell', holding.currentPrice)}
                          className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-medium"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Holdings</h3>
                  <p className="text-gray-400">Start trading to see your holdings here</p>
                </div>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <button
                onClick={() => setShowTransactions(!showTransactions)}
                className="text-gray-400 hover:text-white"
              >
                {showTransactions ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {showTransactions && (
              <div className="p-6">
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading transactions...</p>
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx._id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{tx.symbol}</div>
                            <div className="text-sm text-gray-400">
                              {new Date(tx.timestamp || tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${tx.action === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.action.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-400">
                              {tx.quantity} shares @ ₹{tx.price?.toFixed(2)}
                            </div>
                            <div className="text-sm font-medium">
                              ₹{tx.totalCost?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                    <p className="text-gray-400">Your trading history will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trade Success Message */}
        {tradeMessage && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>{tradeMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {tradeModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {tradeModal.action === 'buy' ? 'Buy' : 'Sell'} {tradeModal.symbol}
              </h3>
              <button onClick={closeTradeModal} className="text-gray-400 hover:text-white">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Current Price</span>
                  <span>₹{tradeModal.currentPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Available Cash</span>
                  <span>₹{(portfolio?.cash || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Total Cost</span>
                  <span>₹{(tradeModal.currentPrice * quantity)?.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  min="1"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeTradeModal}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={executeTrade}
                  disabled={tradeLoading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    tradeModal.action === 'buy'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {tradeLoading ? 'Processing...' : `${tradeModal.action === 'buy' ? 'Buy' : 'Sell'} ${tradeModal.symbol}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio; 