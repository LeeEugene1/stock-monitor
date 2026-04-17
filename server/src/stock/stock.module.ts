import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StockController, IndexController } from './stock.controller';
import { StockService } from './stock.service';
import { StockGateway } from './stock.gateway';
import { ChartController } from './chart.controller';
import { ChartService } from './chart.service';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [AuthModule],
  controllers: [StockController, IndexController, ChartController, NewsController],
  providers: [StockService, StockGateway, ChartService, NewsService],
  exports: [StockService],
})
export class StockModule {}
