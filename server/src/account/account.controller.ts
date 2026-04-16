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

function maskAccount(account: Account) {
  return {
    id: account.id,
    nickname: account.nickname,
    appKey: account.appKey.slice(0, 4) + '****',
    appSecret: '********',
    accountNo: account.accountNo.slice(0, 4) + '****',
    productCode: account.productCode,
    broker: account.broker || 'kis',
    isPaper: account.isPaper,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

interface AccountBody {
  nickname?: string;
  appKey?: string;
  appSecret?: string;
  accountNo?: string;
  productCode?: string;
  broker?: string;
  isPaper?: boolean;
}

@Controller('api/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async findAll() {
    const accounts = await this.accountService.findAll();
    return accounts.map(maskAccount);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const account = await this.accountService.findOne(id);
    return maskAccount(account);
  }

  @Post()
  async create(@Body() body: AccountBody) {
    const account = await this.accountService.create(body);
    return maskAccount(account);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AccountBody,
  ) {
    const account = await this.accountService.update(id, body);
    return maskAccount(account);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.accountService.remove(id);
  }
}
