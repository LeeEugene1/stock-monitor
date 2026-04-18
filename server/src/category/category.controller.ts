import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Put(':stockCode')
  setCategory(
    @Param('stockCode') stockCode: string,
    @Body() body: { category: string },
  ) {
    return this.categoryService.setCategory(stockCode, body.category);
  }
}
