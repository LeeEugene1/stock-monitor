import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountList } from '../components/accounts/AccountList';
import { AccountForm } from '../components/accounts/AccountForm';
import type { Account, AccountFormData } from '../types/account';
import { apiFetch } from '../utils/api';
import '../components/accounts/Accounts.css';

const API = '/api/accounts';

async function fetchAccounts(): Promise<Account[]> {
  const res = await apiFetch(API);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export function AccountsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const createMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const res = await apiFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create account');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: AccountFormData;
    }) => {
      const res = await apiFetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update account');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleSubmit = (data: AccountFormData) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('이 계좌를 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  if (isLoading) return <div className="loading-text">로딩 중...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>계좌 관리</h2>
        {!showForm && !editing && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + 계좌 추가
          </button>
        )}
      </div>

      {(showForm || editing) && (
        <AccountForm
          account={editing}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      <AccountList
        accounts={accounts}
        onEdit={(account) => {
          setEditing(account);
          setShowForm(false);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
