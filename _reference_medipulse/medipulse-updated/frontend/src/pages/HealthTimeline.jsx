import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mood as moodApi, vitals as vitalsApi, appointments as apptApi, medicines as medApi } from '../services/api';

const TIMELINE_DATA = [
  { date: '2026-02-25', type: 'MOOD', icon: '😊', color: '#3b82f6', title: 'Mood Check — Good', detail: 'Patient reported feeling good today. No complaints.', tag: 'Mood', tagColor: '#3b82f6' },
  { date: '2026-02-24', type: 'MEDICINE', icon: '💊', color: '#6c63ff', title: 'Metformin 500mg — Taken', detail: 'Morning dose confirmed. Adherence: 95% this week.', tag: 'Medicine', tagColor: '#6c63ff' },
  { date: '2026-02-23', type: 'LAB', icon: '🧪', color: '#ef4444', title: 'Lab Results — HbA1c 6.8%', detail: 'HbA1c within target range. Blood glucose: 112 mg/dL (Normal). Reviewed by Dr. Smith.', tag: 'Lab Alert', tagColor: '#ef4444' },
  { date: '2026-02-20', type: 'APPOINTMENT', icon: '📅', color: '#f59e0b', title: 'Appointment — Dr. Smith', detail: 'Regular follow-up. Blood pressure 128/82 mmHg. Weight 74 kg. Next appointment in 1 month.', tag: 'Appointment', tagColor: '#f59e0b' },
  { date: '2026-02-18', type: 'MOOD', icon: '😕', color: '#f97316', title: 'Mood Check — Bad', detail: 'Patient reported fatigue and mild headache. Doctor notified. Recommended rest and hydration.', tag: 'Mood Alert', tagColor: '#f97316' },
  { date: '2026-02-15', type: 'MEDICINE', icon: '💊', color: '#6c63ff', title: 'New Prescription — Amlodipine 5mg', detail: 'Dr. Smith prescribed Amlodipine for blood pressure management. Once daily in the morning.', tag: 'Medicine', tagColor: '#6c63ff' },
  { date: '2026-02-10', type: 'APPOINTMENT', icon: '📅', color: '#f59e0b', title: 'Cardiology Consultation — Dr. Patel', detail: 'ECG normal. No signs of cardiac abnormality. Advised lifestyle changes and low-sodium diet.', tag: 'Appointment', tagColor: '#f59e0b' },
  { date: '2026-02-05', type: 'LAB', icon: '🧪', color: '#ef4444', title: 'Lab Results — Complete Blood Count', detail: 'Hemoglobin 13.2 g/dL (Normal). WBC 7,400 (Normal). Platelet count 230,000 (Normal).', tag: 'Lab', tagColor: '#ef4444' },
  { date: '2026-01-28', type: 'ADMISSION', icon: '🏥', color: '#0f4c75', title: 'Admitted — General Ward', detail: 'Admitted for acute fever (104°F). Treated with IV fluids and antibiotics. Discharged after 2 days.', tag: 'Admission', tagColor: '#0f4c75' },
  { date: '2026-01-20', type: 'MOOD', icon: '😄', color: '#10b981', title: 'Mood Check — Great!', detail: 'Feeling excellent. Energy levels high. No symptoms to report.', tag: 'Mood', tagColor: '#10b981' },
];

