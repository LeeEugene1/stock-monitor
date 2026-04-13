import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('market_insights')
export class MarketInsight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  date: string; // YYYY-MM-DD

  // Raw metrics
  @Column('simple-json')
  metrics: {
    nasdaq: { price: number; change: number; changeRate: number; high52w: number; low52w: number };
    sp500: { price: number; change: number; changeRate: number; high52w: number; low52w: number };
    vix: { price: number; change: number; changeRate: number };
    usdKrw: { price: number; change: number; changeRate: number };
    us10y: { yield: number; change: number; changeRate: number };
  };

  // Scores (-2 ~ +2)
  @Column('simple-json')
  scores: {
    valuation: number;  // 고평가 -2 ~ 저평가 +2
    rate: number;       // 금리 부담 -2 ~ 우호적 +2
    fx: number;         // 환율 위험 -2 ~ 안정 +2
    fear: number;       // 공포 -2 ~ 탐욕 +2
    overall: number;    // 종합
  };

  @Column()
  summary: string; // 한줄 종합 평가

  @Column()
  signal: string; // bullish | neutral | bearish

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
