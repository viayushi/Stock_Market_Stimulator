import React, { useEffect, useState, useRef } from 'react';
import { getStockList, getLivePrices } from '../services/marketService';
import StockDetailModal from '../components/Market/StockDetailModal';
import { ArrowUpRight, ArrowDownRight, Search, XCircle } from 'lucide-react';

const placeholderIcon = (symbol) => (
  <div style={{
    width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #223b6b 60%, #7ecbff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 20, boxShadow: '0 2px 8px #0002'
  }}>{symbol[0]}</div>
);

const Market = () => {
  const [stocks, setStocks] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [selectedStock, setSelectedStock] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAction, setTradeAction] = useState('buy');
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchInputRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stockList = await getStockList();
        setStocks(stockList);
        setSelectedStock(stockList[0]?.symbol || null);
      } catch (err) {
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!stocks.length) return;
    const symbols = stocks.map(s => s.symbol);
    const fetchPrices = async () => {
      try {
        const prices = await getLivePrices(symbols);
        setLivePrices(prices);
      } catch {}
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [stocks]);

  const filteredStocks = stocks.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    (s.company_name && s.company_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div>Loading market data...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#101223', justifyContent: 'center', alignItems: 'flex-start', gap: 40 }}>
      {/* Left: Stock List */}
      <div style={{
        width: 440,
        minWidth: 340,
        background: 'rgba(24,28,42,0.96)',
        boxShadow: '0 8px 32px #0004',
        borderRadius: 24,
        marginTop: 40,
        marginBottom: 40,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 40,
        height: 'calc(100vh - 80px)'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', padding: 32, paddingBottom: 16, background: 'rgba(36,40,60,0.98)', borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 2 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              style={{
                width: '100%',
                padding: '12px 44px 12px 16px',
                borderRadius: 10,
                border: searchFocus ? '2px solid #7ecbff' : '1px solid #23263a',
                background: searchFocus ? 'rgba(34,59,107,0.14)' : '#23263a',
                color: '#fff',
                fontSize: 18,
                outline: 'none',
                boxShadow: searchFocus ? '0 0 0 2px #7ecbff33' : 'none',
                transition: 'border 0.2s, box-shadow 0.2s, background 0.2s'
              }}
            />
            <Search size={22} style={{ position: 'absolute', left: 12, top: 14, color: '#7ecbff', pointerEvents: 'none' }} />
            {search && (
              <button
                onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 0 }}
                tabIndex={-1}
                aria-label="Clear search"
              >
                <XCircle size={22} />
              </button>
            )}
          </div>
        </div>
        {/* Stock List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px 0' }}>
          {filteredStocks.length === 0 && (
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: 60, fontSize: 20 }}>No stocks found.</div>
          )}
          {filteredStocks.map(stock => {
            const priceObj = livePrices[stock.symbol] || {};
            const price = priceObj.price || priceObj.close || '-';
            const change = priceObj.change || priceObj.pct || 0;
            const isUp = change > 0;
            const isSelected = selectedStock === stock.symbol;
            return (
              <div
                key={stock.symbol}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18, padding: '16px 26px', cursor: 'pointer', background: isSelected ? 'linear-gradient(90deg, #223b6b 60%, #181c2a 100%)' : 'none', borderLeft: isSelected ? '4px solid #7ecbff' : '4px solid transparent', borderRadius: 14, margin: '6px 14px', boxShadow: isSelected ? '0 2px 16px #7ecbff22' : 'none', transition: 'background 0.2s, box-shadow 0.2s' }}
                onClick={() => setSelectedStock(stock.symbol)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') setSelectedStock(stock.symbol); }}
              >
                {placeholderIcon(stock.symbol)}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{stock.symbol}</div>
                  <div style={{ color: '#aaa', fontSize: 15 }}>{stock.company_name}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>{price}</div>
                  <div style={{ color: isUp ? '#27ae60' : '#c0392b', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {change > 0 ? '+' : ''}{change}%
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 16 }}>
                  <button style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 6px #27ae6022', transition: 'background 0.15s, box-shadow 0.15s' }} onClick={e => { e.stopPropagation(); setSelectedStock(stock.symbol); setTradeAction('buy'); setShowTradeModal(true); }}>Buy</button>
                  <button style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 6px #c0392b22', transition: 'background 0.15s, box-shadow 0.15s' }} onClick={e => { e.stopPropagation(); setSelectedStock(stock.symbol); setTradeAction('sell'); setShowTradeModal(true); }}>Sell</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Right: Stock Details/Chart */}
      <div style={{ flex: 1, padding: 40, background: '#101223', minHeight: '100vh', display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, maxWidth: 900, margin: '0 auto' }}>
          {selectedStock && (
            <StockDetailModal symbol={selectedStock} onClose={() => setSelectedStock(null)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Market; 