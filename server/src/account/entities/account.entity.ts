import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nickname: string;

  @Column({ name: 'app_key' })
  appKey: string;

  @Column({ name: 'app_secret' })
  appSecret: string;

  @Column({ name: 'account_no' })
  accountNo: string;

  @Column({ name: 'product_code', default: '01' })
  productCode: string;

  @Column({ default: 'kis' })
  broker: string;

  @Column({ name: 'is_paper', default: false })
  isPaper: boolean;

  @Column({ name: 'user_id', default: 0 })
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
