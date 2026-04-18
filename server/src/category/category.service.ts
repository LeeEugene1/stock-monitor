import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { StockCategory } from './entities/stock-category.entity';
import { NAVER_HEADERS } from '../common/naver-http';

const DEFAULT_CATEGORY = '기타';
const SCRAPE_CONCURRENCY = 5;

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(StockCategory)
    private readonly repo: Repository<StockCategory>,
  ) {}

  findAll(): Promise<StockCategory[]> {
    return this.repo.find();
  }

  async resolveCategoriesBatch(
    stockCodes: string[],
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (stockCodes.length === 0) return result;

    const existing = await this.repo.find({
      where: { stockCode: In(stockCodes) },
    });
    const existingMap = new Map(existing.map((e) => [e.stockCode, e]));

    const toFetch: string[] = [];
    for (const code of stockCodes) {
      const rec = existingMap.get(code);
      if (rec?.category) result.set(code, rec.category);
      else if (rec?.autoSector) result.set(code, rec.autoSector);
      else toFetch.push(code);
    }

    if (toFetch.length === 0) return result;

    const fetched = await this.scrapeSectorsLimited(toFetch);
    const toSave: Partial<StockCategory>[] = [];
    for (const { code, sector } of fetched) {
      result.set(code, sector || DEFAULT_CATEGORY);
      toSave.push({ stockCode: code, autoSector: sector, category: null });
    }
    if (toSave.length > 0) await this.repo.save(toSave);

    return result;
  }

  async setCategory(
    stockCode: string,
    category: string,
  ): Promise<StockCategory> {
    const existing = await this.repo.findOneBy({ stockCode });
    if (existing) {
      existing.category = category;
      return this.repo.save(existing);
    }
    return this.repo.save({ stockCode, category, autoSector: null });
  }

  private async scrapeSectorsLimited(
    codes: string[],
  ): Promise<{ code: string; sector: string | null }[]> {
    const results: { code: string; sector: string | null }[] = [];
    for (let i = 0; i < codes.length; i += SCRAPE_CONCURRENCY) {
      const batch = codes.slice(i, i + SCRAPE_CONCURRENCY);
      const settled = await Promise.allSettled(
        batch.map(async (code) => ({
          code,
          sector: await this.fetchSector(code),
        })),
      );
      for (const s of settled) {
        if (s.status === 'fulfilled') results.push(s.value);
      }
    }
    return results;
  }

  private async fetchSector(stockCode: string): Promise<string | null> {
    try {
      const { data: html } = await axios.get(
        `https://finance.naver.com/item/main.naver?code=${stockCode}`,
        { headers: NAVER_HEADERS, timeout: 5000 },
      );
      const $ = cheerio.load(html);
      // 우선순위 1: 구체 셀렉터
      const direct = $('div.wrap_company .description a').first().text().trim();
      if (direct) return direct;
      // 우선순위 2: 정규식 fallback
      const m = html.match(/업종[^<]*<[^>]*>([^<]+)/);
      return m ? m[1].trim() : null;
    } catch (err: any) {
      this.logger.warn(
        `Failed to fetch sector for ${stockCode}: ${err.message}`,
      );
      return null;
    }
  }
}
