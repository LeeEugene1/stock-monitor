import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface StockPrice {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: string;
  changeType: 'up' | 'down' | 'none';
  volume: number;
  high: number;
  low: number;
  open: number;
  high52w: number;
  low52w: number;
  updatedAt: string;
  category: 'stock' | 'index';
}

export interface StockSearchResult {
  code: string;
  name: string;
  market: string;
  category: 'stock' | 'index';
  reutersCode?: string;
}

export interface SubscribeItem {
  code: string;
  category: 'stock' | 'index';
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private readonly stockDetailsCache = new Map<
    string,
    { fetchedAt: number; infos: Array<{ code: string; value: string }> }
  >();
  private readonly stockDetailsInFlight = new Map<
    string,
    Promise<Array<{ code: string; value: string }>>
  >();
  private readonly stockDetailsCacheTtlMs = 60_000;

  async getStockPrice(code: string): Promise<StockPrice | null> {
    return this.getNaverStockPrice(code);
  }

  private async getNaverStockPrice(code: string): Promise<StockPrice | null> {
    try {
      const url = `https://m.stock.naver.com/api/stock/${code}/basic`;
      const { data } = await axios.get<any>(url, {
        headers: { ...HEADERS, Referer: 'https://m.stock.naver.com/' },
        timeout: 5000,
      });

      if (!data?.stockName || !data?.closePrice) return null;

      const infos = await this.getStockDetails(code);
      const getInfo = (key: string) =>
        this.parseNumber(infos.find((item) => item.code === key)?.value || '');

      const compareCode = data.compareToPreviousPrice?.name;
      const rawChange = this.parseFloat(data.compareToPreviousClosePrice);
      const change =
        compareCode === 'FALLING'
          ? -Math.abs(rawChange)
          : compareCode === 'RISING'
            ? Math.abs(rawChange)
            : rawChange;
      const changeRateValue = this.parseFloat(data.fluctuationsRatio);

      return {
        code,
        name: data.stockName,
        price: this.parseNumber(data.closePrice),
        change,
        changeRate: `${changeRateValue.toFixed(2)}%`,
        changeType:
          compareCode === 'RISING'
            ? 'up'
            : compareCode === 'FALLING'
              ? 'down'
              : 'none',
        volume: getInfo('accumulatedTradingVolume'),
        high: getInfo('highPrice'),
        low: getInfo('lowPrice'),
        open: getInfo('openPrice'),
        high52w:
          getInfo('highPriceOf52WeeksAdjusted') ||
          getInfo('highPriceOf52Weeks'),
        low52w:
          getInfo('lowPriceOf52WeeksAdjusted') || getInfo('lowPriceOf52Weeks'),
        updatedAt: new Date().toISOString(),
        category: 'stock',
      };
    } catch (error) {
      this.logger.error(`NAVER stock API failed for ${code}`, error);
      return null;
    }
  }

  private async getStockDetails(
    code: string,
  ): Promise<Array<{ code: string; value: string }>> {
    const cached = this.stockDetailsCache.get(code);
    if (cached && Date.now() - cached.fetchedAt < this.stockDetailsCacheTtlMs) {
      return cached.infos;
    }

    const inFlight = this.stockDetailsInFlight.get(code);
    if (inFlight) return inFlight;

    const detailsUrl = `https://m.stock.naver.com/api/stock/${code}/integration`;
    const request = axios
      .get<any>(detailsUrl, {
        headers: { ...HEADERS, Referer: 'https://m.stock.naver.com/' },
        timeout: 5000,
      })
      .then(({ data }) => {
        const infos: Array<{ code: string; value: string }> =
          data?.totalInfos || [];
        this.stockDetailsCache.set(code, { fetchedAt: Date.now(), infos });
        return infos;
      })
      .catch(() => {
        this.logger.warn(
          `NAVER stock details API failed for ${code}; using cached empty details`,
        );
        const infos: Array<{ code: string; value: string }> = [];
        this.stockDetailsCache.set(code, { fetchedAt: Date.now(), infos });
        return infos;
      })
      .finally(() => this.stockDetailsInFlight.delete(code));

    this.stockDetailsInFlight.set(code, request);
    return request;
  }