const FILTER_TYPES = [
  { id: 'ALL', label: 'All Events', icon: '📋' },
  { id: 'MOOD', label: 'Mood', icon: '💙' },
  { id: 'MEDICINE', label: 'Medicine', icon: '💊' },
  { id: 'LAB', label: 'Lab Results', icon: '🧪' },
  { id: 'APPOINTMENT', label: 'Appointments', icon: '📅' },
  { id: 'ADMISSION', label: 'Admissions', icon: '🏥' },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export default function HealthTimeline() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const [timelineData, setTimelineData] = useState(TIMELINE_DATA);

  useEffect(() => {
    if (!user?.id) return;
    const events = [];
    Promise.all([
      moodApi.getByPatient(user.id).then(res => {
        (res.data || []).forEach(m => events.push({
          date: (m.loggedAt || '').slice(0,10),
          type: 'MOOD',
          icon: m.moodScore >= 7 ? '😄' : m.moodScore >= 5 ? '😊' : m.moodScore >= 3 ? '😐' : '😕',
          color: m.moodScore >= 7 ? '#10b981' : m.moodScore >= 5 ? '#3b82f6' : m.moodScore >= 3 ? '#f59e0b' : '#f97316',
          title: `Mood Check — ${m.moodLabel || m.moodScore + '/10'}`,
          detail: m.note || 'Mood recorded.',
          tag: m.doctorAlerted ? 'Mood Alert' : 'Mood',
          tagColor: m.doctorAlerted ? '#f97316' : '#3b82f6',
        }));
      }).catch(() => {}),
      vitalsApi.getByPatient(user.id).then(res => {
        (res.data || []).forEach(v => events.push({
          date: (v.recordedAt || '').slice(0,10),
          type: 'VITALS',
          icon: '🩺', color: '#6c63ff',
          title: `Vitals — BP ${v.systolic||'?'}/${v.diastolic||'?'} mmHg`,
          detail: `SpO₂: ${v.spo2||'?'}% | HR: ${v.heartRate||'?'} bpm | Sugar: ${v.bloodSugar||'?'} mg/dL | Temp: ${v.temperature||'?'}°C`,
          tag: 'Vitals', tagColor: '#6c63ff',
        }));
      }).catch(() => {}),
      apptApi.getByPatient(user.id).then(res => {
        (res.data || []).forEach(a => events.push({
          date: a.appointmentDate || '',
          type: 'APPOINTMENT',
          icon: '📅', color: '#f59e0b',
          title: `Appointment — ${a.doctor?.user?.name || 'Doctor'}`,
          detail: a.reason || 'Appointment scheduled.',
          tag: 'Appointment', tagColor: '#f59e0b',
        }));
      }).catch(() => {}),
      medApi.getByPatient(user.id).then(res => {
        (res.data || []).slice(0,3).forEach(m => events.push({
          date: new Date().toISOString().slice(0,10),
          type: 'MEDICINE',
          icon: '💊', color: '#6c63ff',
          title: `Prescription — ${m.medicineName} ${m.dose}`,
          detail: `${m.frequency || 'Daily'} | Reminder at ${m.reminderHour||8}:${String(m.reminderMinute||0).padStart(2,'0')}`,
          tag: 'Medicine', tagColor: '#6c63ff',
        }));
      }).catch(() => {}),
    ]).then(() => {
      if (events.length > 0) {
        events.sort((a, b) => b.date.localeCompare(a.date));
        setTimelineData(events);
      }
    });
  }, [user?.id]);

  const filtered = filter === 'ALL' ? timelineData : timelineData.filter(e => e.type === filter);

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>PATIENT RECORD</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>📈 Health Timeline</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Complete chronological history of your health journey — moods, medicines, labs, and appointments</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {FILTER_TYPES.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '8px 14px', borderRadius: '20px', border: `1.5px solid ${filter === f.id ? '#1b6ca8' : '#e2e8f0'}`, background: filter === f.id ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : 'white', color: filter === f.id ? 'white' : '#4a5568', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px', fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s' }}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: '23px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom,#1b6ca8,#e2e8f0)', borderRadius: '1px', zIndex: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {filtered.map((event, i) => (
            <div key={i} style={{ display: 'flex', gap: '20px', paddingBottom: '20px', position: 'relative', cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
              {/* Dot */}
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${event.color}18`, border: `3px solid ${event.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, zIndex: 1, background: 'white', boxShadow: `0 0 0 3px ${event.color}30` }}>
                {event.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, background: 'white', borderRadius: '14px', padding: '14px 18px', border: `1px solid ${expanded === i ? event.color : '#f0f4f8'}`, boxShadow: expanded === i ? `0 4px 16px ${event.color}20` : '0 2px 8px rgba(0,0,0,.04)', transition: 'all 0.2s', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c' }}>{event.title}</span>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: event.tagColor, background: `${event.tagColor}15`, padding: '2px 8px', borderRadius: '20px' }}>{event.tag}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(event.date)}</span>
                </div>
                {expanded === i && (
                  <div style={{ marginTop: '8px', padding: '10px 12px', background: '#f8fafd', borderRadius: '10px', fontSize: '13px', color: '#374151', lineHeight: '1.6', border: '1px solid #f0f4f8', animation: 'expandIn 0.2s ease' }}>
                    {event.detail}
                  </div>
                )}
                {expanded !== i && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Click to expand details</div>}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '18px', color: '#94a3b8', border: '1px solid #f0f4f8' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            No events found for this filter.
          </div>
        )}
      </div>
      <style>{`@keyframes expandIn{from{opacity:0;transform:scaleY(0.8)}to{opacity:1;transform:scaleY(1)}}`}</style>
    </div>
  );
}
