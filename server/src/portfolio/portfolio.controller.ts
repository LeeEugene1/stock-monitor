import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('api/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  getOverview() {
    return this.portfolioService.getOverview();
  }

  @Get('holding/:stockCode')
  getHoldingByCode(@Param('stockCode') stockCode: string) {
    return this.portfolioService.getHoldingByCode(stockCode);
  }

  @Get(':accountId')
  getAccountPortfolio(@Param('accountId', ParseIntPipe) accountId: number) {
    return this.portfolioService.getAccountPortfolio(accountId);
  }
}
