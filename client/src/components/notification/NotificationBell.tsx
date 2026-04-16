import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { AppNotification } from '../../types/notification';
import './Notification.css';

const TYPE_ICONS: Record<string, string> = {
  buy_time: '⏰',
  buy_success: '✅',
  buy_failed: '❌',
  unfilled_close: '⚠️',
  info: 'ℹ️',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { items, unread, markRead, markAllRead, remove } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = (n: AppNotification) => {
    if (!n.readAt) markRead(n.id);
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="notif-bell"
        onClick={() => setOpen((v) => !v)}
        aria-label="알림"
      >
        🔔
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <h4>알림</h4>
            {unread > 0 && (
              <button className="notif-link" onClick={() => markAllRead()}>
                모두 읽음
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="notif-empty">새 알림이 없습니다</div>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`notif-item ${n.readAt ? 'read' : 'unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-icon">{TYPE_ICONS[n.type] || '•'}</span>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  <button
                    className="notif-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(n.id);
                    }}
                    aria-label="삭제"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
