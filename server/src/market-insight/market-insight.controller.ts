import { Controller, Get, Post } from '@nestjs/common';
import { MarketInsightService } from './market-insight.service';

@Controller('api/market-insight')
export class MarketInsightController {
  constructor(private readonly insightService: MarketInsightService) {}

  @Get()
  getLatest() {
    return this.insightService.getLatest();
  }

  // 수동 생성 (force=true로 재생성)
  @Post('generate')
  generate() {
    return this.insightService.generateInsight(true);
  }
}
