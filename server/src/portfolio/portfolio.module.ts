import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { AccountModule } from '../account/account.module';
import { KisModule } from '../kis/kis.module';
import { KiwoomModule } from '../kiwoom/kiwoom.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [AccountModule, KisModule, KiwoomModule, CategoryModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
