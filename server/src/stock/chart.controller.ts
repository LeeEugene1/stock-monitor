import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChartService } from './chart.service';

@Controller('api/chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Get(':code')
  async getChartData(
    @Param('code') code: string,
    @Query('period') period: string = '3m',
    @Query('category') category: string = 'stock',
  ) {
    return this.chartService.getChartData(code, period, category);
  }
}
