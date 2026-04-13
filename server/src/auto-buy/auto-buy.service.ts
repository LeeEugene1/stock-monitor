import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutoBuyRule } from './entities/auto-buy-rule.entity';
import { AutoBuyLog } from './entities/auto-buy-log.entity';

@Injectable()
export class AutoBuyService {
  constructor(
    @InjectRepository(AutoBuyRule)
    private readonly ruleRepo: Repository<AutoBuyRule>,
    @InjectRepository(AutoBuyLog)
    private readonly logRepo: Repository<AutoBuyLog>,
  ) {}

  // --- Rules CRUD ---
  findAllRules(): Promise<AutoBuyRule[]> {
    return this.ruleRepo.find({ order: { accountId: 'ASC', id: 'ASC' } });
  }

  async findOneRule(id: number): Promise<AutoBuyRule> {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) throw new NotFoundException(`Rule #${id} not found`);
    return rule;
  }

  findRulesByDay(day: number): Promise<AutoBuyRule[]> {
    return this.ruleRepo.find({
      where: { buyDay: day, enabled: true },
    });
  }

  createRule(data: Partial<AutoBuyRule>): Promise<AutoBuyRule> {
    const rule = this.ruleRepo.create(data);
    return this.ruleRepo.save(rule);
  }

  async updateRule(id: number, data: Partial<AutoBuyRule>): Promise<AutoBuyRule> {
    const rule = await this.findOneRule(id);
    Object.assign(rule, data);
    return this.ruleRepo.save(rule);
  }

  async removeRule(id: number): Promise<void> {
    const rule = await this.findOneRule(id);
    await this.ruleRepo.remove(rule);
  }

  // --- Logs ---
  findLogs(limit = 50): Promise<AutoBuyLog[]> {
    return this.logRepo.find({
      order: { executedAt: 'DESC' },
      take: limit,
    });
  }

  createLog(data: Partial<AutoBuyLog>): Promise<AutoBuyLog> {
    const log = this.logRepo.create(data);
    return this.logRepo.save(log);
  }
}
