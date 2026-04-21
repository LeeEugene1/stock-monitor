import { useState, useEffect, useRef } from 'react';
import type { Account } from '../../types/account';
import type { AutoBuyRule, AutoBuyRuleFormData } from '../../types/auto-buy';
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

type Strategy = 'dca' | 'dip';

function formatNumber(value: number | null | undefined): string {
  if (value == null || value === 0) return '';
  return value.toLocaleString();
}

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  return Number(cleaned);
}

function detectStrategy(rule: AutoBuyRule): Strategy {
  if (rule.triggerType === 'drop_from_high') return 'dip';
  return 'dca';
}

function buildFormData(
  strategy: Strategy,
  base: {
    accountId: number;
    stockCode: string;
    stockName: string;
    // DCA fields
    day: number;
    amount: number;
    discount: number;
    // Dip fields
    dropPercent: number;
    dipAmount: number;
  },
): AutoBuyRuleFormData {
  const common = {
    accountId: base.accountId,
    stockCode: base.stockCode,
    stockName: base.stockName,
    enabled: true,
    mode: 'auto' as const,
  };

  if (strategy === 'dca') {
    return {
      ...common,
      scheduleType: 'monthly',
      scheduleWeekdays: [1, 2, 3, 4, 5],
      scheduleDay: base.day,
      weekInterval: 1,
      windowStart: '09:00',
      windowEnd: '09:30',
      checkInterval: 5,
      triggerType: 'always',
      targetPrice: null,
      dropPercent: null,
      amountStrategy: 'fixed',
      amountFixed: base.amount,
      amountRatio: null,
      orderType: 'limit',
      limitPriceMode: 'discount',
      limitPriceFixed: null,
      limitPriceDiscount: base.discount,
      unfilledAction: 'skip',
    };
  }

  // dip
  return {
    ...common,
    scheduleType: 'daily',
    scheduleWeekdays: [1, 2, 3, 4, 5],
    scheduleDay: 1,
    weekInterval: 1,
    windowStart: '09:00',
    windowEnd: '09:30',
    checkInterval: 5,
    triggerType: 'drop_from_high',
    targetPrice: null,
    dropPercent: base.dropPercent,
    amountStrategy: 'fixed',
    amountFixed: base.dipAmount,
    amountRatio: null,
    orderType: 'limit',
    limitPriceMode: 'discount',
    limitPriceFixed: null,
    limitPriceDiscount: base.discount,
    unfilledAction: 'skip',
  };
}

