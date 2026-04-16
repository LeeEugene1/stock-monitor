import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../account/account.service';
import {
  KisService,
  Holding,
  AccountSummary,
} from '../kis/kis.service';

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
  ) {}

  async getOverview(userId: number): Promise<PortfolioOverview> {
    const accounts = await this.accountService.findAll(userId);

    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        const [summary, holdings] = await Promise.all([
          this.kisService.inquireAccountSummary(account.id),
          this.kisService.inquireBalance(account.id),
        ]);
        return { summary, holdings } as AccountPortfolio;
      }),
    );

    const accountPortfolios: AccountPortfolio[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        accountPortfolios.push(result.value);
      } else {
        this.logger.error(
          `Failed to fetch portfolio for account #${accounts[i].id}: ${result.reason}`,
        );
      }
    }

    let totalPurchase = 0;
    let totalEval = 0;
    let totalDeposit = 0;
    let totalAssets = 0;

    for (const ap of accountPortfolios) {
      totalPurchase += ap.summary.purchaseAmountTotal;
      totalEval += ap.summary.evalAmountTotal;
      totalDeposit += ap.summary.depositBalance;
      totalAssets += ap.summary.totalEvalAmount;
    }

    const totalProfitLoss = totalEval - totalPurchase;

    return {
      totalPurchase,
      totalEval,
      totalProfitLoss,
      totalProfitLossRate:
        totalPurchase > 0 ? (totalProfitLoss / totalPurchase) * 100 : 0,
      totalDeposit,
      totalAssets,
      accounts: accountPortfolios,
    };
  }

  async getAccountPortfolio(accountId: number): Promise<AccountPortfolio> {
    const [summary, holdings] = await Promise.all([
      this.kisService.inquireAccountSummary(accountId),
      this.kisService.inquireBalance(accountId),
    ]);
    return { summary, holdings };
  }

  async getHoldingByCode(stockCode: string, userId: number): Promise<HoldingByCode | null> {
    const accounts = await this.accountService.findAll(userId);

    const results = await Promise.allSettled(
      accounts.map(async (account) => ({
        account,
        holdings: await this.kisService.inquireBalance(account.id),
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
