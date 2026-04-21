import type { AutoBuyRule, AutoBuyLog } from '../types/auto-buy';

export type StrategyType = 'dca' | 'dip' | 'advanced';

export function detectStrategyFromRule(rule: AutoBuyRule): StrategyType {
  if (
    rule.scheduleType === 'monthly' &&
    rule.triggerType === 'always' &&
    rule.orderType === 'limit'
  ) {
    return 'dca';
  }
  if (rule.triggerType === 'drop_from_high') {
    return 'dip';
  }
  return 'advanced';
}

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  dca: '적립식',
  dip: '눌림장',
  advanced: '적립식',  // 분류 불가 시 적립식으로 표시
};

export const STRATEGY_COLORS: Record<StrategyType, string> = {
  dca: '#58a6ff',
  dip: '#f85149',
  advanced: '#58a6ff',
};
