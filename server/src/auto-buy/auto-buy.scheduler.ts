import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AutoBuyService } from './auto-buy.service';
import { KisService } from '../kis/kis.service';
import { KisTokenService } from '../kis/kis-token.service';
import { AccountService } from '../account/account.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class AutoBuyScheduler {
  private readonly logger = new Logger(AutoBuyScheduler.name);

  constructor(
    private readonly autoBuyService: AutoBuyService,
    private readonly kisService: KisService,
    private readonly kisTokenService: KisTokenService,
    private readonly accountService: AccountService,
    private readonly stockService: StockService,
  ) {}

  // 매 평일 08:30 KST — 토큰 사전 갱신
  @Cron('0 30 8 * * 1-5', { timeZone: 'Asia/Seoul' })
  async refreshTokens() {
    this.logger.log('Refreshing tokens for all accounts...');
    const accounts = await this.accountService.findAllInternal();
    for (const account of accounts) {
      try {
        await this.kisTokenService.getToken(account.id);
      } catch (err: any) {
        this.logger.error(
          `Token refresh failed for account #${account.id}: ${err.message}`,
        );
      }
    }
  }

  // 매 평일 09:05 KST — 자동매수 실행
  @Cron('0 5 9 * * 1-5', { timeZone: 'Asia/Seoul' })
  async handleAutoBuy() {
    const today = new Date();
    const dayOfMonth = today.getDate();

    const rules = await this.autoBuyService.findRulesByDay(dayOfMonth);
    if (rules.length === 0) {
      this.logger.log(`No auto-buy rules for day ${dayOfMonth}`);
      return;
    }

    this.logger.log(
      `Executing ${rules.length} auto-buy rules for day ${dayOfMonth}`,
    );

    for (const rule of rules) {
      await this.executeRule(rule.id);
      await this.delay(200);
    }
  }

  async executeRule(ruleId: number) {
    const rule = await this.autoBuyService.findOneRule(ruleId);

    try {
      // 현재가 조회 (기존 StockService 재사용)
      const stockData = await this.stockService.getStockPrice(rule.stockCode);
      if (!stockData || stockData.price <= 0) {
        throw new Error(`현재가 조회 실패: ${rule.stockCode}`);
      }

      const quantity = Math.floor(rule.buyAmount / stockData.price);
      if (quantity <= 0) {
        throw new Error(
          `매수 수량 부족: ${rule.buyAmount}원 / ${stockData.price}원 = 0주`,
        );
      }

      // 시장가 주문 시 단가 0
      const price = rule.ordDvsn === '01' ? 0 : stockData.price;

      const result = await this.kisService.orderCash(
        rule.accountId,
        rule.stockCode,
        quantity,
        price,
        rule.ordDvsn,
      );

      await this.autoBuyService.createLog({
        ruleId: rule.id,
        accountId: rule.accountId,
        stockCode: rule.stockCode,
        stockName: rule.stockName,
        ordQty: quantity,
        ordUnpr: stockData.price,
        orderNo: result.orderNo,
        status: 'success',
      });

      this.logger.log(
        `Order success: ${rule.stockName} x${quantity} (order #${result.orderNo})`,
      );
    } catch (error: any) {
      await this.autoBuyService.createLog({
        ruleId: rule.id,
        accountId: rule.accountId,
        stockCode: rule.stockCode,
        stockName: rule.stockName,
        ordQty: 0,
        ordUnpr: 0,
        status: 'failed',
        errorMessage: error.message,
      });

      this.logger.error(
        `Order failed for rule #${rule.id}: ${error.message}`,
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