export function AutoBuyRuleForm({ accounts, rule, onSubmit, onCancel }: Props) {
  const [strategy, setStrategy] = useState<Strategy>(
    rule ? detectStrategy(rule) : 'dca',
  );

  // DCA fields
  const [accountId, setAccountId] = useState(rule?.accountId || accounts[0]?.id || 0);
  const [stockCode, setStockCode] = useState(rule?.stockCode || '');
  const [stockName, setStockName] = useState(rule?.stockName || '');
  const [day, setDay] = useState(rule?.scheduleDay || 25);
  const [amount, setAmount] = useState(rule?.amountFixed || 100000);
  const [discount, setDiscount] = useState(rule?.limitPriceDiscount || 1.5);

  // Dip fields
  const [dropPercent, setDropPercent] = useState(rule?.dropPercent || 20);
  const [dipAmount, setDipAmount] = useState(
    rule?.triggerType === 'drop_from_high' ? (rule?.amountFixed || 500000) : 500000,
  );

  // Search
  const [searchQuery, setSearchQuery] = useState(rule?.stockName || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [userTyping, setUserTyping] = useState(false);
  const timerRef = useRef<number>();
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery || !userTyping) {
      setSearchResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/stock/search?q=${encodeURIComponent(searchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(
            data.filter((r: any) => r.category === 'stock').slice(0, 8),
          );
          setShowResults(true);
        }
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [searchQuery, userTyping]);

  // 외부 클릭 시 드롭다운 닫힘
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 종목 선택 시 현재가 조회
  useEffect(() => {
    if (!stockCode) {
      setCurrentPrice(null);
      return;
    }
    fetch(`/api/stock/${stockCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCurrentPrice(d?.price ?? null))
      .catch(() => setCurrentPrice(null));
  }, [stockCode]);

  const selectStock = (r: SearchResult) => {
    setStockCode(r.code);
    setStockName(r.name);
    setSearchQuery(r.name);
    setShowResults(false);
    setUserTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !stockCode) return;

    onSubmit(
      buildFormData(strategy, {
        accountId, stockCode, stockName,
        day, amount, discount,
        dropPercent, dipAmount,
      }),
    );
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <form className="autobuy-form" onSubmit={handleSubmit}>
      <h3>{rule ? '규칙 수정' : '규칙 추가'}</h3>

      {/* 전략 선택 */}
      <div className="strategy-selector">
        <button
          type="button"
          className={`strategy-card ${strategy === 'dca' ? 'active' : ''}`}
          onClick={() => setStrategy('dca')}
        >
          <div className="strategy-title">적립식 매수</div>
          <div className="strategy-desc">매월 N일, 시가 대비 할인가로 지정가 매수</div>
        </button>
        <button
          type="button"
          className={`strategy-card ${strategy === 'dip' ? 'active' : ''}`}
          onClick={() => setStrategy('dip')}
        >
          <div className="strategy-title">눌림장</div>
          <div className="strategy-desc">52주 고점 대비 N% 하락 시 시장가 매수</div>
        </button>
      </div>

      {/* 공통: 계좌 + 종목 */}
      <label>
        <span>계좌</span>
        <select
          value={accountId}
          onChange={(e) => setAccountId(Number(e.target.value))}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nickname}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>종목</span>
        <div className="stock-search-wrap" ref={searchWrapRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setUserTyping(true);
            }}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="종목명 또는 코드 입력"
          />
          {showResults && searchResults.length > 0 && (
            <ul className="stock-dropdown">
              {searchResults.map((r) => (
                <li key={r.code} onMouseDown={() => selectStock(r)}>
                  <span className="result-name">{r.name}</span>
                  <span className="result-code">{r.code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {stockCode && (
          <div className="selected-stock">
            {stockName} ({stockCode})
            {currentPrice !== null && (
              <span className="selected-price">
                현재가 {currentPrice.toLocaleString()}원
              </span>
            )}
          </div>
        )}
      </label>

      {/* 적립식 매수 */}
      {strategy === 'dca' && (
        <fieldset>
          <legend>적립식 설정</legend>
          <div className="form-row">
            <label>
              <span>매월</span>
              <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}일
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>매수 금액</span>
              <div className="input-with-unit">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumber(amount)}
                  onChange={(e) => {
                    const v = parseNumber(e.target.value);
                    if (v !== null) setAmount(v);
                  }}
                  placeholder="300,000"
                />
                <span className="unit">원</span>
              </div>
            </label>
          </div>
          <label>
            <span>시가 대비 할인율 (지정가)</span>
            <div className="input-with-unit">
              <span className="minus-prefix">-</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min={0}
                max={10}
                step={0.5}
                style={{ width: 80 }}
              />
              <span className="unit">%</span>
            </div>
            <div className="field-hint">
              시가 대비 -{discount}% 가격에 지정가 주문 → 안 내려오면 스킵
            </div>
          </label>
        </fieldset>
      )}

      {/* 하락장 매수 */}
      {strategy === 'dip' && (
        <fieldset>
          <legend>눌림장 설정</legend>
          <label>
            <span>52주 고점 대비 하락률</span>
            <div className="input-with-unit">
              <span className="minus-prefix">-</span>
              <input
                type="number"
                value={dropPercent}
                onChange={(e) => setDropPercent(Number(e.target.value))}
                min={5}
                max={50}
                step={1}
                style={{ width: 80 }}
              />
              <span className="unit">% 이상 하락 시</span>
            </div>
          </label>
          <label>
            <span>매수 금액</span>
            <div className="input-with-unit">
              <input
                type="text"
                inputMode="numeric"
                value={formatNumber(dipAmount)}
                onChange={(e) => {
                  const v = parseNumber(e.target.value);
                  if (v !== null) setDipAmount(v);
                }}
                placeholder="500,000"
              />
              <span className="unit">원</span>
            </div>
          </label>
          <label>
            <span>시가 대비 할인율 (지정가)</span>
            <div className="input-with-unit">
              <span className="minus-prefix">-</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min={0}
                max={10}
                step={0.5}
                style={{ width: 80 }}
              />
              <span className="unit">%</span>
            </div>
            <div className="field-hint">
              조건 충족일에 시가 대비 -{discount}% 지정가 주문 → 안 내려오면 스킵
            </div>
          </label>
        </fieldset>
      )}

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
