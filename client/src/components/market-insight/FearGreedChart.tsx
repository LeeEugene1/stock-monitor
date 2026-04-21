import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface FearGreedPoint {
  date: string;
  score: number;
  rating: string;
}

interface FearGreedData {
  current: {
    score: number;
    rating: string;
    timestamp: string;
    previousClose: number;
    previous1Week: number;
    previous1Month: number;
    previous1Year: number;
  };
  history: FearGreedPoint[];
}

async function fetchFearGreed(): Promise<FearGreedData | null> {
  const res = await fetch('/api/market-insight/fear-greed');
  if (!res.ok) return null;
  return res.json();
}

function useFearGreed() {
  return useQuery({
    queryKey: ['fear-greed'],
    queryFn: fetchFearGreed,
    staleTime: 30 * 60 * 1000,
  });
}

const RATING_KR: Record<string, string> = {
  'extreme fear': '극도의 공포',
  fear: '공포',
  neutral: '중립',
  greed: '탐욕',
  'extreme greed': '극도의 탐욕',
};

function ratingFromScore(score: number): string {
  if (score < 25) return 'extreme fear';
  if (score < 45) return 'fear';
  if (score <= 55) return 'neutral';
  if (score <= 75) return 'greed';
  return 'extreme greed';
}

function scoreColor(score: number): string {
  if (score < 25) return '#f85149';
  if (score < 45) return '#f0883e';
  if (score <= 55) return '#d29922';
  if (score <= 75) return '#56d364';
  return '#3fb950';
}

function formatTick(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: FearGreedPoint }>;
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: '0.75rem',
        color: '#c9d1d9',
      }}
    >
      <div style={{ color: '#8b949e', marginBottom: 2 }}>{p.date}</div>
      <div>
        <span style={{ color: scoreColor(p.score), fontWeight: 600 }}>
          {p.score.toFixed(1)}
        </span>
        <span style={{ color: '#8b949e', marginLeft: 6 }}>
          {RATING_KR[p.rating] || p.rating}
        </span>
      </div>
    </div>
  );
}

export function FearGreedScoreItem() {
  const { data } = useFearGreed();
  if (!data || !data.current.timestamp) return null;

  const { score, rating } = data.current;
  const color = scoreColor(score);
  const label = RATING_KR[rating] || rating;
  const leftPct = Math.max(0, Math.min(100, score));

  return (
    <div className="score-item">
      <span className="score-label">탐욕지수</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ left: `${leftPct}%`, background: color }}
        />
      </div>
      <span className="score-text" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function FearGreedChartBody() {
  const { data } = useFearGreed();
  if (!data || !data.history.length) return null;

  const { current, history } = data;

  const prevWeekRating = ratingFromScore(current.previous1Week);
  const prevMonthRating = ratingFromScore(current.previous1Month);
  const prevYearRating = ratingFromScore(current.previous1Year);

  const tickStep = Math.max(1, Math.floor(history.length / 6));
  const ticks = history
    .filter((_, i) => i % tickStep === 0)
    .map((p) => p.date);

  return (
    <div className="fg-chart-wrap">
      <div className="fg-chart-area">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart
            data={history}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
          >
            <ReferenceArea y1={0} y2={25} fill="#f85149" fillOpacity={0.06} />
            <ReferenceArea y1={25} y2={45} fill="#f0883e" fillOpacity={0.06} />
            <ReferenceArea y1={45} y2={55} fill="#d29922" fillOpacity={0.06} />
            <ReferenceArea y1={55} y2={75} fill="#56d364" fillOpacity={0.06} />
            <ReferenceArea y1={75} y2={100} fill="#3fb950" fillOpacity={0.08} />
            <ReferenceLine y={50} stroke="#30363d" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatTick}
              tick={{ fontSize: 10, fill: '#8b949e' }}
              stroke="#30363d"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 10, fill: '#8b949e' }}
              stroke="#30363d"
              width={40}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#58a6ff"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="fg-chart-compare">
        <div className="fg-compare-item">
          <span className="fg-compare-label">1주 전</span>
          <span
            className="fg-compare-value"
            style={{ color: scoreColor(current.previous1Week) }}
          >
            {current.previous1Week.toFixed(0)}
          </span>
          <span className="fg-compare-rating">
            {RATING_KR[prevWeekRating]}
          </span>
        </div>
        <div className="fg-compare-item">
          <span className="fg-compare-label">1개월 전</span>
          <span
            className="fg-compare-value"
            style={{ color: scoreColor(current.previous1Month) }}
          >
            {current.previous1Month.toFixed(0)}
          </span>
          <span className="fg-compare-rating">
            {RATING_KR[prevMonthRating]}
          </span>
        </div>
        <div className="fg-compare-item">
          <span className="fg-compare-label">1년 전</span>
          <span
            className="fg-compare-value"
            style={{ color: scoreColor(current.previous1Year) }}
          >
            {current.previous1Year.toFixed(0)}
          </span>
          <span className="fg-compare-rating">
            {RATING_KR[prevYearRating]}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FearGreedDetails() {
  const [open, setOpen] = useState(false);
  const { data } = useFearGreed();
  // Hide entire toggle if we have no data at all — avoid a button that does nothing
  if (!data || !data.history.length) return null;

  return (
    <div className="fg-details">
      <button
        type="button"
        className="fg-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>탐욕지수 그래프 (CNN Fear &amp; Greed)</span>
        <span className={`fg-toggle-caret ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && <FearGreedChartBody />}
    </div>
  );
}
