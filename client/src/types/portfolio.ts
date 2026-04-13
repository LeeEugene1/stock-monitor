export interface Holding {
  stockCode: string;
  stockName: string;
  quantity: number;
  avgPrice: number;
  purchaseAmount: number;
  currentPrice: number;
  evalAmount: number;
  profitLossAmount: number;
  profitLossRate: number;
}

export interface AccountSummary {
  accountId: number;
  nickname: string;
  depositBalance: number;
  stockEvalAmount: number;
  totalEvalAmount: number;
  purchaseAmountTotal: number;
  evalAmountTotal: number;
  profitLossTotal: number;
  profitLossRate: number;
}

export interface AccountPortfolio {
  summary: AccountSummary;
  holdings: Holding[];
}

export interface PortfolioOverview {
  totalPurchase: number;
  totalEval: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalDeposit: number;
  totalAssets: number;
  accounts: AccountPortfolio[];
}