  async getIndexPrice(reutersCode: string): Promise<StockPrice | null> {
    try {
      const url = `https://api.stock.naver.com/index/${reutersCode}/basic`;
      const { data } = await axios.get(url, {
        headers: HEADERS,
        timeout: 5000,
      });

      const name = data.indexName;
      if (!name) return null;

      const price = this.parseFloat(data.closePrice);
      const change = this.parseFloat(data.compareToPreviousClosePrice);
      const changeRate = data.fluctuationsRatio || '0.00';

      const compareCode = data.compareToPreviousPrice?.name;
      const changeType: StockPrice['changeType'] =
        compareCode === 'RISING'
          ? 'up'
          : compareCode === 'FALLING'
            ? 'down'
            : 'none';

      const infos = data.stockItemTotalInfos || [];
      const getValue = (code: string) => {
        const item = infos.find((i: any) => i.code === code);
        return item ? this.parseFloat(item.value) : 0;
      };

      return {
        code: reutersCode,
        name,
        price,
        change: changeType === 'down' ? -change : change,
        changeRate:
          changeType === 'down' ? `-${changeRate}%` : `${changeRate}%`,
        changeType,
        volume: getValue('accumulatedTradingVolume'),
        high: getValue('highPrice'),
        low: getValue('lowPrice'),
        open: getValue('openPrice'),
        high52w: getValue('highPriceOf52Weeks'),
        low52w: getValue('lowPriceOf52Weeks'),
        updatedAt: new Date().toISOString(),
        category: 'index',
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch index price for ${reutersCode} - ${error?.message}`,
      );
      return null;
    }
  }

  async searchStock(keyword: string): Promise<StockSearchResult[]> {
    try {
      const [stockRes, indexRes] = await Promise.allSettled([
        axios.get(
          `https://ac.stock.naver.com/ac?q=${encodeURIComponent(keyword)}&target=stock`,
          { headers: HEADERS, timeout: 5000 },
        ),
        axios.get(
          `https://ac.stock.naver.com/ac?q=${encodeURIComponent(keyword)}&target=index`,
          { headers: HEADERS, timeout: 5000 },
        ),
      ]);

      const results: StockSearchResult[] = [];

      if (stockRes.status === 'fulfilled') {
        const items = stockRes.value.data?.items || [];
        items
          .filter((item: any) => item.nationCode === 'KOR')
          .forEach((item: any) => {
            results.push({
              code: item.code,
              name: item.name,
              market: item.typeName || '',
              category: 'stock',
            });
          });
      }

      if (indexRes.status === 'fulfilled') {
        const items = indexRes.value.data?.items || [];
        items.forEach((item: any) => {
          results.push({
            code: item.reutersCode || item.code,
            name: item.name,
            market: item.typeName || '',
            category: 'index',
            reutersCode: item.reutersCode,
          });
        });
      }

      return results;
    } catch (error: any) {
      this.logger.error(
        `Failed to search stock: ${keyword} - ${error?.message}`,
      );
      return [];
    }
  }

  async getMultiplePrices(items: SubscribeItem[]): Promise<StockPrice[]> {
    const results = await Promise.allSettled(
      items.map((item) =>
        item.category === 'index'
          ? this.getIndexPrice(item.code)
          : this.getStockPrice(item.code),
      ),
    );
    return results
      .filter(
        (r): r is PromiseFulfilledResult<StockPrice> =>
          r.status === 'fulfilled' && r.value !== null,
      )
      .map((r) => r.value);
  }

  private parseNumber(text: string): number {
    return parseInt(text.replace(/,/g, ''), 10) || 0;
  }

  private parseFloat(text: string): number {
    if (!text) return 0;
    return (
      Number.parseFloat(text.replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0
    );
  }
}
