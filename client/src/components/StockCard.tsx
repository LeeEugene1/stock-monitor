import { useEffect, useRef } from 'react';
import { StockPrice } from '../types/stock';

interface Props {
  stock: StockPrice;
  onRemove: (code: string) => void;
  onOpenDetail?: (code: string) => void;
}

export function StockCard({ stock, onRemove, onOpenDetail }: Props) {
  const prevPriceRef = useRef(stock.price);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevPriceRef.current !== stock.price && cardRef.current) {
      cardRef.current.classList.remove('flash');
      void cardRef.current.offsetWidth;
      cardRef.current.classList.add('flash');
    }
    prevPriceRef.current = stock.price;
  }, [stock.price]);

  const changeColor =
    stock.changeType === 'up'
      ? 'price-up'
      : stock.changeType === 'down'
        ? 'price-down'
        : '';

  const fromHighRate = stock.high52w > 0
    ? ((stock.price - stock.high52w) / stock.high52w) * 100
    : 0;

  const isIndex = stock.category === 'index';
  const priceDisplay = isIndex
    ? stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : stock.price.toLocaleString();

  return (
    <div
      className={`stock-card ${changeColor}`}
      ref={cardRef}
    >
      <div className="card-header">
        <div>
          <h3 className="stock-name">
            {stock.name}
            {isIndex && <span className="badge-index">지수</span>}
          </h3>
          <span className="stock-code">{stock.code}</span>
        </div>
        <div className="card-actions">
          <button
            className="chart-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail?.(stock.code);
            }}
            title="상세 보기"
          >
            차트
          </button>
          <button className="remove-btn" onClick={() => onRemove(stock.code)}>
            &times;
          </button>
        </div>
      </div>
      <div className="card-price">
        <span className="current-price">
          {priceDisplay}
          {!isIndex && <small>원</small>}
        </span>
        <span className={`change ${changeColor}`}>
          {stock.changeType === 'up' ? '▲' : stock.changeType === 'down' ? '▼' : '-'}
          {' '}
          {Math.abs(stock.change).toLocaleString(undefined, isIndex ? { minimumFractionDigits: 2 } : undefined)}
          {' '}({stock.changeRate})
        </span>
      </div>
      {stock.high52w > 0 && (
        <div className="card-from-high">
          <span className="label">고점대비</span>
          <span className={fromHighRate <= 0 ? 'price-down' : 'price-up'}>
            {fromHighRate > 0 ? '+' : ''}{fromHighRate.toFixed(1)}%
          </span>
        </div>
      )}
      <div className="card-details">
        <div>
          <span className="label">시가</span>
          <span>{stock.open ? stock.open.toLocaleString() : '-'}</span>
        </div>
        <div>
          <span className="label">고가</span>
          <span className="price-up">{stock.high ? stock.high.toLocaleString() : '-'}</span>
        </div>
        <div>
          <span className="label">저가</span>
          <span className="price-down">{stock.low ? stock.low.toLocaleString() : '-'}</span>
        </div>
        <div>
          <span className="label">거래량</span>
          <span>{stock.volume ? stock.volume.toLocaleString() : '-'}</span>
        </div>
        {stock.high52w > 0 && (
          <div>
            <span className="label">52주 고가</span>
            <span>{stock.high52w.toLocaleString()}</span>
          </div>
        )}
        {stock.low52w > 0 && (
          <div>
            <span className="label">52주 저가</span>
            <span>{stock.low52w.toLocaleString()}</span>
          </div>
        )}
      </div>
      <div className="card-updated">
        {new Date(stock.updatedAt).toLocaleTimeString('ko-KR')}
      </div>
    </div>
  );
}
