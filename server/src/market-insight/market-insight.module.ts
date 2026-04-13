import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketInsight } from './entities/market-insight.entity';
import { MarketInsightController } from './market-insight.controller';
import { MarketInsightService } from './market-insight.service';
import { MarketInsightScheduler } from './market-insight.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([MarketInsight])],
  controllers: [MarketInsightController],
  providers: [MarketInsightService, MarketInsightScheduler],
})
export class MarketInsightModule {}
