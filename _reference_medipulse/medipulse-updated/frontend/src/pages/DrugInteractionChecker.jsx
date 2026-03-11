import React, { useState } from 'react';

const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

const COMMON_DRUGS = ['Metformin','Lisinopril','Atorvastatin','Aspirin','Warfarin','Amlodipine','Metoprolol','Omeprazole','Pantoprazole','Ramipril','Losartan','Atenolol','Glibenclamide','Insulin Glargine','Clopidogrel','Furosemide','Spironolactone','Digoxin','Amoxicillin','Azithromycin','Ciprofloxacin'];

const SEVERITY_CONFIG = {
  MAJOR:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🚨', label: 'MAJOR — Avoid Combination' },
  MODERATE: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⚠️', label: 'MODERATE — Use with Caution' },
  MINOR:    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅', label: 'MINOR — Generally Safe' },
  NONE:     { color: '#1b6ca8', bg: '#eff6ff', border: '#bfdbfe', icon: '💚', label: 'NO INTERACTIONS FOUND' },
};

export default function DrugInteractionChecker() {
  const [drugs, setDrugs] = useState([]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addDrug = (drug) => {
    const d = drug.trim();
    if (d && !drugs.includes(d) && drugs.length < 10) setDrugs(p => [...p, d]);
    setInput('');
  };

  const removeDrug = (d) => setDrugs(p => p.filter(x => x !== d));

  const check = async () => {
    if (drugs.length < 2) { setError('Add at least 2 medications to check interactions.'); return; }
    setError(''); setLoading(true); setResult(null);

    const prompt = `You are a clinical pharmacist AI. Check drug interactions for these medications: ${drugs.join(', ')}.

Return ONLY valid JSON (no markdown):
{
  "overallSeverity": "MAJOR|MODERATE|MINOR|NONE",
  "summary": "2-sentence overall assessment",
  "interactions": [
    {
      "drug1": "Drug A",
      "drug2": "Drug B", 
      "severity": "MAJOR|MODERATE|MINOR",
      "mechanism": "brief pharmacological mechanism",
      "clinicalEffect": "what happens to the patient",
      "management": "what the doctor/patient should do"
    }
  ],
  "safeCombinations": ["Drug A + Drug B are safe together"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "monitoringRequired": ["parameter to monitor 1"],
  "disclaimer": "short clinical disclaimer"
}

Check ALL possible pairs. Be accurate and clinically relevant.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      setResult(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { setError('Check failed. Please verify your API key in Layout.jsx.'); }
    setLoading(false);
  };

  const sc = result ? (SEVERITY_CONFIG[result.overallSeverity] || SEVERITY_CONFIG.NONE) : null;

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>CLINICAL SAFETY · PRO</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>💊 Drug Interaction Checker</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Check for dangerous drug combinations before prescribing or dispensing</p>
      </div>

      <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8', marginBottom: '16px' }}>
        <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>Add Medications ({drugs.length}/10)</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Type a drug name or select from common medications below</div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDrug(input)}
            placeholder="Type medication name and press Enter..."
            style={{ flex: 1, padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
          <button onClick={() => addDrug(input)} style={{ padding: '11px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Add</button>
        </div>

        {/* Common drugs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {COMMON_DRUGS.filter(d => !drugs.includes(d)).slice(0, 12).map(d => (
            <button key={d} onClick={() => addDrug(d)}
              style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#fafafa', color: '#4a5568', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              + {d}
            </button>
          ))}
        </div>

        {/* Selected drugs */}
        {drugs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {drugs.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#f5f3ff', border: '1.5px solid #7c3aed30', borderRadius: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#7c3aed' }}>💊 {d}</span>
                <button onClick={() => removeDrug(d)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {error && <div style={{ marginBottom: '10px', padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '12px' }}>⚠️ {error}</div>}

        <button onClick={check} disabled={loading || drugs.length < 2}
          style={{ width: '100%', padding: '14px', background: drugs.length >= 2 ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#e2e8f0', color: drugs.length >= 2 ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: drugs.length >= 2 ? 'pointer' : 'not-allowed', fontFamily: "'Outfit',sans-serif" }}>
          {loading ? '🔬 Checking interactions...' : '🔍 Check Drug Interactions'}
        </button>
      </div>

      {result && sc && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Overall result */}
          <div style={{ background: sc.bg, borderRadius: '18px', padding: '24px', border: `2px solid ${sc.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <span style={{ fontSize: '36px' }}>{sc.icon}</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: sc.color, letterSpacing: '1px' }}>OVERALL ASSESSMENT</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: sc.color }}>{sc.label}</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>{result.summary}</p>
          </div>

          {/* Interaction pairs */}
          {result.interactions?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '16px' }}>🔗 Interaction Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {result.interactions.map((inter, i) => {
                  const s = SEVERITY_CONFIG[inter.severity] || SEVERITY_CONFIG.MINOR;
                  return (
                    <div key={i} style={{ borderRadius: '12px', border: `1.5px solid ${s.border}`, overflow: 'hidden' }}>
                      <div style={{ background: s.bg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px' }}>{s.icon}</span>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: s.color }}>{inter.drug1} + {inter.drug2}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: '700', color: s.color, background: 'white', padding: '2px 8px', borderRadius: '20px' }}>{inter.severity}</span>
                      </div>
                      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {[
                          { label: '⚗️ Mechanism', val: inter.mechanism },
                          { label: '🏥 Clinical Effect', val: inter.clinicalEffect },
                          { label: '📋 Management', val: inter.management },
                        ].map((item, j) => (
                          <div key={j}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '4px' }}>{item.label}</div>
                            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations & Monitoring */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '12px' }}>📋 Clinical Recommendations</div>
              {result.recommendations?.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
                  <span style={{ color: '#7c3aed', flexShrink: 0 }}>→</span> {r}
                </div>
              ))}
            </div>
            <div style={{ background: '#fef9c3', borderRadius: '16px', padding: '20px', border: '1px solid #fde047' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#92400e', marginBottom: '12px' }}>🔍 Monitor These Parameters</div>
              {result.monitoringRequired?.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', color: '#374151' }}>
                  <span>●</span> {m}
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>⚠️ {result.disclaimer}</p>
          <button onClick={() => { setResult(null); setDrugs([]); }} style={{ padding: '12px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>← Check Different Medications</button>
        </div>
      )}
    </div>
  );
}
