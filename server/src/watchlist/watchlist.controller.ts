import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';

@Controller('api/watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  findAll() {
    return this.watchlistService.findAll();
  }

  @Post()
  add(@Body() body: { code: string; name: string; category: string }) {
    return this.watchlistService.add(body);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.watchlistService.remove(code);
  }

  @Post('reorder')
  reorder(@Body() body: { codes: string[] }) {
    return this.watchlistService.reorder(body.codes);
  }
}
