export type AutoBuyMode = 'notify_only' | 'auto';
export type ScheduleType = 'daily' | 'weekly' | 'monthly';
export type TriggerType =
  | 'always'
  | 'price_below'
  | 'drop_from_yesterday'
  | 'drop_from_high';
export type AmountStrategy = 'fixed' | 'manual' | 'cash_ratio';
export type OrderType = 'market' | 'limit' | 'conditional_limit';
export type LimitPriceMode = 'current' | 'fixed' | 'discount';
export type UnfilledAction = 'skip' | 'force_market_close' | 'rollover_next_day';

export interface AutoBuyRule {
  id: number;
  accountId: number;
  stockCode: string;
  stockName: string;
  enabled: boolean;
  mode: AutoBuyMode;

  scheduleType: ScheduleType;
  scheduleWeekdays: number[] | null;
  scheduleDay: number | null;
  weekInterval: number;
  windowStart: string;
  windowEnd: string;
  checkInterval: number;

  triggerType: TriggerType;
  targetPrice: number | null;
  dropPercent: number | null;
  highSource: string | null;

  amountStrategy: AmountStrategy;
  amountFixed: number | null;
  amountRatio: number | null;

  orderType: OrderType;
  limitPriceMode: LimitPriceMode;
  limitPriceFixed: number | null;
  limitPriceDiscount: number | null;
  unfilledAction: UnfilledAction;

  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutoBuyRuleFormData {
  accountId: number;
  stockCode: string;
  stockName: string;
  enabled: boolean;
  mode: AutoBuyMode;

  scheduleType: ScheduleType;
  scheduleWeekdays: number[];
  scheduleDay: number;
  weekInterval: number;
  windowStart: string;
  windowEnd: string;
  checkInterval: number;

  triggerType: TriggerType;
  targetPrice: number | null;
  dropPercent: number | null;

  amountStrategy: AmountStrategy;
  amountFixed: number | null;
  amountRatio: number | null;

  orderType: OrderType;
  limitPriceMode: LimitPriceMode;
  limitPriceFixed: number | null;
  limitPriceDiscount: number | null;
  unfilledAction: UnfilledAction;
}

export interface AutoBuyLog {
  id: number;
  ruleId: number;
  accountId: number;
  stockCode: string;
  stockName: string;
  ordQty: number;
  ordUnpr: number;
  orderNo: string | null;
  status: string;
  errorMessage: string | null;
  executedAt: string;
}
