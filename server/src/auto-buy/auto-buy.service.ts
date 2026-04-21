import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutoBuyRule } from './entities/auto-buy-rule.entity';
import { AutoBuyLog } from './entities/auto-buy-log.entity';
import { AccountService } from '../account/account.service';
import { KisService } from '../kis/kis.service';
import { KiwoomService } from '../kiwoom/kiwoom.service';

@Injectable()
export class AutoBuyService {
  constructor(
    @InjectRepository(AutoBuyRule)
    private readonly ruleRepo: Repository<AutoBuyRule>,
    @InjectRepository(AutoBuyLog)
    private readonly logRepo: Repository<AutoBuyLog>,
    private readonly accountService: AccountService,
    private readonly kisService: KisService,
    private readonly kiwoomService: KiwoomService,
  ) {}

  async cancelAndRemoveLog(logId: number): Promise<void> {
    const log = await this.logRepo.findOneBy({ id: logId });
    if (!log) throw new NotFoundException(`Log #${logId} not found`);
    if (log.status !== 'pending') {
      throw new BadRequestException(
        `취소 가능한 주문이 아닙니다 (현재 상태: ${log.status})`,
      );
    }

    const account = await this.accountService.findOne(log.accountId);
    try {
      if (account.broker === 'kiwoom') {
        await this.kiwoomService.cancelOrder(
          log.accountId,
          log.orderNo,
          log.stockCode,
        );
      } else {
        await this.kisService.cancelOrder(log.accountId, log.orderNo);
      }
    } catch (err: any) {
      // 장 종료 등으로 취소 실패 시에도 로컬 DB는 정리
      const msg = err?.message || '';
      if (msg.includes('장종료') || msg.includes('장마감')) {
        // 장 종료 후 미체결은 자동 소멸 → 로컬만 정리
      } else {
        throw err;
      }
    }

    await this.logRepo.delete({ id: logId });
  }

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

  findEnabledRules(): Promise<AutoBuyRule[]> {
    return this.ruleRepo.find({ where: { enabled: true } });
  }

  async markExecuted(id: number): Promise<void> {
    await this.ruleRepo.update(id, { lastExecutedAt: new Date() });
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
