export type NotificationType =
  | 'buy_time'
  | 'buy_success'
  | 'buy_failed'
  | 'unfilled_close'
  | 'info';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  ruleId: number | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: AppNotification[];
  unread: number;
}
