import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarketInsightService } from './market-insight.service';

@Injectable()
export class MarketInsightScheduler implements OnModuleInit {
  private readonly logger = new Logger(MarketInsightScheduler.name);

  constructor(private readonly insightService: MarketInsightService) {}

  // 서버 시작 시 오늘 인사이트가 없으면 자동 생성
  async onModuleInit() {
    const latest = await this.insightService.getLatest();
    const today = new Date().toISOString().slice(0, 10);
    if (!latest || latest.date !== today) {
      this.logger.log('No insight for today, generating...');
      try {
        await this.insightService.generateInsight();
      } catch (err: any) {
        this.logger.error(`Init insight failed: ${err.message}`);
      }
    }
  }

  // 매일 08:00 KST — 시장 인사이트 생성
  @Cron('0 0 8 * * *', { timeZone: 'Asia/Seoul' })
  async generateDailyInsight() {
    this.logger.log('Generating daily market insight...');
    try {
      const insight = await this.insightService.generateInsight();
      this.logger.log(`Market insight generated: ${insight.summary}`);
    } catch (error: any) {
      this.logger.error(`Failed to generate insight: ${error.message}`);
    }
  }
}
