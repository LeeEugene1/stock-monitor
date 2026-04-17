import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AutoBuyRule } from './entities/auto-buy-rule.entity';
import { AutoBuyLog } from './entities/auto-buy-log.entity';
import { AccountService } from '../account/account.service';

@Injectable()
export class AutoBuyService {
  constructor(
    @InjectRepository(AutoBuyRule)
    private readonly ruleRepo: Repository<AutoBuyRule>,
    @InjectRepository(AutoBuyLog)
    private readonly logRepo: Repository<AutoBuyLog>,
    private readonly accountService: AccountService,
  ) {}

  private async getUserAccountIds(userId: number): Promise<number[]> {
    const accounts = await this.accountService.findAllByUser(userId);
    return accounts.map((a) => a.id);
  }

  // --- Rules CRUD ---
  async findAllRules(userId: number): Promise<AutoBuyRule[]> {
    const accountIds = await this.getUserAccountIds(userId);
    if (accountIds.length === 0) return [];
    return this.ruleRepo.find({
      where: { accountId: In(accountIds) },
      order: { accountId: 'ASC', id: 'ASC' },
    });
  }

  async findOneRule(id: number, userId?: number): Promise<AutoBuyRule> {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) throw new NotFoundException(`Rule #${id} not found`);
    if (userId !== undefined) {
      const accountIds = await this.getUserAccountIds(userId);
      if (!accountIds.includes(rule.accountId)) {
        throw new NotFoundException(`Rule #${id} not found`);
      }
    }
    return rule;
  }

  async findAllRulesForScheduler(): Promise<AutoBuyRule[]> {
    return this.ruleRepo.find({ order: { accountId: 'ASC', id: 'ASC' } });
  }

  findRulesByDay(day: number): Promise<AutoBuyRule[]> {
    return this.ruleRepo.find({
      where: { buyDay: day, enabled: true },
    });
  }

  async createRule(data: Partial<AutoBuyRule>, userId: number): Promise<AutoBuyRule> {
    const accountIds = await this.getUserAccountIds(userId);
    if (!data.accountId || !accountIds.includes(data.accountId)) {
      throw new NotFoundException(`Account #${data.accountId} not found`);
    }
    const rule = this.ruleRepo.create(data);
    return this.ruleRepo.save(rule);
  }

  async updateRule(id: number, data: Partial<AutoBuyRule>, userId: number): Promise<AutoBuyRule> {
    const rule = await this.findOneRule(id, userId);
    Object.assign(rule, data);
    return this.ruleRepo.save(rule);
  }

  async removeRule(id: number, userId: number): Promise<void> {
    const rule = await this.findOneRule(id, userId);
    await this.ruleRepo.remove(rule);
  }

  // --- Logs ---
  async findLogs(userId: number, limit = 50): Promise<AutoBuyLog[]> {
    const accountIds = await this.getUserAccountIds(userId);
    if (accountIds.length === 0) return [];
    return this.logRepo.find({
      where: { accountId: In(accountIds) },
      order: { executedAt: 'DESC' },
      take: limit,
    });
  }

  createLog(data: Partial<AutoBuyLog>): Promise<AutoBuyLog> {
    const log = this.logRepo.create(data);
    return this.logRepo.save(log);
  }
}
