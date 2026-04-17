import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { TokenCache } from './entities/token-cache.entity';
import { AccountService } from '../account/account.service';

const BASE_URL_REAL = 'https://openapi.koreainvestment.com:9443';
const BASE_URL_PAPER = 'https://openapivts.koreainvestment.com:29443';

@Injectable()
export class KisTokenService {
  private readonly logger = new Logger(KisTokenService.name);

  constructor(
    @InjectRepository(TokenCache)
    private readonly tokenRepo: Repository<TokenCache>,
    private readonly accountService: AccountService,
  ) {}

  getBaseUrl(isPaper: boolean): string {
    return isPaper ? BASE_URL_PAPER : BASE_URL_REAL;
  }

  async getToken(accountId: number): Promise<string> {
    const cached = await this.tokenRepo.findOneBy({ accountId });

    if (cached && !this.isExpiringSoon(cached.expiredAt)) {
      return cached.accessToken;
    }

    const account = await this.accountService.findOneInternal(accountId);
    const baseUrl = this.getBaseUrl(account.isPaper);

    try {
      const { data } = await axios.post(
        `${baseUrl}/oauth2/tokenP`,
        {
          grant_type: 'client_credentials',
          appkey: account.appKey,
          appsecret: account.appSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const tokenCache = this.tokenRepo.create({
        accountId,
        accessToken: data.access_token,
        expiredAt: data.access_token_token_expired,
      });
      await this.tokenRepo.save(tokenCache);

      this.logger.log(`Token refreshed for account #${accountId}`);
      return data.access_token;
    } catch (error: any) {
      this.logger.error(
        `Token request failed for account #${accountId}: ${error.message}`,
      );
      throw error;
    }
  }

  private isExpiringSoon(expiredAt: string): boolean {
    const expiry = new Date(expiredAt).getTime();
    const buffer = 60 * 60 * 1000; // 1 hour
    return Date.now() > expiry - buffer;
  }
}
