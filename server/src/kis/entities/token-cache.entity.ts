import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('token_cache')
export class TokenCache {
  @PrimaryColumn({ name: 'account_id' })
  accountId: number;

  @Column({ name: 'access_token' })
  accessToken: string;

  @Column({ name: 'expired_at' })
  expiredAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
