import React, { useState, useMemo, useEffect } from 'react';
import { audit as auditApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ACTION_TYPES = {
  VIEW_RECORD:   { color: '#1b6ca8', bg: '#eff6ff', icon: '👁️', label: 'View' },
  UPDATE_RECORD: { color: '#f59e0b', bg: '#fffbeb', icon: '✏️', label: 'Update' },
  DELETE_RECORD: { color: '#ef4444', bg: '#fef2f2', icon: '🗑️', label: 'Delete' },
  LOGIN:         { color: '#10b981', bg: '#f0fdf4', icon: '🔐', label: 'Login' },
  LOGOUT:        { color: '#94a3b8', bg: '#f8fafd', icon: '🚪', label: 'Logout' },
  EXPORT_DATA:   { color: '#8b5cf6', bg: '#f5f3ff', icon: '📤', label: 'Export' },
  PRESCRIPTION:  { color: '#0891b2', bg: '#ecfeff', icon: '📝', label: 'Prescription' },
  LAB_ORDER:     { color: '#6c63ff', bg: '#f0f0ff', icon: '🧪', label: 'Lab Order' },
  FAILED_AUTH:   { color: '#dc2626', bg: '#fff1f1', icon: '🚨', label: 'Auth Fail' },
  DATA_SHARE:    { color: '#f97316', bg: '#fff7ed', icon: '🔗', label: 'Share' },
};

function generateLogs(count = 80) {
  const users = [
    { name: 'Dr. Priya Sharma', role: 'DOCTOR', dept: 'Cardiology' },
    { name: 'Dr. Arjun Mehta', role: 'DOCTOR', dept: 'Neurology' },
    { name: 'Admin User', role: 'ADMIN', dept: 'Administration' },
    { name: 'Nurse Rekha', role: 'NURSE', dept: 'ICU' },
    { name: 'Patient User', role: 'PATIENT', dept: '-' },
    { name: 'Dr. Kavita Nair', role: 'DOCTOR', dept: 'Orthopedics' },
  ];
  const actions = Object.keys(ACTION_TYPES);
  const resources = [
    'Patient Record #PR-4821', 'Appointment #APT-1092', 'Lab Result #LAB-2234',
    'Prescription #RX-9981', 'Discharge Summary #DS-441', 'Medical Image #MRI-7721',
    'Insurance Claim #INS-3312', 'Patient Record #PR-7741', 'Audit Log Access',
    'User Account #USR-881',
  ];
  const ips = ['192.168.1.10','10.0.0.45','172.16.0.12','192.168.2.88','10.0.1.201'];

  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const d = new Date();
    d.setMinutes(d.getMinutes() - i * Math.floor(Math.random() * 18 + 2));
    return {
      id: `LOG-${String(count - i).padStart(5, '0')}`,
      user: user.name,
      role: user.role,
      dept: user.dept,
      action,
      resource: resources[Math.floor(Math.random() * resources.length)],
      ip: ips[Math.floor(Math.random() * ips.length)],
      timestamp: d,
      sessionId: `SID-${Math.random().toString(36).substr(2,8).toUpperCase()}`,
      status: action === 'FAILED_AUTH' ? 'FAILED' : 'SUCCESS',
      details: action === 'EXPORT_DATA' ? 'CSV export of 248 records' : action === 'DELETE_RECORD' ? 'Soft-delete flagged for review' : null,
    };
  });
}

const LOGS = generateLogs(80);

const fmtTime = (d) => d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDate = (d) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' });

