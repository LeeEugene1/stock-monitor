import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('watch_items')
export class WatchItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ default: 'stock' })
  category: string; // 'stock' | 'index'

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'user_id', default: 0 })
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
