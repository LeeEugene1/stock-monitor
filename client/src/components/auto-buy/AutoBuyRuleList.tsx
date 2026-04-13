import type { AutoBuyRule } from '../../types/auto-buy';
import type { Account } from '../../types/account';
import './AutoBuy.css';

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
  const accountMap = new Map(accounts.map((a) => [a.id, a.nickname]));

  if (rules.length === 0) {
    return <div className="empty-state">등록된 자동매수 규칙이 없습니다</div>;
  }

  return (
    <div className="rule-list">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}
        >
          <div className="rule-info">
            <div className="rule-top">
              <span className="rule-stock">{rule.stockName}</span>
              <span className="rule-code">{rule.stockCode}</span>
              <span className="rule-account">
                {accountMap.get(rule.accountId) || `#${rule.accountId}`}
              </span>
            </div>
            <div className="rule-detail">
              매월 <strong>{rule.buyDay}일</strong> &middot;{' '}
              <strong>{rule.buyAmount.toLocaleString()}원</strong> &middot;{' '}
              {rule.ordDvsn === '01' ? '시장가' : '지정가'}
            </div>
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
      ))}
    </div>
  );
}
