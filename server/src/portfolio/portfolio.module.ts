import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { AccountModule } from '../account/account.module';
import { KisModule } from '../kis/kis.module';

@Module({
  imports: [AccountModule, KisModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
