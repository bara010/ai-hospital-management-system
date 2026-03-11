import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patients as patientsApi } from '../services/api';

// Mock patient risk profiles
const PATIENTS = [
  {
    id: 1, name: 'Rahul Verma', age: 58, gender: 'M',
    readmissionRisk: 72, noShowRisk: 34, mortalityRisk: 12, deteriorationRisk: 45,
    conditions: ['Type 2 Diabetes', 'Hypertension', 'CKD Stage 2'],
    lastVisit: '3 days ago', nextAppt: 'Mar 10', doctor: 'Dr. Sharma',
    labs: { hba1c: 8.4, creatinine: 1.8, bp: '148/92' },
    riskFactors: ['Medication non-adherence (62%)', 'Elevated HbA1c', 'No caregiver support', 'Low income area'],
    recommendation: 'HIGH RISK — Schedule follow-up within 7 days. Consider case manager assignment.',
  },
  {
    id: 2, name: 'Sunita Patel', age: 44, gender: 'F',
    readmissionRisk: 18, noShowRisk: 8, mortalityRisk: 3, deteriorationRisk: 15,
    conditions: ['Controlled Hypertension'],
    lastVisit: '2 weeks ago', nextAppt: 'Apr 2', doctor: 'Dr. Mehta',
    labs: { hba1c: 5.6, creatinine: 0.9, bp: '128/82' },
    riskFactors: ['Well-controlled vitals', 'High medication adherence'],
    recommendation: 'LOW RISK — Routine follow-up as scheduled.',
  },
  {
    id: 3, name: 'Mohammed Shaikh', age: 71, gender: 'M',
    readmissionRisk: 88, noShowRisk: 55, mortalityRisk: 24, deteriorationRisk: 71,
    conditions: ['CHF Stage 3', 'Atrial Fibrillation', 'COPD', 'T2DM'],
    lastVisit: 'Yesterday', nextAppt: 'Overdue', doctor: 'Dr. Nair',
    labs: { hba1c: 9.1, creatinine: 2.4, bp: '162/96' },
    riskFactors: ['Multiple comorbidities', 'Recent hospitalization', 'Overdue follow-up', 'Lives alone', 'COPD exacerbation risk'],
    recommendation: 'CRITICAL — Immediate outreach required. Consider home health referral.',
  },
  {
    id: 4, name: 'Kavya Reddy', age: 29, gender: 'F',
    readmissionRisk: 22, noShowRisk: 42, mortalityRisk: 1, deteriorationRisk: 12,
    conditions: ['Anemia', 'Anxiety Disorder'],
    lastVisit: '1 month ago', nextAppt: 'Mar 15', doctor: 'Dr. Sharma',
    labs: { hba1c: 5.2, creatinine: 0.7, bp: '118/76' },
    riskFactors: ['High no-show history', 'Missed last 2 appointments'],
    recommendation: 'MODERATE — Send appointment reminder. Consider telehealth option.',
  },
  {
    id: 5, name: 'Arun Krishnan', age: 63, gender: 'M',
    readmissionRisk: 54, noShowRisk: 15, mortalityRisk: 8, deteriorationRisk: 38,
    conditions: ['Post-CABG', 'T2DM', 'Hyperlipidemia'],
    lastVisit: '5 days ago', nextAppt: 'Mar 8', doctor: 'Dr. Nair',
    labs: { hba1c: 7.2, creatinine: 1.1, bp: '136/88' },
    riskFactors: ['Recent cardiac surgery', 'Moderate HbA1c control', 'On anticoagulants'],
    recommendation: 'MODERATE-HIGH — Weekly check-in calls recommended. Monitor INR closely.',
  },
];

