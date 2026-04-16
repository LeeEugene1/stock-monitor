import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchItemEntity } from './entities/watch-item.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchItemEntity)
    private readonly repo: Repository<WatchItemEntity>,
  ) {}

  findAll(userId: number): Promise<WatchItemEntity[]> {
    return this.repo.find({ where: { userId }, order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async add(data: {
    code: string;
    name: string;
    category: string;
  }, userId: number): Promise<WatchItemEntity> {
    const existing = await this.repo.findOneBy({ code: data.code, userId });
    if (existing) return existing;

    const maxOrder = await this.repo
      .createQueryBuilder('w')
      .select('MAX(w.sortOrder)', 'max')
      .where('w.user_id = :userId', { userId })
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const item = this.repo.create({ ...data, sortOrder, userId });
    return this.repo.save(item);
  }

  async remove(code: string, userId: number): Promise<void> {
    await this.repo.delete({ code, userId });
  }

  async reorder(codes: string[], userId: number): Promise<void> {
    for (let i = 0; i < codes.length; i++) {
      await this.repo.update({ code: codes[i], userId }, { sortOrder: i });
    }
  }
}
