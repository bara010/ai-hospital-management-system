import React, { useState, useEffect, useRef } from 'react';
import { notifications as notifApi } from '../services/api';

const TYPE_CONFIG = {
  MEDICINE_REMINDER:    { icon: '💊', label: 'Medicine Reminder',    color: '#8e44ad', bg: '#f9f0ff' },
  MOOD_CHECK:           { icon: '😊', label: 'Mood Check',           color: '#2980b9', bg: '#eaf4fd' },
  MOOD_ALERT:           { icon: '⚠️', label: 'Mood Alert',           color: '#e74c3c', bg: '#fdf2f2' },
  MOOD_RESPONSE:        { icon: '💙', label: 'Mood Response',        color: '#2980b9', bg: '#eaf4fd' },
  APPOINTMENT_REMINDER: { icon: '📅', label: 'Appointment Reminder', color: '#e67e22', bg: '#fdf6ec' },
  HEALTH_TIP:           { icon: '🏥', label: 'Health Tip',           color: '#27ae60', bg: '#f0fdf4' },
  READMISSION:          { icon: '🏥', label: 'Readmission Risk',     color: '#e74c3c', bg: '#fdf2f2' },
  NOSHOW:               { icon: '📅', label: 'No-Show Risk',         color: '#e67e22', bg: '#fdf6ec' },
  LAB_ALERT:            { icon: '🧪', label: 'Lab Alert',            color: '#c0392b', bg: '#fdf2f2' },
  STOCK:                { icon: '💊', label: 'Stock Alert',          color: '#27ae60', bg: '#f0fdf4' },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

// Show a real browser push notification
function showBrowserNotif(title, message, type) {
  if (Notification.permission !== 'granted') return;
  try {
    const cfg = TYPE_CONFIG[type] || {};
    const n = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: type + '-' + Date.now(),
      requireInteraction: type === 'MOOD_CHECK' || type === 'LAB_ALERT',
    });
    setTimeout(() => n.close(), 10000);
    n.onclick = () => {
      window.focus();
      window.location.href = type === 'MOOD_CHECK' ? '/mood' : '/notifications';
      n.close();
    };
  } catch (e) {
    console.warn('[Notif]', e);
  }
}

// Request permission and return whether it was granted
async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export default function NotificationBell({ patientId, onCountChange }) {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const seenIds = useRef(new Set());
  const ref = useRef(null);
  const isFirstLoad = useRef(true);

  // Ask for permission on mount
  useEffect(() => {
    requestPermission().then(granted => {
      setPermissionGranted(granted);
      if (granted) {
        // Show a welcome notification so user knows it's working
        showBrowserNotif('🏥 MediPulse', 'Push notifications are now enabled!', 'HEALTH_TIP');
      }
    });
  }, []);

  const load = async () => {
    try {
      const res = patientId
        ? await notifApi.getUnreadForPatient(patientId)
        : await notifApi.getUnread();
      const data = res.data || [];

      // Find truly NEW notifications (not seen before)
      const newOnes = data.filter(n => !seenIds.current.has(n.id));

      if (!isFirstLoad.current && newOnes.length > 0) {
        // Show browser push for each new notification
        newOnes.forEach(n => {
          const cfg = TYPE_CONFIG[n.type] || {};
          showBrowserNotif(
            n.title || cfg.label || '🔔 Notification',
            n.message || '',
            n.type
          );
        });
      }

      // Mark all current IDs as seen
      data.forEach(n => seenIds.current.add(n.id));
      isFirstLoad.current = false;

      setNotifs(data);
      if (onCountChange) onCountChange(data.length);
    } catch (e) {}
  };

  useEffect(() => {
    load();
    // Poll every 10 seconds for new notifications
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markRead = async (id) => { await notifApi.markRead(id); load(); };
  const markAll = async () => {
    patientId
      ? await notifApi.markAllReadForPatient(patientId)
      : await notifApi.markAllRead();
    load();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        title={permissionGranted ? 'Notifications enabled' : 'Click to enable notifications'}
        style={{
          background: notifs.length > 0 ? '#f0f7ff' : '#f8fafd',
          border: `1px solid ${notifs.length > 0 ? '#d0e8ff' : '#e2e8f0'}`,
          cursor: 'pointer',
          fontSize: '18px',
          position: 'relative',
          padding: '8px 10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
      >
        {notifs.length > 0 ? '🔔' : '🔕'}
        {!permissionGranted && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#f59e0b', color: 'white', borderRadius: '50%',
            width: '14px', height: '14px', fontSize: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white', fontWeight: '800',
          }}>!</span>
        )}
        {permissionGranted && notifs.length > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ef4444', color: 'white', borderRadius: '50%',
            minWidth: '18px', height: '18px', fontSize: '10px',
            fontWeight: '700', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '2px solid white',
          }}>
            {notifs.length > 99 ? '99+' : notifs.length}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '48px', width: '380px',
          background: 'white', borderRadius: '18px',
          boxShadow: '0 16px 50px rgba(0,0,0,0.15)', zIndex: 9999,
          maxHeight: '480px', overflowY: 'auto',
          border: '1px solid #f0f4f8', fontFamily: "'Outfit',system-ui,sans-serif",
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #f0f4f8',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, background: 'white', borderRadius: '18px 18px 0 0',
          }}>
            <strong style={{ fontSize: '14px', color: '#1a202c' }}>
              🔔 Notifications
              {notifs.length > 0 && (
                <span style={{
                  background: '#ef4444', color: 'white', borderRadius: '10px',
                  padding: '1px 8px', fontSize: '11px', marginLeft: '6px', fontWeight: '700',
                }}>{notifs.length}</span>
              )}
            </strong>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!permissionGranted && (
                <button
                  onClick={async () => {
                    const granted = await requestPermission();
                    setPermissionGranted(granted);
                  }}
                  style={{
                    fontSize: '11px', color: 'white', background: '#f59e0b',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    padding: '4px 8px', fontWeight: '700',
                  }}
                >
                  Enable Push
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={markAll} style={{
                  fontSize: '12px', color: '#1b6ca8', border: 'none',
                  background: 'none', cursor: 'pointer', fontWeight: '600',
                }}>
                  ✓ Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Permission warning */}
          {!permissionGranted && (
            <div style={{
              padding: '10px 16px', background: '#fffbeb',
              borderBottom: '1px solid #fde68a', fontSize: '12px', color: '#92400e',
            }}>
              ⚠️ Push notifications are <strong>blocked</strong>. Click <strong>Enable Push</strong> to receive alerts.
            </div>
          )}

          {/* Notification list */}
          {notifs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              ✅ All caught up!
            </div>
          ) : notifs.map(n => {
            const cfg = TYPE_CONFIG[n.type] || { icon: '🔔', color: '#718096', bg: '#f8fafd' };
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid #f0f4f8',
                  background: cfg.bg, borderLeft: `3px solid ${cfg.color}`, cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', color: cfg.color, letterSpacing: '0.3px' }}>{n.title}</div>
                    <div style={{ fontSize: '12.5px', color: '#374151', marginTop: '3px', lineHeight: '1.5' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{timeAgo(n.createdAt)} · tap to dismiss</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
