import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationListResponse } from '../types/notification';

export function useNotifications() {
  const qc = useQueryClient();

  const query = useQuery<NotificationListResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    items: query.data?.items ?? [],
    unread: query.data?.unread ?? 0,
    loading: query.isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    remove: remove.mutate,
  };
}
