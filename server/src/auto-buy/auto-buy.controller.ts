import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AutoBuyService } from './auto-buy.service';
import { AutoBuyScheduler } from './auto-buy.scheduler';

@Controller('api/auto-buy')
export class AutoBuyController {
  constructor(
    private readonly autoBuyService: AutoBuyService,
    private readonly scheduler: AutoBuyScheduler,
  ) {}

  // --- Rules ---
  @Get('rules')
  findAllRules() {
    return this.autoBuyService.findAllRules();
  }

  @Get('rules/:id')
  findOneRule(@Param('id', ParseIntPipe) id: number) {
    return this.autoBuyService.findOneRule(id);
  }

  @Post('rules')
  createRule(
    @Body()
    body: {
      accountId: number;
      stockCode: string;
      stockName: string;
      buyDay: number;
      buyAmount: number;
      ordDvsn?: string;
    },
  ) {
    return this.autoBuyService.createRule(body);
  }

  @Put('rules/:id')
  updateRule(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      accountId?: number;
      stockCode?: string;
      stockName?: string;
      buyDay?: number;
      buyAmount?: number;
      ordDvsn?: string;
      enabled?: boolean;
    },
  ) {
    return this.autoBuyService.updateRule(id, body);
  }

  @Delete('rules/:id')
  removeRule(@Param('id', ParseIntPipe) id: number) {
    return this.autoBuyService.removeRule(id);
  }

  // --- Manual execute ---
  @Post('rules/:id/execute')
  executeRule(@Param('id', ParseIntPipe) id: number) {
    return this.scheduler.executeRule(id);
  }

  // --- Logs ---
  @Get('logs')
  findLogs() {
    return this.autoBuyService.findLogs();
  }
}
