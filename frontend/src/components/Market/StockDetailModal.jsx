import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { getStockDetails, getCandles, getLivePrices } from '../../services/marketService';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';
import TradeModal from '../Trading/TradeModal';
import { getHoldings, getFunds } from '../../services/portfolioService';
import { Loader2 } from 'lucide-react';

const INDICATOR_DEFAULTS = { sma: true, ema: false, rsi: false, macd: false, bb: false };
const DRAW_TOOLS = [
  { key: 'trend', label: 'Trendline' },
  { key: 'ray', label: 'Ray' },
  { key: 'arrow', label: 'Arrow' },
  { key: 'hline', label: 'Horizontal' },
  { key: 'rect', label: 'Rectangle' },
  { key: 'ellipse', label: 'Ellipse' },
  { key: 'text', label: 'Text' }
];

const StockDetailModal = ({ symbol, onClose }) => {
  const [details, setDetails] = useState(null);
  const [candles, setCandles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indicators, setIndicators] = useState(INDICATOR_DEFAULTS);
  const [drawTool, setDrawTool] = useState(null);
  const chartRef = useRef(null);
  const chartRoot = useRef(null);
  const drawingRefs = useRef([]);
  let drawing = useRef(null);
  let startPoint = useRef(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAction, setTradeAction] = useState('buy');
  const [portfolio, setPortfolio] = useState({ holdings: {}, cash: 0 });
  const [livePrice, setLivePrice] = useState(null);
  const [liveChange, setLiveChange] = useState(null);
  // Chart loading state
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const d = await getStockDetails(symbol);
        setDetails(d);
        const c = await getCandles(symbol);
        setCandles(c);
      } catch (err) {
        setError('Failed to load stock details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [symbol]);

  // Poll live price for this stock
  useEffect(() => {
    let isMounted = true;
    const fetchLive = async () => {
      try {
        const prices = await getLivePrices([symbol]);
        if (isMounted && prices && prices[symbol]) {
          setLivePrice(prices[symbol].price || prices[symbol].close || null);
          setLiveChange(prices[symbol].change || prices[symbol].pct || null);
        }
      } catch {}
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [symbol]);

  // Fetch portfolio info for trade modal
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const h = await getHoldings();
        const f = await getFunds();
        setPortfolio({ holdings: h.holdings || {}, cash: f.cash || 0 });
      } catch {}
    };
    fetchPortfolio();
  }, [symbol, showTradeModal]);

  useLayoutEffect(() => {
    console.log('Candle data:', candles);
    if (!candles || !Array.isArray(candles) || candles.length === 0 || !chartRef.current) {
      setChartLoading(true);
      return;
    }
    setChartLoading(false);
    if (chartRoot.current) {
      chartRoot.current.dispose();
    }
    let root = am5.Root.new(chartRef.current);
    chartRoot.current = root;
    root.setThemes([am5themes_Animated.new(root)]);
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'zoomX',
        wheelY: 'zoomY',
        layout: root.verticalLayout,
        background: am5.Rectangle.new(root, { fill: am5.color(0x181c2a) })
      })
    );
    let xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.5,
        groupData: false,
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 60,
          stroke: am5.color(0x444a6d),
          grid: { stroke: am5.color(0x23263a) }
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );
    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          stroke: am5.color(0x444a6d),
          grid: { stroke: am5.color(0x23263a) }
        })
      })
    );
    let series = chart.series.push(
      am5xy.CandlestickSeries.new(root, {
        name: symbol,
        xAxis,
        yAxis,
        openValueYField: 'open',
        valueYField: 'close',
        lowValueYField: 'low',
        highValueYField: 'high',
        valueXField: 'timestamp',
        tooltip: am5.Tooltip.new(root, {
          labelText: 'O:{open} H:{high} L:{low} C:{close}'
        }),
        fill: am5.color(0x27ae60),
        stroke: am5.color(0xc0392b)
      })
    );
    // Prepare data
    const chartData = candles.slice(-100).map(c => ({
      timestamp: new Date(c.datetime || c.date || c.timestamp).getTime(),
      open: +c.open,
      high: +c.high,
      low: +c.low,
      close: +c.close,
      volume: +c.volume || 0
    }));
    series.data.setAll(chartData);

    // SMA
    if (indicators.sma) {
      const smaArr = SMA.calculate({ period: 20, values: chartData.map(d => d.close) });
      let smaSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'SMA 20',
          xAxis,
          yAxis,
          valueYField: 'sma',
          valueXField: 'timestamp',
          stroke: am5.color(0x007bff),
          strokeWidth: 2
        })
      );
      smaSeries.data.setAll(chartData.map((d, i) => ({ ...d, sma: smaArr[i - (chartData.length - smaArr.length)] })));
    }
    // EMA
    if (indicators.ema) {
      const emaArr = EMA.calculate({ period: 20, values: chartData.map(d => d.close) });
      let emaSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'EMA 20',
          xAxis,
          yAxis,
          valueYField: 'ema',
          valueXField: 'timestamp',
          stroke: am5.color(0xff9900),
          strokeWidth: 2
        })
      );
      emaSeries.data.setAll(chartData.map((d, i) => ({ ...d, ema: emaArr[i - (chartData.length - emaArr.length)] })));
    }
    // Bollinger Bands
    if (indicators.bb) {
      const bb = BollingerBands.calculate({ period: 20, stdDev: 2, values: chartData.map(d => d.close) });
      let upperSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'BB Upper',
          xAxis,
          yAxis,
          valueYField: 'bbUpper',
          valueXField: 'timestamp',
          stroke: am5.color(0x888888),
          strokeDasharray: [4, 4],
          strokeWidth: 1
        })
      );
      let lowerSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'BB Lower',
          xAxis,
          yAxis,
          valueYField: 'bbLower',
          valueXField: 'timestamp',
          stroke: am5.color(0x888888),
          strokeDasharray: [4, 4],
          strokeWidth: 1
        })
      );
      upperSeries.data.setAll(chartData.map((d, i) => ({ ...d, bbUpper: bb[i - (chartData.length - bb.length)]?.upper }))); 
      lowerSeries.data.setAll(chartData.map((d, i) => ({ ...d, bbLower: bb[i - (chartData.length - bb.length)]?.lower }))); 
    }
    // RSI (separate axis)
    if (indicators.rsi) {
      const rsiArr = RSI.calculate({ period: 14, values: chartData.map(d => d.close) });
      let rsiAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}), height: am5.percent(20), extraMax: 0.1 })
      );
      let rsiSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'RSI 14',
          xAxis,
          yAxis: rsiAxis,
          valueYField: 'rsi',
          valueXField: 'timestamp',
          stroke: am5.color(0x00b894),
          strokeWidth: 2
        })
      );
      rsiSeries.data.setAll(chartData.map((d, i) => ({ ...d, rsi: rsiArr[i - (chartData.length - rsiArr.length)] })));
    }
    // MACD (separate axis)
    if (indicators.macd) {
      const macd = MACD.calculate({
        values: chartData.map(d => d.close),
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      let macdAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}), height: am5.percent(20), extraMax: 0.1 })
      );
      let macdSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'MACD',
          xAxis,
          yAxis: macdAxis,
          valueYField: 'macd',
          valueXField: 'timestamp',
          stroke: am5.color(0x6c5ce7),
          strokeWidth: 2
        })
      );
      let signalSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'Signal',
          xAxis,
          yAxis: macdAxis,
          valueYField: 'signal',
          valueXField: 'timestamp',
          stroke: am5.color(0xfdcb6e),
          strokeWidth: 2
        })
      );
      let histSeries = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: 'Histogram',
          xAxis,
          yAxis: macdAxis,
          valueYField: 'hist',
          valueXField: 'timestamp',
          fill: am5.color(0x636e72),
          stroke: am5.color(0x636e72)
        })
      );
      macdSeries.data.setAll(chartData.map((d, i) => ({ ...d, macd: macd[i - (chartData.length - macd.length)]?.MACD })));
      signalSeries.data.setAll(chartData.map((d, i) => ({ ...d, signal: macd[i - (chartData.length - macd.length)]?.signal })));
      histSeries.data.setAll(chartData.map((d, i) => ({ ...d, hist: macd[i - (chartData.length - macd.length)]?.histogram })));
    }

    // Drawing tools
    drawingRefs.current = [];
    let drawingLayer = chart.plotContainer.children.push(am5.Container.new(root, {}));
    drawing.current = null;
    startPoint.current = null;
    function handlePointerDown(ev) {
      if (!drawTool) return;
      const { x, y } = chart.plotContainer.toLocal(ev.point);
      startPoint.current = { x, y };
      if (drawTool === 'trend') {
        drawing.current = drawingLayer.children.push(am5.Line.new(root, {
          x1: x, y1: y, x2: x, y2: y, stroke: am5.color(0x007bff), strokeWidth: 2
        }));
      } else if (drawTool === 'ray') {
        drawing.current = drawingLayer.children.push(am5.Line.new(root, {
          x1: x, y1: y, x2: x + 100, y2: y, stroke: am5.color(0x8e44ad), strokeWidth: 2, strokeDasharray: [6, 3]
        }));
      } else if (drawTool === 'arrow') {
        drawing.current = drawingLayer.children.push(am5.Line.new(root, {
          x1: x, y1: y, x2: x, y2: y, stroke: am5.color(0xe67e22), strokeWidth: 2, 
          endArrow: am5.LineArrow.new(root, { length: 15, width: 10 })
        }));
      } else if (drawTool === 'hline') {
        drawing.current = drawingLayer.children.push(am5.Line.new(root, {
          x1: 0, y1: y, x2: chart.plotContainer.width(), y2: y, stroke: am5.color(0x00b894), strokeWidth: 2
        }));
      } else if (drawTool === 'rect') {
        drawing.current = drawingLayer.children.push(am5.Rectangle.new(root, {
          x: x, y: y, width: 1, height: 1, fill: am5.color(0xfdcb6e), fillOpacity: 0.2, stroke: am5.color(0xfdcb6e)
        }));
      } else if (drawTool === 'ellipse') {
        drawing.current = drawingLayer.children.push(am5.Ellipse.new(root, {
          x: x, y: y, width: 1, height: 1, fill: am5.color(0x74b9ff), fillOpacity: 0.2, stroke: am5.color(0x0984e3)
        }));
      } else if (drawTool === 'text') {
        const text = prompt('Enter label text:');
        if (text) {
          drawing.current = drawingLayer.children.push(am5.Label.new(root, {
            x: x, y: y, text, fontSize: 16, fill: am5.color(0xd35400), fontWeight: 'bold', background: am5.Rectangle.new(root, { fill: am5.color(0xfdebd0), fillOpacity: 0.7 })
          }));
          drawingRefs.current.push(drawing.current);
        }
        drawing.current = null;
        startPoint.current = null;
        return;
      }
      drawingRefs.current.push(drawing.current);
    }
    function handlePointerMove(ev) {
      if (!drawTool || !drawing.current || !startPoint.current) return;
      const { x, y } = chart.plotContainer.toLocal(ev.point);
      if (drawTool === 'trend' || drawTool === 'arrow') {
        drawing.current.set('x2', x);
        drawing.current.set('y2', y);
      } else if (drawTool === 'ray') {
        // Extend the line to the right edge
        drawing.current.set('x2', chart.plotContainer.width());
        drawing.current.set('y2', y);
      } else if (drawTool === 'rect') {
        drawing.current.set('width', x - startPoint.current.x);
        drawing.current.set('height', y - startPoint.current.y);
      } else if (drawTool === 'ellipse') {
        drawing.current.set('width', x - startPoint.current.x);
        drawing.current.set('height', y - startPoint.current.y);
      }
    }
    function handlePointerUp() {
      drawing.current = null;
      startPoint.current = null;
    }
    chart.plotContainer.events.on('pointerdown', handlePointerDown);
    chart.plotContainer.events.on('pointermove', handlePointerMove);
    chart.plotContainer.events.on('pointerup', handlePointerUp);

    // Clean up
    return () => {
      root.dispose();
      chartRoot.current = null;
    };
  }, [candles, symbol, indicators, drawTool]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ background: 'rgba(24,28,42,0.98)', borderRadius: 16, boxShadow: '0 4px 32px #0002', maxWidth: 900, margin: '40px auto', padding: 0, overflow: 'hidden', color: '#fff', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '28px 32px 18px 32px', borderBottom: '1px solid #23263a', background: 'linear-gradient(90deg, #23263a 60%, #181c2a 100%)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{details?.company_name || symbol}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ background: '#223b6b', color: '#7ecbff', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>NSE</span>
            <span style={{ background: '#23263a', color: '#fff', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>{symbol.replace('NSE_EQ|', '')}</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, margin: '10px 0 0 0', color: '#fff' }}>{livePrice !== null ? `₹${livePrice}` : '—'}</div>
          <div style={{ fontSize: 15, color: liveChange > 0 ? '#27ae60' : '#c0392b', fontWeight: 700, marginTop: 2 }}>
            {liveChange !== null ? (liveChange > 0 ? `▲ +${liveChange}%` : `▼ ${liveChange}%`) : ''}
          </div>
          <div style={{ fontSize: 13, color: '#7ecbff', marginTop: 10 }}>TradingView Symbol: <span style={{ color: '#fff' }}>NSE:{symbol.replace('NSE_EQ|', '')}</span></div>
        </div>
        <button onClick={onClose} style={{ fontSize: 22, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginLeft: 12, marginTop: -8 }}>×</button>
      </div>
      {/* Chart Section */}
      <div style={{ padding: 0, background: '#101223' }}>
        <div style={{ padding: '18px 32px 0 32px' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Live Candlestick Chart - <span style={{ color: '#7ecbff' }}>{symbol}</span></h3>
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>Interactive stock chart with technical analysis tools</div>
        </div>
        <div style={{ padding: '0 32px 32px 32px' }}>
          <div style={{ background: '#181c2a', borderRadius: 12, boxShadow: '0 2px 12px #0002', padding: 0, minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center' }}>
            {/* Chart controls and chart */}
            <div style={{ width: '100%', height: 400, minHeight: 400, maxHeight: 420, margin: '0 auto', position: 'relative' }}>
              {chartLoading ? (
                candles && Array.isArray(candles) && candles.length === 0 ? (
                  <div style={{ color: '#aaa', textAlign: 'center', fontSize: 18, marginTop: 120 }}>No chart data available for this stock.</div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={48} className="animate-spin" color="#7ecbff" />
                  </div>
                )
              ) : (
                <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Buy/Sell Buttons */}
      <div style={{ display: 'flex', gap: 12, margin: '0 32px 24px 32px' }}>
        <button style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 700, fontSize: 18, cursor: 'pointer', flex: 1 }} onClick={() => { setTradeAction('buy'); setShowTradeModal(true); }}>Buy</button>
        <button style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 700, fontSize: 18, cursor: 'pointer', flex: 1 }} onClick={() => { setTradeAction('sell'); setShowTradeModal(true); }}>Sell</button>
      </div>
      <TradeModal
        isOpen={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        symbol={symbol}
        action={tradeAction}
        currentPrice={livePrice || details?.close || details?.price || 0}
        balance={portfolio.cash}
        holdings={portfolio.holdings}
        onTradeSuccess={() => { setShowTradeModal(false); }}
      />
    </div>
  );
};

export default StockDetailModal; 