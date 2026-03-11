import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { medicines as medicinesApi } from '../services/api';

// ── Utility: generate mock adherence data ─────────────────────────────────────
function generateHeatmapData(weeks = 12) {
  const data = [];
  const now = new Date();
  for (let w = weeks - 1; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() - w * 7 - (6 - d));
      const isFuture = date > now;
      week.push({
        date,
        taken: isFuture ? null : Math.random() > 0.18,
        skipped: isFuture ? null : Math.random() > 0.85,
      });
    }
    data.push(week);
  }
  return data;
}

const MEDICATIONS = [
  { id: 1, name: 'Metformin', dose: '500mg', frequency: 'Twice daily', time: ['8:00 AM', '8:00 PM'], color: '#6c63ff', category: 'Diabetes', streak: 14, totalDays: 90, takenDays: 82 },
  { id: 2, name: 'Lisinopril', dose: '10mg', frequency: 'Once daily', time: ['7:00 AM'], color: '#1b6ca8', category: 'Blood Pressure', streak: 7, totalDays: 60, takenDays: 57 },
  { id: 3, name: 'Atorvastatin', dose: '20mg', frequency: 'Once daily', time: ['9:00 PM'], color: '#10b981', category: 'Cholesterol', streak: 21, totalDays: 45, takenDays: 44 },
  { id: 4, name: 'Aspirin', dose: '81mg', frequency: 'Once daily', time: ['8:00 AM'], color: '#ef4444', category: 'Cardiac', streak: 3, totalDays: 30, takenDays: 26 },
];

function HeatmapCell({ cell }) {
  const [hovered, setHovered] = useState(false);
  const bg = cell.date > new Date()
    ? '#f0f4f8'
    : cell.taken
      ? '#10b981'
      : cell.skipped
        ? '#f59e0b'
        : '#fecaca';

  const label = cell.date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={{
        width: '14px', height: '14px', borderRadius: '3px',
        background: bg, cursor: 'pointer', transition: 'transform 0.15s',
        transform: hovered ? 'scale(1.3)' : 'scale(1)',
      }} />
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a202c', color: 'white', padding: '4px 8px', borderRadius: '6px',
          fontSize: '10px', whiteSpace: 'nowrap', zIndex: 10, fontWeight: '600',
        }}>
          {label}: {cell.date > new Date() ? 'Future' : cell.taken ? '✅ Taken' : cell.skipped ? '⚠️ Late' : '❌ Missed'}
        </div>
      )}
    </div>
  );
}

