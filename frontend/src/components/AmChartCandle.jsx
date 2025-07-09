import React, { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { getCandles } from '../services/marketService';

const Chart = ({ symbol, livePrice }) => {
  const chartRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    let root = am5.Root.new(chartRef.current);
    rootRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);

    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true
      })
    );

    let dateAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.5,
        groupData: false,
        baseInterval: { timeUnit: 'minute', count: 5 },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    let valueAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    let series = chart.series.push(
      am5xy.CandlestickSeries.new(root, {
        name: symbol,
        xAxis: dateAxis,
        yAxis: valueAxis,
        valueYField: 'close',
        openValueYField: 'open',
        lowValueYField: 'low',
        highValueYField: 'high',
        valueXField: 'timestamp',
        tooltip: am5.Tooltip.new(root, {
          labelText: 'Open: {open}\nHigh: {high}\nLow: {low}\nClose: {close}'
        })
      })
    );

    // Fetch historical candles
    getCandles(symbol, '5m').then(data => {
      if (data && Array.isArray(data)) {
        const chartData = data.map(candle => ({
          timestamp: new Date(candle.timestamp).getTime(),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        }));
        series.data.setAll(chartData);
      }
    });

    // Cursor
    chart.set('cursor', am5xy.XYCursor.new(root, {
      xAxis: dateAxis
    }));

    // Cleanup
    return () => {
      root.dispose();
    };
  }, [symbol]);

  // Update with live price
  useEffect(() => {
    if (!livePrice || !rootRef.current) return;
    // Optionally, you could update the last candle or add a new one
    // For demo, we skip this for simplicity
  }, [livePrice]);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default Chart; 