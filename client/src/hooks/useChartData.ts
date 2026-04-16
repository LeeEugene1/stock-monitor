import { useState, useEffect } from 'react';
import { ChartDataPoint, ChartPeriod } from '../types/chart';
import { apiFetch } from '../utils/api';

export function useChartData(
  code: string,
  category: 'stock' | 'index',
  period: ChartPeriod,
) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(`/api/chart/${code}?period=${period}&category=${category}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, category, period]);

  return { data, loading, error };
}
