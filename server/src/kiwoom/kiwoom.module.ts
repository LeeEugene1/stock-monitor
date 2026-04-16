import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenCache } from '../kis/entities/token-cache.entity';
import { KiwoomTokenService } from './kiwoom-token.service';
import { KiwoomService } from './kiwoom.service';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [TypeOrmModule.forFeature([TokenCache]), AccountModule],
  providers: [KiwoomTokenService, KiwoomService],
  exports: [KiwoomService, KiwoomTokenService],
})
export class KiwoomModule {}
