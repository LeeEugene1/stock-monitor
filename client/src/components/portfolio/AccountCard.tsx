import type { AccountSummary } from '../../types/portfolio';
import './Portfolio.css';

interface Props {
  summary: AccountSummary;
  onClick: () => void;
}

function formatKRW(value: number): string {
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toFixed(0)}만`;
  }
  return value.toLocaleString();
}

export function AccountCard({ summary, onClick }: Props) {
  const plClass =
    summary.profitLossTotal > 0
      ? 'profit'
      : summary.profitLossTotal < 0
        ? 'loss'
        : '';

  return (
    <div className="account-card" onClick={onClick}>
      <div className="card-top">
        <span className="card-nickname">{summary.nickname}</span>
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
