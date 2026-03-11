import React, { useState, useEffect } from 'react';
import { doctors as doctorsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DOCTORS = [
  {
    id: 1, name: 'Dr. Priya Sharma', specialty: 'Cardiologist', dept: 'Cardiology',
    icon: '👩‍⚕️', rating: 4.8, totalPatients: 312, todayAppointments: 14,
    avgWaitMin: 8, satisfactionScore: 94, completedThisMonth: 178,
    noShowRate: 4.2, readmissionRate: 3.1, revenueK: 284,
    trend: 'up', weeklyLoad: [12, 14, 11, 16, 13, 10, 14],
    tags: ['Top Performer', 'Patient Favorite'],
  },
  {
    id: 2, name: 'Dr. Arjun Mehta', specialty: 'Neurologist', dept: 'Neurology',
    icon: '👨‍⚕️', rating: 4.6, totalPatients: 228, todayAppointments: 10,
    avgWaitMin: 12, satisfactionScore: 88, completedThisMonth: 132,
    noShowRate: 6.8, readmissionRate: 5.2, revenueK: 196,
    trend: 'up', weeklyLoad: [8, 10, 9, 12, 11, 7, 10],
    tags: ['Research Lead'],
  },
  {
    id: 3, name: 'Dr. Kavita Nair', specialty: 'Orthopedic Surgeon', dept: 'Orthopedics',
    icon: '👩‍⚕️', rating: 4.9, totalPatients: 421, todayAppointments: 18,
    avgWaitMin: 6, satisfactionScore: 97, completedThisMonth: 246,
    noShowRate: 2.1, readmissionRate: 1.8, revenueK: 412,
    trend: 'up', weeklyLoad: [15, 18, 16, 20, 17, 12, 18],
    tags: ['Top Performer', 'Lowest No-Show'],
  },
  {
    id: 4, name: 'Dr. Rajesh Kumar', specialty: 'General Medicine', dept: 'General',
    icon: '👨‍⚕️', rating: 4.4, totalPatients: 518, todayAppointments: 22,
    avgWaitMin: 18, satisfactionScore: 79, completedThisMonth: 310,
    noShowRate: 9.4, readmissionRate: 7.2, revenueK: 168,
    trend: 'down', weeklyLoad: [20, 22, 19, 24, 21, 16, 22],
    tags: ['Highest Volume', 'Needs Attention'],
  },
];

function MiniBarChart({ data, color }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '36px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: `${color}30`, borderRadius: '3px 3px 0 0', position: 'relative', height: `${(v / max) * 36}px`, minHeight: '4px' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: color, borderRadius: '3px 3px 0 0', height: i === data.length - 1 ? '100%' : '60%', opacity: i === data.length - 1 ? 1 : 0.5 }} />
        </div>
      ))}
    </div>
  );
}

function RatingStars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: '12px', color: i <= Math.round(rating) ? '#f59e0b' : '#e2e8f0' }}>★</span>
      ))}
    </div>
  );
}

function GaugeBar({ value, max = 100, color, label, danger }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = danger ? (value > 8 ? '#ef4444' : value > 5 ? '#f59e0b' : '#10b981') : color;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: barColor }}>{value}{danger ? '%' : ''}</span>
      </div>
      <div style={{ height: '6px', background: '#f0f4f8', borderRadius: '99px' }}>
        <div style={{ height: '6px', width: `${pct}%`, background: barColor, borderRadius: '99px', transition: 'width 0.6s' }} />
      </div>
    </div>
  );
}

