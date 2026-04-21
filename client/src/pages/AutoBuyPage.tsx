import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AutoBuyRuleList } from '../components/auto-buy/AutoBuyRuleList';
import { AutoBuyRuleForm } from '../components/auto-buy/AutoBuyRuleForm';
import { AutoBuyLogTable } from '../components/auto-buy/AutoBuyLogTable';
import type { Account } from '../types/account';
import type {
  AutoBuyRule,
  AutoBuyRuleFormData,
  AutoBuyLog,
} from '../types/auto-buy';
import '../components/auto-buy/AutoBuy.css';
import '../components/accounts/Accounts.css';

async function fetchRules(): Promise<AutoBuyRule[]> {
  const res = await fetch('/api/auto-buy/rules');
  if (!res.ok) throw new Error('Failed to fetch rules');
  return res.json();
}

async function fetchLogs(): Promise<AutoBuyLog[]> {
  const res = await fetch('/api/auto-buy/logs');
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch('/api/accounts');
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export function AutoBuyPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AutoBuyRule | null>(null);

  const { data: rules = [] } = useQuery({
    queryKey: ['auto-buy-rules'],
    queryFn: fetchRules,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['auto-buy-logs'],
    queryFn: fetchLogs,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['auto-buy-rules'] });
    queryClient.invalidateQueries({ queryKey: ['auto-buy-logs'] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: AutoBuyRuleFormData) => {
      const res = await fetch('/api/auto-buy/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create rule');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AutoBuyRuleFormData & { enabled: boolean }>;
    }) => {
      const res = await fetch(`/api/auto-buy/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/auto-buy/rules/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete rule');
    },
    onSuccess: invalidate,
  });

  const executeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/auto-buy/rules/${id}/execute`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to execute rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-buy-logs'] });
    },
  });

  const handleSubmit = (data: AutoBuyRuleFormData) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('이 규칙을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id: number, enabled: boolean) => {
    updateMutation.mutate({ id, data: { enabled } });
  };

  const handleExecute = (id: number) => {
    if (confirm('이 규칙을 지금 실행하시겠습니까?')) {
      executeMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  const formOpen = (showForm || editing !== null) && accounts.length > 0;

  return (
    <div>
      <div className="page-header">
        <h2>자동매수</h2>
        {accounts.length > 0 && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + 규칙 추가
          </button>
        )}
      </div>

      {accounts.length === 0 && (
        <div className="empty-state">
          계좌를 먼저 등록해 주세요.
        </div>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div
            className="modal-content modal-form"
            onClick={(e) => e.stopPropagation()}
          >
            <AutoBuyRuleForm
              accounts={accounts}
              rule={editing}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}

      <AutoBuyRuleList
        rules={rules}
        accounts={accounts}
        onEdit={(rule) => {
          setEditing(rule);
          setShowForm(false);
        }}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onExecute={handleExecute}
      />

      {logs.length > 0 && (
        <>
          <h3 className="section-title">실행 이력</h3>
          <AutoBuyLogTable logs={logs} accounts={accounts} rules={rules} />
        </>
      )}
    </div>
  );
}
