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

  @Column({ name: 'buy_day' })
  buyDay: number;

  @Column({ name: 'buy_amount' })
  buyAmount: number;

  @Column({ name: 'ord_dvsn', default: '01' })
  ordDvsn: string;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
