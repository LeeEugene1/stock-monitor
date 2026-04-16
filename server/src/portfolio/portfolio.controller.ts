import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  getOverview(@CurrentUser() user: { sub: number }) {
    return this.portfolioService.getOverview(user.sub);
  }

  @Get('holding/:stockCode')
  getHoldingByCode(
    @Param('stockCode') stockCode: string,
    @CurrentUser() user: { sub: number },
  ) {
    return this.portfolioService.getHoldingByCode(stockCode, user.sub);
  }

  @Get(':accountId')
  getAccountPortfolio(@Param('accountId', ParseIntPipe) accountId: number) {
    return this.portfolioService.getAccountPortfolio(accountId);
  }
}
