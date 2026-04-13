export type Broker = 'kis' | 'kiwoom';

export interface Account {
  id: number;
  nickname: string;
  appKey: string;
  appSecret: string;
  accountNo: string;
  productCode: string;
  broker: Broker;
  isPaper: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountFormData {
  nickname: string;
  appKey: string;
  appSecret: string;
  accountNo: string;
  productCode: string;
  broker: Broker;
  isPaper: boolean;
}
