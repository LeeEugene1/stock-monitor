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
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

function maskAccount(account: Account) {
  return {
    id: account.id,
    nickname: account.nickname,
    appKey: account.appKey.slice(0, 4) + '****',
    appSecret: '********',
    accountNo: account.accountNo.slice(0, 4) + '****',
    productCode: account.productCode,
    isPaper: account.isPaper,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

@Controller('api/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async findAll(@CurrentUser() user: { sub: number }) {
    const accounts = await this.accountService.findAllByUser(user.sub);
    return accounts.map(maskAccount);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number },
  ) {
    const account = await this.accountService.findOneByUser(id, user.sub);
    return maskAccount(account);
  }

  @Post()
  async create(
    @Body()
    body: {
      nickname: string;
      appKey: string;
      appSecret: string;
      accountNo: string;
      productCode?: string;
      isPaper?: boolean;
    },
    @CurrentUser() user: { sub: number },
  ) {
    const account = await this.accountService.create(body, user.sub);
    return maskAccount(account);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      nickname?: string;
      appKey?: string;
      appSecret?: string;
      accountNo?: string;
      productCode?: string;
      isPaper?: boolean;
    },
    @CurrentUser() user: { sub: number },
  ) {
    const account = await this.accountService.update(id, body, user.sub);
    return maskAccount(account);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number },
  ) {
    return this.accountService.remove(id, user.sub);
  }
}
