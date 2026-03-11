import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointments as apptApi, doctors as doctorsApi } from '../services/api';

const STATUS_CFG = {
  SCHEDULED:  { color: '#1b6ca8', bg: '#eff6ff', label: 'Scheduled' },
  COMPLETED:  { color: '#16a34a', bg: '#f0fdf4', label: 'Completed' },
  CANCELLED:  { color: '#dc2626', bg: '#fef2f2', label: 'Cancelled' },
  PENDING:    { color: '#7c3aed', bg: '#f5f3ff', label: 'Pending' },
};

const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];

export default function Appointments() {
  const { user } = useAuth();
  const [tab,           setTab]    = useState('my');
  const [step,          setStep]   = useState(1);
  const [doctors,       setDoctors] = useState([]);
  const [selDoc,        setSelDoc]  = useState(null);
  const [selDate,       setSelDate] = useState('');
  const [selTime,       setSelTime] = useState('');
  const [reason,        setReason]  = useState('');
  const [myAppts,       setMyAppts] = useState([]);
  const [allAppts,      setAllAppts] = useState([]);  // for doctor/admin
  const [loading,       setLoading] = useState(false);
  const [booked,        setBooked]  = useState(false);
  const [patientId,     setPid]     = useState(null);

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const isPatient = user?.role === 'PATIENT';
  const isDoctor  = user?.role === 'DOCTOR';
  const isAdmin   = user?.role === 'ADMIN';

  useEffect(() => {
    // Load doctors for booking
    doctorsApi.getAll().then(r => setDoctors(r.data || [])).catch(() => {});

    // Load appointments based on role
    if (isPatient && user?.id) {
      // Patient sees their own appointments; need their patientId
      // Try to get it from a patient lookup
      import('../services/api').then(({ patients }) => {
        patients.getByUserId(user.id).then(r => {
          const pid = r.data?.id;
          setPid(pid);
          if (pid) apptApi.getByPatient(pid).then(r2 => setMyAppts(r2.data || []));
        }).catch(() => {});
      });
    } else if (isDoctor && user?.id) {
      import('../services/api').then(({ doctors }) => {
        doctors.getAll().then(r => {
          const myDoc = (r.data || []).find(d => d.userId === user.id || d.user?.id === user.id);
          if (myDoc) apptApi.getByDoctor(myDoc.id).then(r2 => setAllAppts(r2.data || []));
        }).catch(() => {});
      });
    } else if (isAdmin) {
      apptApi.getAll().then(r => setAllAppts(r.data || [])).catch(() => {});
    }
  }, [user]);

  const book = async () => {
    if (!selDoc || !selDate || !selTime || !reason.trim()) return;
    setLoading(true);
    try {
      await apptApi.book({ patientId, doctorId: selDoc.id, date: selDate, time: selTime, reason });
      setBooked(true);
      // Refresh
      if (patientId) apptApi.getByPatient(patientId).then(r => setMyAppts(r.data || []));
    } catch (e) {
      alert('Booking failed. Please try again.');
    }
    setLoading(false);
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    await apptApi.cancel(id);
    setMyAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
  };

  const updateStatus = async (id, status) => {
    await apptApi.updateStatus(id, { status });
    setAllAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const resetBooking = () => { setBooked(false); setStep(1); setSelDoc(null); setSelDate(''); setSelTime(''); setReason(''); };

  // ── Shared header ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: 20, padding: '22px 26px', marginBottom: 20, color: 'white' }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 2 }}>📅 Appointments</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {isPatient ? 'Book and manage your appointments'
           : isDoctor ? 'Your patient appointments'
           : 'All hospital appointments'}
        </div>
      </div>

      {/* Tab bar — patients only */}
      {isPatient && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {['my','book'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 22px', borderRadius: 12, border: 'none', background: tab === t ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : 'white', color: tab === t ? 'white' : '#4a5568', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === t ? '0 4px 14px rgba(15,76,117,0.2)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
              {t === 'my' ? '📋 My Appointments' : '➕ Book New'}
            </button>
          ))}
        </div>
      )}

      {/* ── PATIENT: My Appointments ─────────────────────────────────────── */}
      {(isPatient && tab === 'my') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {myAppts.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 18, padding: 50, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1a202c', marginBottom: 6 }}>No appointments yet</div>
              <button onClick={() => setTab('book')} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>Book First Appointment</button>
            </div>
          ) : myAppts.map(a => {
            const cfg = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
            return (
              <div key={a.id} style={{ background: 'white', borderRadius: 16, padding: '16px 20px', border: `1px solid #f0f4f8`, borderLeft: `4px solid ${cfg.color}`, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{a.doctor?.user?.name || 'Doctor'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 20 }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#718096' }}>{a.reason || 'General Consultation'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>📅 {a.appointmentDate} &nbsp; 🕐 {a.appointmentTime}</div>
                </div>
                {a.status === 'SCHEDULED' && (
                  <button onClick={() => cancel(a.id)} style={{ padding: '7px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Cancel</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PATIENT: Book Appointment ────────────────────────────────────── */}
      {isPatient && tab === 'book' && !booked && (
        <div style={{ background: 'white', borderRadius: 18, padding: 24, border: '1px solid #f0f4f8' }}>
          {/* Step 1: Pick doctor */}
          {step === 1 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Step 1: Choose a Doctor</div>
              {doctors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading doctors from database…</div>
              ) : doctors.map(d => (
                <div key={d.id} onClick={() => { setSelDoc(d); setStep(2); }}
                  style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, border: '1.5px solid #e2e8f0', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s', background: '#fafbfc' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#065f46,#047857)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {(d.name || d.user?.name || 'D')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1a202c' }}>{d.name || d.user?.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{d.specialization} · {d.department}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{d.availability} · Fee: ₹{d.consultationFee || d.fee || '—'}</div>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 20, alignSelf: 'center' }}>→</div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Step 2: Pick Date & Time</div>
              <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', marginBottom: 18, fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                👨‍⚕️ {selDoc?.name || selDoc?.user?.name} · {selDoc?.specialization}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 6 }}>SELECT DATE</label>
                <input type="date" min={minDateStr} value={selDate} onChange={e => setSelDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
              </div>
              {selDate && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 8 }}>SELECT TIME SLOT</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {TIME_SLOTS.map(t => (
                      <button key={t} onClick={() => setSelTime(t)} style={{ padding: '9px', border: `1.5px solid ${selTime === t ? '#047857' : '#e2e8f0'}`, borderRadius: 10, background: selTime === t ? '#f0fdf4' : 'white', color: selTime === t ? '#047857' : '#4a5568', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 6 }}>REASON FOR VISIT</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Regular check-up, fever..." rows={3}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, background: '#f8fafd', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>← Back</button>
                <button onClick={book} disabled={!selDate || !selTime || !reason.trim() || loading}
                  style={{ flex: 2, padding: 12, background: (!selDate || !selTime || !reason.trim()) ? '#e2e8f0' : 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: (!selDate || !selTime || !reason.trim()) ? '#94a3b8' : 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>
                  {loading ? '⟳ Booking…' : '✅ Confirm Appointment'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Booking success ── */}
      {isPatient && tab === 'book' && booked && (
        <div style={{ background: 'white', borderRadius: 18, padding: 50, textAlign: 'center', border: '1px solid #f0f4f8' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#1a202c', marginBottom: 8 }}>Appointment Booked!</div>
          <div style={{ color: '#718096', fontSize: 14, marginBottom: 24 }}>
            With <strong>{selDoc?.name || selDoc?.user?.name}</strong> on <strong>{selDate}</strong> at <strong>{selTime}</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={resetBooking} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>Book Another</button>
            <button onClick={() => { resetBooking(); setTab('my'); }} style={{ padding: '12px 24px', background: '#f0f7ff', color: '#1b6ca8', border: '1px solid #d0e8ff', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>My Appointments</button>
          </div>
        </div>
      )}

      {/* ── DOCTOR / ADMIN: All Appointments ─────────────────────────────── */}
      {(isDoctor || isAdmin) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allAppts.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 18, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a202c' }}>No appointments found</div>
            </div>
          ) : allAppts.map(a => {
            const cfg = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
            return (
              <div key={a.id} style={{ background: 'white', borderRadius: 14, padding: '14px 18px', border: '1px solid #f0f4f8', borderLeft: `4px solid ${cfg.color}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{a.patient?.user?.name || 'Patient'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 20 }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>with {a.doctor?.user?.name || 'Doctor'} · {a.reason}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>📅 {a.appointmentDate} at {a.appointmentTime}</div>
                </div>
                {a.status === 'SCHEDULED' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => updateStatus(a.id, 'COMPLETED')} style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✅ Done</button>
                    <button onClick={() => updateStatus(a.id, 'CANCELLED')} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✕ Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
