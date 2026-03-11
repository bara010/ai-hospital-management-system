import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settings as settingsApi } from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('mp_dark') === 'true');
  const [notifications, setNotifications] = useState({ medicine: true, mood: true, appointment: true, lab: true, tips: true });
  const [language, setLanguage] = useState('en');
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    document.body.style.background = darkMode ? '#0f172a' : '#f0f4f8';
    localStorage.setItem('mp_dark', darkMode);
    return () => { document.body.style.background = '#f0f4f8'; };
  }, [darkMode]);

  // Load persisted settings on mount
  useEffect(() => {
    settingsApi.get().then(res => {
      const d = res.data;
      if (d.name)  setProfileName(d.name);
      if (d.phone) setProfilePhone(d.phone);
      setNotifications({ medicine: d.medicineAlerts, mood: d.moodAlerts,
        appointment: d.appointmentAlerts, lab: d.labAlerts, tips: d.healthTips });
      if (d.language) setLanguage(d.language);
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await settingsApi.updateProfile({ name: profileName, phone: profilePhone });
      await settingsApi.updateNotifications({
        medicineAlerts: notifications.medicine, moodAlerts: notifications.mood,
        appointmentAlerts: notifications.appointment, labAlerts: notifications.lab,
        healthTips: notifications.tips, language,
      });
    } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const changePassword = async () => {
    if (!currentPw || !newPw) { setPwMsg('Please fill both fields.'); return; }
    try {
      await settingsApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwMsg('✅ Password changed!'); setCurrentPw(''); setNewPw('');
    } catch { setPwMsg('❌ Current password incorrect.'); }
    setTimeout(() => setPwMsg(''), 4000);
  };

  const Toggle = ({ checked, onChange }) => (
    <div onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', background: checked ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: checked ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </div>
  );

  const Card = ({ title, icon, children }) => (
    <div style={{ background: darkMode ? '#1e293b' : 'white', borderRadius: '18px', padding: '24px', border: `1px solid ${darkMode ? '#334155' : '#f0f4f8'}`, marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontWeight: '700', fontSize: '15px', color: darkMode ? '#f1f5f9' : '#1a202c' }}>{title}</span>
      </div>
      {children}
    </div>
  );

  const Row = ({ label, desc, control }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#334155' : '#f0f4f8'}` }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e2e8f0' : '#1a202c' }}>{label}</div>
        {desc && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{desc}</div>}
      </div>
      {control}
    </div>
  );

  const langs = [{ code: 'en', label: '🇺🇸 English' }, { code: 'hi', label: '🇮🇳 Hindi' }, { code: 'es', label: '🇪🇸 Spanish' }, { code: 'fr', label: '🇫🇷 French' }];

  return (
    <div style={{ maxWidth: '680px', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>PREFERENCES</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>⚙️ Settings</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Customize your MediPulse experience</p>
      </div>

      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 18px', marginBottom: '16px', color: '#16a34a', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✅ Settings saved successfully!
        </div>
      )}

      {/* Profile */}
      <Card title="Account" icon="👤">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: darkMode ? '#0f172a' : '#f8fafd', borderRadius: '14px', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#1b6ca8,#2980b9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '22px' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: darkMode ? '#f1f5f9' : '#1a202c' }}>{user?.name}</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{user?.email}</div>
            <div style={{ fontSize: '11px', color: '#1b6ca8', fontWeight: '700', background: '#eff6ff', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginTop: '4px' }}>{user?.role}</div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card title="Appearance" icon="🎨">
        <Row label="Dark Mode" desc="Switch to dark theme for comfortable night-time use"
          control={<Toggle checked={darkMode} onChange={() => setDarkMode(d => !d)} />} />
        <Row label="Language" desc="Select your preferred display language" control={
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: "'Outfit',sans-serif", background: darkMode ? '#1e293b' : 'white', color: darkMode ? '#e2e8f0' : '#1a202c', outline: 'none' }}>
            {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        } />
      </Card>

      {/* Notifications */}
      <Card title="Notification Preferences" icon="🔔">
        {[
          { key: 'medicine', label: 'Medicine Reminders', desc: 'Daily medication alerts at scheduled times' },
          { key: 'mood', label: 'Mood Check Requests', desc: 'Daily morning emotional wellbeing check' },
          { key: 'appointment', label: 'Appointment Reminders', desc: '24-hour and 1-hour before alerts' },
          { key: 'lab', label: 'Lab Alerts', desc: 'Critical lab value notifications' },
          { key: 'tips', label: 'Health Tips', desc: 'Personalized wellness tips from doctors' },
        ].map(n => (
          <Row key={n.key} label={n.label} desc={n.desc}
            control={<Toggle checked={notifications[n.key]} onChange={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))} />} />
        ))}
      </Card>

      {/* Privacy */}
      <Card title="Privacy & Data" icon="🔐">
        <Row label="Share mood data with care team" desc="Allows your doctor to see mood check results"
          control={<Toggle checked={true} onChange={() => {}} />} />
        <Row label="AI-powered suggestions" desc="Allow MediPulse AI to personalize your experience"
          control={<Toggle checked={true} onChange={() => {}} />} />
        <Row label="Anonymous analytics" desc="Help improve MediPulse (no personal data)"
          control={<Toggle checked={false} onChange={() => {}} />} />
      </Card>

      {/* About */}
      <Card title="About MediPulse" icon="✚">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[['Version', 'v2.0.0 Pro'], ['Stack', 'Java 21 + React 18'], ['Database', 'PostgreSQL 15'], ['AI Model', 'Claude Sonnet'], ['License', 'Academic Use'], ['Build', '2026-02-25']].map(([k, v]) => (
            <div key={k} style={{ padding: '10px 12px', background: darkMode ? '#0f172a' : '#f8fafd', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>{k}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#e2e8f0' : '#1a202c', marginTop: '2px' }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <button onClick={save} style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
        💾 Save Settings
      </button>
    </div>
  );
}
