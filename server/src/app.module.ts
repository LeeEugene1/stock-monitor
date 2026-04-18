import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AccountModule } from './account/account.module';
import { KisModule } from './kis/kis.module';
import { KiwoomModule } from './kiwoom/kiwoom.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AutoBuyModule } from './auto-buy/auto-buy.module';
import { MarketInsightModule } from './market-insight/market-insight.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { StockModule } from './stock/stock.module';
import { NotificationModule } from './notification/notification.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    AccountModule,
    KisModule,
    KiwoomModule,
    PortfolioModule,
    AutoBuyModule,
    MarketInsightModule,
    WatchlistModule,
    StockModule,
    NotificationModule,
    CategoryModule,
  ],
})
export class AppModule {}
