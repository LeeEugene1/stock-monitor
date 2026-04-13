import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenCache } from './entities/token-cache.entity';
import { KisTokenService } from './kis-token.service';
import { KisService } from './kis.service';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [TypeOrmModule.forFeature([TokenCache]), AccountModule],
  providers: [KisTokenService, KisService],
  exports: [KisTokenService, KisService],
})
export class KisModule {}