function StreakBadge({ streak }) {
  const color = streak >= 21 ? '#f59e0b' : streak >= 14 ? '#6c63ff' : streak >= 7 ? '#10b981' : '#1b6ca8';
  const label = streak >= 21 ? '🏆 Legend' : streak >= 14 ? '⭐ Champion' : streak >= 7 ? '🔥 On Fire' : '✅ Active';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color }}>
        {streak}
      </div>
      <div style={{ fontSize: '9px', fontWeight: '700', color, letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

export default function MedicationAdherence() {
  const { user } = useAuth();
  const [heatmap] = useState(generateHeatmapData(12));
  const [medications, setMedications] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [loadingMeds, setLoadingMeds] = useState(true);

  useEffect(() => {
    if (user?.id) {
      medicinesApi.getByPatient(user.id).then(res => {
        const data = res.data || [];
        const active = data.filter(m => m.active);
        const mapped = active.map((m, i) => ({
          id: m.id,
          name: m.medicineName,
          dose: m.dose || '',
          frequency: m.timeOfDay || 'Daily',
          time: `${String(m.reminderHour ?? 8).padStart(2,'0')}:${String(m.reminderMinute ?? 0).padStart(2,'0')}`,
          color: ['#6c63ff','#10b981','#f59e0b','#ef4444','#3b82f6'][i % 5],
          category: 'Prescribed',
          streak: 0, totalDays: 30, takenDays: 0,
        }));
        setMedications(mapped);
        setSelectedMed(mapped[0] || null);
      }).catch(() => {}).finally(() => setLoadingMeds(false));
    } else {
      setLoadingMeds(false);
    }
  }, [user?.id]);
  const [todayLog, setTodayLog] = useState({});

  const overall = medications.length > 0
    ? Math.round(medications.reduce((s, m) => s + ((m.takenDays || 0) / (m.totalDays || 1)), 0) / medications.length * 100)
    : 0;
  const bestStreak = medications.length > 0 ? Math.max(...medications.map(m => m.streak || 0)) : 0;

  const markTaken = (medId, time) => {
    setTodayLog(prev => ({ ...prev, [`${medId}-${time}`]: 'taken' }));
  };

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6c63ff,#4c46cc)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>PRO FEATURE</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>💊 Medication Adherence</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Track every dose, build streaks, and see your full adherence history</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { icon: '📊', val: `${overall}%`, label: 'Overall Adherence', color: overall >= 90 ? '#10b981' : overall >= 75 ? '#f59e0b' : '#ef4444' },
          { icon: '🔥', val: bestStreak, label: 'Best Streak (days)', color: '#f59e0b' },
          { icon: '💊', val: medications.length, label: 'Active Medications', color: '#6c63ff' },
          { icon: '✅', val: `${medications.reduce((s,m)=>s+m.takenDays,0)}`, label: 'Total Doses Taken', color: '#1b6ca8' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '18px', padding: '20px', border: '1px solid #f0f4f8', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', marginBottom: '16px' }}>
        {/* Adherence Heatmap */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>📅 12-Week Adherence Heatmap</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Hover each cell for details</div>

          {/* Day labels */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', paddingLeft: '4px' }}>
            {days.map((d, i) => <div key={i} style={{ width: '14px', fontSize: '10px', color: '#94a3b8', textAlign: 'center', fontWeight: '600' }}>{d}</div>)}
          </div>

          {/* Heatmap grid */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {heatmap.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {week.map((cell, di) => <HeatmapCell key={di} cell={cell} />)}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'center' }}>
            {[['#10b981','Taken'],['#f59e0b','Late'],['#fecaca','Missed'],['#f0f4f8','Future']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Streak Board */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>🏆 Streak Leaderboard</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Your medication consistency</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...medications].sort((a,b) => b.streak - a.streak).map((med, idx) => (
              <div key={med.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: selectedMed.id === med.id ? `${med.color}08` : '#f8fafd', border: `1px solid ${selectedMed.id === med.id ? med.color : '#f0f4f8'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => setSelectedMed(med)}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#94a3b8', width: '20px' }}>#{idx+1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a202c' }}>{med.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{med.dose} · {med.category}</div>
                  <div style={{ height: '4px', background: '#f0f4f8', borderRadius: '99px', marginTop: '6px' }}>
                    <div style={{ height: '4px', width: `${Math.round(med.takenDays/med.totalDays*100)}%`, background: med.color, borderRadius: '99px', transition: 'width 0.6s' }} />
                  </div>
                </div>
                <StreakBadge streak={med.streak} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Doses */}
      <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
        <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>⏰ Today's Doses</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Mark each dose as taken</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {medications.flatMap(med =>
            med.time.map(t => {
              const key = `${med.id}-${t}`;
              const done = !!todayLog[key];
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px', border: `1.5px solid ${done ? med.color : '#e2e8f0'}`, background: done ? `${med.color}08` : 'white', transition: 'all 0.2s' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${med.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a202c' }}>{med.name} {med.dose}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>⏰ {t} · {med.category}</div>
                  </div>
                  <button onClick={() => markTaken(med.id, t)} disabled={done}
                    style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', background: done ? '#f0fdf4' : med.color, color: done ? '#16a34a' : 'white', fontWeight: '700', fontSize: '12px', cursor: done ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s' }}>
                    {done ? '✅ Taken' : 'Mark Taken'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
