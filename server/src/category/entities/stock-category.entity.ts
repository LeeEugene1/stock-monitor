import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stock_categories')
export class StockCategory {
  @PrimaryColumn({ name: 'stock_code' })
  stockCode: string;

  @Column({ nullable: true })
  category: string | null;

  @Column({ name: 'auto_sector', nullable: true })
  autoSector: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
