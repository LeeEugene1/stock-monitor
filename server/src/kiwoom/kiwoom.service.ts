import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { KiwoomTokenService } from './kiwoom-token.service';
import { AccountService } from '../account/account.service';
import { Holding, AccountSummary } from '../kis/kis.service';

@Injectable()
export class KiwoomService {
  private readonly logger = new Logger(KiwoomService.name);

  constructor(
    private readonly tokenService: KiwoomTokenService,
    private readonly accountService: AccountService,
  ) {}

  /**
   * 계좌평가잔고내역요청 (kt00018)
   */
  /**
   * 잔고 + 요약을 한 번의 API 호출로 반환
   */
  async inquireBalanceAndSummary(
    accountId: number,
  ): Promise<{ holdings: Holding[]; summary: AccountSummary }> {
    const account = await this.accountService.findOne(accountId);
    const data = await this.callBalanceApi(accountId);

    const holdings = this.parseHoldings(data);
    const summary = this.parseSummary(data, accountId, account.nickname);

    return { holdings, summary };
  }

  async inquireBalance(accountId: number): Promise<Holding[]> {
    const data = await this.callBalanceApi(accountId);
    return this.parseHoldings(data);
  }

  async inquireAccountSummary(accountId: number): Promise<AccountSummary> {
    const account = await this.accountService.findOne(accountId);
    const data = await this.callBalanceApi(accountId);
    return this.parseSummary(data, accountId, account.nickname);
  }

  private parseHoldings(data: any): Holding[] {
    const items = data?.acnt_evlt_remn_indv_tot || [];
    return items.map((item: any): Holding => {
      const quantity = this.toNumber(item.rmnd_qty);
      const avgPrice = this.toNumber(item.pur_pric);
      const purchaseAmount = quantity * avgPrice;
      const currentPrice = this.toNumber(item.pred_close_pric);
      const evalAmount = quantity * currentPrice;
      const profitLossAmount = this.toNumber(item.evltv_prft);
      const profitLossRate = this.toFloat(item.prft_rt);
      return {
        stockCode: item.stk_cd || '',
        stockName: item.stk_nm || '',
        quantity,
        avgPrice,
        purchaseAmount,
        currentPrice,
        evalAmount,
        profitLossAmount,
        profitLossRate,
      };
    });
  }

  private parseSummary(
    data: any,
    accountId: number,
    nickname: string,
  ): AccountSummary {
    const purchaseAmountTotal = this.toNumber(data?.tot_pur_amt);
    const evalAmountTotal = this.toNumber(data?.tot_evlt_amt);
    const profitLossTotal = this.toNumber(data?.tot_evlt_pl);
    const profitLossRate = this.toFloat(data?.tot_prft_rt);
    const totalEvalAmount = this.toNumber(data?.prsm_dpst_aset_amt);
    const depositBalance = Math.max(0, totalEvalAmount - evalAmountTotal);

    return {
      accountId,
      nickname,
      depositBalance,
      stockEvalAmount: evalAmountTotal,
      totalEvalAmount,
      purchaseAmountTotal,
      evalAmountTotal,
      profitLossTotal,
      profitLossRate,
    };
  }

  private async callBalanceApi(accountId: number): Promise<any> {
    const account = await this.accountService.findOne(accountId);
    const token = await this.tokenService.getToken(accountId);
    const baseUrl = this.tokenService.getBaseUrl(account.isPaper);

    try {
      const { data } = await axios.post(
        `${baseUrl}/api/dostk/acnt`,
        {
          qry_tp: '1', // 1=합산
          dmst_stex_tp: 'KRX',
        },
        {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            authorization: `Bearer ${token}`,
            'api-id': 'kt00018',
          },
          timeout: 10000,
        },
      );
      return data;
    } catch (error: any) {
      this.logger.error(
        `Kiwoom balance failed for account #${accountId}: ${error?.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw error;
    }
  }

  private toNumber(v: any): number {
    if (v == null) return 0;
    return parseInt(String(v).replace(/,/g, ''), 10) || 0;
  }

  private toFloat(v: any): number {
    if (v == null) return 0;
    return parseFloat(String(v).replace(/,/g, '')) || 0;
  }
}