function RiskGauge({ value, label, size = 80 }) {
  const color = value >= 70 ? '#ef4444' : value >= 40 ? '#f59e0b' : '#10b981';
  const angle = (value / 100) * 180;
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const startX = cx - r, startY = cy;
  const rad = (angle - 180) * Math.PI / 180;
  const endX = cx + r * Math.cos(rad);
  const endY = cy + r * Math.sin(rad);
  const large = angle > 180 ? 1 : 0;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#f0f4f8" strokeWidth="8" strokeLinecap="round" />
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        <text x={cx} y={cy + 4} textAnchor="middle" style={{ fontSize: '14px', fontWeight: '800', fill: color, fontFamily: "'Outfit',sans-serif" }}>{value}%</text>
      </svg>
      <div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function RiskBadge({ value }) {
  const cfg = value >= 70 ? { color: '#dc2626', bg: '#fef2f2', label: 'CRITICAL' }
    : value >= 50 ? { color: '#c2410c', bg: '#fff7ed', label: 'HIGH' }
    : value >= 30 ? { color: '#d97706', bg: '#fffbeb', label: 'MODERATE' }
    : { color: '#16a34a', bg: '#f0fdf4', label: 'LOW' };
  return <span style={{ fontSize: '10px', fontWeight: '800', color: cfg.color, background: cfg.bg, padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>{cfg.label}</span>;
}

export default function PredictiveRisk() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(PATIENTS[2]); // Default to highest risk
  const [sortBy, setSortBy] = useState('readmissionRisk');

  const sorted = [...PATIENTS].sort((a, b) => b[sortBy] - a[sortBy]);

  const criticalCount = PATIENTS.filter(p => p.readmissionRisk >= 70).length;

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>ML RISK ENGINE · PRO</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>🤖 Predictive Risk Dashboard</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>AI-driven readmission, no-show, and clinical deterioration risk scores for proactive intervention</p>
      </div>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div style={{ background: '#fff1f1', borderRadius: '14px', padding: '14px 20px', border: '1.5px solid #fecaca', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🚨</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#dc2626' }}>{criticalCount} Patient{criticalCount>1?'s':''} at Critical Risk</div>
            <div style={{ fontSize: '12px', color: '#b91c1c' }}>Immediate intervention recommended to prevent adverse outcomes</div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { val: PATIENTS.filter(p=>p.readmissionRisk>=70).length, label: 'Critical Risk Patients', color: '#ef4444', icon: '🚨' },
          { val: `${Math.round(PATIENTS.reduce((s,p)=>s+p.readmissionRisk,0)/PATIENTS.length)}%`, label: 'Avg Readmission Risk', color: '#f59e0b', icon: '🏥' },
          { val: PATIENTS.filter(p=>p.noShowRisk>=40).length, label: 'High No-Show Risk', color: '#8b5cf6', icon: '📅' },
          { val: PATIENTS.length, label: 'Patients Monitored', color: '#1b6ca8', icon: '👥' },
        ].map((s,i) => (
          <div key={i} style={{ background: 'white', borderRadius: '18px', padding: '20px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px' }}>
        {/* Patient Risk List */}
        <div>
          {/* Sort */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { key: 'readmissionRisk', label: '🏥 Readmission' },
              { key: 'noShowRisk', label: '📅 No-Show' },
              { key: 'deteriorationRisk', label: '📉 Deterioration' },
              { key: 'mortalityRisk', label: '⚠️ Mortality' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setSortBy(key)}
                style={{ padding: '7px 14px', borderRadius: '20px', border: `1.5px solid ${sortBy===key?'#1b6ca8':'#e2e8f0'}`, background: sortBy===key?'#eff6ff':'white', color: sortBy===key?'#1b6ca8':'#4a5568', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map((patient, idx) => (
              <div key={patient.id}
                onClick={() => setSelected(patient)}
                style={{ background: 'white', borderRadius: '16px', padding: '18px 20px', border: `1.5px solid ${selected.id===patient.id?'#1b6ca8':'#f0f4f8'}`, boxShadow: selected.id===patient.id?'0 4px 20px rgba(27,108,168,0.12)':'0 2px 8px rgba(0,0,0,.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#94a3b8', width: '20px' }}>#{idx+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c' }}>{patient.name}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{patient.age}{patient.gender}</span>
                      <RiskBadge value={patient.readmissionRisk} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{patient.conditions.join(' · ')} · {patient.doctor}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                      { val: patient.readmissionRisk, label: 'Readmit' },
                      { val: patient.noShowRisk, label: 'No-Show' },
                    ].map((r, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: r.val>=70?'#ef4444':r.val>=40?'#f59e0b':'#10b981', letterSpacing: '-0.5px' }}>{r.val}%</div>
                        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600' }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Detail */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <div style={{ fontWeight: '800', fontSize: '16px', color: '#1a202c', marginBottom: '2px' }}>{selected.name}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>{selected.age}y {selected.gender} · {selected.doctor}</div>

          {/* 4 Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            <RiskGauge value={selected.readmissionRisk} label="Readmission" />
            <RiskGauge value={selected.noShowRisk} label="No-Show" />
            <RiskGauge value={selected.deteriorationRisk} label="Deterioration" />
            <RiskGauge value={selected.mortalityRisk} label="Mortality" />
          </div>

          {/* Labs */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '8px' }}>LATEST LABS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'HbA1c', val: selected.labs.hba1c, danger: selected.labs.hba1c > 7 },
                { label: 'Creatinine', val: selected.labs.creatinine, danger: selected.labs.creatinine > 1.5 },
                { label: 'BP', val: selected.labs.bp, danger: parseInt(selected.labs.bp) > 140 },
              ].map((l,i) => (
                <div key={i} style={{ padding: '10px', borderRadius: '10px', background: l.danger ? '#fff8f8' : '#f8fafd', border: `1px solid ${l.danger ? '#fecaca' : '#f0f4f8'}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: l.danger ? '#dc2626' : '#1a202c' }}>{l.val}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600' }}>{l.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '8px' }}>RISK FACTORS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selected.riskFactors.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', background: '#f8fafd', fontSize: '11px', color: '#374151' }}>
                  <span style={{ color: '#f59e0b', fontSize: '12px' }}>⚠</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          <div style={{ padding: '14px', borderRadius: '12px', background: selected.readmissionRisk >= 70 ? '#fff1f1' : selected.readmissionRisk >= 40 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${selected.readmissionRisk >= 70 ? '#fecaca' : selected.readmissionRisk >= 40 ? '#fde68a' : '#bbf7d0'}` }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>🤖 AI RECOMMENDATION</div>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6', fontWeight: '500' }}>{selected.recommendation}</div>
          </div>

          <button style={{ width: '100%', padding: '12px', marginTop: '12px', borderRadius: '12px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            📋 Create Intervention Plan
          </button>
        </div>
      </div>
    </div>
  );
}
