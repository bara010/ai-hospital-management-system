import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patients as patientsApi, healthAnalysis } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Chest pain', 'Shortness of breath', 'Headache',
  'Dizziness', 'Eye pain', 'Blurred vision', 'Ear pain', 'Sore throat',
  'Back pain', 'Joint pain', 'Stomach pain', 'Nausea', 'Vomiting',
  'Diarrhea', 'Rash', 'Itching', 'Anxiety', 'Fatigue',
  'Frequent urination', 'Tooth pain', 'Bleeding gums', 'Palpitations',
  'Numbness', 'Swelling', 'Weight loss', 'Insomnia',
];

const DISEASE_OPTIONS = [
  'Diabetes', 'Hypertension / BP', 'Heart Disease', 'Asthma',
  'Thyroid Disorder', 'Kidney Disease', 'Liver Disease', 'Arthritis',
  'Cancer', 'Depression / Anxiety', 'Epilepsy', 'None',
];

const DURATIONS = ['Less than 1 day', '1–3 days', '3–7 days', '1–2 weeks', 'More than 2 weeks', 'Chronic / Ongoing'];

const EMERGENCY_LEVELS = [
  { value: 'NORMAL',   label: '🟢 Normal',   desc: 'Mild, non-urgent symptoms' },
  { value: 'MODERATE', label: '🟡 Moderate', desc: 'Noticeable discomfort' },
  { value: 'HIGH',     label: '🔴 High',     desc: 'Significant pain or concern' },
  { value: 'CRITICAL', label: '🆘 Critical', desc: 'Emergency — seek help now' },
];

