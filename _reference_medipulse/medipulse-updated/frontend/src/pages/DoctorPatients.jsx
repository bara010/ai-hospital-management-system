import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctors as doctorsApi, appointments as apptApi, patients as patientsApi, vitals as vitalsApi } from '../services/api';

/**
 * DoctorPatients — Shows REAL patients who have appointments with this doctor.
 * Fetches from: /api/doctors/for-user/{userId} → /api/appointments/doctor/{doctorId}
 */
export default function DoctorPatients() {
  const { user } = useAuth();
  const [doctor,   setDoctor]   = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get doctor profile for this user
      const docRes = await doctorsApi.getAll();
      const allDoctors = docRes.data || [];
      // Find doctor by matching user id
      let myDoctor = null;
      for (const d of allDoctors) {
        if (d.userId === user.id || d.user?.id === user.id) { myDoctor = d; break; }
      }

      if (!myDoctor) {
        setError('Your doctor profile is not set up. Please contact admin.');
        setLoading(false);
        return;
      }
      setDoctor(myDoctor);

      // 2. Get appointments for this doctor
      const apptRes = await apptApi.getByDoctor(myDoctor.id);
      const appointments = apptRes.data || [];

      // 3. Build unique patient list from appointments
      const patientMap = {};
      for (const appt of appointments) {
        const pid = appt.patient?.id || appt.patientId;
        if (!pid) continue;
        if (!patientMap[pid]) {
          patientMap[pid] = {
            patientId:       pid,
            name:            appt.patient?.user?.name || appt.patientName || 'Unknown',
            age:             appt.patient?.age || '—',
            gender:          appt.patient?.gender || '—',
            bloodGroup:      appt.patient?.bloodGroup || '—',
            status:          appt.patient?.status || 'OUTPATIENT',
            medicalHistory:  appt.patient?.medicalHistory || '—',
            appointments:    [],
          };
        }
        patientMap[pid].appointments.push({
          id:     appt.id,
          date:   appt.appointmentDate,
          time:   appt.appointmentTime,
          reason: appt.reason,
          status: appt.status,
        });
      }

      // Sort appointments per patient (latest first)
      const list = Object.values(patientMap).map(p => ({
        ...p,
        lastAppointment: p.appointments.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0],
        totalAppointments: p.appointments.length,
      }));

      setPatients(list);
    } catch (err) {
      console.error(err);
      setError('Failed to load patients. Make sure backend is running.');
    }
    setLoading(false);
  };

  const filtered = patients.filter(p =>
    !search || (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.medicalHistory || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = s =>
    s === 'ICU'        ? '#dc2626' :
    s === 'ADMITTED'   ? '#f59e0b' :
    s === 'OUTPATIENT' ? '#1b6ca8' : '#16a34a';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
        <div style={{ fontWeight: 600 }}>Loading your patients…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: 'white', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 480, margin: '40px auto' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Doctor Profile Not Found</div>
      <div style={{ color: '#64748b', fontSize: 13 }}>{error}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 20, padding: '24px 28px', marginBottom: 20, color: 'white' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>👥 My Patients</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Dr. {user?.name} · {doctor?.department || 'General Medicine'} · {patients.length} patient{patients.length !== 1 ? 's' : ''} from appointments
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Patients', value: patients.length, color: '#1b6ca8', icon: '👥' },
          { label: 'Total Appointments', value: patients.reduce((s,p) => s + p.totalAppointments, 0), color: '#059669', icon: '📅' },
          { label: 'Inpatients', value: patients.filter(p => p.status === 'ADMITTED' || p.status === 'ICU').length, color: '#dc2626', icon: '🛏️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a202c' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="🔍 Search by name or medical history..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '11px 16px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'white' }}
        />
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 20, padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 6 }}>
            {patients.length === 0 ? 'No patients yet' : 'No patients match your search'}
          </div>
          <div style={{ fontSize: 13 }}>
            {patients.length === 0 ? 'Patients who book appointments with you will appear here.' : 'Try a different search term.'}
          </div>
        </div>
      ) : filtered.map(p => (
        <div key={p.patientId} style={{ background: 'white', borderRadius: 16, marginBottom: 10, border: selected === p.patientId ? '2px solid #047857' : '1px solid #f0f4f8', overflow: 'hidden', transition: 'border 0.15s' }}>
          {/* Row */}
          <div
            style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 10 }}
            onClick={() => setSelected(selected === p.patientId ? null : p.patientId)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#065f46,#047857)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                {(p.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a202c' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Age: {p.age} · {p.gender} · Blood: {p.bloodGroup} · {p.totalAppointments} appt{p.totalAppointments !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(p.status), background: `${statusColor(p.status)}15`, padding: '4px 10px', borderRadius: 20 }}>
                {p.status}
              </span>
              {p.lastAppointment && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Last: {p.lastAppointment.date || '—'}</span>
              )}
              <span style={{ color: '#94a3b8', fontSize: 18 }}>{selected === p.patientId ? '▲' : '▼'}</span>
            </div>
          </div>

          {/* Expanded */}
          {selected === p.patientId && (
            <div style={{ borderTop: '1px solid #f0f4f8', padding: '18px 22px', background: '#fafbfc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 5 }}>MEDICAL HISTORY</div>
                  <div style={{ fontSize: 13, color: '#374151', background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                    {p.medicalHistory}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 5 }}>ADMISSION STATUS</div>
                  <div style={{ fontSize: 13, color: '#374151', background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                    {p.status}
                  </div>
                </div>
              </div>
              {/* Appointment history */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>APPOINTMENT HISTORY</div>
                {p.appointments.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 10, background: 'white', border: '1px solid #e5e7eb', marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: a.status === 'COMPLETED' ? '#16a34a' : a.status === 'CANCELLED' ? '#dc2626' : '#1b6ca8', background: a.status === 'COMPLETED' ? '#f0fdf4' : a.status === 'CANCELLED' ? '#fef2f2' : '#eff6ff', padding: '2px 8px', borderRadius: 20 }}>
                      {a.status}
                    </span>
                    <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{a.reason || 'General consultation'}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{a.date} {a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
