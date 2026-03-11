import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { mood as moodApi, patients as patientsApi } from '../services/api';

const MOODS = [
  { score:1, emoji:'😢', label:'Very Bad',  color:'#dc2626', bg:'#fef2f2', ring:'#fca5a5' },
  { score:2, emoji:'😕', label:'Bad',       color:'#f59e0b', bg:'#fffbeb', ring:'#fde68a' },
  { score:3, emoji:'😐', label:'Okay',      color:'#eab308', bg:'#fefce8', ring:'#fef08a' },
  { score:4, emoji:'😊', label:'Good',      color:'#16a34a', bg:'#f0fdf4', ring:'#86efac' },
  { score:5, emoji:'😄', label:'Great!',    color:'#1b6ca8', bg:'#eff6ff', ring:'#93c5fd' },
];

export default function MoodCheck() {
  const { user } = useAuth();
  const [selected,  setSelected]  = useState(null);
  const [note,      setNote]      = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [response,  setResponse]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  // Only patients can submit mood check
  if (user?.role && user.role !== 'PATIENT') {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 40,
        background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧘</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Mood Check</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
          Mood check is available for <strong>patients only</strong>.<br/>
          As a <strong>{user.role}</strong>, you can view patient mood reports in the dashboard.
        </p>
      </div>
    );
  }
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input needs Chrome browser.'); return; }
    const rec = new SR(); rec.lang = 'en-US'; rec.continuous = false;
    rec.onstart  = () => setListening(true);
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript.toLowerCase();
      setNote(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript);
      if (t.includes('great') || t.includes('excellent')) setSelected(MOODS[4]);
      else if (t.includes('good') || t.includes('well')) setSelected(MOODS[3]);
      else if (t.includes('okay') || t.includes('alright')) setSelected(MOODS[2]);
      else if (t.includes('bad') || t.includes('tired')) setSelected(MOODS[1]);
      else if (t.includes('terrible') || t.includes('awful')) setSelected(MOODS[0]);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec; rec.start();
  };

  const handleSubmit = async () => {
    if (!selected || !user?.id) return;
    setLoading(true); setError('');
    try {
      // Resolve patient profile ID — auto-create if missing
      let patientId = null;
      try {
        const pRes = await patientsApi.getByUserId(user.id);
        if (pRes.data?.id) patientId = pRes.data.id;
      } catch (_) {}

      if (!patientId) {
        try {
          const createRes = await patientsApi.create({
            userId: user.id,
            status: 'OUTPATIENT',
            name:   user?.name || '',
            email:  user?.email || '',
          });
          if (createRes.data?.id) patientId = createRes.data.id;
        } catch (createErr) {
          setError(
            '⚠️ Your patient profile is not set up yet. Please ask your Admin to go to Admin Setup → All Users and click "Create Profile" next to your name.'
          );
          setLoading(false);
          return;
        }
      }

      const res = await moodApi.submit({
        patientId,
        patientName: user?.name || 'Patient',
        moodScore:   selected.score,
        note,
      });

      const data = res.data;
      setResponse(data.patient_response || (selected.score <= 3
        ? 'Your care team has been notified and will follow up with you 💙'
        : 'Thanks for sharing! Keep up the great mood! 😊'
      ));
      setSubmitted(true);
    } catch (e) {
      setError('Failed to submit mood. Please try again.');
    }
    setLoading(false);
  };

  if (submitted) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f0f4f8' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{selected?.emoji}</div>
        <h2 style={{ margin: '0 0 6px', color: '#1a202c', fontSize: 24, fontWeight: 800 }}>Thank you!</h2>
        <div style={{ width: 40, height: 3, background: 'linear-gradient(90deg,#0f4c75,#1b6ca8)', borderRadius: 2, margin: '0 auto 20px' }} />
        <p style={{ color: '#718096', lineHeight: 1.7, fontSize: 15, marginBottom: 28 }}>{response}</p>
        {selected.score <= 3 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
            📧 Your doctor has been notified by email and will follow up with you.
          </div>
        )}
        <button onClick={() => { setSubmitted(false); setSelected(null); setNote(''); setResponse(''); }}
          style={{ padding: '13px 32px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
          ← Back to Mood Check
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '40px 36px', maxWidth: 500, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f0f4f8' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px' }}>💙</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#1a202c', fontWeight: 800 }}>How are you feeling?</h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
            Hi <strong style={{ color: '#1b6ca8' }}>{user?.name?.split(' ')[0]}</strong>, your care team wants to know.
            {selected?.score <= 3 ? ' 🚨 Low mood will alert your doctor by email.' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
          {MOODS.map(m => (
            <button key={m.score} onClick={() => setSelected(m)} style={{ flex: 1, padding: '14px 4px', border: `2px solid ${selected?.score === m.score ? m.color : m.ring}`, borderRadius: 14, cursor: 'pointer', background: selected?.score === m.score ? m.bg : '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.2s', transform: selected?.score === m.score ? 'scale(1.07)' : 'scale(1)', boxShadow: selected?.score === m.score ? `0 4px 14px ${m.color}40` : 'none' }}>
              <span style={{ fontSize: 30 }}>{m.emoji}</span>
              <span style={{ fontSize: 10, color: selected?.score === m.score ? m.color : '#94a3b8', fontWeight: 700 }}>{m.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div style={{ background: selected.bg, borderRadius: 12, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: selected.color, fontWeight: 600, border: `1px solid ${selected.ring}`, textAlign: 'center' }}>
            {selected.emoji} You selected: {selected.label}
            {selected.score <= 3 && ' — Your doctor will be notified 🔔'}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', letterSpacing: '0.5px' }}>
              NOTES (optional)
            </label>
            <button onClick={listening ? () => { recRef.current?.stop(); setListening(false); } : startVoice}
              style={{ padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${listening ? '#dc2626' : '#d0e8ff'}`, background: listening ? '#fef2f2' : '#f0f7ff', color: listening ? '#dc2626' : '#1b6ca8', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
              {listening ? '⏹ Stop' : '🎙️ Voice'}
            </button>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Feeling a bit tired, mild headache..."
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13, resize: 'none', height: 80, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12, background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={!selected || loading}
          style={{ width: '100%', padding: 14, background: selected ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : '#e2e8f0', color: selected ? 'white' : '#94a3b8', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          {loading ? '⟳ Sharing with your doctor…' : '💙 Share with My Care Team'}
        </button>
      </div>
    </div>
  );
}
