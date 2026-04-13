export interface HoldingAccount {
  accountId: number;
  nickname: string;
  qty: number;
  avgPrice: number;
}

export interface HoldingByCode {
  stockCode: string;
  stockName: string;
  totalQty: number;
  avgPrice: number;
  totalPurchase: number;
  accounts: HoldingAccount[];
}
