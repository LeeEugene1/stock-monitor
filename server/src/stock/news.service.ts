import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface NewsItem {
  id: string;
  office: string;
  title: string;
  body: string;
  datetime: string;
  imageUrl: string | null;
  url: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  async getStockNews(
    code: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<NewsItem[]> {
    try {
      const url = `https://m.stock.naver.com/api/news/stock/${code}?pageSize=${pageSize}&page=${page}`;
      const { data } = await axios.get(url, {
        headers: HEADERS,
        timeout: 5000,
      });

      const results: NewsItem[] = [];
      const groups = Array.isArray(data) ? data : [];

      for (const group of groups) {
        const items = group?.items || [];
        for (const item of items) {
          results.push({
            id: item.id,
            office: item.officeName,
            title: this.decodeHtml(item.title || ''),
            body: this.decodeHtml(item.body || ''),
            datetime: this.parseDatetime(item.datetime),
            imageUrl: item.imageOriginLink || null,
            url: item.mobileNewsUrl || '',
          });
        }
      }

      return results;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch news for ${code}: ${error?.message}`,
      );
      return [];
    }
  }

  private parseDatetime(yyyymmddhhmm: string): string {
    if (!yyyymmddhhmm || yyyymmddhhmm.length < 12) return '';
    const y = yyyymmddhhmm.slice(0, 4);
    const mo = yyyymmddhhmm.slice(4, 6);
    const d = yyyymmddhhmm.slice(6, 8);
    const h = yyyymmddhhmm.slice(8, 10);
    const mi = yyyymmddhhmm.slice(10, 12);
    return `${y}-${mo}-${d}T${h}:${mi}:00+09:00`;
  }

  private decodeHtml(text: string): string {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}
