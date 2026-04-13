import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StockSearch } from './StockSearch';
import { StockCard } from './StockCard';
import { StockDetailModal } from './StockDetailModal';
import { MarketInsightBanner } from './market-insight/MarketInsightBanner';
import { useSocket } from '../hooks/useSocket';
import { WatchItem, StockSearchResult, SubscribeItem } from '../types/stock';

async function fetchWatchlist(): Promise<WatchItem[]> {
  const res = await fetch('/api/watchlist');
  if (!res.ok) return [];
  return res.json();
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const [detailCode, setDetailCode] = useState<string | null>(null);

  const { data: watchList = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: fetchWatchlist,
  });

  const subscribeItems: SubscribeItem[] = useMemo(
    () => watchList.map((item) => ({ code: item.code, category: item.category })),
    [watchList],
  );

  const { prices, connected, removePrice } = useSocket(subscribeItems);

  const addMutation = useMutation({
    mutationFn: async (item: { code: string; name: string; category: string }) => {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(code)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  // localStorage → DB 마이그레이션 (1회성)
  useEffect(() => {
    const STORAGE_KEY = 'stock-watchlist';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const items: WatchItem[] = JSON.parse(saved);
      if (items.length > 0) {
        Promise.all(
          items.map((item) =>
            fetch('/api/watchlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            }),
          ),
        ).then(() => {
          localStorage.removeItem(STORAGE_KEY);
          queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        });
      }
    } catch {
      /* ignore */
    }
  }, [queryClient]);

  const handleAdd = (result: StockSearchResult) => {
    const code = result.reutersCode || result.code;
    if (watchList.some((item) => item.code === code)) return;
    addMutation.mutate({ code, name: result.name, category: result.category });
  };

  const handleRemove = (code: string) => {
    removeMutation.mutate(code);
    removePrice(code);
    if (detailCode === code) setDetailCode(null);
  };

  const handleOpenDetail = (code: string) => {
    setDetailCode(code);
  };

  const handleCloseDetail = () => {
    setDetailCode(null);
  };

  const detailStock = detailCode ? prices.get(detailCode) : null;

  return (
    <div className="dashboard">
      <MarketInsightBanner />
      <header className="dashboard-header">
        <h1>주식 모니터링</h1>
        <div className={`connection-status ${connected ? 'connected' : ''}`}>
          {connected ? '● 실시간 연결됨' : '○ 연결 끊김'}
        </div>
      </header>

      <StockSearch onAdd={handleAdd} />

      {isLoading ? (
        <div className="loading-text">로딩 중...</div>
      ) : watchList.length === 0 ? (
        <div className="empty-state">
          종목을 검색하여 관심종목을 추가하세요
        </div>
      ) : (
        <div className="stock-grid">
          {watchList.map((item) => {
            const stock = prices.get(item.code);
            if (!stock) {
              return (
                <div key={item.code} className="stock-card loading-card">
                  <div className="card-header">
                    <div>
                      <h3 className="stock-name">{item.name}</h3>
                      <span className="stock-code">{item.code}</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemove(item.code)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="loading-text">로딩 중...</div>
                </div>
              );
            }
            return (
              <StockCard
                key={item.code}
                stock={stock}
                onRemove={handleRemove}
                onOpenDetail={handleOpenDetail}
              />
            );
          })}
        </div>
      )}

      {detailStock && (
        <StockDetailModal stock={detailStock} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
