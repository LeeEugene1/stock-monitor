import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MarketInsightBanner } from '../components/market-insight/MarketInsightBanner';
import { PortfolioSummary } from '../components/portfolio/PortfolioSummary';
import { AccountCard } from '../components/portfolio/AccountCard';
import type { PortfolioOverview } from '../types/portfolio';
import '../components/portfolio/Portfolio.css';

async function fetchOverview(): Promise<PortfolioOverview> {
  const res = await fetch('/api/portfolio');
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return res.json();
}

export function PortfolioPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchOverview,
  });

  if (isLoading) {
    return <div className="portfolio-loading">포트폴리오 조회 중...</div>;
  }

  if (error || !data) {
    return (
      <div className="portfolio-error">
        포트폴리오를 불러올 수 없습니다.
        {data?.accounts.length === 0 && ' 등록된 계좌가 없습니다.'}
      </div>
    );
  }

  if (data.accounts.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2>포트폴리오</h2>
        </div>
        <div className="empty-state">
          등록된 계좌가 없습니다. 계좌관리에서 계좌를 추가하세요.
        </div>
      </div>
    );
  }

  return (
    <div>
      <MarketInsightBanner />

      <div className="page-header">
        <h2>포트폴리오</h2>
      </div>

      <PortfolioSummary
        totalAssets={data.totalAssets}
        totalPurchase={data.totalPurchase}
        totalEval={data.totalEval}
        totalProfitLoss={data.totalProfitLoss}
        totalProfitLossRate={data.totalProfitLossRate}
        totalDeposit={data.totalDeposit}
      />

      <div className="account-cards">
        {data.accounts.map((ap) => (
          <AccountCard
            key={ap.summary.accountId}
            summary={ap.summary}
            onClick={() =>
              navigate(`/portfolio/${ap.summary.accountId}`)
            }
          />
        ))}
      </div>
    </div>
  );
}
