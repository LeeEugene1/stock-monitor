import { useState, useEffect, useRef } from 'react';
import type { Account } from '../../types/account';
import type {
  AutoBuyRule,
  AutoBuyRuleFormData,
  ScheduleType,
  TriggerType,
  AmountStrategy,
  OrderType,
  AutoBuyMode,
  UnfilledAction,
  LimitPriceMode,
} from '../../types/auto-buy';
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

const WEEKDAYS = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
];

function formatNumber(value: number | null | undefined): string {
  if (value == null || value === 0) return '';
  return value.toLocaleString();
}

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  return Number(cleaned);
}

const defaultForm = (accounts: Account[]): AutoBuyRuleFormData => ({
  accountId: accounts[0]?.id || 0,
  stockCode: '',
  stockName: '',
  enabled: true,
  mode: 'auto',
  scheduleType: 'monthly',
  scheduleWeekdays: [1, 2, 3, 4, 5],
  scheduleDay: 15,
  weekInterval: 1,
  windowStart: '09:00',
  windowEnd: '15:30',
  checkInterval: 5,
  triggerType: 'always',
  targetPrice: null,
  dropPercent: 3,
  amountStrategy: 'fixed',
  amountFixed: 100000,
  amountRatio: 50,
  orderType: 'market',
  limitPriceMode: 'current',
  limitPriceFixed: null,
  limitPriceDiscount: 2,
  unfilledAction: 'skip',
});

