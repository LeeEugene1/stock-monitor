import type { AccountPortfolio } from '../../types/portfolio';
import { formatKRW } from '../../utils/format';
import { BROKER_LABELS } from '../../constants';
import './Portfolio.css';

interface Props {
  accountPortfolio: AccountPortfolio;
  onClick: () => void;
}

export function AccountCard({ accountPortfolio, onClick }: Props) {
  const { account, summary, unsupported, error } = accountPortfolio;

  if (unsupported) {
    return (
      <div className="account-card unsupported" onClick={onClick}>
        <div className="card-top">
          <span className="card-nickname">
            {account.nickname}
            <span className={`badge-broker badge-broker-${account.broker}`}>
              {BROKER_LABELS[account.broker] || account.broker}
            </span>
          </span>
          <span className="card-arrow">&rsaquo;</span>
        </div>
        <div className="card-unsupported-msg">
          {error || 'API 연동 미구현'}
        </div>
      </div>
    );
  }

  const plClass =
    summary.profitLossTotal > 0
      ? 'profit'
      : summary.profitLossTotal < 0
        ? 'loss'
        : '';

  return (
    <div className="account-card" onClick={onClick}>
      <div className="card-top">
        <span className="card-nickname">
          {account.nickname}
          <span className={`badge-broker badge-broker-${account.broker}`}>
            {BROKER_LABELS[account.broker] || account.broker}
          </span>
        </span>
        <span className="card-arrow">&rsaquo;</span>
      </div>
      <div className="card-eval">{formatKRW(summary.totalEvalAmount)}원</div>
      <div className={`card-pl ${plClass}`}>
        {summary.profitLossTotal > 0 ? '+' : ''}
        {formatKRW(summary.profitLossTotal)}원 (
        {summary.profitLossRate.toFixed(2)}%)
      </div>
      <div className="card-meta-row">
        <span>매입 {formatKRW(summary.purchaseAmountTotal)}원</span>
        <span>예수금 {formatKRW(summary.depositBalance)}원</span>
      </div>
    </div>
  );
}
