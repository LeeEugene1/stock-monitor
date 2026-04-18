import { useQuery } from '@tanstack/react-query';
import './MarketInsight.css';

interface Metrics {
  nasdaq: { price: number; change: number; changeRate: number };
  sp500: { price: number; change: number; changeRate: number };
  vix: { price: number; change: number };
  usdKrw: { price: number; change: number; changeRate: number };
  us10y: { yield: number; change: number };
}

interface Insight {
  date: string;
  metrics: Metrics;
  summary: string;
  signal: string;
}

async function fetchInsight(): Promise<Insight | null> {
  const res = await fetch('/api/market-insight');
  if (!res.ok) return null;
  const data = await res.json();
  return data || null;
}

function formatChange(val: number): string {
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

export function MarketInsightBanner() {
  const { data: insight } = useQuery({
    queryKey: ['market-insight'],
    queryFn: fetchInsight,
    staleTime: 5 * 60 * 1000,
  });

  if (!insight) return null;

  const { metrics, signal } = insight;
  const signalCls =
    signal === 'bullish'
      ? 'signal-bullish'
      : signal === 'bearish'
        ? 'signal-bearish'
        : 'signal-neutral';

  return (
    <div className={`insight-banner ${signalCls}`}>
      <div className="insight-header">
        <div className="insight-signal">
          <span className={`signal-dot ${signalCls}`} />
          <span className="signal-text">
            {signal === 'bullish'
              ? '긍정적'
              : signal === 'bearish'
                ? '부정적'
                : '중립'}
          </span>
          <span className="insight-date">{insight.date}</span>
        </div>
        <div className="insight-summary">{insight.summary.replace(/^\[.*?\]\s*/, '')}</div>
      </div>

      <div className="insight-metrics">
        <div className="metric">
          <span className="metric-name">NASDAQ</span>
          <span className="metric-value">
            {metrics.nasdaq.price.toLocaleString()}
          </span>
          <span
            className={`metric-change ${metrics.nasdaq.changeRate >= 0 ? 'up' : 'down'}`}
          >
            {formatChange(metrics.nasdaq.changeRate)}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-name">S&P 500</span>
          <span className="metric-value">
            {metrics.sp500.price.toLocaleString()}
          </span>
          <span
            className={`metric-change ${metrics.sp500.changeRate >= 0 ? 'up' : 'down'}`}
          >
            {formatChange(metrics.sp500.changeRate)}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-name">VIX</span>
          <span className="metric-value">{metrics.vix.price.toFixed(1)}</span>
        </div>
        <div className="metric">
          <span className="metric-name">USD/KRW</span>
          <span className="metric-value">
            {Math.round(metrics.usdKrw.price).toLocaleString()}
          </span>
          <span
            className={`metric-change ${metrics.usdKrw.changeRate >= 0 ? 'up' : 'down'}`}
          >
            {formatChange(metrics.usdKrw.changeRate)}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-name">US 10Y</span>
          <span className="metric-value">
            {metrics.us10y.yield.toFixed(2)}%
          </span>
        </div>
      </div>

    </div>
  );
}
