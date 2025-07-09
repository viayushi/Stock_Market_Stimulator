import React, { useState } from 'react';
import StockDetailModal from './StockDetailModal';

const StockCard = ({ stock }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="stock-card">
      <div>
        <strong>{stock.symbol}</strong> - {stock.company_name}
      </div>
      <button onClick={() => setShowModal(true)}>Details</button>
      {showModal && (
        <StockDetailModal symbol={stock.symbol} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default StockCard; 