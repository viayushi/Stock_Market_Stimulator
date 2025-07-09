import React from 'react';
import { useRealTimePrice } from '../../hooks/useRealTimePrice';

export default function StockCard({ stock, onClick }) {
  const price = useRealTimePrice(stock.symbol);
  const changePercent = stock.changePercent !== undefined ? stock.changePercent : null;
  const volume = stock.volume !== undefined ? stock.volume : null;
  // Use a default logo if not provided
  const logoUrl = stock.logo || '/default-logo.png';
  return (
    <div
      className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center cursor-pointer transition hover:shadow-lg border border-gray-200"
      onClick={() => onClick(stock)}
    >
      <img
        src={logoUrl}
        alt={stock.symbol + ' logo'}
        className="w-16 h-16 rounded-full mb-2 border-2 border-gray-200 object-cover bg-white"
        onError={e => { e.target.src = '/default-logo.png'; }}
        loading="lazy"
      />
      <div className="font-bold text-lg">{stock.symbol}</div>
      <div className="text-gray-600 text-center">{stock.name}</div>
      <div className="mt-2 text-xl font-mono text-green-600">
        {price !== null ? `₹${price}` : 'Loading...'}
      </div>
      {changePercent !== null && (
        <div className={`mt-1 text-sm font-semibold ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </div>
      )}
      {volume !== null && (
        <div className="mt-1 text-xs text-gray-500">Vol: {volume.toLocaleString()}</div>
      )}
    </div>
  );
} 