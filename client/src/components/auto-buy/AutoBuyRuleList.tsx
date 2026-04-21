import { useMemo } from 'react';
import type { AutoBuyRule } from '../../types/auto-buy';
import type { Account } from '../../types/account';
import type { StockPrice } from '../../types/stock';
import { useStockPrices } from '../../hooks/useStockPrices';
import { BROKER_LABELS } from '../../constants';
import './AutoBuy.css';

const WEEKDAY_LABELS = ['', '월', '화', '수', '목', '금', '토', '일'];

function formatSchedule(rule: AutoBuyRule): string {
  switch (rule.scheduleType) {
    case 'daily':
      return `매일 ${rule.windowStart}~${rule.windowEnd}`;
    case 'weekly': {
      const days = (rule.scheduleWeekdays || [])
        .map((d) => WEEKDAY_LABELS[d])
        .join('');
      const interval = rule.weekInterval || 1;
      const prefix =
        interval === 1
          ? '매주'
          : interval === 2
            ? '격주'
            : `${interval}주마다`;
      return `${prefix} [${days}] ${rule.windowStart}~${rule.windowEnd}`;
    }
    case 'monthly':
      return `매월 ${rule.scheduleDay}일 ${rule.windowStart}~${rule.windowEnd}`;
    default:
      return '';
  }
}

function formatAmount(rule: AutoBuyRule): string {
  switch (rule.amountStrategy) {
    case 'fixed':
      return `고정 ${(rule.amountFixed || 0).toLocaleString()}원`;
    case 'manual':
      return '직접 입력';
    case 'cash_ratio':
      return `예수금 ${rule.amountRatio || 0}%`;
    default:
      return '';
  }
}

function formatTrigger(rule: AutoBuyRule): string {
  switch (rule.triggerType) {
    case 'always':
      return '무조건';
    case 'price_below':
      return `${(rule.targetPrice || 0).toLocaleString()}원 이하`;
    case 'drop_from_yesterday':
      return `전일대비 -${rule.dropPercent}%↓`;
    case 'drop_from_high':
      return `52주 고점대비 -${rule.dropPercent}%↓`;
    default:
      return '';
  }
}

interface TriggerStatus {
  current: string;       // 현재 상태 (예: "-1.2%")
  target: string;        // 목표 (예: "-3%")
  triggered: boolean;    // 충족 여부
  progress: number;      // 0~100 (충족 정도)
}

function evaluateTrigger(
  rule: AutoBuyRule,
  stock: StockPrice | undefined,
): TriggerStatus | null {
  if (!stock) return null;

  switch (rule.triggerType) {
    case 'price_below': {
      if (!rule.targetPrice) return null;
      const triggered = stock.price <= rule.targetPrice;
      const progress = Math.min(
        100,
        Math.max(0, ((rule.targetPrice / stock.price) * 100)),
      );
      return {
        current: `${stock.price.toLocaleString()}원`,
        target: `${rule.targetPrice.toLocaleString()}원 이하`,
        triggered,
        progress,
      };
    }
    case 'drop_from_yesterday': {
      if (rule.dropPercent == null) return null;
      const yesterday = stock.price - stock.change;
      if (yesterday <= 0) return null;
      const dropRate = ((stock.price - yesterday) / yesterday) * 100;
      const triggered = dropRate <= -Math.abs(rule.dropPercent);
      const progress = Math.min(
        100,
        Math.max(0, (Math.abs(dropRate) / Math.abs(rule.dropPercent)) * 100),
      );
      return {
        current: `${dropRate >= 0 ? '+' : ''}${dropRate.toFixed(2)}%`,
        target: `-${rule.dropPercent}%`,
        triggered,
        progress,
      };
    }
    case 'drop_from_high': {
      if (rule.dropPercent == null || stock.high52w <= 0) return null;
      const dropRate = ((stock.price - stock.high52w) / stock.high52w) * 100;
      const triggered = dropRate <= -Math.abs(rule.dropPercent);
      const progress = Math.min(
        100,
        Math.max(0, (Math.abs(dropRate) / Math.abs(rule.dropPercent)) * 100),
      );
      return {
        current: `${dropRate.toFixed(2)}%`,
        target: `-${rule.dropPercent}%`,
        triggered,
        progress,
      };
    }
    default:
      return null;
  }
}

interface Props {
  rules: AutoBuyRule[];
  accounts: Account[];
  onEdit: (rule: AutoBuyRule) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
  onExecute: (id: number) => void;
}

export function AutoBuyRuleList({
  rules,
  accounts,
  onEdit,
  onDelete,
  onToggle,
  onExecute,
}: Props) {
  const accountMap = useMemo(
    () =>
      new Map(
        accounts.map((a) => [
          a.id,
          { nickname: a.nickname, broker: a.broker },
        ]),
      ),
    [accounts],
  );
  const codes = useMemo(
    () => Array.from(new Set(rules.map((r) => r.stockCode))),
    [rules],
  );
  const { data: prices } = useStockPrices(codes);

  if (rules.length === 0) {
    return <div className="empty-state">등록된 자동매수 규칙이 없습니다</div>;
  }

  return (
    <div className="rule-list">
      {rules.map((rule) => {
        const stock = prices?.get(rule.stockCode);
        const status = evaluateTrigger(rule, stock);
        return (
        <div
          key={rule.id}
          className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}
        >
          <div className="rule-info">
            <div className="rule-top">
              <span className="rule-stock">{rule.stockName}</span>
              <span className="rule-code">{rule.stockCode}</span>
              {(() => {
                const acc = accountMap.get(rule.accountId);
                return (
                  <>
                    <span className="rule-account">
                      {acc?.nickname || `#${rule.accountId}`}
                    </span>
                    {acc?.broker && (
                      <span
                        className={`badge-broker badge-broker-${acc.broker}`}
                      >
                        {BROKER_LABELS[acc.broker] || acc.broker}
                      </span>
                    )}
                  </>
                );
              })()}
              {stock && (
                <span className="rule-current-price">
                  {stock.price.toLocaleString()}원
                </span>
              )}
            </div>
            <div className="rule-detail">
              {formatSchedule(rule)} &middot; {formatAmount(rule)} &middot;{' '}
              {formatTrigger(rule)} &middot;{' '}
              <span className="badge-mode">
                {rule.mode === 'auto' ? '자동매수' : '알림만'}
              </span>
            </div>
            {status && (
              <div className="rule-trigger-status">
                <span className="trigger-label">현재</span>
                <span
                  className={`trigger-current ${status.triggered ? 'triggered' : ''}`}
                >
                  {status.current}
                </span>
                <span className="trigger-arrow">→</span>
                <span className="trigger-target">목표 {status.target}</span>
                <div className="trigger-progress">
                  <div
                    className={`trigger-progress-bar ${status.triggered ? 'done' : ''}`}
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
                {status.triggered && (
                  <span className="badge-triggered">조건충족</span>
                )}
              </div>
            )}
          </div>
          <div className="rule-actions">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) => onToggle(rule.id, e.target.checked)}
              />
            </label>
            <button
              className="btn-small btn-execute"
              onClick={() => onExecute(rule.id)}
              disabled={!rule.enabled}
              title="지금 실행"
            >
              실행
            </button>
            <button className="btn-small" onClick={() => onEdit(rule)}>
              수정
            </button>
            <button
              className="btn-small btn-danger"
              onClick={() => onDelete(rule.id)}
            >
              삭제
            </button>
          </div>
        </div>
      );
      })}
    </div>
  );
}
