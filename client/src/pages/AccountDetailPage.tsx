import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HoldingsTable } from '../components/portfolio/HoldingsTable';
import type { AccountPortfolio } from '../types/portfolio';
import '../components/portfolio/Portfolio.css';

async function fetchAccountPortfolio(
  accountId: string,
): Promise<AccountPortfolio> {
  const res = await fetch(`/api/portfolio/${accountId}`);
  if (!res.ok) throw new Error('Failed to fetch account portfolio');
  return res.json();
}

export function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', accountId],
    queryFn: () => fetchAccountPortfolio(accountId!),
    enabled: !!accountId,
  });

  if (isLoading) {
    return <div className="portfolio-loading">잔고 조회 중...</div>;
  }

  if (error || !data) {
    return (
      <div className="portfolio-error">잔고를 불러올 수 없습니다.</div>
    );
  }

  const { account, summary, holdings, unsupported, error: apiError } = data;

  if (unsupported) {
    return (
      <div>
        <Link to="/portfolio" className="back-btn">
          &larr; 포트폴리오
        </Link>
        <div className="detail-header">
          <h2>{account.nickname}</h2>
        </div>
        <div className="empty-state">{apiError || 'API 연동 미구현'}</div>
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
    <div>
      <Link to="/portfolio" className="back-btn">
        &larr; 포트폴리오
      </Link>

      <div className="detail-header">
        <h2>{account.nickname}</h2>
        <div className="detail-eval">
          <div className="amount">
            {summary.totalEvalAmount.toLocaleString()}원
          </div>
          <div className={`pl ${plClass}`}>
            {summary.profitLossTotal > 0 ? '+' : ''}
            {summary.profitLossTotal.toLocaleString()}원 (
            {summary.profitLossRate.toFixed(2)}%)
          </div>
        </div>
      </div>

      <HoldingsTable holdings={holdings} />
    </div>
  );
}
