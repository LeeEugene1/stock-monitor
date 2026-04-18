import { useState } from 'react';
import type { CategoryBreakdown } from '../../types/portfolio';
import { formatKRW } from '../../utils/format';
import './Portfolio.css';

interface Props {
  breakdown: CategoryBreakdown;
  onClose: () => void;
  onUpdated: () => void;
}

export function CategoryEditModal({ breakdown, onClose, onUpdated }: Props) {
  const initial = Object.fromEntries(
    breakdown.stocks.map((s) => [s.stockCode, breakdown.category]),
  );
  const [edits, setEdits] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const changed = Object.entries(edits).filter(
        ([code, category]) => category && category !== initial[code],
      );
      if (changed.length === 0) {
        onClose();
        return;
      }
      const results = await Promise.allSettled(
        changed.map(([stockCode, category]) =>
          fetch(`/api/categories/${encodeURIComponent(stockCode)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category }),
          }).then((res) => {
            if (!res.ok) throw new Error(`${stockCode} 저장 실패`);
            return res;
          }),
        ),
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        setError(`${failed.length}개 종목 저장 실패`);
        setSaving(false);
        return;
      }
      onUpdated();
    } catch (err: any) {
      setError(err.message || '저장 중 오류');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{breakdown.category} — 카테고리 수정</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-hint">
            종목별로 카테고리를 직접 지정할 수 있습니다.
          </p>
          {breakdown.stocks.map((s) => (
            <div key={s.stockCode} className="edit-row">
              <div className="edit-stock-info">
                <span className="edit-stock-name">{s.stockName}</span>
                <span className="edit-stock-amount">
                  {formatKRW(s.amount)}원
                </span>
              </div>
              <input
                type="text"
                value={edits[s.stockCode] || ''}
                onChange={(e) =>
                  setEdits((prev) => ({
                    ...prev,
                    [s.stockCode]: e.target.value,
                  }))
                }
                placeholder="카테고리명"
              />
            </div>
          ))}
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
