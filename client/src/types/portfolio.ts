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

export interface AccountInfo {
  id: number;
  nickname: string;
  broker: string;
  productCode: string;
}

export interface AccountPortfolio {
  account: AccountInfo;
  summary: AccountSummary;
  holdings: Holding[];
  unsupported?: boolean;
  error?: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  ratio: number;
  stocks: { stockCode: string; stockName: string; amount: number }[];
}

export interface PortfolioOverview {
  totalPurchase: number;
  totalEval: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalDeposit: number;
  totalAssets: number;
  accounts: AccountPortfolio[];
  breakdown: CategoryBreakdown[];
}
