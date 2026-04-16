import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  findAll(userId?: number): Promise<Account[]> {
    const where = userId !== undefined ? { userId } : {};
    return this.accountRepo.find({ where, order: { id: 'ASC' } });
  }

  async findOne(id: number, userId?: number): Promise<Account> {
    const where: any = { id };
    if (userId !== undefined) where.userId = userId;
    const account = await this.accountRepo.findOneBy(where);
    if (!account) throw new NotFoundException(`Account #${id} not found`);
    return account;
  }

  create(data: Partial<Account>, userId: number): Promise<Account> {
    const account = this.accountRepo.create({ ...data, userId });
    return this.accountRepo.save(account);
  }

  async update(id: number, data: Partial<Account>, userId: number): Promise<Account> {
    const account = await this.findOne(id, userId);
    // 마스킹된 값이나 빈 값은 기존 값 유지
    const filtered: Partial<Account> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined || val === null) continue;
      if (typeof val === 'string' && (val.includes('****') || val === '********')) continue;
      filtered[key as keyof Account] = val as any;
    }
    Object.assign(account, filtered);
    return this.accountRepo.save(account);
  }

  async remove(id: number, userId: number): Promise<void> {
    const account = await this.findOne(id, userId);
    await this.accountRepo.remove(account);
  }
}