export default function HealthInputForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patientId, setPatientId] = useState(null);
  const [form, setForm] = useState({
    age: '',
    weightKg: '',
    symptoms: [],
    customSymptom: '',
    symptomDuration: '',
    existingDiseases: [],
    emergencyLevel: 'NORMAL',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1=input, 2=result

  useEffect(() => {
    if (user) {
      patientsApi.getByUserId(user.id)
        .then(r => {
          setPatientId(r.data.id);
          if (r.data.age) setForm(f => ({ ...f, age: r.data.age }));
          if (r.data.weightKg) setForm(f => ({ ...f, weightKg: r.data.weightKg }));
        })
        .catch(() => {});
    }
  }, [user]);

  const toggleSymptom = (s) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s]
    }));
  };

  const toggleDisease = (d) => {
    setForm(f => ({
      ...f,
      existingDiseases: f.existingDiseases.includes(d)
        ? f.existingDiseases.filter(x => x !== d)
        : [...f.existingDiseases, d]
    }));
  };

  const handleSubmit = async () => {
    if (!patientId) { setError('Patient profile not found. Please complete registration.'); return; }
    const allSymptoms = [...form.symptoms, form.customSymptom].filter(Boolean).join(', ').toLowerCase();
    if (!allSymptoms) { setError('Please select at least one symptom.'); return; }
    setLoading(true); setError('');

    try {
      const payload = {
        symptoms: allSymptoms,
        symptomDuration: form.symptomDuration,
        existingDiseases: form.existingDiseases.join(', '),
        weightKg: parseFloat(form.weightKg) || 0,
        emergencyLevel: form.emergencyLevel,
      };
      // Update patient profile first
      if (form.age) await patientsApi.update(patientId, { age: parseInt(form.age), weightKg: parseFloat(form.weightKg) || 0 });
      // Run analysis
      const r = await healthAnalysis.analyze(patientId, payload);
      setResult(r.data);
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (score) => {
    if (score >= 75) return '#dc2626';
    if (score >= 55) return '#f59e0b';
    if (score >= 35) return '#3b82f6';
    return '#16a34a';
  };

  const emergencyBg = (level) => {
    if (level === 'CRITICAL') return 'linear-gradient(135deg,#dc2626,#991b1b)';
    if (level === 'HIGH')     return 'linear-gradient(135deg,#f59e0b,#d97706)';
    if (level === 'MODERATE') return 'linear-gradient(135deg,#3b82f6,#2563eb)';
    return 'linear-gradient(135deg,#16a34a,#15803d)';
  };

  const S = {
    page: { minHeight: '100vh', background: '#f0f4f8', padding: '32px 16px', fontFamily: "'Outfit',sans-serif" },
    card: { maxWidth: 720, margin: '0 auto', background: 'white', borderRadius: 24, padding: 40, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' },
    title: { fontSize: 28, fontWeight: 800, color: '#1a202c', marginBottom: 4 },
    sub: { fontSize: 14, color: '#64748b', marginBottom: 32 },
    label: { fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'block' },
    input: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
    section: { marginBottom: 28 },
    chipGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    chip: (sel) => ({
      padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${sel ? '#3b82f6' : '#e5e7eb'}`,
      background: sel ? '#eff6ff' : 'white', color: sel ? '#1d4ed8' : '#374151',
      cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
    }),
    btn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg,#1b6ca8,#0ea5e9)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 },
    resultBanner: (level) => ({
      background: emergencyBg(level), borderRadius: 16, padding: '24px 28px', color: 'white', marginBottom: 24
    }),
    scoreRing: (score) => ({ width: 80, height: 80, borderRadius: '50%', background: `conic-gradient(${severityColor(score)} ${score * 3.6}deg, #e5e7eb 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }),
    recs: { background: '#f8fafc', borderRadius: 14, padding: 20, marginTop: 16 },
  };

  if (step === 2 && result) {
    const recs = result.recommendations || [];
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div style={S.title}>🔬 Analysis Complete</div>
              <div style={S.sub}>Based on your symptoms, here's what we found</div>
            </div>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: '1.5px solid #e5e7eb', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>← Edit</button>
          </div>

          {/* Emergency Banner */}
          <div style={S.resultBanner(result.emergencyLevel)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, letterSpacing: 1, marginBottom: 6 }}>EMERGENCY LEVEL</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{result.emergencyLevel}</div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>{result.predictedCondition}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>SEVERITY</div>
                <div style={{ fontSize: 36, fontWeight: 900 }}>{result.severityScore}%</div>
              </div>
            </div>
          </div>

          {/* Department Recommendation */}
          <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', letterSpacing: 1, marginBottom: 6 }}>RECOMMENDED SPECIALIST</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0c4a6e' }}>🏥 {result.departmentLabel}</div>
          </div>

          {/* Recommendations */}
          {recs.length > 0 && (
            <div style={S.recs}>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: 12 }}>📋 What to do next</div>
              {recs.map((r, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < recs.length - 1 ? '1px solid #e5e7eb' : 'none', fontSize: 14, color: '#4b5563' }}>{r}</div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={() => navigate('/appointments')}
              style={{ ...S.btn, flex: 1, background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              📅 Book Appointment
            </button>
            <button onClick={() => navigate('/')}
              style={{ ...S.btn, flex: 1, background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              🏠 Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.title}>🩺 Smart Health Assessment</div>
        <div style={S.sub}>Tell us about your symptoms and we'll suggest the right specialist for you</div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{error}</div>}

        {/* Age & Weight */}
        <div style={{ ...S.section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={S.label}>Age (years)</label>
            <input type="number" placeholder="e.g. 35" value={form.age}
              onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Weight (kg)</label>
            <input type="number" placeholder="e.g. 70" value={form.weightKg}
              onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))} style={S.input} />
          </div>
        </div>

        {/* Symptoms */}
        <div style={S.section}>
          <label style={S.label}>Symptoms (select all that apply)</label>
          <div style={S.chipGrid}>
            {SYMPTOM_OPTIONS.map(s => (
              <div key={s} style={S.chip(form.symptoms.includes(s))} onClick={() => toggleSymptom(s)}>{s}</div>
            ))}
          </div>
          <input placeholder="+ Add custom symptom" value={form.customSymptom}
            onChange={e => setForm(f => ({ ...f, customSymptom: e.target.value }))}
            style={{ ...S.input, marginTop: 12 }} />
        </div>

        {/* Duration */}
        <div style={S.section}>
          <label style={S.label}>Duration of Symptoms</label>
          <div style={S.chipGrid}>
            {DURATIONS.map(d => (
              <div key={d} style={S.chip(form.symptomDuration === d)} onClick={() => setForm(f => ({ ...f, symptomDuration: d }))}>{d}</div>
            ))}
          </div>
        </div>

        {/* Existing Diseases */}
        <div style={S.section}>
          <label style={S.label}>Existing Conditions / Diseases</label>
          <div style={S.chipGrid}>
            {DISEASE_OPTIONS.map(d => (
              <div key={d} style={S.chip(form.existingDiseases.includes(d))} onClick={() => toggleDisease(d)}>{d}</div>
            ))}
          </div>
        </div>

        {/* Emergency Level */}
        <div style={S.section}>
          <label style={S.label}>How urgent is your situation?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {EMERGENCY_LEVELS.map(e => (
              <div key={e.value} onClick={() => setForm(f => ({ ...f, emergencyLevel: e.value }))}
                style={{ padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  border: `2px solid ${form.emergencyLevel === e.value ? '#3b82f6' : '#e5e7eb'}`,
                  background: form.emergencyLevel === e.value ? '#eff6ff' : 'white' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{e.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? '🔍 Analyzing your symptoms...' : '🔬 Analyze & Get Doctor Recommendation'}
        </button>
      </div>
    </div>
  );
}
