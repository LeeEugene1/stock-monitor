import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '../../types/portfolio';
import { formatKRW } from '../../utils/format';
import { CategoryEditModal } from './CategoryEditModal';
import './Portfolio.css';

const COLORS = [
  '#58a6ff',
  '#3fb950',
  '#d29922',
  '#f85149',
  '#bc8cff',
  '#ff7b72',
  '#79c0ff',
  '#7ee787',
  '#ffa657',
  '#8b949e',
];

const TOOLTIP_STYLE = {
  background: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: 6,
  fontSize: '0.85rem',
};

interface Props {
  breakdown: CategoryBreakdown[];
  onUpdated: () => void;
}

export function PortfolioBreakdown({ breakdown, onUpdated }: Props) {
  const [selected, setSelected] = useState<CategoryBreakdown | null>(null);

  const chartData = useMemo(
    () =>
      breakdown.map((b, i) => ({
        bd: b,
        name: b.category,
        value: b.amount,
        ratio: b.ratio,
        color: COLORS[i % COLORS.length],
      })),
    [breakdown],
  );

  if (breakdown.length === 0) return null;

  return (
    <div className="portfolio-breakdown">
      <h3 className="breakdown-title">카테고리별 비중</h3>
      <div className="breakdown-body">
        <div className="breakdown-chart">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                onClick={(data: any) => setSelected(data.payload?.bd ?? null)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any, _name: any, props: any) =>
                  [
                    `${formatKRW(Number(value))}원 (${props.payload.ratio.toFixed(1)}%)`,
                    props.payload.name,
                  ] as [string, string]
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="breakdown-legend">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="legend-item"
              onClick={() => setSelected(item.bd)}
            >
              <span
                className="legend-dot"
                style={{ background: item.color }}
              />
              <span className="legend-name">{item.name}</span>
              <span className="legend-ratio">{item.ratio.toFixed(1)}%</span>
              <span className="legend-amount">{formatKRW(item.value)}원</span>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <CategoryEditModal
          breakdown={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            onUpdated();
          }}
        />
      )}
    </div>
  );
}
