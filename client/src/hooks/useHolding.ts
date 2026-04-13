import { useEffect, useState } from 'react';
import { HoldingByCode } from '../types/holding';

export function useHolding(code: string, enabled: boolean = true) {
  const [data, setData] = useState<HoldingByCode | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code || !enabled) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/portfolio/holding/${code}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, enabled]);

  return { data, loading };
}
