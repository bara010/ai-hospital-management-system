import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vitals as vitalsApi, audit } from '../services/api';

const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

function generateHistory(days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      fullDate: d,
      bp_sys: 118 + Math.floor(Math.random() * 28),
      bp_dia: 74 + Math.floor(Math.random() * 16),
      sugar: 90 + Math.floor(Math.random() * 60),
      spo2: 95 + Math.floor(Math.random() * 5),
      weight: 72 + (Math.random() * 3 - 1.5).toFixed(1) * 1,
      pulse: 68 + Math.floor(Math.random() * 20),
    };
  });
}

const VITALS_CONFIG = [
  { key: 'bp_sys', label: 'Systolic BP', unit: 'mmHg', color: '#ef4444', icon: '❤️', normal: [90, 120], format: v => `${v}` },
  { key: 'bp_dia', label: 'Diastolic BP', unit: 'mmHg', color: '#f97316', icon: '🩸', normal: [60, 80], format: v => `${v}` },
  { key: 'sugar', label: 'Blood Sugar', unit: 'mg/dL', color: '#f59e0b', icon: '🍬', normal: [70, 140], format: v => `${v}` },
  { key: 'spo2', label: 'SpO₂', unit: '%', color: '#3b82f6', icon: '💨', normal: [95, 100], format: v => `${v}` },
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#6c63ff', icon: '⚖️', normal: [0, 999], format: v => v.toFixed(1) },
  { key: 'pulse', label: 'Pulse', unit: 'bpm', color: '#10b981', icon: '💓', normal: [60, 100], format: v => `${v}` },
];

