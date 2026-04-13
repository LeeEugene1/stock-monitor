import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  CandlestickData,
  HistogramData,
  LineStyle,
  Time,
} from 'lightweight-charts';
import { useChartData } from '../hooks/useChartData';
import { useHolding } from '../hooks/useHolding';
import { ChartPeriod } from '../types/chart';

interface Props {
  code: string;
  category: 'stock' | 'index';
}

const PERIODS: { label: string; value: ChartPeriod }[] = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
];

export function StockChart({ code, category }: Props) {
  const [period, setPeriod] = useState<ChartPeriod>('3m');
  const { data, loading, error } = useChartData(code, category, period);
  const { data: holding } = useHolding(code, category === 'stock');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#161b22' },
        textColor: '#8b949e',
      },
      grid: {
        vertLines: { color: '#21262d' },
        horzLines: { color: '#21262d' },
      },
      crosshair: {
        vertLine: { color: '#58a6ff', width: 1, style: 2 },
        horzLine: { color: '#58a6ff', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: '#30363d',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#30363d',
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#f85149',
      downColor: '#58a6ff',
      borderUpColor: '#f85149',
      borderDownColor: '#58a6ff',
      wickUpColor: '#f85149',
      wickDownColor: '#58a6ff',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#30363d',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const candles: CandlestickData<Time>[] = data.map((d) => ({
      time: d.date as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumes: HistogramData<Time>[] = data.map((d) => ({
      time: d.date as Time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(248,81,73,0.3)' : 'rgba(88,166,255,0.3)',
    }));

    candleSeries.setData(candles);
    volumeSeries.setData(volumes);

    // 매입평균가 라인
    if (holding && holding.avgPrice > 0) {
      candleSeries.createPriceLine({
        price: holding.avgPrice,
        color: '#d29922',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `매입평균 ${Math.round(holding.avgPrice).toLocaleString()}`,
      });
    }

    chart.timeScale().fitContent();

    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, holding]);

  const lastClose = data.length > 0 ? data[data.length - 1].close : 0;
  const profitRate =
    holding && holding.avgPrice > 0 && lastClose > 0
      ? ((lastClose - holding.avgPrice) / holding.avgPrice) * 100
      : 0;

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <div className="chart-periods">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`period-btn ${period === p.value ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setPeriod(p.value);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {holding && holding.avgPrice > 0 && (
          <div className="holding-info">
            <span className="holding-label">보유 {holding.totalQty}주</span>
            <span className="holding-avg">
              평단 {Math.round(holding.avgPrice).toLocaleString()}원
            </span>
            <span className={profitRate >= 0 ? 'price-up' : 'price-down'}>
              {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      {loading && <div className="chart-loading">차트 로딩 중...</div>}
      {error && <div className="chart-error">차트를 불러올 수 없습니다</div>}
      <div ref={containerRef} className="chart-container" />
    </div>
  );
}
