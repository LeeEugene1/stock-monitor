import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

@Injectable()
export class ChartService {
  private readonly logger = new Logger(ChartService.name);

  async getChartData(
    code: string,
    period: string,
    category: string,
  ): Promise<ChartDataPoint[]> {
    try {
      const endDate = this.formatDate(new Date());
      const startDate = this.getStartDate(period);

      const url =
        category === 'index'
          ? `https://api.stock.naver.com/chart/foreign/index/${code}/day?startDateTime=${startDate}&endDateTime=${endDate}`
          : `https://api.stock.naver.com/chart/domestic/item/${code}/day?startDateTime=${startDate}&endDateTime=${endDate}`;

      const { data } = await axios.get(url, {
        headers: HEADERS,
        timeout: 10000,
      });

      const items = Array.isArray(data) ? data : [];

      return items
        .map((item: any) => ({
          date: this.toIsoDate(item.localDate),
          open: item.openPrice,
          high: item.highPrice,
          low: item.lowPrice,
          close: item.closePrice,
          volume: item.accumulatedTradingVolume || 0,
        }))
        .sort(
          (a: ChartDataPoint, b: ChartDataPoint) =>
            a.date.localeCompare(b.date),
        );
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch chart data for ${code}: ${error?.message}`,
      );
      return [];
    }
  }

  private getStartDate(period: string): string {
    const now = new Date();
    switch (period) {
      case '1m':
        now.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        now.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        now.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        now.setMonth(now.getMonth() - 3);
    }
    return this.formatDate(now);
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private toIsoDate(yyyymmdd: string): string {
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
  }
}
