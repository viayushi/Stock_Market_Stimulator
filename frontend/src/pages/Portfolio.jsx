import React, { useEffect, useState } from 'react';
import { getHoldings, getPositions, getFunds, getPnL } from '../services/portfolioService';

const Portfolio = () => {
  const [holdings, setHoldings] = useState(null);
  const [positions, setPositions] = useState(null);
  const [funds, setFunds] = useState(null);
  const [pnl, setPnL] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const h = await getHoldings();
        setHoldings(h);
        const p = await getPositions();
        setPositions(p);
        const f = await getFunds();
        setFunds(f);
        const pl = await getPnL();
        setPnL(pl);
      } catch (err) {
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading portfolio...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="portfolio-page" style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>Portfolio</h1>
      <section style={{ marginBottom: 24 }}>
        <h2>Funds</h2>
        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8, padding: 16, marginBottom: 8 }}>
          <strong>Cash:</strong> ₹{funds && funds.cash ? funds.cash.toLocaleString() : 0}
        </div>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2>Holdings</h2>
        {holdings && holdings.holdings && Object.keys(holdings.holdings).length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Symbol</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Quantity</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(holdings.holdings).map(([symbol, data]) => (
                <tr key={symbol}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{symbol}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.quantity}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.averagePrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No holdings found.</div>
        )}
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2>Positions</h2>
        {positions && positions.positions && positions.positions.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Symbol</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Quantity</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {positions.positions.map((pos) => (
                <tr key={pos.symbol}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{pos.symbol}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{pos.quantity}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{pos.averagePrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No open positions.</div>
        )}
      </section>
      <section>
        <h2>P&amp;L</h2>
        {pnl && pnl.pnl && pnl.pnl.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Symbol</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Unrealized P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {pnl.pnl.map((item) => (
                <tr key={item.symbol}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.symbol}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.unrealizedPnL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No P&amp;L data.</div>
        )}
      </section>
    </div>
  );
};

export default Portfolio; 