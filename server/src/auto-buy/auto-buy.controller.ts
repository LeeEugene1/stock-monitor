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
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/auto-buy')
export class AutoBuyController {
  constructor(
    private readonly autoBuyService: AutoBuyService,
    private readonly scheduler: AutoBuyScheduler,
  ) {}

  // --- Rules ---
  @Get('rules')
  findAllRules(@CurrentUser() user: { sub: number }) {
    return this.autoBuyService.findAllRules(user.sub);
  }

  @Get('rules/:id')
  findOneRule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number },
  ) {
    return this.autoBuyService.findOneRule(id, user.sub);
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
    @CurrentUser() user: { sub: number },
  ) {
    return this.autoBuyService.createRule(body, user.sub);
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
    @CurrentUser() user: { sub: number },
  ) {
    return this.autoBuyService.updateRule(id, body, user.sub);
  }

  @Delete('rules/:id')
  removeRule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number },
  ) {
    return this.autoBuyService.removeRule(id, user.sub);
  }

  // --- Manual execute ---
  @Post('rules/:id/execute')
  executeRule(@Param('id', ParseIntPipe) id: number) {
    return this.scheduler.executeRule(id);
  }

  // --- Logs ---
  @Get('logs')
  findLogs(@CurrentUser() user: { sub: number }) {
    return this.autoBuyService.findLogs(user.sub);
  }
}
