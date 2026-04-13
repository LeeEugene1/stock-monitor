import { useEffect } from 'react';
import { StockPrice } from '../types/stock';
import { StockChart } from './StockChart';
import { StockNews } from './StockNews';

interface Props {
  stock: StockPrice;
  onClose: () => void;
}

export function StockDetailModal({ stock, onClose }: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const isIndex = stock.category === 'index';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {stock.name}
              {isIndex && <span className="badge-index">지수</span>}
            </h2>
            <span className="stock-code">{stock.code}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="닫기">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <StockChart code={stock.code} category={stock.category} />
          {stock.category === 'stock' && <StockNews code={stock.code} />}
        </div>
      </div>
    </div>
  );
}
