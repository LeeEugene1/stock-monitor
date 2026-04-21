import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoBuyRule } from './entities/auto-buy-rule.entity';
import { AutoBuyLog } from './entities/auto-buy-log.entity';
import { AutoBuyController } from './auto-buy.controller';
import { AutoBuyService } from './auto-buy.service';
import { AutoBuyScheduler } from './auto-buy.scheduler';
import { AccountModule } from '../account/account.module';
import { KisModule } from '../kis/kis.module';
import { KiwoomModule } from '../kiwoom/kiwoom.module';
import { StockModule } from '../stock/stock.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutoBuyRule, AutoBuyLog]),
    AccountModule,
    KisModule,
    KiwoomModule,
    StockModule,
    NotificationModule,
  ],
  controllers: [AutoBuyController],
  providers: [AutoBuyService, AutoBuyScheduler],
})
export class AutoBuyModule {}
