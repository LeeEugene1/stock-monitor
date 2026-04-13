import type { Account } from '../../types/account';
import './Accounts.css';

const PRODUCT_LABELS: Record<string, string> = {
  '01': '위탁',
  '03': '선물옵션',
  '06': 'CMA',
  '22': '연금저축',
  '29': '퇴직연금',
  '00': '위탁',
  '02': '연금저축',
};

const BROKER_LABELS: Record<string, string> = {
  kis: '한투',
  kiwoom: '키움',
};

interface Props {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: number) => void;
}

export function AccountList({ accounts, onEdit, onDelete }: Props) {
  if (accounts.length === 0) {
    return <div className="empty-state">등록된 계좌가 없습니다</div>;
  }

  return (
    <div className="account-list">
      {accounts.map((account) => (
        <div key={account.id} className="account-item">
          <div className="account-info">
            <div className="account-nickname">{account.nickname}</div>
            <div className="account-meta">
              <span className="badge-broker">
                {BROKER_LABELS[account.broker] || '한투'}
              </span>
              <span className="account-type">
                {PRODUCT_LABELS[account.productCode] || account.productCode}
              </span>
              <span className="account-no">
                {account.accountNo.slice(0, 4)}-****
              </span>
              {account.isPaper && <span className="badge-paper">모의</span>}
            </div>
          </div>
          <div className="account-actions">
            <button className="btn-small" onClick={() => onEdit(account)}>
              수정
            </button>
            <button
              className="btn-small btn-danger"
              onClick={() => onDelete(account.id)}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
