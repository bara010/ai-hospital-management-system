import React, { useState, useRef } from 'react';

const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

const SAMPLE_REPORT = `LABORATORY REPORT
Patient: John Doe | Age: 52 | Date: 25-Feb-2026

COMPLETE BLOOD COUNT (CBC)
Hemoglobin: 11.2 g/dL (Low) [Normal: 13.5-17.5]
WBC: 11,200 /μL (High) [Normal: 4,500-11,000]
Platelets: 145,000 /μL [Normal: 150,000-400,000]

METABOLIC PANEL
HbA1c: 8.6% (High) [Normal: <5.7%]
Fasting Glucose: 198 mg/dL (High) [Normal: 70-100]
Creatinine: 1.9 mg/dL (High) [Normal: 0.7-1.3]
eGFR: 38 mL/min (Low) [Normal: >60]

LIPID PANEL
Total Cholesterol: 234 mg/dL (High) [Normal: <200]
LDL: 158 mg/dL (High) [Normal: <130]
HDL: 38 mg/dL (Low) [Normal: >40]
Triglycerides: 210 mg/dL (High) [Normal: <150]`;

export default function ReportReader() {
  const [report, setReport] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('paste'); // paste | demo
  const fileRef = useRef();

  const analyzeReport = async (text) => {
    if (!text.trim()) { setError('Please paste or upload a lab report.'); return; }
    setError(''); setLoading(true); setResult(null);

    const prompt = `You are a medical AI that explains lab reports in plain language for patients. Analyze this lab report and respond ONLY in this exact JSON format (no markdown):
{
  "summary": "2-sentence overall summary of what this report shows",
  "values": [
    {"name": "test name", "value": "result", "unit": "unit", "status": "normal|high|low|critical", "meaning": "1-sentence plain language explanation of what this value means for the patient"}
  ],
  "concerns": ["concern 1", "concern 2"],
  "positives": ["positive finding 1"],
  "nextSteps": ["action 1", "action 2", "action 3"],
  "urgency": "routine|soon|urgent",
  "disclaimer": "standard medical disclaimer"
}

Lab Report:
${text}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const text2 = data.content?.[0]?.text || '';
      const parsed = JSON.parse(text2.replace(/```json|```/g, '').trim());
      setResult(parsed);
    } catch { setError('Analysis failed. Please check your Anthropic API key in Layout.jsx.'); }
    setLoading(false);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReport(ev.target.result);
    reader.readAsText(file);
  };

  const statusColor = (s) => ({ normal: '#10b981', high: '#ef4444', low: '#f59e0b', critical: '#dc2626' }[s] || '#94a3b8');
  const statusBg = (s) => ({ normal: '#f0fdf4', high: '#fef2f2', low: '#fffbeb', critical: '#fff1f1' }[s] || '#f8fafd');
  const statusIcon = (s) => ({ normal: '✅', high: '⬆️', low: '⬇️', critical: '🚨' }[s] || '•');
  const urgencyConfig = { routine: { color: '#10b981', bg: '#f0fdf4', label: '📋 Routine Follow-up' }, soon: { color: '#f59e0b', bg: '#fffbeb', label: '⚠️ See Doctor Soon' }, urgent: { color: '#ef4444', bg: '#fef2f2', label: '🚨 Seek Care Promptly' } };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>AI POWERED</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>🔬 Medical Report Reader</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Paste your lab report and get a plain-language AI explanation of every value</p>
      </div>

      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[{ id: 'paste', label: '📋 Paste Report' }, { id: 'demo', label: '🧪 Try Demo Report' }].map(m => (
                <button key={m.id} onClick={() => { setMode(m.id); if (m.id === 'demo') setReport(SAMPLE_REPORT); else setReport(''); }}
                  style={{ padding: '8px 18px', borderRadius: '20px', border: `1.5px solid ${mode === m.id ? '#0891b2' : '#e2e8f0'}`, background: mode === m.id ? '#ecfeff' : 'white', color: mode === m.id ? '#0891b2' : '#4a5568', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  {m.label}
                </button>
              ))}
              <button onClick={() => fileRef.current?.click()}
                style={{ padding: '8px 18px', borderRadius: '20px', border: '1.5px solid #e2e8f0', background: 'white', color: '#4a5568', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                📁 Upload .txt File
              </button>
              <input ref={fileRef} type="file" accept=".txt,.csv" onChange={handleFile} style={{ display: 'none' }} />
            </div>

            <textarea value={report} onChange={e => setReport(e.target.value)}
              placeholder="Paste your lab report here — blood count, metabolic panel, lipid panel, thyroid, etc."
              style={{ width: '100%', height: '200px', padding: '14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'monospace', outline: 'none', resize: 'vertical', lineHeight: '1.7', boxSizing: 'border-box' }} />

            {error && <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '12px' }}>⚠️ {error}</div>}

            <button onClick={() => analyzeReport(report)} disabled={loading || !report.trim()}
              style={{ width: '100%', marginTop: '14px', padding: '14px', background: report.trim() ? 'linear-gradient(135deg,#0891b2,#0e7490)' : '#e2e8f0', color: report.trim() ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: report.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Outfit',sans-serif" }}>
              {loading ? '🤖 AI is reading your report...' : '🔬 Explain My Report with AI'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary + Urgency */}
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', background: urgencyConfig[result.urgency]?.bg, color: urgencyConfig[result.urgency]?.color, padding: '6px 14px', borderRadius: '20px', border: `1px solid ${urgencyConfig[result.urgency]?.color}30` }}>
                {urgencyConfig[result.urgency]?.label}
              </div>
            </div>
            <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: 0 }}>{result.summary}</p>
          </div>

          {/* All values */}
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '16px' }}>🧪 Your Test Values Explained</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.values?.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px', borderRadius: '12px', background: statusBg(v.status), border: `1px solid ${statusColor(v.status)}25` }}>
                  <div style={{ fontSize: '18px', flexShrink: 0 }}>{statusIcon(v.status)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#1a202c' }}>{v.name}</span>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: statusColor(v.status) }}>{v.value} {v.unit}</span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: statusColor(v.status), background: 'white', padding: '2px 7px', borderRadius: '20px' }}>{v.status.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4a5568', lineHeight: '1.6' }}>{v.meaning}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concerns & Positives */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#fef2f2', borderRadius: '16px', padding: '20px', border: '1px solid #fecaca' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#dc2626', marginBottom: '12px' }}>⚠️ Areas of Concern</div>
              {result.concerns?.map((c, i) => <div key={i} style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6', marginBottom: '6px', paddingLeft: '10px', borderLeft: '2px solid #ef4444' }}>{c}</div>)}
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '20px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#16a34a', marginBottom: '12px' }}>✅ Good News</div>
              {result.positives?.map((p, i) => <div key={i} style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6', marginBottom: '6px', paddingLeft: '10px', borderLeft: '2px solid #10b981' }}>{p}</div>)}
            </div>
          </div>

          {/* Next Steps */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '12px' }}>📋 Recommended Next Steps</div>
            {result.nextSteps?.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#1b6ca8', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{s}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>⚠️ {result.disclaimer}</p>
          <button onClick={() => { setResult(null); setReport(''); }} style={{ padding: '12px', background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>← Analyze Another Report</button>
        </div>
      )}
    </div>
  );
}
