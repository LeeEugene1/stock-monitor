import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { KisTokenService } from './kis-token.service';
import { AccountService } from '../account/account.service';
import { Account } from '../account/entities/account.entity';

export interface Holding {
  stockCode: string;
  stockName: string;
  quantity: number;
  avgPrice: number;
  purchaseAmount: number;
  currentPrice: number;
  evalAmount: number;
  profitLossAmount: number;
  profitLossRate: number;
}

export interface OrderResult {
  orderNo: string;
  orderTime: string;
}

export interface AccountSummary {
  accountId: number;
  nickname: string;
  depositBalance: number;
  stockEvalAmount: number;
  totalEvalAmount: number;
  purchaseAmountTotal: number;
  evalAmountTotal: number;
  profitLossTotal: number;
  profitLossRate: number;
}

@Injectable()
export class KisService {
  private readonly logger = new Logger(KisService.name);

  constructor(
    private readonly tokenService: KisTokenService,
    private readonly accountService: AccountService,
  ) {}

  async inquireBalance(accountId: number): Promise<Holding[]> {
    const account = await this.accountService.findOne(accountId);
    // Only product_code 29 (퇴직연금) uses pension API
    // product_code 22 (개인연금저축) uses standard API
    const isPension = account.productCode === '29';

    return isPension
      ? this.fetchPensionBalance(account)
      : this.fetchStandardBalance(account);
  }

  async inquireAccountSummary(accountId: number): Promise<AccountSummary> {
    const account = await this.accountService.findOne(accountId);
    const isPension = account.productCode === '29';

    if (isPension) {
      return this.fetchPensionSummary(account);
    }
    return this.fetchStandardSummary(account);
  }

  // --- Standard balance (product_code 01) ---
  private async fetchStandardBalance(account: Account): Promise<Holding[]> {
    const token = await this.tokenService.getToken(account.id);
    const baseUrl = this.tokenService.getBaseUrl(account.isPaper);
    const trId = account.isPaper ? 'VTTC8434R' : 'TTTC8434R';

    const allHoldings: Holding[] = [];
    let trCont = '';
    let fk100 = '';
    let nk100 = '';

    for (let page = 0; page < 10; page++) {
      const { data } = await axios.get(
        `${baseUrl}/uapi/domestic-stock/v1/trading/inquire-balance`,
        {
          headers: this.buildHeaders(account, token, trId, trCont),
          params: {
            CANO: account.accountNo,
            ACNT_PRDT_CD: account.productCode,
            AFHR_FLPR_YN: 'N',
            OFL_YN: '',
            INQR_DVSN: '02',
            UNPR_DVSN: '01',
            FUND_STTL_ICLD_YN: 'N',
            FNCG_AMT_AUTO_RDPT_YN: 'N',
            PRCS_DVSN: '00',
            CTX_AREA_FK100: fk100,
            CTX_AREA_NK100: nk100,
          },
          timeout: 10000,
        },
      );

      const items = (data.output1 || [])
        .filter((item: any) => Number(item.hldg_qty) > 0)
        .map((item: any) => this.mapHolding(item));
      allHoldings.push(...items);

      trCont = data.tr_cont;
      fk100 = data.ctx_area_fk100 || '';
      nk100 = data.ctx_area_nk100 || '';

      if (trCont !== 'M' && trCont !== 'F') break;
      await this.delay(100);
    }

    return allHoldings;
  }

