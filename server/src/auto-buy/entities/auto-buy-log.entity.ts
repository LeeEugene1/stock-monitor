import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('auto_buy_logs')
export class AutoBuyLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'rule_id' })
  ruleId: number;

  @Column({ name: 'account_id' })
  accountId: number;

  @Column({ name: 'stock_code' })
  stockCode: string;

  @Column({ name: 'stock_name' })
  stockName: string;

  @Column({ name: 'ord_qty' })
  ordQty: number;

  @Column({ name: 'ord_unpr' })
  ordUnpr: number;

  @Column({ name: 'order_no', nullable: true })
  orderNo: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'executed_at' })
  executedAt: Date;
}
