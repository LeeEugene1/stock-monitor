import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AccountModule } from './account/account.module';
import { KisModule } from './kis/kis.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AutoBuyModule } from './auto-buy/auto-buy.module';
import { MarketInsightModule } from './market-insight/market-insight.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    AccountModule,
    KisModule,
    PortfolioModule,
    AutoBuyModule,
    MarketInsightModule,
    WatchlistModule,
    StockModule,
  ],
})
export class AppModule {}
