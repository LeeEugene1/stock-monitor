import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { MarketInsight } from './entities/market-insight.entity';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

@Injectable()
export class MarketInsightService {
  private readonly logger = new Logger(MarketInsightService.name);

  constructor(
    @InjectRepository(MarketInsight)
    private readonly insightRepo: Repository<MarketInsight>,
  ) {}

  async getLatest(): Promise<MarketInsight | null> {
    return this.insightRepo.findOne({
      where: {},
      order: { date: 'DESC' },
    });
  }

  async generateInsight(force = false): Promise<MarketInsight> {
    const today = new Date().toISOString().slice(0, 10);

    // Check if already generated today
    const existing = await this.insightRepo.findOneBy({ date: today });
    if (existing && !force) return existing;
    if (existing && force) await this.insightRepo.remove(existing);

    const metrics = await this.fetchMetrics();
    const scores = this.computeScores(metrics);
    const signal = this.getSignal(scores.overall);
    const summary = this.buildSummary(metrics, scores, signal);

    const insight = this.insightRepo.create({
      date: today,
      metrics,
      scores,
      summary,
      signal,
    });

    return this.insightRepo.save(insight);
  }

  private async fetchMetrics() {
    const [nasdaq, sp500, vix, usdKrw, us10y] = await Promise.allSettled([
      this.fetchIndex('.IXIC'),
      this.fetchIndex('.INX'),
      this.fetchIndex('.VIX'),
      this.fetchExchangeRate(),
      this.fetchBondYield(),
    ]);

    return {
      nasdaq: nasdaq.status === 'fulfilled' ? nasdaq.value : this.emptyIndex(),
      sp500: sp500.status === 'fulfilled' ? sp500.value : this.emptyIndex(),
      vix: vix.status === 'fulfilled'
        ? { price: vix.value.price, change: vix.value.change, changeRate: vix.value.changeRate }
        : { price: 0, change: 0, changeRate: 0 },
      usdKrw: usdKrw.status === 'fulfilled'
        ? usdKrw.value
        : { price: 0, change: 0, changeRate: 0 },
      us10y: us10y.status === 'fulfilled'
        ? us10y.value
        : { yield: 0, change: 0, changeRate: 0 },
    };
  }

  private async fetchIndex(reutersCode: string) {
    const { data } = await axios.get(
      `https://api.stock.naver.com/index/${reutersCode}/basic`,
      { headers: HEADERS, timeout: 5000 },
    );

    const infos = data.stockItemTotalInfos || [];
    const getValue = (code: string) => {
      const item = infos.find((i: any) => i.code === code);
      return item ? this.parseNum(item.value) : 0;
    };

    const price = this.parseNum(data.closePrice);
    const change = this.parseNum(data.compareToPreviousClosePrice);
    const isDown = data.compareToPreviousPrice?.name === 'FALLING';

    return {
      price,
      change: isDown ? -Math.abs(change) : change,
      changeRate: this.parseNum(data.fluctuationsRatio) * (isDown ? -1 : 1),
      high52w: getValue('highPriceOf52Weeks'),
      low52w: getValue('lowPriceOf52Weeks'),
    };
  }

  private async fetchExchangeRate() {
    const { data } = await axios.get(
      'https://api.stock.naver.com/marketindex/exchange/FX_USDKRW',
      { headers: HEADERS, timeout: 5000 },
    );

    const ei = data.exchangeInfo || data;
    const price = this.parseNum(ei.closePrice);
    const change = this.parseNum(ei.fluctuations);
    const isDown = ei.fluctuationsType?.code === '5';

    return {
      price,
      change: isDown ? -Math.abs(change) : change,
      changeRate: this.parseNum(ei.fluctuationsRatio) * (isDown ? -1 : 1),
    };
  }

  private async fetchBondYield() {
    const { data } = await axios.get(
      'https://api.stock.naver.com/marketindex/bond/US10YT%3DRR',
      { headers: HEADERS, timeout: 5000 },
    );

    const yieldVal = this.parseNum(data.closePrice);
    const change = this.parseNum(data.fluctuations);
    const isDown = data.fluctuationsType?.code === '5';

    return {
      yield: yieldVal,
      change: isDown ? -Math.abs(change) : change,
      changeRate: this.parseNum(data.fluctuationsRatio) * (isDown ? -1 : 1),
    };
  }

