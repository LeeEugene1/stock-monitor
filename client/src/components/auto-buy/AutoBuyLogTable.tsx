import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AutoBuyLog, AutoBuyRule } from '../../types/auto-buy';
import type { Account } from '../../types/account';
import { BROKER_LABELS } from '../../constants';
import { detectStrategyFromRule, STRATEGY_LABELS, STRATEGY_COLORS } from '../../utils/strategy';
import './AutoBuy.css';

interface Props {
  logs: AutoBuyLog[];
  accounts?: Account[];
  rules?: AutoBuyRule[];
}

export function AutoBuyLogTable({ logs, accounts = [], rules = [] }: Props) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async (logId: number) => {
      const res = await fetch(`/api/auto-buy/logs/${logId}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '취소 실패');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-buy-logs'] });
    },
    onError: (err: Error) => {
      alert(`취소 실패: ${err.message}`);
    },
  });

  const handleCancel = (logId: number) => {
    if (
      confirm('접수 취소하면 실행이력에서 제거됩니다. 진행하시겠습니까?')
    ) {
      cancelMutation.mutate(logId);
    }
  };

  if (logs.length === 0) {
    return <div className="empty-state">실행 이력이 없습니다</div>;
  }
  const accountMap = new Map(
    accounts.map((a) => [a.id, { nickname: a.nickname, broker: a.broker }]),
  );
  const ruleMap = new Map(rules.map((r) => [r.id, r]));

  return (
    <div className="log-table-wrapper">
      <table className="log-table">
        <thead>
          <tr>
            <th className="left">일시</th>
            <th>전략</th>
            <th className="left">계좌</th>
            <th className="left">종목</th>
            <th>수량</th>
            <th>단가</th>
            <th>상태</th>
            <th className="left">비고</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const acc = accountMap.get(log.accountId);
            const matchedRule = ruleMap.get(log.ruleId);
            const strat = matchedRule ? detectStrategyFromRule(matchedRule) : null;
            return (
              <tr key={log.id}>
                <td className="left">
                  {new Date(log.executedAt).toLocaleString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td>
                  {strat && (
                    <span
                      className="badge-strategy"
                      style={{ color: STRATEGY_COLORS[strat], borderColor: STRATEGY_COLORS[strat] }}
                    >
                      {STRATEGY_LABELS[strat]}
                    </span>
                  )}
                </td>
                <td className="left">
                  <span className="rule-account">
                    {acc?.nickname || `#${log.accountId}`}
                  </span>
                  {acc?.broker && (
                    <span
                      className={`badge-broker badge-broker-${acc.broker}`}
                    >
                      {BROKER_LABELS[acc.broker] || acc.broker}
                    </span>
                  )}
                </td>
                <td className="left">
                  <span className="log-stock">{log.stockName}</span>
                </td>
                <td>{log.ordQty > 0 ? log.ordQty.toLocaleString() : '-'}</td>
                <td>{log.ordUnpr > 0 ? log.ordUnpr.toLocaleString() : '-'}</td>
                <td>
                  <div className="status-cell">
                    <span className={`status-badge ${log.status}`}>
                      {
                        {
                          filled: '체결',
                          pending: '접수',
                          failed: '실패',
                          success: '체결',
                        }[log.status] || log.status
                      }
                    </span>
                    {log.status === 'pending' && (
                      <button
                        className="btn-cancel-log"
                        onClick={() => handleCancel(log.id)}
                        disabled={cancelMutation.isPending}
                        title="주문 취소"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </td>
                <td className="left log-note">
                  {log.status === 'success' || log.status === 'filled'
                    ? `주문번호 ${log.orderNo}`
                    : log.status === 'pending'
                      ? `주문번호 ${log.orderNo}`
                      : log.errorMessage || ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
