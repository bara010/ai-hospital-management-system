import React, { useState, useRef } from 'react';
import { discharge as dischargeApi, audit } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DischargeSummary() {
  const { user } = useAuth();
  const [form, setForm] = useState({ patientName: '', age: '', gender: '', admissionDate: '', dischargeDate: '', admissionDiagnosis: '', finalDiagnosis: '', treatmentGiven: '', medicationsOnDischarge: '', doctorName: user?.role === 'DOCTOR' ? user?.name : '', followUpDate: '', specialInstructions: '' });
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    const required = ['patientName', 'admissionDiagnosis', 'finalDiagnosis', 'treatmentGiven'];
    if (required.some(k => !form[k].trim())) { setError('Please fill in Patient Name, Diagnoses, and Treatment fields.'); return; }
    setError(''); setLoading(true);

    const prompt = `You are a senior hospital physician. Generate a professional, structured hospital discharge summary for this patient.

Patient Details:
- Name: ${form.patientName}
- Age: ${form.age || 'Not specified'}, Gender: ${form.gender || 'Not specified'}
- Admission Date: ${form.admissionDate || 'Not specified'}
- Discharge Date: ${form.dischargeDate || 'Not specified'}
- Admitting Diagnosis: ${form.admissionDiagnosis}
- Final Diagnosis: ${form.finalDiagnosis}
- Treatment Given: ${form.treatmentGiven}
- Medications on Discharge: ${form.medicationsOnDischarge || 'None specified'}
- Attending Physician: ${form.doctorName || 'Not specified'}
- Follow-up Date: ${form.followUpDate || 'Not specified'}
- Special Instructions: ${form.specialInstructions || 'None'}

Write a complete, formal medical discharge summary with these sections:
1. PATIENT INFORMATION
2. CLINICAL HISTORY & PRESENTATION
3. INVESTIGATIONS & FINDINGS
4. DIAGNOSIS
5. TREATMENT SUMMARY
6. CONDITION AT DISCHARGE
7. MEDICATIONS ON DISCHARGE (with dosage and frequency)
8. DISCHARGE INSTRUCTIONS
9. FOLLOW-UP PLAN
10. PHYSICIAN'S NOTE

Use professional medical language. Be specific and thorough. Format with clear section headers using ALL CAPS.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || 'Generation failed.';
      setSummary(text);
      // Persist to backend
      dischargeApi.save({ patientId: user?.id, ...form, summaryText: text }).catch(() => {});
      audit.log({ userEmail: user?.email, userName: user?.name, userRole: user?.role,
        action: 'GENERATE_DISCHARGE', resource: `Patient: ${form.patientName}`,
        status: 'SUCCESS', details: 'Discharge summary generated via AI' }).catch(() => {});
    } catch {
      setError('AI generation failed. Check your API key in Layout.jsx.');
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Discharge Summary - ${form.patientName}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1a202c;line-height:1.7}h1{color:#0f4c75;border-bottom:3px solid #1b6ca8;padding-bottom:12px}pre{white-space:pre-wrap;font-family:inherit;font-size:14px}.header{background:#f0f7ff;border:1px solid #d0e8ff;padding:16px;border-radius:8px;margin-bottom:24px}@media print{body{padding:20px}}</style></head><body><h1>🏥 MediPulse — Discharge Summary</h1><div class="header"><strong>Patient:</strong> ${form.patientName} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</div><pre>${summary}</pre></body></html>`);
    w.document.close(); w.print();
  };

  const inp = (label, key, placeholder, type = 'text', required = false) => (
    <div>
      <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }} />
    </div>
  );

  const ta = (label, key, placeholder, required = false, rows = 3) => (
    <div>
      <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <textarea value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", resize: 'vertical', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>AI DOCUMENT GENERATOR</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>📄 Discharge Summary</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Fill in patient details and AI will generate a complete, professional discharge summary document</p>
      </div>

      {!summary ? (
        <div style={{ background: 'white', borderRadius: '18px', padding: '28px', border: '1px solid #f0f4f8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {inp('PATIENT NAME', 'patientName', 'Full name', 'text', true)}
            {inp('ATTENDING DOCTOR', 'doctorName', 'Dr. Name')}
            {inp('AGE', 'age', '45', 'number')}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>GENDER</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'white' }}>
                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            {inp('ADMISSION DATE', 'admissionDate', '', 'date')}
            {inp('DISCHARGE DATE', 'dischargeDate', '', 'date')}
          </div>
          <div style={{ display: 'grid', gap: '14px', marginBottom: '14px' }}>
            {ta('ADMITTING DIAGNOSIS', 'admissionDiagnosis', 'e.g. Acute febrile illness with suspected dengue fever', true)}
            {ta('FINAL DIAGNOSIS', 'finalDiagnosis', 'e.g. Dengue fever — confirmed by NS1 antigen test', true)}
            {ta('TREATMENT GIVEN', 'treatmentGiven', 'e.g. IV fluids, Paracetamol 500mg TDS, Platelet monitoring...', true, 4)}
            {ta('MEDICATIONS ON DISCHARGE', 'medicationsOnDischarge', 'e.g. Tab Paracetamol 500mg TID × 5 days, Syp Iron 10ml OD...')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {inp('FOLLOW-UP DATE', 'followUpDate', '', 'date')}
            </div>
            {ta('SPECIAL INSTRUCTIONS', 'specialInstructions', 'e.g. Avoid strenuous activity for 2 weeks, drink plenty of fluids...')}
          </div>

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', border: '1px solid #fecaca' }}>⚠️ {error}</div>}

          <button onClick={generate} disabled={loading} style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            {loading ? '🤖 Generating professional summary with AI...' : '📄 Generate Discharge Summary with AI'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button onClick={() => setSummary('')} style={{ padding: '10px 18px', background: '#f8fafd', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontFamily: "'Outfit',sans-serif" }}>← Edit Details</button>
            <button onClick={handlePrint} style={{ padding: '10px 18px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontFamily: "'Outfit',sans-serif' " }}>🖨️ Print / Export PDF</button>
          </div>
          <div ref={printRef} style={{ background: 'white', borderRadius: '18px', padding: '32px', border: '1px solid #f0f4f8', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
            <div style={{ borderBottom: '3px solid #1b6ca8', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px' }}>✚</div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f4c75', fontFamily: 'Georgia,serif' }}>MediPulse</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px' }}>HOSPITAL DISCHARGE SUMMARY</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#718096' }}>
                <span>Patient: <strong style={{ color: '#1a202c' }}>{form.patientName}</strong></span>
                <span>Generated: <strong style={{ color: '#1a202c' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: "'Outfit',sans-serif", fontSize: '13.5px', lineHeight: '1.8', color: '#374151', margin: 0 }}>{summary}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
