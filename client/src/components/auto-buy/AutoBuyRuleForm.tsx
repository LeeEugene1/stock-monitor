import { useState, useEffect, useRef } from 'react';
import type { Account } from '../../types/account';
import type { AutoBuyRule, AutoBuyRuleFormData } from '../../types/auto-buy';
import { apiFetch } from '../../utils/api';
import './AutoBuy.css';

interface Props {
  accounts: Account[];
  rule?: AutoBuyRule | null;
  onSubmit: (data: AutoBuyRuleFormData) => void;
  onCancel: () => void;
}

interface SearchResult {
  code: string;
  name: string;
  market: string;
}

export function AutoBuyRuleForm({ accounts, rule, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<AutoBuyRuleFormData>(
    rule
      ? {
          accountId: rule.accountId,
          stockCode: rule.stockCode,
          stockName: rule.stockName,
          buyDay: rule.buyDay,
          buyAmount: rule.buyAmount,
          ordDvsn: rule.ordDvsn,
        }
      : {
          accountId: accounts[0]?.id || 0,
          stockCode: '',
          stockName: '',
          buyDay: 15,
          buyAmount: 100000,
          ordDvsn: '01',
        },
  );

  const [searchQuery, setSearchQuery] = useState(rule?.stockName || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/api/stock/search?q=${encodeURIComponent(searchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(
            data
              .filter((r: any) => r.category === 'stock')
              .slice(0, 8),
          );
          setShowResults(true);
        }
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [searchQuery]);

  const selectStock = (result: SearchResult) => {
    setForm((prev) => ({
      ...prev,
      stockCode: result.code,
      stockName: result.name,
    }));
    setSearchQuery(result.name);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId || !form.stockCode || !form.buyAmount) return;
    onSubmit(form);
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <form className="autobuy-form" onSubmit={handleSubmit}>
      <h3>{rule ? '규칙 수정' : '규칙 추가'}</h3>

      <label>
        <span>계좌</span>
        <select
          value={form.accountId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              accountId: Number(e.target.value),
            }))
          }
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nickname}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>종목 검색</span>
        <div className="stock-search-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="종목명 또는 코드 입력"
          />
          {showResults && searchResults.length > 0 && (
            <ul className="stock-dropdown">
              {searchResults.map((r) => (
                <li key={r.code} onMouseDown={() => selectStock(r)}>
                  <span className="result-name">{r.name}</span>
                  <span className="result-code">{r.code}</span>
                  {r.market && (
                    <span className="result-market">{r.market}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {form.stockCode && (
          <div className="selected-stock">
            {form.stockName} ({form.stockCode})
          </div>
        )}
      </label>

      <div className="form-row">
        <label>
          <span>매수일 (매월)</span>
          <select
            value={form.buyDay}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                buyDay: Number(e.target.value),
              }))
            }
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>매수 금액 (원)</span>
          <input
            type="number"
            value={form.buyAmount}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                buyAmount: Number(e.target.value),
              }))
            }
            min={1000}
            step={1000}
            required
          />
        </label>
      </div>

      <label>
        <span>주문 유형</span>
        <select
          value={form.ordDvsn}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, ordDvsn: e.target.value }))
          }
        >
          <option value="01">시장가</option>
          <option value="00">지정가</option>
        </select>
      </label>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {rule ? '수정' : '추가'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}
