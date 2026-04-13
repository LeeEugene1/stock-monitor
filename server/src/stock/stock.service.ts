import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

  async getStockPrice(code: string): Promise<StockPrice | null> {
    try {
      const url = `https://finance.naver.com/item/main.naver?code=${code}`;
      const { data: html } = await axios.get(url, {
        headers: HEADERS,
        timeout: 5000,
      });

      const $ = cheerio.load(html);

      const name = $('div.wrap_company h2 a').text().trim();
      if (!name) return null;

      const priceText = $('p.no_today span.blind').first().text().trim();
      const price = this.parseNumber(priceText);

      const changeEl = $('p.no_exday em span.blind');
      const change = this.parseNumber(changeEl.first().text().trim());

      const changeRateText = changeEl.eq(1).text().trim();
      const changeRate = changeRateText ? changeRateText : '0.00%';

      const isDown = $('p.no_exday em.no_down').length > 0;
      const isUp = $('p.no_exday em.no_up').length > 0;
      const changeType: StockPrice['changeType'] = isUp
        ? 'up'
        : isDown
          ? 'down'
          : 'none';

      const tableItems = $('table.no_info tbody tr td span.blind');
      const open = this.parseNumber(tableItems.eq(1).text().trim());
      const high = this.parseNumber(tableItems.eq(0).text().trim());
      const low = this.parseNumber(tableItems.eq(2).text().trim());
      const volume = this.parseNumber(tableItems.eq(3).text().trim());

      // 52주 최고/최저
      let high52w = 0;
      let low52w = 0;
      $('th').each((_, el) => {
        const thText = $(el).text().replace(/\s/g, '');
        if (thText.includes('52주')) {
          const td = $(el).next('td');
          const ems = td.find('em');
          if (ems.length >= 2) {
            high52w = this.parseNumber(ems.eq(0).text().trim());
            low52w = this.parseNumber(ems.eq(1).text().trim());
          }
        }
      });

      return {
        code,
        name,
        price,
        change: isDown ? -change : change,
        changeRate: isDown ? `-${changeRate}` : changeRate,
        changeType,
        volume,
        high,
        low,
        open,
        high52w,
        low52w,
        updatedAt: new Date().toISOString(),
        category: 'stock',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch stock price for ${code}`, error);
      return null;
    }
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
    return Number.parseFloat(text.replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
  }
}
