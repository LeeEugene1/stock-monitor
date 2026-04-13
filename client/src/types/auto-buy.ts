export interface AutoBuyRule {
  id: number;
  accountId: number;
  stockCode: string;
  stockName: string;
  buyDay: number;
  buyAmount: number;
  ordDvsn: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutoBuyRuleFormData {
  accountId: number;
  stockCode: string;
  stockName: string;
  buyDay: number;
  buyAmount: number;
  ordDvsn: string;
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
