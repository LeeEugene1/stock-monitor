import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'kakao_id', type: 'bigint', unique: true })
  kakaoId: number;

  @Column()
  nickname: string;

  @Column({ name: 'profile_image', type: 'varchar', nullable: true })
  profileImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
