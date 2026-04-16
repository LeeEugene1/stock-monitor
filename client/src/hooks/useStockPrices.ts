import { useQuery } from '@tanstack/react-query';
import { StockPrice } from '../types/stock';

async function fetchStock(code: string): Promise<StockPrice | null> {
  const res = await fetch(`/api/stock/${code}`);
  if (!res.ok) return null;
  return res.json();
}

export function useStockPrices(codes: string[]) {
  return useQuery({
    queryKey: ['stock-prices', [...codes].sort()],
    queryFn: async () => {
      const map = new Map<string, StockPrice>();
      const results = await Promise.all(codes.map(fetchStock));
      results.forEach((s) => {
        if (s) map.set(s.code, s);
      });
      return map;
    },
    enabled: codes.length > 0,
    refetchInterval: 60_000,
  });
}
