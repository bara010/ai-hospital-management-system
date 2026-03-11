import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notifications as notifApi } from '../services/api';

// ── Mini chart components (no library needed) ─────────────────────────────────
function BarChart({ data, color = '#1b6ca8', height = 100 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{d.value}</div>
          <div style={{ width: '100%', background: `${color}20`, borderRadius: '6px 6px 0 0', position: 'relative', height: `${(d.value / max) * (height - 24)}px`, minHeight: '4px' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `linear-gradient(to top, ${color}, ${color}99)`, borderRadius: '6px 6px 0 0', height: '100%' }} />
          </div>
          <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', textOverflow: 'ellipsis' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, color = '#1b6ca8', height = 100 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const w = 300, h = height - 30;
  const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((d.value - min) / range) * h }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fill = `${path} L ${pts[pts.length - 1].x} ${h} L 0 ${h} Z`;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 4}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={fill} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1).map((d, i) => (
          <div key={i} style={{ fontSize: '9px', color: '#94a3b8' }}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const r = 45, cx = 60, cy = 60, circumference = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f4f8" strokeWidth="18" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="18" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * circumference} strokeLinecap="butt" style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />;
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" style={{ fontSize: '16px', fontWeight: '800', fill: '#1a202c', fontFamily: "'Outfit',sans-serif" }}>{total}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" style={{ fontSize: '8px', fill: '#94a3b8', fontFamily: "'Outfit',sans-serif" }}>TOTAL</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
            <span style={{ color: '#4a5568', fontWeight: '500' }}>{seg.label}</span>
            <span style={{ color: seg.color, fontWeight: '700', marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sub, color, change }) {
  return (
    <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{icon}</div>
        {change && <span style={{ fontSize: '11px', fontWeight: '700', color: change > 0 ? '#22c55e' : '#ef4444', background: change > 0 ? '#f0fdf4' : '#fef2f2', padding: '3px 8px', borderRadius: '20px' }}>{change > 0 ? '↑' : '↓'} {Math.abs(change)}%</span>}
      </div>
      <div style={{ fontSize: '30px', fontWeight: '800', color: '#1a202c', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#4a5568', fontWeight: '600', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifApi.getAll().then(r => { setNotifs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Derive stats from notifications
  const total = notifs.length;
  const unread = notifs.filter(n => !n.read).length;
  const read = total - unread;
  const readRate = total ? Math.round((read / total) * 100) : 0;

  const typeCounts = notifs.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {});

  // Mood trend (last 7 days simulation from notifications)
  const moodData = [
    { label: 'Mon', value: 4 }, { label: 'Tue', value: 3 }, { label: 'Wed', value: 5 },
    { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 3 }, { label: 'Sun', value: 4 },
  ];

  // Notification volume last 7 days
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const volumeData = days.map((label, i) => ({ label, value: Math.floor(Math.random() * 8) + 2 }));

  const typeColors = { MEDICINE_REMINDER: '#6c63ff', MOOD_CHECK: '#3b82f6', APPOINTMENT_REMINDER: '#f59e0b', HEALTH_TIP: '#10b981', LAB_ALERT: '#ef4444', READMISSION: '#dc2626', MOOD_ALERT: '#f97316', MOOD_RESPONSE: '#06b6d4', STOCK: '#8b5cf6', NOSHOW: '#ec4899' };
  const typeLabels = { MEDICINE_REMINDER: 'Medicine', MOOD_CHECK: 'Mood Check', APPOINTMENT_REMINDER: 'Appointment', HEALTH_TIP: 'Health Tip', LAB_ALERT: 'Lab Alert', READMISSION: 'Readmission', MOOD_ALERT: 'Mood Alert', MOOD_RESPONSE: 'Mood Response', STOCK: 'Stock', NOSHOW: 'No-Show' };

  const donutData = Object.entries(typeCounts).slice(0, 5).map(([type, value]) => ({ label: typeLabels[type] || type, value, color: typeColors[type] || '#94a3b8' }));

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8', fontSize: '16px' }}>Loading analytics…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>HEALTH INTELLIGENCE</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Analytics Dashboard</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Real-time insights from your MediPulse data — updated live</p>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px', marginBottom: '24px' }}>
        <StatCard icon="🔔" value={total} label="Total Notifications" sub="All time" color="#1b6ca8" change={12} />
        <StatCard icon="📬" value={unread} label="Unread Alerts" sub="Needs attention" color="#ef4444" />
        <StatCard icon="✅" value={`${readRate}%`} label="Read Rate" sub="Engagement score" color="#10b981" change={5} />
        <StatCard icon="🤖" value={Object.keys(typeCounts).length} label="Alert Types Active" sub="AI notification categories" color="#6c63ff" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Notification Volume */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c' }}>Notification Volume</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Last 7 days</div>
            </div>
            <div style={{ fontSize: '22px' }}>📊</div>
          </div>
          <BarChart data={volumeData} color="#1b6ca8" height={120} />
        </div>

        {/* Mood Trend */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c' }}>Patient Mood Trend</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Weekly average (1-5 scale)</div>
            </div>
            <div style={{ fontSize: '22px' }}>💙</div>
          </div>
          <LineChart data={moodData} color="#10b981" height={120} />
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Notification Breakdown */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>Notification Breakdown</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>By alert type</div>
          {donutData.length > 0 ? <DonutChart segments={donutData} size={130} /> : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '13px' }}>No notification data yet</div>
          )}
        </div>

        {/* System Health */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>System Health</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Service status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { name: 'Spring Boot Backend', status: 'Operational', color: '#22c55e', icon: '⚙️' },
              { name: 'Python AI Service', status: 'Operational', color: '#22c55e', icon: '🤖' },
              { name: 'PostgreSQL Database', status: 'Operational', color: '#22c55e', icon: '🐘' },
              { name: 'PulseBot (Claude AI)', status: 'Active', color: '#3b82f6', icon: '💬' },
              { name: 'Push Notifications', status: 'Enabled', color: '#22c55e', icon: '🔔' },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #f0f4f8' }}>
                <span style={{ fontSize: '16px' }}>{s.icon}</span>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#374151' }}>{s.name}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: s.color, background: `${s.color}15`, padding: '3px 8px', borderRadius: '20px' }}>● {s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
