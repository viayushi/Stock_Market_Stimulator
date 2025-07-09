import React from 'react';
import StockCard from './StockCard';

const StockList = ({ stocks }) => {
  if (!stocks || stocks.length === 0) return <div>No stocks found.</div>;
  return (
    <div className="stock-list">
      {stocks.map(stock => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  );
};

export default StockList; 