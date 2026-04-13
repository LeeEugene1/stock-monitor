import type { AutoBuyLog } from '../../types/auto-buy';
import './AutoBuy.css';

interface Props {
  logs: AutoBuyLog[];
}

export function AutoBuyLogTable({ logs }: Props) {
  if (logs.length === 0) {
    return <div className="empty-state">실행 이력이 없습니다</div>;
  }

  return (
    <div className="log-table-wrapper">
      <table className="log-table">
        <thead>
          <tr>
            <th className="left">일시</th>
            <th className="left">종목</th>
            <th>수량</th>
            <th>단가</th>
            <th>상태</th>
            <th className="left">비고</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="left">
                {new Date(log.executedAt).toLocaleString('ko-KR', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="left">
                <span className="log-stock">{log.stockName}</span>
              </td>
              <td>{log.ordQty > 0 ? log.ordQty.toLocaleString() : '-'}</td>
              <td>{log.ordUnpr > 0 ? log.ordUnpr.toLocaleString() : '-'}</td>
              <td>
                <span className={`status-badge ${log.status}`}>
                  {log.status === 'success' ? '성공' : '실패'}
                </span>
              </td>
              <td className="left log-note">
                {log.status === 'success'
                  ? `주문번호 ${log.orderNo}`
                  : log.errorMessage || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
