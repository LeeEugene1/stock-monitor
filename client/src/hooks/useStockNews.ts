import { useEffect, useState } from 'react';
import { NewsItem } from '../types/news';

export function useStockNews(code: string, enabled: boolean = true) {
  const [data, setData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !enabled) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/news/${code}?pageSize=10&page=1`)
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
  }, [code, enabled]);

  return { data, loading, error };
}
