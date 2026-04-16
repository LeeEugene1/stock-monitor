import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { TokenCache } from '../kis/entities/token-cache.entity';
import { AccountService } from '../account/account.service';

const BASE_URL_REAL = 'https://api.kiwoom.com';
const BASE_URL_PAPER = 'https://mockapi.kiwoom.com';

@Injectable()
export class KiwoomTokenService {
  private readonly logger = new Logger(KiwoomTokenService.name);

  constructor(
    @InjectRepository(TokenCache)
    private readonly tokenRepo: Repository<TokenCache>,
    private readonly accountService: AccountService,
  ) {}

  getBaseUrl(isPaper: boolean): string {
    return isPaper ? BASE_URL_PAPER : BASE_URL_REAL;
  }

  async getToken(accountId: number): Promise<string> {
    // KIS와 토큰 캐시 테이블을 공유하므로 broker 구분 위해 prefix 사용
    const cacheKey = -accountId; // 키움은 음수로 구분
    const cached = await this.tokenRepo.findOneBy({ accountId: cacheKey });

    if (cached && !this.isExpiringSoon(cached.expiredAt)) {
      return cached.accessToken;
    }

    const account = await this.accountService.findOne(accountId);
    const baseUrl = this.getBaseUrl(account.isPaper);

    try {
      const { data } = await axios.post(
        `${baseUrl}/oauth2/token`,
        {
          grant_type: 'client_credentials',
          appkey: account.appKey,
          secretkey: account.appSecret,
        },
        {
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          timeout: 10000,
        },
      );

      this.logger.log(
        `Kiwoom token response: ${JSON.stringify(data).slice(0, 300)}`,
      );

      const accessToken = data.token || data.access_token;
      if (!accessToken) {
        throw new Error(
          `Kiwoom token missing in response: ${JSON.stringify(data)}`,
        );
      }

      // expires_dt: "20241107083713" → ISO
      const expiredAt = this.parseKiwoomDate(data.expires_dt);

      const tokenCache = cached
        ? Object.assign(cached, { accessToken, expiredAt })
        : this.tokenRepo.create({
            accountId: cacheKey,
            accessToken,
            expiredAt,
          });
      await this.tokenRepo.save(tokenCache);

      this.logger.log(`Kiwoom token refreshed for account #${accountId}`);
      return accessToken;
    } catch (error: any) {
      this.logger.error(
        `Kiwoom token request failed for account #${accountId}: ${error?.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw error;
    }
  }

  private parseKiwoomDate(yyyymmddhhmmss: string): string {
    // "20241107083713" → "2024-11-07T08:37:13"
    if (!yyyymmddhhmmss || yyyymmddhhmmss.length < 14) {
      return new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    }
    const y = yyyymmddhhmmss.slice(0, 4);
    const mo = yyyymmddhhmmss.slice(4, 6);
    const d = yyyymmddhhmmss.slice(6, 8);
    const h = yyyymmddhhmmss.slice(8, 10);
    const mi = yyyymmddhhmmss.slice(10, 12);
    const s = yyyymmddhhmmss.slice(12, 14);
    return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
  }

  private isExpiringSoon(expiredAt: string): boolean {
    const expiry = new Date(expiredAt).getTime();
    const buffer = 60 * 60 * 1000;
    return Date.now() > expiry - buffer;
  }
}
