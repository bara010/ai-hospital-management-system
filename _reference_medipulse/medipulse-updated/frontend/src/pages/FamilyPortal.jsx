import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { family as familyApi } from '../services/api';

const RELATIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Caregiver', 'Other'];
const ALERT_TYPES = ['Medicine Reminders', 'Appointment Alerts', 'Lab Results', 'Mood Alerts', 'Emergency Alerts', 'Discharge Summary'];

const DEMO_CAREGIVERS = [
  { id: 1, name: 'Priya Sharma', relation: 'Spouse', phone: '+91 98765 43210', email: 'priya@example.com', alerts: ['Medicine Reminders', 'Emergency Alerts', 'Appointment Alerts'], status: 'active', avatar: '👩' },
  { id: 2, name: 'Ravi Sharma', relation: 'Parent', phone: '+91 87654 32109', email: 'ravi@example.com', alerts: ['Emergency Alerts'], status: 'pending', avatar: '👴' },
];

const SHARED_ALERTS = [
  { id: 1, type: 'Medicine Reminder', msg: 'Metformin 500mg due at 8:00 PM', time: '2 hours ago', to: 'Priya Sharma', icon: '💊' },
  { id: 2, type: 'Appointment Alert', msg: 'Appointment with Dr. Sharma tomorrow at 10 AM', time: 'Yesterday', to: 'Priya Sharma', icon: '📅' },
  { id: 3, type: 'Emergency Alert', msg: 'Blood pressure reading flagged as high: 162/96', time: '3 days ago', to: 'Priya Sharma, Ravi Sharma', icon: '🚨' },
];

export default function FamilyPortal() {
  const { user } = useAuth();
  const [caregivers, setCaregivers] = useState(DEMO_CAREGIVERS);
  const [tab, setTab] = useState('caregivers');

  useEffect(() => {
    if (user?.id) {
      familyApi.getByPatient(user.id).then(res => {
        if (res.data && res.data.length > 0) {
          setCaregivers(res.data.map(c => ({
            id: c.id, name: c.name, relation: c.relation,
            phone: c.phone || '', email: c.email || '',
            alerts: c.alertTypes ? c.alertTypes.split(',').filter(Boolean) : [],
            status: c.status, avatar: c.avatar || '👤',
          })));
        }
      }).catch(() => {});
    }
  }, [user?.id]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', relation: 'Spouse', phone: '', email: '', alerts: [] });
  const [saved, setSaved] = useState(false);

  const toggleAlert = (alert) => setForm(f => ({
    ...f, alerts: f.alerts.includes(alert) ? f.alerts.filter(a => a !== alert) : [...f.alerts, alert]
  }));

  const addCaregiver = async () => {
    if (!form.name || !form.email) return;
    setCaregivers(prev => [...prev, { id: Date.now(), ...form, status: 'pending', avatar: '👤' }]);
    setForm({ name: '', relation: 'Spouse', phone: '', email: '', alerts: [] });
    setShowAdd(false);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
    if (user?.id) {
      try { await familyApi.add({ patientId: user.id, name: form.name, relation: form.relation,
        phone: form.phone, email: form.email, alertTypes: form.alerts.join(',') }); } catch {}
    }
  };

  const removeCaregiver = async (id) => {
    setCaregivers(prev => prev.filter(c => c.id !== id));
    try { await familyApi.remove(id); } catch {}
  };

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>CARE NETWORK</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>👨‍👩‍👧 Family & Caregiver Portal</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Add family members who receive copies of your health alerts and notifications</p>
      </div>

      {saved && (
        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px 18px', border: '1px solid #bbf7d0', marginBottom: '16px', color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>
          ✅ Invitation sent! They'll receive an email to join your care network.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'white', padding: '8px', borderRadius: '14px', border: '1px solid #f0f4f8' }}>
        {[{ id: 'caregivers', label: `👥 Caregivers (${caregivers.length})` }, { id: 'activity', label: '📋 Shared Alerts' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px', border: 'none', background: tab === t.id ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#f8fafd', color: tab === t.id ? 'white' : '#4a5568', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: "'Outfit',sans-serif" }}>{t.label}</button>
        ))}
      </div>

      {tab === 'caregivers' && (
        <div>
          {/* Caregiver cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {caregivers.map(cg => (
              <div key={cg.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{cg.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c' }}>{cg.name}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', background: '#f8fafd', padding: '2px 8px', borderRadius: '20px', border: '1px solid #f0f4f8' }}>{cg.relation}</span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: cg.status === 'active' ? '#10b981' : '#f59e0b', background: cg.status === 'active' ? '#f0fdf4' : '#fffbeb', padding: '2px 8px', borderRadius: '20px' }}>
                        {cg.status === 'active' ? '● Active' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{cg.email} · {cg.phone}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                      {cg.alerts.map(a => (
                        <span key={a} style={{ fontSize: '10px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeCaregiver(cg.id)} style={{ padding: '7px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'Outfit',sans-serif" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Caregiver */}
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '14px', background: 'white', border: '2px dashed #f97316', borderRadius: '14px', color: '#f97316', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              + Add Family Member / Caregiver
            </button>
          ) : (
            <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1.5px solid #f97316' }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '16px' }}>👤 Add New Caregiver</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                {[
                  { label: 'Full Name *', key: 'name', placeholder: 'e.g. Priya Sharma' },
                  { label: 'Email Address *', key: 'email', placeholder: 'e.g. priya@example.com' },
                  { label: 'Phone Number', key: 'phone', placeholder: '+91 98765 43210' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>{f.label.toUpperCase()}</label>
                    <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>RELATIONSHIP</label>
                  <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'white', boxSizing: 'border-box' }}>
                    {RELATIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>SHARE THESE ALERTS</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ALERT_TYPES.map(a => (
                    <button key={a} onClick={() => toggleAlert(a)}
                      style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${form.alerts.includes(a) ? '#f97316' : '#e2e8f0'}`, background: form.alerts.includes(a) ? '#fff7ed' : '#fafafa', color: form.alerts.includes(a) ? '#f97316' : '#4a5568', cursor: 'pointer', fontWeight: form.alerts.includes(a) ? '700' : '500', fontSize: '12px', fontFamily: "'Outfit',sans-serif" }}>
                      {form.alerts.includes(a) ? '✓ ' : ''}{a}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addCaregiver} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>📧 Send Invitation</button>
                <button onClick={() => setShowAdd(false)} style={{ padding: '12px 20px', background: 'white', color: '#4a5568', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {SHARED_ALERTS.map((alert, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', border: '1px solid #f0f4f8', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{alert.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#f97316', letterSpacing: '0.5px', marginBottom: '2px' }}>{alert.type.toUpperCase()}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c', marginBottom: '4px' }}>{alert.msg}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>📤 Shared with: {alert.to} · {alert.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
