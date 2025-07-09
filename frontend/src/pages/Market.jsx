import React, { useEffect, useState } from 'react';
import StockCard from '../components/Market/StockCard';
import axios from 'axios';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/marketService';

export default function Market() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [mostActive, setMostActive] = useState([]);
  const [watchlist, setWatchlist] = useState([]); // Placeholder, should fetch from backend
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [screener, setScreener] = useState({ sector: '', minPrice: '', maxPrice: '', minVolume: '', change: '' });
  const [screenerResults, setScreenerResults] = useState([]);
  const [selected, setSelected] = useState(null);

  // Fetch gainers/losers/most active
  useEffect(() => {
    axios.get('/api/upstox/gainers-losers')
      .then(res => {
        setGainers(res.data.gainers || []);
        setLosers(res.data.losers || []);
        setMostActive(res.data.gainers.concat(res.data.losers).slice(0, 10));
      })
      .catch(() => {
        setGainers([]); setLosers([]); setMostActive([]);
      });
  }, []);

  // Search auto-suggestions
  useEffect(() => {
    if (!search) { setSearchResults([]); return; }
    const timeout = setTimeout(() => {
      axios.get(`/api/upstox/search?q=${encodeURIComponent(search)}`)
        .then(res => setSearchResults(res.data))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Screener
  const handleScreener = async () => {
    const params = new URLSearchParams(screener).toString();
    const res = await axios.get(`/api/upstox/screener?${params}`);
    setScreenerResults(res.data);
  };

  // Fetch user watchlist
  useEffect(() => {
    getWatchlist().then(setWatchlist).catch(() => setWatchlist([]));
  }, []);

  // Watchlist actions
  const isInWatchlist = selected && watchlist.includes(selected.symbol);
  const handleAddWatchlist = async () => {
    if (selected) {
      const updated = await addToWatchlist(selected.symbol);
      setWatchlist(updated);
    }
  };
  const handleRemoveWatchlist = async () => {
    if (selected) {
      const updated = await removeFromWatchlist(selected.symbol);
      setWatchlist(updated);
    }
  };

  return (
    <div className="p-4 space-y-8">
      {/* Search Bar */}
      <div className="mb-4 relative">
        <input
          className="w-full p-2 border rounded"
          placeholder="Search stocks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="bg-white border rounded shadow mt-1 max-h-60 overflow-y-auto z-10 absolute w-full">
            {searchResults.map(stock => (
              <StockCard key={stock.symbol} stock={stock} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* Only show main lists if not searching */}
      {(!search || searchResults.length === 0) && <>
        {/* Screener Panel */}
        <div className="mb-4 flex flex-wrap gap-2 items-end">
          <input className="border p-1 rounded" placeholder="Sector" value={screener.sector} onChange={e => setScreener(s => ({ ...s, sector: e.target.value }))} />
          <input className="border p-1 rounded" placeholder="Min Price" type="number" value={screener.minPrice} onChange={e => setScreener(s => ({ ...s, minPrice: e.target.value }))} />
          <input className="border p-1 rounded" placeholder="Max Price" type="number" value={screener.maxPrice} onChange={e => setScreener(s => ({ ...s, maxPrice: e.target.value }))} />
          <input className="border p-1 rounded" placeholder="Min Volume" type="number" value={screener.minVolume} onChange={e => setScreener(s => ({ ...s, minVolume: e.target.value }))} />
          <input className="border p-1 rounded" placeholder="% Change" type="number" value={screener.change} onChange={e => setScreener(s => ({ ...s, change: e.target.value }))} />
          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleScreener}>Filter</button>
        </div>
        {screenerResults.length > 0 && (
          <div>
            <h2 className="font-bold mb-2">Screener Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {screenerResults.map(stock => (
                <StockCard key={stock.symbol} stock={stock} onClick={setSelected} />
              ))}
            </div>
          </div>
        )}

        {/* Top Gainers */}
        <div>
          <h2 className="font-bold mb-2">Top Gainers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gainers.map(stock => (
              <StockCard key={stock.symbol} stock={{ ...stock, changePercent: stock.changePercent, volume: stock.volume }} onClick={setSelected} />
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <h2 className="font-bold mb-2">Top Losers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {losers.map(stock => (
              <StockCard key={stock.symbol} stock={{ ...stock, changePercent: stock.changePercent, volume: stock.volume }} onClick={setSelected} />
            ))}
          </div>
        </div>

        {/* Most Active */}
        <div>
          <h2 className="font-bold mb-2">Most Active</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mostActive.map(stock => (
              <StockCard key={stock.symbol} stock={{ ...stock, changePercent: stock.changePercent, volume: stock.volume }} onClick={setSelected} />
            ))}
          </div>
        </div>

        {/* Watchlist (placeholder) */}
        <div>
          <h2 className="font-bold mb-2">My Watchlist</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {watchlist.map(stock => (
              <StockCard key={stock.symbol} stock={stock} onClick={setSelected} />
            ))}
          </div>
        </div>
      </>}

      {/* Stock Detail Modal (placeholder) */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setSelected(null)}>✕</button>
            <h2 className="text-xl font-bold mb-2">{selected.symbol} - {selected.name}</h2>
            {/* TODO: Add AdvancedChart, MarketData, Buy/Sell, Watchlist button here */}
            <div className="mb-4">
              {isInWatchlist ? (
                <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleRemoveWatchlist}>Remove from Watchlist</button>
              ) : (
                <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleAddWatchlist}>Add to Watchlist</button>
              )}
            </div>
            <div className="text-gray-700">Stock details and chart coming soon...</div>
          </div>
        </div>
      )}
    </div>
  );
} 