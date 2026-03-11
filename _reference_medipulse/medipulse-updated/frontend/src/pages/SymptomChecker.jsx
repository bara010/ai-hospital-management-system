import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Chest pain',
  'Shortness of breath', 'Dizziness', 'Sore throat', 'Back pain',
  'Stomach ache', 'Vomiting', 'Joint pain', 'Skin rash', 'Insomnia',
];

const URGENCY_CONFIG = {
  EMERGENCY: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🚨', label: 'EMERGENCY', action: 'Call emergency services (108/911) immediately or go to the nearest ER.' },
  HIGH:      { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: '⚠️', label: 'HIGH PRIORITY', action: 'See a doctor today or visit urgent care within a few hours.' },
  MEDIUM:    { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🔶', label: 'MODERATE', action: 'Schedule a doctor\'s appointment within 1–2 days.' },
  LOW:       { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅', label: 'LOW PRIORITY', action: 'Monitor your symptoms. Rest and stay hydrated. See a doctor if it worsens.' },
};

export default function SymptomChecker() {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [duration, setDuration] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggleSymptom = (s) => setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const allSymptoms = [...selected, ...(custom.trim() ? custom.split(',').map(s => s.trim()).filter(Boolean) : [])];

  const analyze = async () => {
    if (allSymptoms.length === 0) { setError('Please select at least one symptom.'); return; }
    setError(''); setLoading(true); setResult(null);
    const prompt = `You are a medical AI triage assistant. A patient reports the following:
Symptoms: ${allSymptoms.join(', ')}
Duration: ${duration || 'Not specified'}
Patient age: ${age || 'Not specified'}

Analyze these symptoms and respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "urgency": "EMERGENCY|HIGH|MEDIUM|LOW",
  "summary": "2-sentence plain language summary of the likely cause",
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "warningSignsToWatch": ["sign1", "sign2"],
  "disclaimer": "one sentence medical disclaimer"
}

Rules:
- EMERGENCY: chest pain + breathing difficulty, stroke symptoms, severe allergic reaction, unconsciousness
- HIGH: persistent high fever (>103°F), severe pain, blood in stool/urine, sudden severe headache
- MEDIUM: fever under 103°F, moderate pain, common infections
- LOW: mild symptoms, common cold, minor aches
Be accurate and conservative — err on the side of caution.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch {
      setError('AI analysis failed. Please check your API key in Layout.jsx or try again.');
    }
    setLoading(false);
  };

  const reset = () => { setSelected([]); setCustom(''); setDuration(''); setAge(''); setResult(null); setError(''); };

  const cfg = result ? URGENCY_CONFIG[result.urgency] || URGENCY_CONFIG.LOW : null;

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>AI POWERED</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>🩺 Symptom Checker</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Describe your symptoms and get an AI triage assessment. Not a substitute for professional medical advice.</p>
      </div>

      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Common symptoms */}
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>Select Your Symptoms</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Tap all that apply</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {COMMON_SYMPTOMS.map(s => (
                <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: '8px 14px', borderRadius: '20px', border: `1.5px solid ${selected.includes(s) ? '#1b6ca8' : '#e2e8f0'}`, background: selected.includes(s) ? '#eff6ff' : '#fafafa', color: selected.includes(s) ? '#1b6ca8' : '#4a5568', cursor: 'pointer', fontWeight: selected.includes(s) ? '700' : '500', fontSize: '13px', fontFamily: "'Outfit',sans-serif", transition: 'all 0.15s' }}>
                  {selected.includes(s) ? '✓ ' : ''}{s}
                </button>
              ))}
            </div>
          </div>

          {/* Custom symptoms + details */}
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '16px' }}>Additional Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>OTHER SYMPTOMS (comma separated)</label>
                <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="e.g. blurred vision, numbness..."
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>HOW LONG?</label>
                <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'white' }}>
                  <option value="">Select duration</option>
                  <option>Just started (hours)</option>
                  <option>1–2 days</option>
                  <option>3–7 days</option>
                  <option>1–2 weeks</option>
                  <option>More than 2 weeks</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>YOUR AGE</label>
                <input value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 35" type="number" min="1" max="120"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
              </div>
            </div>
          </div>

          {/* Selected summary */}
          {allSymptoms.length > 0 && (
            <div style={{ background: '#f0f7ff', borderRadius: '12px', padding: '14px 18px', border: '1px solid #d0e8ff', fontSize: '13px', color: '#1b6ca8' }}>
              <strong>Selected ({allSymptoms.length}):</strong> {allSymptoms.join(', ')}
            </div>
          )}

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', border: '1px solid #fecaca' }}>⚠️ {error}</div>}

          <button onClick={analyze} disabled={loading || allSymptoms.length === 0}
            style={{ padding: '15px', background: allSymptoms.length > 0 ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : '#e2e8f0', color: allSymptoms.length > 0 ? 'white' : '#94a3b8', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: allSymptoms.length > 0 ? 'pointer' : 'not-allowed', fontFamily: "'Outfit',sans-serif" }}>
            {loading ? '🤖 Analyzing your symptoms with AI...' : '🩺 Analyze Symptoms with AI'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', margin: '0' }}>⚠️ This tool is for informational purposes only. Always consult a qualified healthcare professional for medical advice.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease' }}>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Urgency Banner */}
          <div style={{ background: cfg.bg, borderRadius: '18px', padding: '24px', border: `2px solid ${cfg.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <span style={{ fontSize: '36px' }}>{cfg.icon}</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: cfg.color, letterSpacing: '1px' }}>TRIAGE RESULT</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: cfg.color }}>{cfg.label}</div>
              </div>
            </div>
            <p style={{ margin: '0 0 12px', color: '#374151', fontSize: '14px', lineHeight: '1.6' }}>{result.summary}</p>
            <div style={{ background: cfg.color, color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}>
              📋 {cfg.action}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Possible Conditions */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '14px' }}>🔍 Possible Conditions</div>
              {result.possibleConditions?.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < result.possibleConditions.length - 1 ? '1px solid #f0f4f8' : 'none' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1b6ca8', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#374151' }}>{c}</span>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '14px' }}>✅ Recommendations</div>
              {result.recommendations?.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: i < result.recommendations.length - 1 ? '1px solid #f0f4f8' : 'none' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#16a34a', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning signs */}
          {result.warningSignsToWatch?.length > 0 && (
            <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '18px', border: '1px solid #fed7aa' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#c2410c', marginBottom: '10px' }}>⚠️ Watch for These Warning Signs</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {result.warningSignsToWatch.map((s, i) => (
                  <span key={i} style={{ padding: '5px 12px', background: 'white', border: '1px solid #fed7aa', borderRadius: '20px', fontSize: '12px', color: '#c2410c', fontWeight: '600' }}>⚡ {s}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '0 20px' }}>⚠️ {result.disclaimer}</p>

          <button onClick={reset} style={{ padding: '13px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            ← Check Different Symptoms
          </button>
        </div>
      )}
    </div>
  );
}