  private computeScores(metrics: any) {
    // Valuation: NASDAQ position within 52-week range
    let valuation = 0;
    if (metrics.nasdaq.high52w > 0 && metrics.nasdaq.low52w > 0) {
      const range = metrics.nasdaq.high52w - metrics.nasdaq.low52w;
      const position = (metrics.nasdaq.price - metrics.nasdaq.low52w) / range;
      // 0.0 = 52주 최저 → +2, 1.0 = 52주 최고 → -2
      valuation = Math.round((1 - position) * 4 - 2);
      valuation = Math.max(-2, Math.min(2, valuation));
    }

    // Rate: US 10Y yield level
    let rate = 0;
    const y = metrics.us10y.yield;
    if (y > 0) {
      if (y >= 5.0) rate = -2;       // 고금리 부담
      else if (y >= 4.5) rate = -1;
      else if (y >= 3.5) rate = 0;   // 중립
      else if (y >= 2.5) rate = 1;
      else rate = 2;                  // 저금리 우호적
    }

    // FX: USD/KRW level
    let fx = 0;
    const fxRate = metrics.usdKrw.price;
    if (fxRate > 0) {
      if (fxRate >= 1450) fx = -2;       // 원화 약세 위험
      else if (fxRate >= 1350) fx = -1;
      else if (fxRate >= 1200) fx = 0;   // 중립
      else if (fxRate >= 1100) fx = 1;
      else fx = 2;                        // 원화 강세
    }

    // Fear: VIX level
    let fear = 0;
    const vixVal = metrics.vix.price;
    if (vixVal > 0) {
      if (vixVal >= 35) fear = -2;       // 극도의 공포
      else if (vixVal >= 25) fear = -1;  // 공포
      else if (vixVal >= 15) fear = 0;   // 중립
      else if (vixVal >= 12) fear = 1;   // 낙관
      else fear = 2;                      // 탐욕
    }

    const overall = Math.round((valuation + rate + fx + fear) / 4);

    return { valuation, rate, fx, fear, overall };
  }

  private getSignal(overall: number): string {
    if (overall >= 1) return 'bullish';
    if (overall <= -1) return 'bearish';
    return 'neutral';
  }

  private buildSummary(
    metrics: any,
    scores: any,
    signal: string,
  ): string {
    const parts: string[] = [];

    // Valuation
    const valLabels: Record<number, string> = {
      '-2': '고평가 구간',
      '-1': '다소 고평가',
      '0': '적정 수준',
      '1': '다소 저평가',
      '2': '저평가 구간',
    };
    parts.push(`미국 테크 ${valLabels[String(scores.valuation) as any] || '적정 수준'}`);

    // Rate
    const y = metrics.us10y.yield;
    if (y > 0) {
      parts.push(`미 10년물 ${y.toFixed(2)}%`);
    }

    // FX
    const fx = metrics.usdKrw.price;
    if (fx > 0) {
      const fxLabel = scores.fx <= -1 ? '(원화 약세 주의)' : scores.fx >= 1 ? '(원화 강세)' : '';
      parts.push(`환율 ${fx.toFixed(0)}원${fxLabel}`);
    }

    // VIX
    const vixVal = metrics.vix.price;
    if (vixVal > 0) {
      const vixLabel = scores.fear <= -1 ? '공포' : scores.fear >= 1 ? '낙관' : '보통';
      parts.push(`VIX ${vixVal.toFixed(1)}(${vixLabel})`);
    }

    const signalKr = signal === 'bullish' ? '긍정적' : signal === 'bearish' ? '부정적' : '중립';
    return `[${signalKr}] ${parts.join(' · ')}`;
  }

  private parseNum(val: any): number {
    if (!val) return 0;
    return parseFloat(String(val).replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
  }

  private emptyIndex() {
    return { price: 0, change: 0, changeRate: 0, high52w: 0, low52w: 0 };
  }
}
