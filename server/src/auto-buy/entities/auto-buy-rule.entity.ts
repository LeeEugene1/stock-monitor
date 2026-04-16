import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('auto_buy_rules')
export class AutoBuyRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'account_id' })
  accountId: number;

  @Column({ name: 'stock_code' })
  stockCode: string;

  @Column({ name: 'stock_name' })
  stockName: string;

  @Column({ default: true })
  enabled: boolean;

  // 모드: 알림만 / 자동 매수
  @Column({ default: 'auto' })
  mode: 'notify_only' | 'auto';

  // 일정
  @Column({ name: 'schedule_type', default: 'monthly' })
  scheduleType: 'daily' | 'weekly' | 'monthly';

  @Column({ name: 'schedule_weekdays', type: 'simple-json', nullable: true })
  scheduleWeekdays: number[] | null;

  @Column({ name: 'schedule_day', type: 'int', nullable: true })
  scheduleDay: number | null;

  // 매주 모드에서 N주마다 (1=매주, 2=격주, 3=3주마다)
  @Column({ name: 'week_interval', default: 1 })
  weekInterval: number;

  @Column({ name: 'window_start', default: '09:00' })
  windowStart: string;

  @Column({ name: 'window_end', default: '15:30' })
  windowEnd: string;

  @Column({ name: 'check_interval', default: 5 })
  checkInterval: number;

  // 트리거 조건
  @Column({ name: 'trigger_type', default: 'always' })
  triggerType: 'always' | 'price_below' | 'drop_from_yesterday' | 'drop_from_high';

  @Column({ name: 'target_price', type: 'int', nullable: true })
  targetPrice: number | null;

  @Column({ name: 'drop_percent', type: 'real', nullable: true })
  dropPercent: number | null;

  @Column({ name: 'high_source', type: 'text', nullable: true })
  highSource: string | null;

  // 금액
  @Column({ name: 'amount_strategy', default: 'fixed' })
  amountStrategy: 'fixed' | 'manual' | 'cash_ratio';

  @Column({ name: 'amount_fixed', type: 'int', nullable: true })
  amountFixed: number | null;

  @Column({ name: 'amount_ratio', type: 'real', nullable: true })
  amountRatio: number | null;

  // 주문
  @Column({ name: 'order_type', default: 'market' })
  orderType: 'market' | 'limit' | 'conditional_limit';

  // 지정가/조건부지정가 가격 결정 방식
  @Column({ name: 'limit_price_mode', default: 'current' })
  limitPriceMode: 'current' | 'fixed' | 'discount';

  @Column({ name: 'limit_price_fixed', type: 'int', nullable: true })
  limitPriceFixed: number | null;

  @Column({ name: 'limit_price_discount', type: 'real', nullable: true })
  limitPriceDiscount: number | null; // 현재가 -N% (양수)

  @Column({ name: 'unfilled_action', default: 'skip' })
  unfilledAction: 'skip' | 'force_market_close' | 'rollover_next_day';

  // 실행 추적
  @Column({ name: 'last_executed_at', type: 'datetime', nullable: true })
  lastExecutedAt: Date | null;

  // 레거시 (마이그레이션 호환)
  @Column({ name: 'buy_day', type: 'int', nullable: true })
  buyDay: number | null;

  @Column({ name: 'buy_amount', type: 'int', nullable: true })
  buyAmount: number | null;

  @Column({ name: 'ord_dvsn', default: '01' })
  ordDvsn: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
