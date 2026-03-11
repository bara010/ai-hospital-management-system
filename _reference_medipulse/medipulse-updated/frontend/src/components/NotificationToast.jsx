import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notifications as notifApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  MEDICINE_REMINDER:        { icon: '💊', color: '#7c3aed', bg: '#f5f3ff', label: 'Medicine Reminder',    route: '/adherence' },
  MOOD_CHECK:               { icon: '😊', color: '#2563eb', bg: '#eff6ff', label: 'Mood Check',           route: '/mood' },
  MOOD_ALERT:               { icon: '⚠️', color: '#dc2626', bg: '#fef2f2', label: 'Mood Alert',           route: '/mood' },
  MOOD_RESPONSE:            { icon: '💙', color: '#0ea5e9', bg: '#f0f9ff', label: 'Mood Response',        route: '/mood' },
  APPOINTMENT_REMINDER:     { icon: '📅', color: '#d97706', bg: '#fffbeb', label: 'Appointment Reminder', route: '/appointments' },
  HEALTH_TIP:               { icon: '🏥', color: '#059669', bg: '#f0fdf4', label: 'Health Tip',           route: '/' },
  READMISSION:              { icon: '⚕️', color: '#dc2626', bg: '#fef2f2', label: 'Readmission Risk',     route: '/my-patients' },
  NOSHOW:                   { icon: '📅', color: '#d97706', bg: '#fffbeb', label: 'No-Show Risk',         route: '/appointments' },
  LAB_ALERT:                { icon: '🧪', color: '#b91c1c', bg: '#fef2f2', label: 'Lab Alert',            route: '/' },
  STOCK:                    { icon: '📦', color: '#059669', bg: '#f0fdf4', label: 'Stock Alert',          route: '/pharmacy' },
  ONLINE_CONSULT_REQUEST:   { icon: '🟢', color: '#059669', bg: '#f0fdf4', label: 'Consult Request',     route: '/online-doctor' },
  ONLINE_CONSULT_ACCEPTED:  { icon: '✅', color: '#059669', bg: '#f0fdf4', label: 'Doctor Joined',        route: '/online-doctor' },
  ONLINE_CONSULT_MESSAGE:   { icon: '💬', color: '#2563eb', bg: '#eff6ff', label: 'Consult Message',     route: '/online-doctor' },
  ONLINE_CONSULT_ENDED:     { icon: '🏁', color: '#6b7280', bg: '#f8fafd', label: 'Consult Ended',       route: '/online-doctor' },
};

// ─── Single toast card (Zomato-style) ────────────────────────────────────────
function Toast({ notif, onDismiss, onAction }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = TYPE_CONFIG[notif.type] || { icon: '🔔', color: '#6b7280', bg: '#f8fafd', label: 'Notification', route: '/' };

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    // progress bar countdown
    const start = Date.now();
    const duration = 6000;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      if (elapsed >= duration) { clearInterval(tick); dismiss(); }
    }, 50);
    return () => clearInterval(tick);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(notif.id), 350);
  };

  return (
    <div
      onClick={() => { onAction(notif, cfg.route); dismiss(); }}
      style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(380px) scale(0.95)',
        opacity: leaving ? 0 : 1,
        transition: leaving ? 'all 0.3s cubic-bezier(0.4,0,1,1)' : 'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        position: 'relative',
        borderLeft: `4px solid ${cfg.color}`,
      }}
    >
      {/* Main content */}
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start' }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: cfg.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>
          {cfg.icon}
        </div>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, marginBottom: 2, letterSpacing: '0.3px' }}>
            {notif.title || cfg.label}
          </div>
          <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {notif.message}
          </div>
          <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 4, fontWeight: 500 }}>
            Tap to view →
          </div>
        </div>
        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: '0 0 0 4px', lineHeight: 1, flexShrink: 0 }}
        >
          ✕
        </button>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: '#f3f4f6' }}>
        <div style={{
          height: '100%', background: cfg.color,
          width: `${progress}%`,
          transition: 'width 0.05s linear',
          borderRadius: '0 0 0 0',
        }} />
      </div>
    </div>
  );
}

// ─── Toast container (renders all toasts) ────────────────────────────────────
function ToastContainer({ toasts, onDismiss, onAction }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column-reverse', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <Toast notif={t} onDismiss={onDismiss} onAction={onAction} />
        </div>
      ))}
    </div>
  );
}

// ─── Main hook: use this in Layout ───────────────────────────────────────────
export function useNotificationToasts({ userId, role }) {
  const [toasts, setToasts]   = useState([]);
  const seenIds               = useRef(new Set());
  const navigate              = useNavigate();

  const load = useCallback(async () => {
    try {
      let res;
      if (role === 'PATIENT' && userId) {
        res = await notifApi.getUnreadForPatient(userId);
      } else if (role === 'DOCTOR' || role === 'ADMIN' || role === 'NURSE') {
        res = await notifApi.getDoctorUnread();
      } else {
        return;
      }
      const data = res.data || [];
      const newOnes = data.filter(n => !seenIds.current.has(n.id));
      newOnes.forEach(n => {
        seenIds.current.add(n.id);
        setToasts(prev => [...prev.slice(-4), n]); // max 5 at once
        // also mark read in background after 6s
        setTimeout(() => notifApi.markRead(n.id).catch(() => {}), 6200);
      });
    } catch { /* ignore */ }
  }, [userId, role]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // poll every 8s
    return () => clearInterval(interval);
  }, [load]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAction = useCallback((notif, route) => {
    navigate(route);
  }, [navigate]);

  return { toasts, dismiss, handleAction };
}

// ─── Default export: the full toast system to embed in Layout ─────────────────
export default function NotificationToastSystem({ userId, role }) {
  const { toasts, dismiss, handleAction } = useNotificationToasts({ userId, role });
  if (toasts.length === 0) return null;
  return <ToastContainer toasts={toasts} onDismiss={dismiss} onAction={handleAction} />;
}