  private async fetchStandardSummary(
    account: Account,
  ): Promise<AccountSummary> {
    const token = await this.tokenService.getToken(account.id);
    const baseUrl = this.tokenService.getBaseUrl(account.isPaper);
    const trId = account.isPaper ? 'VTTC8434R' : 'TTTC8434R';

    const { data } = await axios.get(
      `${baseUrl}/uapi/domestic-stock/v1/trading/inquire-balance`,
      {
        headers: this.buildHeaders(account, token, trId),
        params: {
          CANO: account.accountNo,
          ACNT_PRDT_CD: account.productCode,
          AFHR_FLPR_YN: 'N',
          OFL_YN: '',
          INQR_DVSN: '02',
          UNPR_DVSN: '01',
          FUND_STTL_ICLD_YN: 'N',
          FNCG_AMT_AUTO_RDPT_YN: 'N',
          PRCS_DVSN: '00',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
        },
        timeout: 10000,
      },
    );

    const summary = Array.isArray(data.output2)
      ? data.output2[0]
      : data.output2;
    const purchaseTotal = this.num(summary?.pchs_amt_smtl_amt);
    const evalTotal = this.num(summary?.evlu_amt_smtl_amt);

    return {
      accountId: account.id,
      nickname: account.nickname,
      depositBalance: this.num(summary?.dnca_tot_amt),
      stockEvalAmount: this.num(summary?.scts_evlu_amt),
      totalEvalAmount: this.num(summary?.tot_evlu_amt),
      purchaseAmountTotal: purchaseTotal,
      evalAmountTotal: evalTotal,
      profitLossTotal: this.num(summary?.evlu_pfls_smtl_amt),
      profitLossRate:
        purchaseTotal > 0
          ? ((evalTotal - purchaseTotal) / purchaseTotal) * 100
          : 0,
    };
  }

  // --- Pension balance (product_code 22, 29) ---
  private async fetchPensionBalance(account: Account): Promise<Holding[]> {
    const token = await this.tokenService.getToken(account.id);
    const baseUrl = this.tokenService.getBaseUrl(account.isPaper);
    const trId = 'TTTC2208R';

    const allHoldings: Holding[] = [];
    let trCont = '';
    let fk100 = '';
    let nk100 = '';

    for (let page = 0; page < 10; page++) {
      const { data } = await axios.get(
        `${baseUrl}/uapi/domestic-stock/v1/trading/pension/inquire-balance`,
        {
          headers: this.buildHeaders(account, token, trId, trCont),
          params: {
            CANO: account.accountNo,
            ACNT_PRDT_CD: account.productCode,
            ACCA_DVSN_CD: '00',
            INQR_DVSN: '00',
            CTX_AREA_FK100: fk100,
            CTX_AREA_NK100: nk100,
          },
          timeout: 10000,
        },
      );

      this.logger.debug(
        `Pension balance response for #${account.id}: rt_cd=${data.rt_cd}, msg=${data.msg1}, output1 count=${data.output1?.length ?? 0}`,
      );

      // KIS API returns rt_cd "1" on error
      if (data.rt_cd === '1') {
        this.logger.error(`KIS API error: ${data.msg1}`);
        return [];
      }

      const items = (data.output1 || [])
        .filter((item: any) => Number(item.hldg_qty) > 0)
        .map((item: any) => this.mapHolding(item));
      allHoldings.push(...items);

      trCont = data.tr_cont;
      fk100 = data.ctx_area_fk100 || '';
      nk100 = data.ctx_area_nk100 || '';

      if (trCont !== 'M' && trCont !== 'F') break;
      await this.delay(100);
    }

    return allHoldings;
  }