function MiniLineChart({ data, color, height = 60 }) {
  if (data.length < 2) return null;
  const vals = data.map(Number);
  const max = Math.max(...vals), min = Math.min(...vals);
  const range = max - min || 1;
  const w = 200, h = height;
  const pts = vals.map((v, i) => ({ x: (i / (vals.length - 1)) * w, y: h - ((v - min) / range) * h }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 4}`} style={{ overflow: 'visible' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="1.5" />)}
    </svg>
  );
}

export default function VitalsTracker() {
  const { user } = useAuth();
  const [history, setHistory] = useState(generateHistory(14));
  const [form, setForm] = useState({ bp_sys: '', bp_dia: '', sugar: '', spo2: '', weight: '', pulse: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load real vitals from backend on mount
  useEffect(() => {
    if (user?.id) {
      vitalsApi.getByPatient(user.id).then(res => {
        if (res.data && res.data.length > 0) {
          const mapped = res.data.slice(0, 14).reverse().map(v => ({
            date: new Date(v.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            fullDate: new Date(v.recordedAt),
            bp_sys: v.systolic || 0,
            bp_dia: v.diastolic || 0,
            sugar: v.bloodSugar || 0,
            spo2: v.spo2 || 0,
            weight: v.weight || 0,
            pulse: v.heartRate || 0,
          }));
          if (mapped.length > 0) setHistory(mapped);
        }
      }).catch(() => {}); // fall back to mock data
    }
  }, [user?.id]);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [tab, setTab] = useState('dashboard');

  const latest = history[history.length - 1];

  const getStatus = (key, val) => {
    const cfg = VITALS_CONFIG.find(v => v.key === key);
    if (!cfg) return 'normal';
    if (val < cfg.normal[0]) return 'low';
    if (val > cfg.normal[1]) return 'high';
    return 'normal';
  };

  const statusColor = (s) => s === 'normal' ? '#10b981' : s === 'high' ? '#ef4444' : '#f59e0b';
  const statusBg = (s) => s === 'normal' ? '#f0fdf4' : s === 'high' ? '#fef2f2' : '#fffbeb';

  const logVitals = async () => {
    const entry = {
      date: new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      fullDate: new Date(),
      bp_sys: Number(form.bp_sys) || latest.bp_sys,
      bp_dia: Number(form.bp_dia) || latest.bp_dia,
      sugar: Number(form.sugar) || latest.sugar,
      spo2: Number(form.spo2) || latest.spo2,
      weight: Number(form.weight) || latest.weight,
      pulse: Number(form.pulse) || latest.pulse,
    };
    setHistory(prev => [...prev.slice(-13), entry]);
    setForm({ bp_sys: '', bp_dia: '', sugar: '', spo2: '', weight: '', pulse: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Persist to backend
    if (user?.id) {
      setLoading(true);
      try {
        await vitalsApi.log({
          patientId: user.id,
          systolic:    Number(form.bp_sys)  || undefined,
          diastolic:   Number(form.bp_dia)  || undefined,
          bloodSugar:  Number(form.sugar)   || undefined,
          spo2:        Number(form.spo2)    || undefined,
          heartRate:   Number(form.pulse)   || undefined,
          weight:      Number(form.weight)  || undefined,
        });
        // Audit log
        audit.log({ userEmail: user.email, userName: user.name, userRole: user.role, action: 'UPDATE_VITALS', resource: `Patient #${user.id}`, status: 'SUCCESS', details: 'Logged new vitals reading' }).catch(() => {});
      } catch (e) { /* ignore - local state already updated */ }
      setLoading(false);
    }
  };

  const getAIInsight = async () => {
    setLoadingAI(true);
    const recent = history.slice(-7);
    const prompt = `Analyze this patient's 7-day vitals trend and give 3 specific, actionable insights in plain language. Be warm, concise (2-3 sentences per insight), and flag any concerning patterns.

Data:
${recent.map(d => `${d.date}: BP ${d.bp_sys}/${d.bp_dia}, Sugar ${d.sugar}mg/dL, SpO2 ${d.spo2}%, Weight ${d.weight}kg, Pulse ${d.pulse}bpm`).join('\n')}

Format response as exactly 3 bullet points starting with an emoji.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      setAiInsight(data.content?.[0]?.text || 'Could not load insights. Check API key.');
    } catch { setAiInsight('AI insights unavailable. Check your API key in Layout.jsx.'); }
    setLoadingAI(false);
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>HEALTH MONITORING</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>❤️ Vitals Tracker</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Log your daily vitals and get AI-powered trend insights</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'white', padding: '8px', borderRadius: '14px', border: '1px solid #f0f4f8' }}>
        {[{ id: 'dashboard', label: '📊 Dashboard' }, { id: 'log', label: '➕ Log Vitals' }, { id: 'history', label: '📅 History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px', border: 'none', background: tab === t.id ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#f8fafd', color: tab === t.id ? 'white' : '#4a5568', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: "'Outfit',sans-serif" }}>{t.label}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div>
          {/* Latest vitals grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {VITALS_CONFIG.map(cfg => {
              const val = latest[cfg.key];
              const s = getStatus(cfg.key, val);
              return (
                <div key={cfg.key} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: `1.5px solid ${statusColor(s)}30`, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ fontSize: '22px' }}>{cfg.icon}</div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: statusColor(s), background: statusBg(s), padding: '2px 7px', borderRadius: '20px' }}>{s.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#1a202c', letterSpacing: '-1px' }}>{cfg.format(val)} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{cfg.unit}</span></div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '10px' }}>{cfg.label}</div>
                  <MiniLineChart data={history.slice(-7).map(h => h[cfg.key])} color={cfg.color} />
                </div>
              );
            })}
          </div>

          {/* AI Insights */}
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c' }}>🤖 AI Trend Analysis</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Based on your last 7 days of vitals</div>
              </div>
              <button onClick={getAIInsight} disabled={loadingAI} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                {loadingAI ? '⟳ Analyzing...' : '✨ Get AI Insights'}
              </button>
            </div>
            {aiInsight ? (
              <div style={{ background: '#f0f7ff', borderRadius: '12px', padding: '16px', border: '1px solid #d0e8ff' }}>
                {aiInsight.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} style={{ fontSize: '13px', color: '#1a202c', lineHeight: '1.7', marginBottom: i < aiInsight.split('\n').filter(Boolean).length - 1 ? '10px' : 0 }}>{line}</div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' }}>Click "Get AI Insights" to analyze your vitals trend</div>
            )}
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div style={{ background: 'white', borderRadius: '18px', padding: '28px', border: '1px solid #f0f4f8' }}>
          <div style={{ fontWeight: '700', fontSize: '16px', color: '#1a202c', marginBottom: '20px' }}>📝 Log Today's Vitals</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {VITALS_CONFIG.map(cfg => (
              <div key={cfg.key}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{cfg.icon} {cfg.label.toUpperCase()} ({cfg.unit})</label>
                <input type="number" value={form[cfg.key]} onChange={e => setForm(p => ({ ...p, [cfg.key]: e.target.value }))}
                  placeholder={`e.g. ${latest[cfg.key]}`}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <button onClick={logVitals} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            {saved ? '✅ Vitals Saved!' : '💾 Save Today\'s Vitals'}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #f0f4f8', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', gap: 0, padding: '12px 20px', background: '#f8fafd', borderBottom: '1px solid #f0f4f8' }}>
            {['Date', ...VITALS_CONFIG.map(c => c.label.split(' ')[0])].map(h => (
              <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>{h.toUpperCase()}</div>
            ))}
          </div>
          {[...history].reverse().map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', gap: 0, padding: '12px 20px', borderBottom: i < history.length - 1 ? '1px solid #f8fafd' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>{row.date}</div>
              {VITALS_CONFIG.map(cfg => {
                const s = getStatus(cfg.key, row[cfg.key]);
                return <div key={cfg.key} style={{ fontSize: '13px', fontWeight: '700', color: statusColor(s) }}>{cfg.format(row[cfg.key])}</div>;
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