export default function DoctorPerformance() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(DOCTORS[0]);
  const [sortBy, setSortBy] = useState('satisfactionScore');

  const sorted = [...DOCTORS].sort((a, b) => b[sortBy] - a[sortBy]);

  const tagColor = (tag) => {
    if (tag === 'Top Performer') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
    if (tag === 'Patient Favorite') return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    if (tag === 'Needs Attention') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    if (tag === 'Highest Volume') return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>ADMIN DASHBOARD · PRO</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>👨‍⚕️ Doctor Performance</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Real-time KPIs, satisfaction scores, and workflow analytics across your medical team</p>
      </div>

      {/* Hospital-wide KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { icon: '👥', val: DOCTORS.reduce((s,d)=>s+d.totalPatients,0).toLocaleString(), label: 'Total Patients Served', color: '#1b6ca8' },
          { icon: '⭐', val: (DOCTORS.reduce((s,d)=>s+d.rating,0)/DOCTORS.length).toFixed(1), label: 'Avg Doctor Rating', color: '#f59e0b' },
          { icon: '📅', val: DOCTORS.reduce((s,d)=>s+d.todayAppointments,0), label: "Today's Appointments", color: '#10b981' },
          { icon: '💰', val: `₹${DOCTORS.reduce((s,d)=>s+d.revenueK,0)}K`, label: 'Monthly Revenue', color: '#6c63ff' },
        ].map((s,i) => (
          <div key={i} style={{ background: 'white', borderRadius: '18px', padding: '20px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        {/* Doctor Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Sort Controls */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'satisfactionScore', label: '⭐ Satisfaction' },
              { key: 'totalPatients', label: '👥 Patients' },
              { key: 'revenueK', label: '💰 Revenue' },
              { key: 'noShowRate', label: '🚫 No-Show (asc)' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setSortBy(key)}
                style={{ padding: '7px 14px', borderRadius: '20px', border: `1.5px solid ${sortBy === key ? '#1b6ca8' : '#e2e8f0'}`, background: sortBy === key ? '#eff6ff' : 'white', color: sortBy === key ? '#1b6ca8' : '#4a5568', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                {label}
              </button>
            ))}
          </div>

          {sorted.map((doc, idx) => (
            <div key={doc.id}
              onClick={() => setSelected(doc)}
              style={{ background: 'white', borderRadius: '18px', padding: '20px 22px', border: `1.5px solid ${selected.id === doc.id ? '#1b6ca8' : '#f0f4f8'}`, boxShadow: selected.id === doc.id ? '0 4px 24px rgba(27,108,168,0.12)' : '0 2px 8px rgba(0,0,0,.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Rank */}
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#94a3b8', width: '24px' }}>#{idx+1}</div>
                {/* Avatar */}
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{doc.icon}</div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c' }}>{doc.name}</span>
                    {doc.tags.map(tag => {
                      const tc = tagColor(tag);
                      return <span key={tag} style={{ fontSize: '10px', fontWeight: '700', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, padding: '2px 7px', borderRadius: '20px' }}>{tag}</span>;
                    })}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{doc.specialty} · {doc.dept}</div>
                  <RatingStars rating={doc.rating} />
                </div>
                {/* Mini chart */}
                <div style={{ width: '80px' }}>
                  <MiniBarChart data={doc.weeklyLoad} color={doc.trend === 'up' ? '#10b981' : '#ef4444'} />
                </div>
                {/* Score */}
                <div style={{ textAlign: 'right', minWidth: '60px' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: doc.satisfactionScore >= 90 ? '#10b981' : doc.satisfactionScore >= 80 ? '#f59e0b' : '#ef4444', letterSpacing: '-1px' }}>{doc.satisfactionScore}%</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Satisfaction</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Doctor Detail */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 12px' }}>{selected.icon}</div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#1a202c' }}>{selected.name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{selected.specialty}</div>
            <RatingStars rating={selected.rating} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{selected.rating} / 5.0</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Today', val: selected.todayAppointments, icon: '📅' },
              { label: 'This Month', val: selected.completedThisMonth, icon: '✅' },
              { label: 'Avg Wait', val: `${selected.avgWaitMin}m`, icon: '⏱️' },
              { label: 'Revenue', val: `₹${selected.revenueK}K`, icon: '💰' },
            ].map((s,i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '12px', background: '#f8fafd', textAlign: 'center' }}>
                <div style={{ fontSize: '16px' }}>{s.icon}</div>
                <div style={{ fontWeight: '800', fontSize: '17px', color: '#1a202c', lineHeight: 1.2 }}>{s.val}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <GaugeBar value={selected.satisfactionScore} label="Patient Satisfaction" color="#10b981" />
            <GaugeBar value={selected.noShowRate} max={20} label="No-Show Rate" danger />
            <GaugeBar value={selected.readmissionRate} max={15} label="Readmission Rate" danger />
          </div>

          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: selected.trend === 'up' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${selected.trend === 'up' ? '#bbf7d0' : '#fecaca'}` }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: selected.trend === 'up' ? '#16a34a' : '#dc2626' }}>
              {selected.trend === 'up' ? '📈 Performance trending upward this week' : '📉 Performance needs attention this week'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