  private async fetchPensionSummary(
    account: Account,
  ): Promise<AccountSummary> {
    const token = await this.tokenService.getToken(account.id);
    const baseUrl = this.tokenService.getBaseUrl(account.isPaper);
    const trId = 'TTTC2208R';

    const { data } = await axios.get(
      `${baseUrl}/uapi/domestic-stock/v1/trading/pension/inquire-balance`,
      {
        headers: this.buildHeaders(account, token, trId),
        params: {
          CANO: account.accountNo,
          ACNT_PRDT_CD: account.productCode,
          ACCA_DVSN_CD: '00',
          INQR_DVSN: '00',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
        },
        timeout: 10000,
      },
    );

    this.logger.debug(
      `Pension summary response for #${account.id}: rt_cd=${data.rt_cd}, msg=${data.msg1}, output1=${JSON.stringify(data.output1?.slice(0, 2))}, output2=${JSON.stringify(data.output2)}`,
    );

    if (data.rt_cd === '1') {
      this.logger.error(`KIS API error (pension summary): ${data.msg1}`);
      return {
        accountId: account.id,
        nickname: account.nickname,
        depositBalance: 0,
        stockEvalAmount: 0,
        totalEvalAmount: 0,
        purchaseAmountTotal: 0,
        evalAmountTotal: 0,
        profitLossTotal: 0,
        profitLossRate: 0,
      };
    }

    // pension output2 is a single object
    const summary = Array.isArray(data.output2)
      ? data.output2[0]
      : data.output2;

    // Calculate totals from holdings (output1) for pension
    const holdings = (data.output1 || []).filter(
      (item: any) => Number(item.hldg_qty) > 0,
    );
    let purchaseTotal = 0;
    let evalTotal = 0;
    for (const item of holdings) {
      purchaseTotal += this.num(item.pchs_amt);
      evalTotal += this.num(item.evlu_amt);
    }
    const profitLossTotal = evalTotal - purchaseTotal;

    return {
      accountId: account.id,
      nickname: account.nickname,
      depositBalance: this.num(summary?.dnca_tot_amt),
      stockEvalAmount: this.num(summary?.scts_evlu_amt),
      totalEvalAmount: this.num(summary?.tot_evlu_amt),
      purchaseAmountTotal: purchaseTotal,
      evalAmountTotal: evalTotal,
      profitLossTotal,
      profitLossRate:
        purchaseTotal > 0 ? (profitLossTotal / purchaseTotal) * 100 : 0,
    };
  }

  // --- Order API ---
  async orderCash(
    accountId: number,
    stockCode: string,
    quantity: number,
    price: number,
    ordDvsn: string,
  ): Promise<OrderResult> {
    const account = await this.accountService.findOne(accountId);
    const token = await this.tokenService.getToken(accountId);
    const baseUrl = this.tokenService.getBaseUrl(account.isPaper);
    const trId = account.isPaper ? 'VTTC0012U' : 'TTTC0012U';

    const { data } = await axios.post(
      `${baseUrl}/uapi/domestic-stock/v1/trading/order-cash`,
      {
        CANO: account.accountNo,
        ACNT_PRDT_CD: account.productCode,
        PDNO: stockCode,
        ORD_DVSN: ordDvsn,
        ORD_QTY: String(quantity),
        ORD_UNPR: String(price),
        EXCG_ID_DVSN_CD: 'KRX',
      },
      {
        headers: this.buildHeaders(account, token, trId),
        timeout: 10000,
      },
    );

    const output = data.output || {};
    return {
      orderNo: output.ODNO || '',
      orderTime: output.ORD_TMD || '',
    };
  }

  // --- Helpers ---
  private buildHeaders(
    account: Account,
    token: string,
    trId: string,
    trCont = '',
  ) {
    return {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: account.appKey,
      appsecret: account.appSecret,
      tr_id: trId,
      tr_cont: trCont,
      custtype: 'P',
    };
  }

  private mapHolding(item: any): Holding {
    const purchaseAmount = this.num(item.pchs_amt);
    const evalAmount = this.num(item.evlu_amt);
    const profitLossAmount = this.num(item.evlu_pfls_amt);

    return {
      stockCode: item.pdno,
      stockName: item.prdt_name,
      quantity: this.num(item.hldg_qty),
      avgPrice: this.numFloat(item.pchs_avg_pric),
      purchaseAmount,
      currentPrice: this.num(item.prpr),
      evalAmount,
      profitLossAmount,
      profitLossRate:
        purchaseAmount > 0 ? (profitLossAmount / purchaseAmount) * 100 : 0,
    };
  }

  private num(val: any): number {
    if (!val) return 0;
    return parseInt(String(val).replace(/,/g, ''), 10) || 0;
  }

  private numFloat(val: any): number {
    if (!val) return 0;
    return parseFloat(String(val).replace(/,/g, '')) || 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
