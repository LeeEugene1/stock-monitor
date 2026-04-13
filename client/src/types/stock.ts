export interface StockPrice {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: string;
  changeType: 'up' | 'down' | 'none';
  volume: number;
  high: number;
  low: number;
  open: number;
  high52w: number;
  low52w: number;
  updatedAt: string;
  category: 'stock' | 'index';
}

export interface StockSearchResult {
  code: string;
  name: string;
  market: string;
  category: 'stock' | 'index';
  reutersCode?: string;
}

export interface WatchItem {
  code: string;
  name: string;
  category: 'stock' | 'index';
}

export interface SubscribeItem {
  code: string;
  category: 'stock' | 'index';
}
