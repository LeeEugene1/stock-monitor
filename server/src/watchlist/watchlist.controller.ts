import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: number }) {
    return this.watchlistService.findAll(user.sub);
  }

  @Post()
  add(
    @Body() body: { code: string; name: string; category: string },
    @CurrentUser() user: { sub: number },
  ) {
    return this.watchlistService.add(body, user.sub);
  }

  @Delete(':code')
  remove(
    @Param('code') code: string,
    @CurrentUser() user: { sub: number },
  ) {
    return this.watchlistService.remove(code, user.sub);
  }

  @Post('reorder')
  reorder(
    @Body() body: { codes: string[] },
    @CurrentUser() user: { sub: number },
  ) {
    return this.watchlistService.reorder(body.codes, user.sub);
  }
}
