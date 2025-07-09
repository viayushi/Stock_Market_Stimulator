import React, { useEffect, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5stock from '@amcharts/amcharts5/stock';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import { 
  Settings, 
  TrendingUp, 
  BarChart3, 
  Activity,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';

const AdvancedChart = ({ 
  symbol, 
  data, 
  loading = false, 
  indicators = ['sma', 'ema', 'rsi', 'macd'],
  onChartReady 
}) => {
  const chartRef = useRef(null);
  const rootRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [visibleIndicators, setVisibleIndicators] = useState(indicators);
  const [chartError, setChartError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Test amCharts availability
  useEffect(() => {
    console.log('amCharts availability test:', {
      am5: !!am5,
      am5stock: !!am5stock,
      am5xy: !!am5xy,
      am5themes_Dark: !!am5themes_Dark
    });
  }, []);

  useEffect(() => {
    console.log('AdvancedChart useEffect triggered:', {
      chartRef: !!chartRef.current,
      dataLength: data?.length,
      symbol,
      loading
    });

    if (!chartRef.current || !data || data.length === 0) {
      console.log('Chart data not ready:', { chartRef: !!chartRef.current, dataLength: data?.length });
      return;
    }

    // Validate data structure
    const isValidData = data.every(item => 
      item.date && 
      typeof item.open === 'number' && 
      typeof item.high === 'number' && 
      typeof item.low === 'number' && 
      typeof item.close === 'number'
    );

    if (!isValidData) {
      console.error('Invalid data structure:', data[0]);
      setChartError(true);
      return;
    }

    console.log('Data validation passed, creating chart...');

    // Dispose of previous chart instance
    if (rootRef.current) {
      rootRef.current.dispose();
      rootRef.current = null;
    }

    try {
      setChartError(false);
      console.log('Creating amCharts root...');
      
      // Create new root
      const root = am5.Root.new(chartRef.current);
      rootRef.current = root;
      root.setThemes([am5themes_Dark.new(root)]);

      console.log('Creating stock chart...');
      // Create stock chart
      const stockChart = root.container.children.push(
        am5stock.StockChart.new(root, {
          layout: root.verticalLayout,
          panX: true,
          panY: true,
          wheelX: "zoomX",
          wheelY: "zoomX",
          pinchZoomX: true,
          pinchZoomY: true,
        })
      );
      chartInstanceRef.current = stockChart;

      // Create main panel for candlesticks
      const mainPanel = stockChart.panels.push(
        am5stock.StockPanel.new(root, {
          wheelY: "zoomX",
          panX: true,
          panY: true,
          height: visibleIndicators.includes('rsi') || visibleIndicators.includes('macd') 
            ? am5.percent(50) 
            : am5.percent(70)
        })
      );

      // Create value axis
      const valueAxis = mainPanel.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, { pan: "zoom" }),
          tooltip: am5.Tooltip.new(root, {}),
          numberFormat: "$#,###.00",
          extraMin: 0.1,
          extraMax: 0.1
        })
      );

      // Create date axis
      const dateAxis = mainPanel.xAxes.push(
        am5xy.GaplessDateAxis.new(root, {
          baseInterval: { timeUnit: "minute", count: 1 },
          renderer: am5xy.AxisRendererX.new(root, {}),
          tooltip: am5.Tooltip.new(root, {}),
          groupData: false
        })
      );

      // Create OHLC series (candlesticks)
      const ohlcSeries = mainPanel.series.push(
        am5stock.OHLCSeries.new(root, {
          name: symbol,
          valueXField: "date",
          valueYField: "close",
          highValueYField: "high",
          lowValueYField: "low",
          openValueYField: "open",
          tooltip: am5.Tooltip.new(root, {
            pointerOrientation: "horizontal",
            labelText: "{name}: O:${openValueY} H:${highValueY} L:${lowValueY} C:${valueY}"
          }),
          fill: am5.color(0x00ff00),
          stroke: am5.color(0x00ff00),
          fillOpacity: 0.5
        })
      );

      // Add SMA indicator
      if (visibleIndicators.includes('sma')) {
        const smaSeries = mainPanel.series.push(
          am5xy.LineSeries.new(root, {
            name: "SMA 20",
            valueXField: "date",
            valueYField: "sma20",
            tooltip: am5.Tooltip.new(root, {
              pointerOrientation: "horizontal",
              labelText: "SMA 20: ${valueY}"
            }),
            stroke: am5.color(0xff0000),
            strokeWidth: 2
          })
        );
      }

      // Add EMA indicator
      if (visibleIndicators.includes('ema')) {
        const emaSeries = mainPanel.series.push(
          am5xy.LineSeries.new(root, {
            name: "EMA 12",
            valueXField: "date",
            valueYField: "ema12",
            tooltip: am5.Tooltip.new(root, {
              pointerOrientation: "horizontal",
              labelText: "EMA 12: ${valueY}"
            }),
            stroke: am5.color(0x00ff00),
            strokeWidth: 2
          })
        );
      }

      // Create volume panel
      const volumePanel = stockChart.panels.push(
        am5stock.StockPanel.new(root, {
          wheelY: "zoomX",
          panX: true,
          panY: true,
          height: visibleIndicators.includes('rsi') || visibleIndicators.includes('macd') 
            ? am5.percent(20) 
            : am5.percent(30)
        })
      );

      // Create volume axis
      const volumeAxis = volumePanel.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, { pan: "zoom" }),
          tooltip: am5.Tooltip.new(root, {})
        })
      );

      // Create volume series
      const volumeSeries = volumePanel.series.push(
        am5xy.ColumnSeries.new(root, {
          name: "Volume",
          valueXField: "date",
          valueYField: "volume",
          tooltip: am5.Tooltip.new(root, {
            pointerOrientation: "horizontal",
            labelText: "Volume: {valueY}"
          }),
          fill: am5.color(0x666666),
          fillOpacity: 0.5
        })
      );

      // Add RSI indicator panel
      if (visibleIndicators.includes('rsi')) {
        const rsiPanel = stockChart.panels.push(
          am5stock.StockPanel.new(root, {
            wheelY: "zoomX",
            panX: true,
            panY: true,
            height: am5.percent(15)
          })
        );

        // Add date axis to RSI panel
        const rsiDateAxis = rsiPanel.xAxes.push(
          am5xy.GaplessDateAxis.new(root, {
            baseInterval: { timeUnit: "minute", count: 1 },
            renderer: am5xy.AxisRendererX.new(root, {}),
            tooltip: am5.Tooltip.new(root, {}),
            groupData: false
          })
        );

        const rsiAxis = rsiPanel.yAxes.push(
          am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, { pan: "zoom" }),
            tooltip: am5.Tooltip.new(root, {}),
            min: 0,
            max: 100
          })
        );

        const rsiSeries = rsiPanel.series.push(
          am5xy.LineSeries.new(root, {
            name: "RSI 14",
            valueXField: "date",
            valueYField: "rsi14",
            tooltip: am5.Tooltip.new(root, {
              pointerOrientation: "horizontal",
              labelText: "RSI 14: ${valueY}"
            }),
            stroke: am5.color(0xffff00),
            strokeWidth: 2
          })
        );

        // Add overbought/oversold lines
        const overboughtLine = rsiPanel.series.push(
          am5xy.LineSeries.new(root, {
            valueXField: "date",
            valueYField: "overbought",
            stroke: am5.color(0xff0000),
            strokeDasharray: [5, 5],
            strokeWidth: 1
          })
        );

        const oversoldLine = rsiPanel.series.push(
          am5xy.LineSeries.new(root, {
            valueXField: "date",
            valueYField: "oversold",
            stroke: am5.color(0x00ff00),
            strokeDasharray: [5, 5],
            strokeWidth: 1
          })
        );
      }

      // Add MACD indicator panel
      if (visibleIndicators.includes('macd')) {
        const macdPanel = stockChart.panels.push(
          am5stock.StockPanel.new(root, {
            wheelY: "zoomX",
            panX: true,
            panY: true,
            height: am5.percent(15)
          })
        );

        // Add date axis to MACD panel
        const macdDateAxis = macdPanel.xAxes.push(
          am5xy.GaplessDateAxis.new(root, {
            baseInterval: { timeUnit: "minute", count: 1 },
            renderer: am5xy.AxisRendererX.new(root, {}),
            tooltip: am5.Tooltip.new(root, {}),
            groupData: false
          })
        );

        const macdAxis = macdPanel.yAxes.push(
          am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, { pan: "zoom" }),
            tooltip: am5.Tooltip.new(root, {})
          })
        );

        const macdSeries = macdPanel.series.push(
          am5xy.LineSeries.new(root, {
            name: "MACD",
            valueXField: "date",
            valueYField: "macd",
            tooltip: am5.Tooltip.new(root, {
              pointerOrientation: "horizontal",
              labelText: "MACD: ${valueY}"
            }),
            stroke: am5.color(0x00ffff),
            strokeWidth: 2
          })
        );

        const signalSeries = macdPanel.series.push(
          am5xy.LineSeries.new(root, {
            name: "Signal",
            valueXField: "date",
            valueYField: "signal",
            tooltip: am5.Tooltip.new(root, {
              pointerOrientation: "horizontal",
              labelText: "Signal: ${valueY}"
            }),
            stroke: am5.color(0xff00ff),
            strokeWidth: 2
          })
        );

        const histogramSeries = macdPanel.series.push(
          am5xy.ColumnSeries.new(root, {
            name: "Histogram",
            valueXField: "date",
            valueYField: "histogram",
            tooltip: am5.Tooltip.new(root, {
              pointerOrientation: "horizontal",
              labelText: "Histogram: ${valueY}"
            }),
            fill: am5.color(0x666666),
            fillOpacity: 0.5
          })
        );
      }

      // Process data with calculated indicators
      const processedData = data.map((item, index) => {
        const processed = {
          date: new Date(item.date).getTime(),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || 0)
        };

        // Calculate SMA 20
        if (index >= 19) {
          const smaValues = data.slice(index - 19, index + 1).map(d => parseFloat(d.close));
          processed.sma20 = smaValues.reduce((sum, val) => sum + val, 0) / 20;
        }

        // Calculate EMA 12
        if (index === 0) {
          processed.ema12 = processed.close;
        } else {
          const prevEma = processedData[index - 1].ema12 || processed.close;
          const multiplier = 2 / (12 + 1);
          processed.ema12 = (processed.close * multiplier) + (prevEma * (1 - multiplier));
        }

        // Calculate RSI 14
        if (index >= 14) {
          let gains = 0;
          let losses = 0;
          
          for (let i = index - 13; i <= index; i++) {
            const change = data[i].close - data[i - 1].close;
            if (change > 0) {
              gains += change;
            } else {
              losses -= change;
            }
          }
          
          const avgGain = gains / 14;
          const avgLoss = losses / 14;
          const rs = avgGain / avgLoss;
          processed.rsi14 = 100 - (100 / (1 + rs));
        }

        // RSI overbought/oversold lines
        processed.overbought = 70;
        processed.oversold = 30;

        // Calculate MACD
        if (index >= 26) {
          // Calculate EMA 12 and EMA 26
          let ema12 = processed.close;
          let ema26 = processed.close;
          
          for (let i = 0; i <= index; i++) {
            if (i === 0) {
              ema12 = data[i].close;
              ema26 = data[i].close;
            } else {
              const multiplier12 = 2 / (12 + 1);
              const multiplier26 = 2 / (26 + 1);
              ema12 = (data[i].close * multiplier12) + (ema12 * (1 - multiplier12));
              ema26 = (data[i].close * multiplier26) + (ema26 * (1 - multiplier26));
            }
          }
          
          processed.macd = ema12 - ema26;
          
          // Calculate Signal line (EMA of MACD)
          if (index >= 34) {
            let signalSum = 0;
            for (let i = index - 8; i <= index; i++) {
              signalSum += processedData[i].macd || 0;
            }
            processed.signal = signalSum / 9;
            processed.histogram = processed.macd - processed.signal;
          }
        }

        return processed;
      });

      // Set data for all series
      ohlcSeries.data.setAll(processedData);
      volumeSeries.data.setAll(processedData);

      // Set data for indicator series
      if (visibleIndicators.includes('rsi')) {
        const rsiSeries = stockChart.panels[2].series[0];
        const overboughtLine = stockChart.panels[2].series[1];
        const oversoldLine = stockChart.panels[2].series[2];
        rsiSeries.data.setAll(processedData);
        overboughtLine.data.setAll(processedData);
        oversoldLine.data.setAll(processedData);
      }

      if (visibleIndicators.includes('macd')) {
        const panelIndex = visibleIndicators.includes('rsi') ? 3 : 2;
        const macdSeries = stockChart.panels[panelIndex].series[0];
        const signalSeries = stockChart.panels[panelIndex].series[1];
        const histogramSeries = stockChart.panels[panelIndex].series[2];
        macdSeries.data.setAll(processedData);
        signalSeries.data.setAll(processedData);
        histogramSeries.data.setAll(processedData);
      }

      // Add stock chart legend
      const legend = stockChart.plotContainer.children.push(
        am5.StockLegend.new(root, {
          stockChart: stockChart
        })
      );

      // Add stock chart controls
      const stockToolbar = stockChart.plotContainer.children.push(
        am5stock.StockToolbar.new(root, {
          stockChart: stockChart
        })
      );

      console.log('Chart created successfully!', {
        panels: stockChart.panels.length,
        dataPoints: processedData.length,
        symbol
      });

      if (onChartReady) {
        onChartReady(stockChart);
      }

    } catch (error) {
      console.error('Chart creation error:', error);
      setChartError(true);
    }
  }, [data, symbol, visibleIndicators, onChartReady]);

  const toggleIndicator = (indicator) => {
    setVisibleIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadChart = () => {
    if (chartInstanceRef.current) {
      // For now, just show a message since export might not be available
      console.log('Download functionality would be implemented here');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (chartError) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-white">Chart Error</h3>
        <p className="text-gray-400">Unable to load chart for {symbol}</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">{symbol} Stock Chart</h3>
          
          {/* Indicator Toggles */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Indicators:</span>
            {['sma', 'ema', 'rsi', 'macd'].map(indicator => (
              <button
                key={indicator}
                onClick={() => toggleIndicator(indicator)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  visibleIndicators.includes(indicator)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {indicator.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadChart}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Download Chart"
          >
            <Download className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartRef} 
        className={`w-full ${isFullscreen ? 'h-screen' : 'h-96'}`}
      />
    </div>
  );
};

export default AdvancedChart; 