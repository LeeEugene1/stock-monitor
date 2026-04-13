import type { Holding } from '../../types/portfolio';
import './Portfolio.css';

interface Props {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: Props) {
  if (holdings.length === 0) {
    return <div className="empty-state">보유 종목이 없습니다</div>;
  }

  return (
    <div className="holdings-table-wrapper">
      <table className="holdings-table">
        <thead>
          <tr>
            <th className="left">종목명</th>
            <th>수량</th>
            <th>매입가</th>
            <th>현재가</th>
            <th>평가금액</th>
            <th>손익</th>
            <th>수익률</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const plClass =
              h.profitLossAmount > 0
                ? 'profit'
                : h.profitLossAmount < 0
                  ? 'loss'
                  : '';
            return (
              <tr key={h.stockCode}>
                <td className="left">
                  <div className="stock-info">
                    <span className="name">{h.stockName}</span>
                    <span className="code">{h.stockCode}</span>
                  </div>
                </td>
                <td>{h.quantity.toLocaleString()}</td>
                <td>{h.avgPrice.toLocaleString()}</td>
                <td>{h.currentPrice.toLocaleString()}</td>
                <td>{h.evalAmount.toLocaleString()}</td>
                <td className={plClass}>
                  {h.profitLossAmount > 0 ? '+' : ''}
                  {h.profitLossAmount.toLocaleString()}
                </td>
                <td className={plClass}>{h.profitLossRate.toFixed(2)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
