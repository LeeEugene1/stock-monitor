import { Controller, Get, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('api/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get(':code')
  async getNews(
    @Param('code') code: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.newsService.getStockNews(
      code,
      parseInt(page, 10) || 1,
      parseInt(pageSize, 10) || 10,
    );
  }
}
