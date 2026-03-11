import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notifications as notifApi } from '../services/api';

// Test push notification directly in browser
async function testBrowserPush(title, message) {
  if (Notification.permission !== 'granted') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      alert('Please allow notifications in your browser to receive push alerts!');
      return;
    }
  }
  const n = new Notification(title, {
    body: message,
    icon: '/favicon.ico',
    requireInteraction: false,
  });
  setTimeout(() => n.close(), 8000);
}

const TYPE_CONFIG = {
  MEDICINE_REMINDER:    { icon:'💊', label:'Medicine',      color:'#6c63ff', bg:'#f5f3ff' },
  MOOD_CHECK:           { icon:'😊', label:'Mood Check',    color:'#3b82f6', bg:'#eff6ff' },
  MOOD_ALERT:           { icon:'⚠️', label:'Mood Alert',    color:'#ef4444', bg:'#fef2f2' },
  MOOD_RESPONSE:        { icon:'💙', label:'Mood Response', color:'#0ea5e9', bg:'#f0f9ff' },
  APPOINTMENT_REMINDER: { icon:'📅', label:'Appointment',   color:'#f59e0b', bg:'#fffbeb' },
  HEALTH_TIP:           { icon:'🏥', label:'Health Tip',    color:'#10b981', bg:'#f0fdf4' },
  READMISSION:          { icon:'⚕️', label:'Readmission Risk', color:'#ef4444', bg:'#fef2f2' },
  NOSHOW:               { icon:'📅', label:'No-Show Risk',  color:'#f59e0b', bg:'#fffbeb' },
  LAB_ALERT:            { icon:'🧪', label:'Lab Alert',     color:'#dc2626', bg:'#fef2f2' },
  STOCK:                { icon:'📦', label:'Stock Alert',   color:'#10b981', bg:'#f0fdf4' },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = user?.role==='PATIENT' ? await notifApi.getForPatient(user.id) : await notifApi.getAll();
      setNotifs(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const types = [...new Set(notifs.map(n => n.type))];
  const filtered = filter==='ALL' ? notifs : notifs.filter(n => n.type===filter);
  const unread = notifs.filter(n => !n.read).length;

  const markRead = async (id) => { await notifApi.markRead(id); load(); };
  const markAll = async () => { user?.role==='PATIENT' ? await notifApi.markAllReadForPatient(user.id) : await notifApi.markAllRead(); load(); };
  const del = async (id) => { await notifApi.delete(id); load(); };

  return (
    <div style={{ maxWidth:'900px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:'22px', color:'#1a202c', fontWeight:'800' }}>AI Notifications</h2>
          <p style={{ margin:0, color:'#94a3b8', fontSize:'13px' }}>
            {unread > 0 ? <><span style={{ color:'#ef4444', fontWeight:'700' }}>{unread} unread</span> — stay up to date with your health</> : '✅ All caught up! You have no unread notifications.'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} style={{ padding:'10px 20px', background:'linear-gradient(135deg,#0f4c75,#1b6ca8)', color:'white', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'600', fontSize:'13px', whiteSpace:'nowrap' }}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* 🔔 Test Push Notification Panel */}
      <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'14px', padding:'16px 20px', marginBottom:'24px' }}>
        <div style={{ fontSize:'13px', fontWeight:'700', color:'#0369a1', marginBottom:'10px' }}>🔔 Test Push Notifications</div>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          <button onClick={() => testBrowserPush('💊 Medicine Reminder', 'Time to take your Metformin 500mg!')}
            style={{ padding:'8px 14px', background:'#8e44ad', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>
            Test Medicine 💊
          </button>
          <button onClick={() => testBrowserPush('😊 Mood Check', 'How are you feeling today? Tap to let your doctor know!')}
            style={{ padding:'8px 14px', background:'#2980b9', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>
            Test Mood Check 😊
          </button>
          <button onClick={() => testBrowserPush('📅 Appointment Reminder', 'You have an appointment with Dr. Smith tomorrow at 10:00 AM!')}
            style={{ padding:'8px 14px', background:'#e67e22', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>
            Test Appointment 📅
          </button>
          <button onClick={async () => {
            if (user?.id) {
              await notifApi.testMood({ patientId: user.id, patientName: user.name || 'Patient' });
              setTimeout(load, 1000);
            }
          }}
            style={{ padding:'8px 14px', background:'#27ae60', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>
            Send to DB + Bell 🔔
          </button>
        </div>
        <p style={{ margin:'8px 0 0', fontSize:'11px', color:'#0369a1' }}>
          ⚠️ If you don't see browser popups, make sure to <strong>Allow</strong> notifications when your browser asks.
        </p>
      </div>

      {/* Type summary grid */}
      {notifs.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'10px', marginBottom:'24px' }}>
          {Object.entries(TYPE_CONFIG).filter(([t]) => notifs.some(n => n.type===t)).map(([type, cfg]) => {
            const count = notifs.filter(n => n.type===type).length;
            const active = filter===type;
            return (
              <div key={type} onClick={() => setFilter(active?'ALL':type)}
                style={{ padding:'14px 12px', borderRadius:'14px', cursor:'pointer', textAlign:'center', border:`1.5px solid ${active?cfg.color:'#f0f4f8'}`, background:active?cfg.bg:'white', transition:'all 0.2s', boxShadow:active?`0 4px 16px ${cfg.color}25`:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:'22px', marginBottom:'6px' }}>{cfg.icon}</div>
                <div style={{ fontWeight:'800', fontSize:'20px', color:active?cfg.color:'#1a202c' }}>{count}</div>
                <div style={{ fontSize:'10.5px', color:active?cfg.color:'#94a3b8', fontWeight:'600', marginTop:'2px' }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter chips */}
      {types.length > 0 && (
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
          <button onClick={() => setFilter('ALL')} style={{ padding:'6px 16px', borderRadius:'20px', border:'none', cursor:'pointer', background:filter==='ALL'?'linear-gradient(135deg,#0f4c75,#1b6ca8)':'#f0f4f8', color:filter==='ALL'?'white':'#4a5568', fontWeight:'600', fontSize:'12.5px', transition:'all 0.2s' }}>
            All ({notifs.length})
          </button>
          {types.map(type => { const cfg = TYPE_CONFIG[type]||{}; return (
            <button key={type} onClick={() => setFilter(filter===type?'ALL':type)}
              style={{ padding:'6px 14px', borderRadius:'20px', border:`1.5px solid ${filter===type?cfg.color:'#e2e8f0'}`, cursor:'pointer', background:filter===type?cfg.color:'white', color:filter===type?'white':cfg.color||'#4a5568', fontWeight:'600', fontSize:'12.5px', transition:'all 0.2s' }}>
              {cfg.icon} {cfg.label}
            </button>
          );})}
        </div>
      )}

      {/* Notifications list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'80px', color:'#94a3b8', background:'white', borderRadius:'18px', border:'1px solid #f0f4f8' }}>
          <div style={{ fontSize:'36px', marginBottom:'12px' }}>⟳</div>
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 40px', background:'white', borderRadius:'18px', border:'1px solid #f0f4f8' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>🔔</div>
          <div style={{ fontWeight:'700', fontSize:'17px', color:'#1a202c', marginBottom:'8px' }}>No notifications here</div>
          <div style={{ color:'#94a3b8', fontSize:'14px' }}>
            {filter==='ALL' ? "You're all caught up! Notifications will appear here." : `No ${TYPE_CONFIG[filter]?.label||filter} notifications yet.`}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type]||{ icon:'🔔', color:'#718096', bg:'#f8fafd', label:'Notification' };
            return (
              <div key={n.id} style={{ padding:'18px 20px', borderRadius:'16px', background:n.read?'white':'#fffbfe', border:`1px solid ${n.read?'#f0f4f8':'#e9d8fd'}`, borderLeft:`4px solid ${cfg.color}`, display:'flex', gap:'14px', alignItems:'flex-start', transition:'all 0.2s', boxShadow:n.read?'0 1px 4px rgba(0,0,0,0.04)':'0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{cfg.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:cfg.color, background:cfg.bg, padding:'3px 8px', borderRadius:'20px', letterSpacing:'0.5px' }}>{n.title||cfg.label}</span>
                    {!n.read && <span style={{ fontSize:'10px', fontWeight:'700', color:'white', background:'#ef4444', padding:'2px 7px', borderRadius:'20px' }}>NEW</span>}
                    <span style={{ fontSize:'11px', color:'#94a3b8', marginLeft:'auto' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ margin:0, fontSize:'13.5px', color:'#374151', lineHeight:'1.6' }}>{n.message}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} style={{ padding:'5px 12px', background:'linear-gradient(135deg,#0f4c75,#1b6ca8)', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'11px', fontWeight:'600', whiteSpace:'nowrap' }}>✓ Read</button>
                  )}
                  <button onClick={() => del(n.id)} style={{ padding:'5px 12px', background:'#f8fafd', color:'#94a3b8', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'11px', fontWeight:'600' }}>✕ Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