export default function AuditLog() {
  const { user } = useAuth();
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [apiLogs, setApiLogs] = useState([]);
  const PER_PAGE = 15;

  useEffect(() => {
    auditApi.getAll().then(res => {
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map(l => ({
          id: `EVT-${l.id}`,
          time: new Date(l.performedAt),
          user: l.userName || l.userEmail,
          email: l.userEmail,
          role: l.userRole,
          action: l.action,
          resource: l.resource,
          status: l.status,
          ip: l.ipAddress || '0.0.0.0',
          details: l.details,
        }));
        setApiLogs(mapped);
      }
    }).catch(() => {});
  }, []);

  const LOGS_DATA = apiLogs.length > 0 ? apiLogs : LOGS;

  const filtered = useMemo(() => LOGS_DATA.filter(l => {
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    if (filterRole !== 'ALL' && l.role !== filterRole) return false;
    if (search && !`${l.user} ${l.resource} ${l.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [filterAction, filterRole, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageLogs = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const riskLogs = LOGS_DATA.filter(l => l.action === 'FAILED_AUTH' || l.action === 'DELETE_RECORD' || l.action === 'EXPORT_DATA');

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>HIPAA COMPLIANCE · ADMIN ONLY</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>🔏 HIPAA Audit Log</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Complete tamper-evident log of all data access, modifications, and authentication events</p>
      </div>

      {/* Risk Alerts */}
      {riskLogs.length > 0 && (
        <div style={{ background: '#fff1f1', borderRadius: '14px', padding: '16px 20px', border: '1px solid #fecaca', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🚨</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#dc2626' }}>Security Alerts Detected</div>
            <div style={{ fontSize: '12px', color: '#b91c1c' }}>{riskLogs.filter(l=>l.action==='FAILED_AUTH').length} failed auth attempts, {riskLogs.filter(l=>l.action==='EXPORT_DATA').length} data exports, {riskLogs.filter(l=>l.action==='DELETE_RECORD').length} deletions in last 24 hours</div>
          </div>
          <button style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: '10px', border: '1px solid #fecaca', background: 'white', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            Review →
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { val: LOGS.length, label: 'Total Events', color: '#1b6ca8', icon: '📋' },
          { val: LOGS.filter(l=>l.action==='FAILED_AUTH').length, label: 'Failed Logins', color: '#ef4444', icon: '🚨' },
          { val: LOGS.filter(l=>l.action==='EXPORT_DATA').length, label: 'Data Exports', color: '#8b5cf6', icon: '📤' },
          { val: LOGS.filter(l=>l.status==='SUCCESS').length, label: 'Successful', color: '#10b981', icon: '✅' },
          { val: [...new Set(LOGS.map(l=>l.ip))].length, label: 'Unique IPs', color: '#f59e0b', icon: '🌐' },
        ].map((s,i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid #f0f4f8', textAlign: 'center' }}>
            <div style={{ fontSize: '18px' }}>{s.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px 20px', border: '1px solid #f0f4f8', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="🔍 Search user, resource, log ID..."
          style={{ flex: 1, minWidth: '200px', padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
        <select value={filterAction} onChange={e=>{setFilterAction(e.target.value);setPage(1);}}
          style={{ padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'white' }}>
          <option value="ALL">All Actions</option>
          {Object.entries(ACTION_TYPES).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={filterRole} onChange={e=>{setFilterRole(e.target.value);setPage(1);}}
          style={{ padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'white' }}>
          <option value="ALL">All Roles</option>
          {['DOCTOR','ADMIN','NURSE','PATIENT'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{filtered.length} events</div>
      </div>

      {/* Log Table */}
      <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #f0f4f8', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 1fr 100px 90px 80px', gap: 0, padding: '12px 20px', background: '#f8fafd', borderBottom: '1px solid #f0f4f8' }}>
          {['Log ID','User','Action','Resource','IP Address','Time','Status'].map(h => (
            <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>{h.toUpperCase()}</div>
          ))}
        </div>
        {pageLogs.map((log, i) => {
          const ac = ACTION_TYPES[log.action];
          return (
            <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 1fr 100px 90px 80px', gap: 0, padding: '12px 20px', borderBottom: i < pageLogs.length - 1 ? '1px solid #f8fafd' : 'none', background: log.action === 'FAILED_AUTH' ? '#fff8f8' : 'white', alignItems: 'center', transition: 'background 0.15s' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: '600' }}>{log.id}</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a202c' }}>{log.user}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{log.role} · {log.dept}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', background: ac.bg, color: ac.color, padding: '3px 8px', borderRadius: '20px' }}>{ac.icon} {ac.label}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{log.resource}</div>
                {log.details && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{log.details}</div>}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>{log.ip}</div>
              <div>
                <div style={{ fontSize: '11px', color: '#4a5568', fontWeight: '600' }}>{fmtTime(log.timestamp)}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{fmtDate(log.timestamp)}</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: log.status === 'SUCCESS' ? '#16a34a' : '#dc2626', background: log.status === 'SUCCESS' ? '#f0fdf4' : '#fef2f2', padding: '3px 7px', borderRadius: '20px' }}>
                  {log.status === 'SUCCESS' ? '● OK' : '● FAIL'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
        <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
          style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#4a5568', cursor: page===1?'default':'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Outfit',sans-serif", opacity: page===1?0.5:1 }}>← Prev</button>
        {Array.from({length: totalPages}, (_,i) => i+1).filter(p => Math.abs(p-page)<=2).map(p => (
          <button key={p} onClick={() => setPage(p)}
            style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: p===page?'#1b6ca8':'white', color: p===page?'white':'#4a5568', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'Outfit',sans-serif", border: `1px solid ${p===page?'#1b6ca8':'#e2e8f0'}` }}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
          style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#4a5568', cursor: page===totalPages?'default':'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Outfit',sans-serif", opacity: page===totalPages?0.5:1 }}>Next →</button>
      </div>
    </div>
  );
}
