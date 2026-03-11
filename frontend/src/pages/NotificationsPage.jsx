import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Loading from '../components/Loading';
import { notificationApi } from '../services/hospitoApi';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function destinationFor(notification) {
  if (!notification?.type) return '/notifications';
  if (notification.type.startsWith('APPOINTMENT')) return '/appointments';
  if (notification.type === 'DOCTOR_MESSAGE') return '/messages';
  if (notification.type === 'CONSULTATION_REMINDER') return '/appointments';
  if (notification.type === 'MEDICATION_REMINDER') return '/medications';
  if (notification.type === 'LAB_ORDER') return '/appointments';
  if (notification.type === 'BILLING') return '/profile';
  return '/notifications';
}

function typeBadge(type) {
  const palette = {
    APPOINTMENT_BOOKED: 'bg-blue-50 text-blue-700',
    APPOINTMENT_APPROVED: 'bg-emerald-50 text-emerald-700',
    APPOINTMENT_REJECTED: 'bg-red-50 text-red-700',
    DOCTOR_MESSAGE: 'bg-indigo-50 text-indigo-700',
    CONSULTATION_REMINDER: 'bg-cyan-50 text-cyan-700',
    MEDICATION_REMINDER: 'bg-green-50 text-green-700',
    LAB_ORDER: 'bg-violet-50 text-violet-700',
    BILLING: 'bg-amber-50 text-amber-700',
    SYSTEM: 'bg-slate-100 text-slate-700',
  };
  return palette[type] || 'bg-slate-100 text-slate-700';
}

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationApi.list();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markRead = async (notificationId) => {
    try {
      const updated = await notificationApi.markRead(notificationId);
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? updated : item)));
      window.dispatchEvent(new CustomEvent('hospito-notifications-updated'));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update notification.');
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((item) => !item.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((item) => notificationApi.markRead(item.id)));
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      window.dispatchEvent(new CustomEvent('hospito-notifications-updated'));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to mark all notifications as read.');
    }
  };

  const openNotification = async (item) => {
    if (!item.read) {
      await markRead(item.id);
    }
    navigate(destinationFor(item));
  };

  return (
    <AppLayout>
      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="panel-title">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500">Unread: {unreadCount}</p>
          </div>
          <button className="btn-secondary" type="button" onClick={markAllRead} disabled={!unreadCount}>
            Mark All As Read
          </button>
        </div>

        {loading ? <Loading label="Loading notifications..." /> : null}
        {error ? <p className="error-text mt-3">{error}</p> : null}

        {!loading && notifications.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No notifications yet.
          </p>
        ) : null}

        <div className="space-y-3">
          {notifications.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 shadow-soft ${item.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/50'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeBadge(item.type)}`}>
                  {item.type?.replaceAll('_', ' ') || 'SYSTEM'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{formatDateTime(item.createdAt)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {!item.read ? (
                    <button className="btn-secondary" type="button" onClick={() => markRead(item.id)}>
                      Mark Read
                    </button>
                  ) : null}
                  <button className="btn-primary" type="button" onClick={() => openNotification(item)}>
                    Open
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

