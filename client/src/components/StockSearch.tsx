import { useState, useRef } from 'react';
import { StockSearchResult } from '../types/stock';

interface Props {
  onAdd: (result: StockSearchResult) => void;
}

export function StockSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);

    if (value.trim().length === 0) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/stock/search?q=${encodeURIComponent(value.trim())}`,
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (item: StockSearchResult) => {
    onAdd(item);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="stock-search">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="종목명 또는 코드 검색 (삼성전자, S&P 등)..."
        className="search-input"
      />
      {loading && <div className="search-loading">검색 중...</div>}
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((item) => (
            <li key={`${item.category}-${item.code}`} onClick={() => handleSelect(item)}>
              <span className="result-name">{item.name}</span>
              <span className="result-code">{item.code}</span>
              <span className={`result-market ${item.category === 'index' ? 'result-index' : ''}`}>
                {item.market}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
