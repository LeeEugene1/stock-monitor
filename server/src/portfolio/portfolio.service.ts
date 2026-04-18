import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../account/account.service';
import {
  KisService,
  Holding,
  AccountSummary,
} from '../kis/kis.service';
import { KiwoomService } from '../kiwoom/kiwoom.service';
import { Account } from '../account/entities/account.entity';
import { friendlyError } from '../common/error-mapper';
import { CategoryService } from '../category/category.service';

export interface AccountPortfolio {
  account: {
    id: number;
    nickname: string;
    broker: string;
    productCode: string;
  };
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

export interface HoldingByCode {
  stockCode: string;
  stockName: string;
  totalQty: number;
  avgPrice: number;
  totalPurchase: number;
  accounts: {
    accountId: number;
    nickname: string;
    qty: number;
    avgPrice: number;
  }[];
}

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly kisService: KisService,
    private readonly kiwoomService: KiwoomService,
    private readonly categoryService: CategoryService,
  ) {}

  async getOverview(): Promise<PortfolioOverview> {
    const accounts = await this.accountService.findAll();

    const results = await Promise.all(
      accounts.map((account) => this.fetchAccountPortfolio(account)),
    );

    let totalPurchase = 0;
    let totalEval = 0;
    let totalDeposit = 0;
    let totalAssets = 0;

    for (const ap of results) {
      if (ap.unsupported) continue;
      totalPurchase += ap.summary.purchaseAmountTotal;
      totalEval += ap.summary.evalAmountTotal;
      totalDeposit += ap.summary.depositBalance;
      totalAssets += ap.summary.totalEvalAmount;
    }

    const totalProfitLoss = totalEval - totalPurchase;
    const breakdown = await this.computeBreakdown(results, totalEval);

    return {
      totalPurchase,
      totalEval,
      totalProfitLoss,
      totalProfitLossRate:
        totalPurchase > 0 ? (totalProfitLoss / totalPurchase) * 100 : 0,
      totalDeposit,
      totalAssets,
      accounts: results,
      breakdown,
    };
  }

  async getAccountPortfolio(accountId: number): Promise<AccountPortfolio> {
    const account = await this.accountService.findOne(accountId);
    return this.fetchAccountPortfolio(account);
  }

  private async fetchAccountPortfolio(
    account: Account,
  ): Promise<AccountPortfolio> {
    const accountInfo = {
      id: account.id,
      nickname: account.nickname,
      broker: account.broker || 'kis',
      productCode: account.productCode,
    };

    try {
      const broker = account.broker || 'kis';
      let summary: AccountSummary;
      let holdings: Holding[];

      if (broker === 'kiwoom') {
        // 키움: 한 번의 API 호출로 잔고 + 요약 조회
        const result = await this.kiwoomService.inquireBalanceAndSummary(
          account.id,
        );
        summary = result.summary;
        holdings = result.holdings;
      } else {
        // KIS: 별도 API이므로 병렬 호출
        [summary, holdings] = await Promise.all([
          this.kisService.inquireAccountSummary(account.id),
          this.kisService.inquireBalance(account.id),
        ]);
      }

      return { account: accountInfo, summary, holdings };
    } catch (err: any) {
      this.logger.error(
        `Failed to fetch portfolio for account #${account.id}: ${err.message}`,
      );
      return {
        account: accountInfo,
        summary: this.emptySummary(),
        holdings: [],
        unsupported: true,
        error: friendlyError(err.message, accountInfo.broker),
      };
    }
  }


  private async computeBreakdown(
    accounts: AccountPortfolio[],
    totalEval: number,
  ): Promise<CategoryBreakdown[]> {
    // 전 계좌 보유종목을 종목별로 합산
    const stockTotals = new Map<
      string,
      { stockName: string; amount: number }
    >();
    for (const ap of accounts) {
      if (ap.unsupported) continue;
      for (const h of ap.holdings) {
        if (h.evalAmount <= 0) continue;
        const existing = stockTotals.get(h.stockCode);
        if (existing) {
          existing.amount += h.evalAmount;
        } else {
          stockTotals.set(h.stockCode, {
            stockName: h.stockName,
            amount: h.evalAmount,
          });
        }
      }
    }

    if (stockTotals.size === 0) return [];

    const stockCodes = Array.from(stockTotals.keys());
    const categoryMap = await this.categoryService.resolveCategoriesBatch(
      stockCodes,
    );

    // 카테고리별로 그룹화
    const grouped = new Map<string, CategoryBreakdown>();
    for (const [stockCode, info] of stockTotals) {
      const category = categoryMap.get(stockCode) || '기타';
      if (!grouped.has(category)) {
        grouped.set(category, { category, amount: 0, ratio: 0, stocks: [] });
      }
      const g = grouped.get(category)!;
      g.amount += info.amount;
      g.stocks.push({
        stockCode,
        stockName: info.stockName,
        amount: info.amount,
      });
    }

    const result = Array.from(grouped.values()).map((g) => ({
      ...g,
      ratio: totalEval > 0 ? (g.amount / totalEval) * 100 : 0,
    }));
    result.sort((a, b) => b.amount - a.amount);
    return result;
  }

  private emptySummary(): AccountSummary {
    return {
      accountId: 0,
      nickname: '',
      depositBalance: 0,
      stockEvalAmount: 0,
      totalEvalAmount: 0,
      purchaseAmountTotal: 0,
      evalAmountTotal: 0,
      profitLossTotal: 0,
      profitLossRate: 0,
    };
  }

  async getHoldingByCode(stockCode: string): Promise<HoldingByCode | null> {
    const accounts = await this.accountService.findAll();

    const results = await Promise.allSettled(
      accounts.map(async (account) => ({
        account,
        holdings:
          account.broker === 'kiwoom'
            ? await this.kiwoomService.inquireBalance(account.id)
            : await this.kisService.inquireBalance(account.id),
      })),
    );

    const matches: HoldingByCode['accounts'] = [];
    let stockName = '';
    let totalQty = 0;
    let totalPurchase = 0;

    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const holding = r.value.holdings.find((h) => h.stockCode === stockCode);
      if (!holding || holding.quantity <= 0) continue;

      matches.push({
        accountId: r.value.account.id,
        nickname: r.value.account.nickname,
        qty: holding.quantity,
        avgPrice: holding.avgPrice,
      });
      stockName = holding.stockName;
      totalQty += holding.quantity;
      totalPurchase += holding.purchaseAmount;
    }

    if (matches.length === 0) return null;

    return {
      stockCode,
      stockName,
      totalQty,
      avgPrice: totalQty > 0 ? totalPurchase / totalQty : 0,
      totalPurchase,
      accounts: matches,
    };
  }
}
