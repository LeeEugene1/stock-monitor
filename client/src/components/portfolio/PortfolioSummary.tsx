import './Portfolio.css';

interface Props {
  totalAssets: number;
  totalPurchase: number;
  totalEval: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalDeposit: number;
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

export function PortfolioSummary({
  totalAssets,
  totalPurchase,
  totalEval,
  totalProfitLoss,
  totalProfitLossRate,
  totalDeposit,
}: Props) {
  const plClass =
    totalProfitLoss > 0
      ? 'profit'
      : totalProfitLoss < 0
        ? 'loss'
        : '';

  return (
    <div className="portfolio-summary">
      <div className="summary-main">
        <div className="summary-label">전체 자산</div>
        <div className="summary-value">{formatKRW(totalAssets)}원</div>
      </div>
      <div className="summary-details">
        <div className="summary-item">
          <span className="label">매입금액</span>
          <span>{formatKRW(totalPurchase)}원</span>
        </div>
        <div className="summary-item">
          <span className="label">평가금액</span>
          <span>{formatKRW(totalEval)}원</span>
        </div>
        <div className={`summary-item ${plClass}`}>
          <span className="label">평가손익</span>
          <span>
            {totalProfitLoss > 0 ? '+' : ''}
            {formatKRW(totalProfitLoss)}원 ({totalProfitLossRate.toFixed(2)}%)
          </span>
        </div>
        <div className="summary-item">
          <span className="label">예수금</span>
          <span>{formatKRW(totalDeposit)}원</span>
        </div>
      </div>
    </div>
  );
}
