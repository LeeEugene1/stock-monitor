import { useState } from 'react';
import type { Account, AccountFormData, Broker } from '../../types/account';
import './Accounts.css';

const BROKERS = [
  { value: 'kis' as Broker, label: '한국투자증권' },
  { value: 'kiwoom' as Broker, label: '키움증권' },
];

const PRODUCT_CODES: Record<Broker, { value: string; label: string }[]> = {
  kis: [
    { value: '01', label: '위탁 (일반매매)' },
    { value: '03', label: '선물옵션' },
    { value: '06', label: 'CMA' },
    { value: '22', label: '개인연금저축' },
    { value: '29', label: '퇴직연금 (DC/IRP)' },
  ],
  kiwoom: [
    { value: '00', label: '위탁 (일반매매)' },
    { value: '01', label: 'ISA' },
    { value: '02', label: '연금저축' },
    { value: '03', label: '퇴직연금 (DC/IRP)' },
  ],
};

const emptyForm: AccountFormData = {
  nickname: '',
  appKey: '',
  appSecret: '',
  accountNo: '',
  productCode: '01',
  broker: 'kis',
  isPaper: false,
};

interface Props {
  account?: Account | null;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<AccountFormData>(
    account
      ? {
          nickname: account.nickname,
          appKey: account.appKey,
          appSecret: account.appSecret,
          accountNo: account.accountNo,
          productCode: account.productCode,
          broker: account.broker || 'kis',
          isPaper: account.isPaper,
        }
      : emptyForm,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nickname || !form.appKey || !form.appSecret || !form.accountNo)
      return;
    onSubmit(form);
  };

  const set = (field: keyof AccountFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleBrokerChange = (broker: Broker) => {
    const codes = PRODUCT_CODES[broker];
    setForm((prev) => ({
      ...prev,
      broker,
      productCode: codes[0].value,
    }));
  };

  const productCodes = PRODUCT_CODES[form.broker];
  const isKis = form.broker === 'kis';

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <h3>{account ? '계좌 수정' : '계좌 추가'}</h3>

      <label>
        <span>증권사</span>
        <select
          value={form.broker}
          onChange={(e) => handleBrokerChange(e.target.value as Broker)}
        >
          {BROKERS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>닉네임</span>
        <input
          type="text"
          value={form.nickname}
          onChange={(e) => set('nickname', e.target.value)}
          placeholder="예: 연금저축, ISA"
          required
        />
      </label>

      <label>
        <span>App Key</span>
        <input
          type="text"
          value={form.appKey}
          onChange={(e) => set('appKey', e.target.value)}
          placeholder={isKis ? 'KIS 앱 키' : '키움 앱 키'}
          required
        />
      </label>

      <label>
        <span>App Secret</span>
        <input
          type="password"
          value={form.appSecret}
          onChange={(e) => set('appSecret', e.target.value)}
          placeholder={isKis ? 'KIS 앱 시크릿' : '키움 앱 시크릿'}
          required
        />
      </label>

      <label>
        <span>계좌번호 (8자리-2자리 또는 8자리)</span>
        <input
          type="text"
          value={form.accountNo}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9-]/g, '');
            if (raw.includes('-')) {
              const [acct, prod] = raw.split('-');
              setForm((prev) => ({
                ...prev,
                accountNo: acct.slice(0, 8),
                productCode:
                  productCodes.find((pc) => pc.value === prod)
                    ? prod
                    : prev.productCode,
              }));
            } else {
              set('accountNo', raw.slice(0, 8));
            }
          }}
          placeholder="12345678-22 또는 12345678"
          maxLength={11}
          required
        />
      </label>

      <label>
        <span>계좌 유형</span>
        <select
          value={form.productCode}
          onChange={(e) => set('productCode', e.target.value)}
        >
          {productCodes.map((pc) => (
            <option key={pc.value} value={pc.value}>
              {pc.label}
            </option>
          ))}
        </select>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={form.isPaper}
          onChange={(e) => set('isPaper', e.target.checked)}
        />
        <span>모의투자</span>
      </label>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {account ? '수정' : '추가'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}
