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

  findAll(): Promise<WatchItemEntity[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async add(data: {
    code: string;
    name: string;
    category: string;
  }): Promise<WatchItemEntity> {
    const existing = await this.repo.findOneBy({ code: data.code });
    if (existing) return existing;

    const maxOrder = await this.repo
      .createQueryBuilder('w')
      .select('MAX(w.sortOrder)', 'max')
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const item = this.repo.create({ ...data, sortOrder });
    return this.repo.save(item);
  }

  async remove(code: string): Promise<void> {
    await this.repo.delete({ code });
  }

  async reorder(codes: string[]): Promise<void> {
    for (let i = 0; i < codes.length; i++) {
      await this.repo.update({ code: codes[i] }, { sortOrder: i });
    }
  }
}
