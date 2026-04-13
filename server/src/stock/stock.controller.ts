import { Controller, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { StockService } from './stock.service';

@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('search')
  async search(@Req() req: Request) {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.stockService.searchStock(query.trim());
  }

  @Get(':code')
  async getStock(@Param('code') code: string) {
    return this.stockService.getStockPrice(code);
  }
}

@Controller('api/index')
export class IndexController {
  constructor(private readonly stockService: StockService) {}

  @Get(':reutersCode')
  async getIndex(@Param('reutersCode') reutersCode: string) {
    return this.stockService.getIndexPrice(reutersCode);
  }
}
