import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutoBuyService } from './auto-buy.service';
import { AutoBuyRule } from './entities/auto-buy-rule.entity';
import { KisService } from '../kis/kis.service';
import { KisTokenService } from '../kis/kis-token.service';
import { KiwoomService } from '../kiwoom/kiwoom.service';
import { AccountService } from '../account/account.service';
import { StockService } from '../stock/stock.service';
import { NotificationService } from '../notification/notification.service';
import { roundDownToTick } from '../common/tick-size';

@Injectable()
export class AutoBuyScheduler {
  private readonly logger = new Logger(AutoBuyScheduler.name);

  constructor(
    private readonly autoBuyService: AutoBuyService,
    private readonly kisService: KisService,
    private readonly kisTokenService: KisTokenService,
    private readonly kiwoomService: KiwoomService,
    private readonly accountService: AccountService,
    private readonly stockService: StockService,
    private readonly notificationService: NotificationService,
  ) {}

  // 매 평일 08:30 KST — 토큰 사전 갱신
  @Cron('0 30 8 * * 1-5', { timeZone: 'Asia/Seoul' })
  async refreshTokens() {
    this.logger.log('Refreshing tokens for all accounts...');
    const accounts = await this.accountService.findAll();
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

  // 평일 08:50~15:35 사이 5분마다 자동매수 규칙 점검
  @Cron('0 */5 8-15 * * 1-5', { timeZone: 'Asia/Seoul' })
  async tick() {
    const now = new Date();
    const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const rules = await this.autoBuyService.findEnabledRules();
    this.logger.log(
      `[tick ${hhmm}] ${rules.length}개 활성 규칙 점검`,
    );

    if (rules.length === 0) return;

    for (const rule of rules) {
      try {
        await this.evaluateRule(rule, now);
      } catch (err: any) {
        this.logger.error(
          `Rule #${rule.id} evaluation failed: ${err.message}`,
        );
      }
    }
  }

  // 수동 실행 (controller에서 호출)
  async executeRule(ruleId: number) {
    const rule = await this.autoBuyService.findOneRule(ruleId);
    await this.executeAutoBuy(rule);
  }

  private async evaluateRule(rule: AutoBuyRule, now: Date) {
    // 1. 오늘 실행 가능 일자인지
    if (!this.isScheduledToday(rule, now)) return;

    // 2. 윈도우 시간대 안인지
    if (!this.isInWindow(rule, now)) {
      this.logger.debug(`Rule #${rule.id} (${rule.stockName}): 윈도우 밖`);
      return;
    }

    // 3. 오늘 이미 실행했는지
    if (this.isExecutedToday(rule, now)) return;

    // 4. 현재가 조회 (트리거 평가 + 주문에서 공유)
    const stock = await this.stockService.getStockPrice(rule.stockCode);

    // 5. 트리거 조건 평가
    const triggered = this.evaluateTrigger(rule, stock);
    if (!triggered) {
      this.logger.debug(
        `Rule #${rule.id} (${rule.stockName}): 조건 미충족 (${rule.triggerType})`,
      );
      return;
    }

    this.logger.log(
      `Rule #${rule.id} (${rule.stockName}) triggered. mode=${rule.mode}`,
    );

    // 6. 모드별 처리
    if (rule.mode === 'notify_only') {
      await this.notificationService.create({
        type: 'buy_time',
        title: `매수 알림: ${rule.stockName}`,
        body: `${rule.stockName}(${rule.stockCode}) 매수 조건이 충족되었습니다. 직접 매수해주세요.`,
        ruleId: rule.id,
      });
      await this.autoBuyService.markExecuted(rule.id);
      return;
    }

    // mode = 'auto'
    await this.executeAutoBuy(rule, stock);
  }

  private isScheduledToday(rule: AutoBuyRule, now: Date): boolean {
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=월, 7=일
    const dayOfMonth = now.getDate();

    switch (rule.scheduleType) {
      case 'daily':
        return dayOfWeek >= 1 && dayOfWeek <= 5; // 평일만
      case 'weekly': {
        const matchDay = rule.scheduleWeekdays?.includes(dayOfWeek) ?? false;
        if (!matchDay) return false;
        const interval = rule.weekInterval || 1;
        if (interval <= 1) return true;
        // createdAt 기준 주차 차이로 격주/N주 판별
        const anchor = new Date(rule.createdAt);
        const weeksSinceAnchor = Math.floor(
          (this.startOfWeek(now).getTime() -
            this.startOfWeek(anchor).getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        );
        return weeksSinceAnchor % interval === 0;
      }
      case 'monthly':
        return rule.scheduleDay === dayOfMonth;
      default:
        return false;
    }
  }

  private startOfWeek(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay() === 0 ? 7 : date.getDay(); // 1=월
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (day - 1));
    return date;
  }

  private isInWindow(rule: AutoBuyRule, now: Date): boolean {
    const [sh, sm] = (rule.windowStart || '09:00').split(':').map(Number);
    const [eh, em] = (rule.windowEnd || '15:30').split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= sh * 60 + sm && cur <= eh * 60 + em;
  }

  private isExecutedToday(rule: AutoBuyRule, now: Date): boolean {
    if (!rule.lastExecutedAt) return false;
    const last = new Date(rule.lastExecutedAt);
    return (
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate()
    );
  }

  private evaluateTrigger(rule: AutoBuyRule, stock: any): boolean {
    if (rule.triggerType === 'always') return !!stock;
    if (!stock) return false;

    switch (rule.triggerType) {
      case 'price_below':
        return rule.targetPrice ? stock.price <= rule.targetPrice : false;

      case 'drop_from_yesterday': {
        if (rule.dropPercent == null) return false;
        // 전일 종가 = 현재가 - change
        const yesterdayClose = stock.price - stock.change;
        if (yesterdayClose <= 0) return false;
        const dropRate = ((stock.price - yesterdayClose) / yesterdayClose) * 100;
        return dropRate <= -Math.abs(rule.dropPercent);
      }

      case 'drop_from_high': {
        if (rule.dropPercent == null || stock.high52w <= 0) return false;
        const dropRate = ((stock.price - stock.high52w) / stock.high52w) * 100;
        return dropRate <= -Math.abs(rule.dropPercent);
      }

      default:
        return false;
    }
  }

  private async executeAutoBuy(rule: AutoBuyRule, stock?: any) {
    try {
      if (!stock) {
        stock = await this.stockService.getStockPrice(rule.stockCode);
      }
      if (!stock || stock.price <= 0) {
        throw new Error(`현재가 조회 실패: ${rule.stockCode}`);
      }

      const amount = await this.resolveAmount(rule);
      if (amount <= 0) {
        throw new Error('매수 금액 0원');
      }

      const quantity = Math.floor(amount / stock.price);
      if (quantity <= 0) {
        throw new Error(
          `수량 부족: ${amount}원 / ${stock.price}원 = 0주`,
        );
      }

      // 주문 유형 매핑
      const ordDvsn =
        rule.orderType === 'market'
          ? '01'
          : rule.orderType === 'limit'
            ? '00'
            : '02'; // conditional_limit

      // 지정가 가격 계산 (호가 단위로 내림 처리)
      let price = 0;
      if (ordDvsn !== '01') {
        switch (rule.limitPriceMode) {
          case 'fixed':
            price = rule.limitPriceFixed || stock.price;
            break;
          case 'discount':
            price = stock.price * (1 - (rule.limitPriceDiscount || 0) / 100);
            break;
          case 'current':
          default:
            price = stock.price;
        }
        price = roundDownToTick(price);
      }

      const account = await this.accountService.findOne(rule.accountId);
      const orderService =
        account.broker === 'kiwoom' ? this.kiwoomService : this.kisService;
      const result = await orderService.orderCash(
        rule.accountId,
        rule.stockCode,
        quantity,
        price,
        ordDvsn,
      );

      if (!result.orderNo) {
        throw new Error('주문번호 없음 (체결 안 됨)');
      }

      await this.autoBuyService.createLog({
        ruleId: rule.id,
        accountId: rule.accountId,
        stockCode: rule.stockCode,
        stockName: rule.stockName,
        ordQty: quantity,
        ordUnpr: stock.price,
        orderNo: result.orderNo,
        status: 'success',
      });

      await this.autoBuyService.markExecuted(rule.id);

      await this.notificationService.create({
        type: 'buy_success',
        title: `✅ 매수 체결: ${rule.stockName}`,
        body: `${quantity}주 @ ${stock.price.toLocaleString()}원 (주문번호 ${result.orderNo})`,
        ruleId: rule.id,
      });

      this.logger.log(
        `Order success: ${rule.stockName} x${quantity} (#${result.orderNo})`,
      );
    } catch (error: any) {
      // 실패는 로그에 기록하지 않고 알림함에만 저장
      await this.notificationService.create({
        type: 'buy_failed',
        title: `❌ 매수 실패: ${rule.stockName}`,
        body: error.message,
        ruleId: rule.id,
      });

      this.logger.error(
        `Order failed for rule #${rule.id}: ${error.message}`,
      );
    }
  }

  private async resolveAmount(rule: AutoBuyRule): Promise<number> {
    switch (rule.amountStrategy) {
      case 'fixed':
        return rule.amountFixed ?? rule.buyAmount ?? 0;
      case 'manual':
        // TODO: 사용자 입력 대기 로직 (현재는 0 반환 → 실패)
        throw new Error('수동 입력 모드는 아직 지원되지 않습니다');
      case 'cash_ratio': {
        if (!rule.amountRatio) return 0;
        const summary = await this.kisService.inquireAccountSummary(
          rule.accountId,
        );
        return Math.floor(summary.depositBalance * (rule.amountRatio / 100));
      }
      default:
        return 0;
    }
  }
}