export function AutoBuyRuleForm({ accounts, rule, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<AutoBuyRuleFormData>(() =>
    rule
      ? {
          accountId: rule.accountId,
          stockCode: rule.stockCode,
          stockName: rule.stockName,
          enabled: rule.enabled,
          mode: rule.mode,
          scheduleType: rule.scheduleType,
          scheduleWeekdays: rule.scheduleWeekdays || [1, 2, 3, 4, 5],
          scheduleDay: rule.scheduleDay || 15,
          weekInterval: rule.weekInterval || 1,
          windowStart: rule.windowStart,
          windowEnd: rule.windowEnd,
          checkInterval: rule.checkInterval,
          triggerType: rule.triggerType,
          targetPrice: rule.targetPrice,
          dropPercent: rule.dropPercent,
          amountStrategy: rule.amountStrategy,
          amountFixed: rule.amountFixed,
          amountRatio: rule.amountRatio,
          orderType: rule.orderType,
          limitPriceMode: rule.limitPriceMode || 'current',
          limitPriceFixed: rule.limitPriceFixed,
          limitPriceDiscount: rule.limitPriceDiscount ?? 2,
          unfilledAction: rule.unfilledAction,
        }
      : defaultForm(accounts),
  );

  const [searchQuery, setSearchQuery] = useState(rule?.stockName || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    if (!searchQuery) {
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
  }, [searchQuery]);

  const set = <K extends keyof AutoBuyRuleFormData>(
    key: K,
    value: AutoBuyRuleFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectStock = (r: SearchResult) => {
    setForm((prev) => ({ ...prev, stockCode: r.code, stockName: r.name }));
    setSearchQuery(r.name);
    setShowResults(false);
  };

  const toggleWeekday = (day: number) => {
    const next = form.scheduleWeekdays.includes(day)
      ? form.scheduleWeekdays.filter((d) => d !== day)
      : [...form.scheduleWeekdays, day].sort();
    set('scheduleWeekdays', next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId || !form.stockCode) return;
    onSubmit(form);
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <form className="autobuy-form" onSubmit={handleSubmit}>
      <h3>{rule ? '규칙 수정' : '규칙 추가'}</h3>

      {/* 기본 */}
      <fieldset>
        <legend>기본</legend>
        <label>
          <span>계좌</span>
          <select
            value={form.accountId}
            onChange={(e) => set('accountId', Number(e.target.value))}
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

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => set('enabled', e.target.checked)}
          />
          <span>활성화</span>
        </label>
      </fieldset>

      {/* 매수 모드 */}
      <fieldset>
        <legend>매수 모드</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={form.mode === 'notify_only'}
              onChange={() => set('mode', 'notify_only' as AutoBuyMode)}
            />
            <span>알림만 받기 (수동 매수)</span>
          </label>
          <label>
            <input
              type="radio"
              checked={form.mode === 'auto'}
              onChange={() => set('mode', 'auto' as AutoBuyMode)}
            />
            <span>자동 매수</span>
          </label>
        </div>
      </fieldset>

      {/* 실행 일정 */}
      <fieldset>
        <legend>실행 일정</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={form.scheduleType === 'daily'}
              onChange={() => set('scheduleType', 'daily' as ScheduleType)}
            />
            <span>매일 (평일)</span>
          </label>
          <label>
            <input
              type="radio"
              checked={form.scheduleType === 'weekly'}
              onChange={() => set('scheduleType', 'weekly' as ScheduleType)}
            />
            <span>매주</span>
          </label>
          <label>
            <input
              type="radio"
              checked={form.scheduleType === 'monthly'}
              onChange={() => set('scheduleType', 'monthly' as ScheduleType)}
            />
            <span>매월</span>
          </label>
        </div>

        {form.scheduleType === 'weekly' && (
          <>
            <div className="weekday-toggle">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={form.scheduleWeekdays.includes(d.value) ? 'active' : ''}
                  onClick={() => toggleWeekday(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <label>
              <span>반복 간격</span>
              <select
                value={form.weekInterval}
                onChange={(e) => set('weekInterval', Number(e.target.value))}
              >
                <option value={1}>매주</option>
                <option value={2}>격주 (2주마다)</option>
                <option value={3}>3주마다</option>
                <option value={4}>4주마다</option>
              </select>
            </label>
          </>
        )}

        {form.scheduleType === 'monthly' && (
          <label>
            <span>매월</span>
            <select
              value={form.scheduleDay}
              onChange={(e) => set('scheduleDay', Number(e.target.value))}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="form-row">
          <label>
            <span>시작</span>
            <input
              type="time"
              value={form.windowStart}
              onChange={(e) => set('windowStart', e.target.value)}
            />
          </label>
          <label>
            <span>종료</span>
            <input
              type="time"
              value={form.windowEnd}
              onChange={(e) => set('windowEnd', e.target.value)}
            />
          </label>
          <label>
            <span>체크 주기</span>
            <select
              value={form.checkInterval}
              onChange={(e) => set('checkInterval', Number(e.target.value))}
            >
              <option value={5}>5분마다</option>
              <option value={10}>10분마다</option>
              <option value={30}>30분마다</option>
              <option value={60}>1시간마다</option>
            </select>
          </label>
        </div>
      </fieldset>

      {/* 매수 조건 */}
      <fieldset>
        <legend>매수 조건</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={form.triggerType === 'always'}
              onChange={() => set('triggerType', 'always' as TriggerType)}
            />
            <span>무조건 (시간 되면 매수)</span>
          </label>
          <label>
            <input
              type="radio"
              checked={form.triggerType === 'price_below'}
              onChange={() => set('triggerType', 'price_below' as TriggerType)}
            />
            <span>현재가가 목표가 이하</span>
            {form.triggerType === 'price_below' && (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumber(form.targetPrice)}
                  onChange={(e) => set('targetPrice', parseNumber(e.target.value))}
                  placeholder="100,000"
                />
                <span>원 이하</span>
              </>
            )}
          </label>
          <label>
            <input
              type="radio"
              checked={form.triggerType === 'drop_from_yesterday'}
              onChange={() =>
                set('triggerType', 'drop_from_yesterday' as TriggerType)
              }
            />
            <span>전일 종가 대비</span>
            {form.triggerType === 'drop_from_yesterday' && (
              <>
                <span className="minus-prefix">-</span>
                <input
                  type="number"
                  value={form.dropPercent ?? ''}
                  onChange={(e) =>
                    set('dropPercent', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="3"
                  min={0}
                  step={0.1}
                  style={{ width: 80 }}
                />
                <span>% 이상 하락</span>
              </>
            )}
          </label>
          <label>
            <input
              type="radio"
              checked={form.triggerType === 'drop_from_high'}
              onChange={() =>
                set('triggerType', 'drop_from_high' as TriggerType)
              }
            />
            <span>52주 고점 대비</span>
            {form.triggerType === 'drop_from_high' && (
              <>
                <span className="minus-prefix">-</span>
                <input
                  type="number"
                  value={form.dropPercent ?? ''}
                  onChange={(e) =>
                    set('dropPercent', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="20"
                  min={0}
                  step={0.1}
                  style={{ width: 80 }}
                />
                <span>% 이상 하락</span>
              </>
            )}
          </label>
        </div>
      </fieldset>

      {/* 매수 금액 */}
      <fieldset>
        <legend>매수 금액</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={form.amountStrategy === 'fixed'}
              onChange={() => set('amountStrategy', 'fixed' as AmountStrategy)}
            />
            <span>고정 금액</span>
            {form.amountStrategy === 'fixed' && (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumber(form.amountFixed)}
                  onChange={(e) => set('amountFixed', parseNumber(e.target.value))}
                  placeholder="100,000"
                />
                <span>원</span>
              </>
            )}
          </label>
          <label>
            <input
              type="radio"
              checked={form.amountStrategy === 'manual'}
              onChange={() => set('amountStrategy', 'manual' as AmountStrategy)}
            />
            <span>매번 직접 입력 (알림 받고 입력)</span>
          </label>
          <label>
            <input
              type="radio"
              checked={form.amountStrategy === 'cash_ratio'}
              onChange={() =>
                set('amountStrategy', 'cash_ratio' as AmountStrategy)
              }
            />
            <span>예수금 비율</span>
            {form.amountStrategy === 'cash_ratio' && (
              <input
                type="number"
                value={form.amountRatio ?? ''}
                onChange={(e) =>
                  set('amountRatio', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="비율 (%)"
                min={1}
                max={100}
                step={1}
              />
            )}
          </label>
        </div>
      </fieldset>

      {/* 주문 */}
      <fieldset>
        <legend>주문</legend>
        <label>
          <span>주문 유형</span>
          <select
            value={form.orderType}
            onChange={(e) => set('orderType', e.target.value as OrderType)}
          >
            <option value="market">시장가 (즉시 체결)</option>
            <option value="limit">지정가 (가격 도달 시 체결)</option>
            <option value="conditional_limit">
              조건부지정가 (지정가, 미체결 시 종가 시장가)
            </option>
          </select>
        </label>

        {form.orderType !== 'market' && (
          <fieldset className="nested-fieldset">
            <legend>지정가 결정 방식</legend>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={form.limitPriceMode === 'current'}
                  onChange={() =>
                    set('limitPriceMode', 'current' as LimitPriceMode)
                  }
                />
                <span>트리거 시점의 현재가</span>
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.limitPriceMode === 'discount'}
                  onChange={() =>
                    set('limitPriceMode', 'discount' as LimitPriceMode)
                  }
                />
                <span>현재가 -</span>
                {form.limitPriceMode === 'discount' && (
                  <input
                    type="number"
                    value={form.limitPriceDiscount ?? ''}
                    onChange={(e) =>
                      set(
                        'limitPriceDiscount',
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="2"
                    min={0}
                    max={30}
                    step={0.5}
                    style={{ width: 80 }}
                  />
                )}
                <span>%</span>
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.limitPriceMode === 'fixed'}
                  onChange={() =>
                    set('limitPriceMode', 'fixed' as LimitPriceMode)
                  }
                />
                <span>직접 지정</span>
                {form.limitPriceMode === 'fixed' && (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(form.limitPriceFixed)}
                      onChange={(e) =>
                        set('limitPriceFixed', parseNumber(e.target.value))
                      }
                      placeholder="100,000"
                    />
                    <span>원</span>
                  </>
                )}
              </label>
            </div>
          </fieldset>
        )}

        <label>
          <span>미체결 시</span>
          <select
            value={form.unfilledAction}
            onChange={(e) =>
              set('unfilledAction', e.target.value as UnfilledAction)
            }
          >
            <option value="skip">스킵</option>
            <option value="force_market_close">종가 시장가 매수</option>
            <option value="rollover_next_day">다음날 이월</option>
          </select>
        </label>
      </fieldset>

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
