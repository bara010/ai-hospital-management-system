import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  analytics as analyticsApi, appointments as apptApi, vitals as vitalsApi,
  patients as patientsApi, notifications as notifApi, beds as bedsApi,
  pharmacy as pharmacyApi, doctors as doctorsApi, mood as moodApi, medicines as medApi,
} from '../services/api';

function StatCard({ icon, value, label, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', borderRadius: 18, padding: 22, border: `1.5px solid ${hov ? color : '#f0f4f8'}`,
        boxShadow: hov ? `0 6px 24px ${color}25` : '0 2px 10px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s',
        transform: hov ? 'translateY(-2px)' : 'none', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 72, height: 72, borderRadius: '50%', background: color, opacity: 0.07 }} />
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#1a202c', marginBottom: 4 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── PATIENT DASHBOARD ──────────────────────────────────────────────────────
function PatientDashboard({ user }) {
  const navigate = useNavigate();
  const [vitals, setVitals]         = useState(null);
  const [appointments, setAppts]    = useState([]);
  const [meds, setMeds]             = useState([]);
  const [moods, setMoods]           = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      vitalsApi.getSummary(user.id),
      apptApi.getByPatient(user.id),
      medApi.getByPatient(user.id),
      moodApi.getRecent(user.id),
    ]).then(([vRes, aRes, mRes, mdRes]) => {
      if (vRes.status === 'fulfilled')  setVitals(vRes.value?.data);
      if (aRes.status === 'fulfilled')  setAppts(aRes.value?.data || []);
      if (mRes.status === 'fulfilled')  setMeds(mRes.value?.data || []);
      if (mdRes.status === 'fulfilled') setMoods(mdRes.value?.data || []);
      setLoading(false);
    });
  }, [user]);

  const upcoming = appointments.filter(a => a.status === 'SCHEDULED');
  const latestMood = moods[0];

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: 22, padding: '26px 30px', marginBottom: 22, color: 'white' }}>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4, fontWeight: 600 }}>Patient Portal</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Welcome back, {user.name.split(' ')[0]} 🏥</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📅" value={upcoming.length}                                    label="Upcoming Appts"  color="#1b6ca8" onClick={() => navigate('/appointments')} />
        <StatCard icon="💊" value={meds.filter(m => m.active).length}                  label="Active Meds"     color="#059669" onClick={() => navigate('/adherence')} />
        <StatCard icon="❤️" value={vitals?.heartRate ? `${vitals.heartRate} bpm` : '—'} label="Heart Rate"     color="#dc2626" onClick={() => navigate('/vitals')} />
        <StatCard icon="💙" value={latestMood ? `${latestMood.moodScore}/5` : '—'}     label="Last Mood"       color="#7c3aed" onClick={() => navigate('/mood')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        {/* Upcoming appointments from DB */}
        <div style={{ background: 'white', borderRadius: 18, padding: 22, border: '1px solid #f0f4f8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a202c' }}>📅 Your Appointments</div>
            <span onClick={() => navigate('/appointments')} style={{ fontSize: 12, color: '#1b6ca8', cursor: 'pointer', fontWeight: 600 }}>View all →</span>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 13 }}>No upcoming appointments.</div>
              <button onClick={() => navigate('/appointments')} style={{ marginTop: 10, padding: '8px 16px', background: '#1b6ca8', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Book One</button>
            </div>
          ) : upcoming.slice(0, 3).map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < Math.min(upcoming.length, 3) - 1 ? '1px solid #f8fafd' : 'none', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a202c' }}>{a.doctorName || a.doctor?.user?.name || 'Doctor'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.appointmentDate} at {a.appointmentTime}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{a.reason}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1b6ca8', background: '#eff6ff', padding: '2px 8px', borderRadius: 20 }}>SCHEDULED</span>
            </div>
          ))}
        </div>

        {/* Vitals & Mood from DB */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Latest vitals */}
          <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #f0f4f8', flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a202c', marginBottom: 14 }}>❤️ Latest Vitals</div>
            {vitals ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Blood Pressure', value: vitals.bloodPressure || `${vitals.systolic}/${vitals.diastolic}` },
                  { label: 'Heart Rate',     value: vitals.heartRate ? `${vitals.heartRate} bpm` : '—' },
                  { label: 'Temperature',    value: vitals.temperature ? `${vitals.temperature}°F` : '—' },
                  { label: 'SpO2',           value: vitals.oxygenSaturation || vitals.spo2 ? `${vitals.oxygenSaturation || vitals.spo2}%` : '—' },
                ].map(v => (
                  <div key={v.label} style={{ background: '#f8fafd', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{v.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c' }}>{v.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
                No vitals logged yet.
                <button onClick={() => navigate('/vitals')} style={{ display: 'block', margin: '10px auto 0', padding: '7px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Log Now</button>
              </div>
            )}
          </div>

          {/* Mood quick action */}
          <div style={{ background: 'linear-gradient(135deg,#4338ca,#7c3aed)', borderRadius: 18, padding: 20, color: 'white', cursor: 'pointer' }} onClick={() => navigate('/mood')}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>💙 How are you feeling today?</div>
            {latestMood ? (
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                Last check-in: {latestMood.moodLabel} ({latestMood.moodScore}/5)
              </div>
            ) : (
              <div style={{ fontSize: 13, opacity: 0.85 }}>Tap to check in — your doctor will see it.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCTOR DASHBOARD ───────────────────────────────────────────────────────
function DoctorDashboard({ user }) {
  const navigate = useNavigate();
  const [appointments, setAppts]  = useState([]);
  const [myDoctor,     setDoctor] = useState(null);
  const [patients,     setPts]    = useState([]);
  const [moods,        setMoods]  = useState([]);
  const [loading,      setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      doctorsApi.getAll(),
      moodApi.getAll(),
    ]).then(async ([dRes, mRes]) => {
      const allDocs = dRes.value?.data || [];
      const myDoc   = allDocs.find(d => d.userId === user.id || d.user?.id === user.id);
      setDoctor(myDoc || null);

      if (myDoc) {
        try {
          const apptRes = await apptApi.getByDoctor(myDoc.id);
          const appts   = apptRes.data || [];
          setAppts(appts);

          // Build unique patient list
          const seen = {};
          appts.forEach(a => {
            const pid = a.patient?.id;
            if (pid && !seen[pid]) seen[pid] = a.patient;
          });
          setPts(Object.values(seen));
        } catch (e) { /* ignore */ }
      }

      if (mRes.status === 'fulfilled') setMoods((mRes.value?.data || []).slice(0, 5));
      setLoading(false);
    });
  }, [user]);

  const todayAppts = appointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointmentDate === today && a.status === 'SCHEDULED';
  });
  const pending = appointments.filter(a => a.status === 'SCHEDULED');
  const lowMoodAlerts = moods.filter(m => m.moodScore <= 3);

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 22, padding: '26px 30px', marginBottom: 22, color: 'white' }}>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4, fontWeight: 600 }}>Doctor Portal</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Dr. {user.name} 👨‍⚕️</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{myDoctor?.department || 'General Medicine'} · {myDoctor?.specialization || ''}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon="👥" value={patients.length}     label="My Patients"         color="#047857" onClick={() => navigate('/my-patients')} />
        <StatCard icon="📅" value={todayAppts.length}   label="Today's Appts"       color="#1b6ca8" onClick={() => navigate('/appointments')} />
        <StatCard icon="⏳" value={pending.length}      label="Pending Appts"       color="#f59e0b" onClick={() => navigate('/appointments')} />
        <StatCard icon="💙" value={lowMoodAlerts.length} label="Low Mood Alerts"    color="#dc2626" onClick={() => navigate('/appointments')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        {/* Today's appointments from DB */}
        <div style={{ background: 'white', borderRadius: 18, padding: 22, border: '1px solid #f0f4f8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a202c' }}>📅 Today's Appointments</div>
            <span onClick={() => navigate('/appointments')} style={{ fontSize: 12, color: '#047857', cursor: 'pointer', fontWeight: 600 }}>All →</span>
          </div>
          {todayAppts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🗓️</div>
              <div style={{ fontSize: 13 }}>No appointments scheduled for today.</div>
            </div>
          ) : todayAppts.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: i < todayAppts.length - 1 ? '1px solid #f8fafd' : 'none', alignItems: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#047857', fontSize: 15, flexShrink: 0 }}>
                {(a.patient?.user?.name || 'P')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{a.patient?.user?.name || 'Patient'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.appointmentTime} · {a.reason}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Patient mood alerts */}
        <div style={{ background: 'white', borderRadius: 18, padding: 22, border: '1px solid #f0f4f8' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>💙 Mood Alerts</div>
          {lowMoodAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>😊</div>
              <div style={{ fontSize: 13 }}>All patients have good mood today!</div>
            </div>
          ) : lowMoodAlerts.map((m, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#991b1b' }}>{m.patientName}</div>
              <div style={{ fontSize: 12, color: '#dc2626' }}>Mood: {m.moodScore}/5 — {m.moodLabel}</div>
              {m.note && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>"{m.note}"</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ────────────────────────────────────────────────────────
function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [summary, setSummary]  = useState(null);
  const [beds,    setBeds]     = useState(null);
  const [pharma,  setPharma]   = useState(null);
  const [loading, setLoading]  = useState(true);
  const [recentAppts, setAppts] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      analyticsApi.getSummary(),
      bedsApi.getSummary(),
      pharmacyApi.getSummary(),
      apptApi.getAll(),
    ]).then(([aRes, bRes, pRes, apptRes]) => {
      if (aRes.status === 'fulfilled') setSummary(aRes.value?.data);
      if (bRes.status === 'fulfilled') setBeds(bRes.value?.data);
      if (pRes.status === 'fulfilled') setPharma(pRes.value?.data);
      if (apptRes.status === 'fulfilled') {
        const today = new Date().toISOString().split('T')[0];
        setAppts((apptRes.value?.data || []).filter(a => a.appointmentDate === today).slice(0, 5));
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ background: 'linear-gradient(135deg,#312e81,#6d28d9)', borderRadius: 22, padding: '26px 30px', marginBottom: 22, color: 'white' }}>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4, fontWeight: 600 }}>Admin Control Panel</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{user.name} 🛡️</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon="👥" value={summary?.totalPatients}    label="Total Patients"   color="#1b6ca8" onClick={() => navigate('/analytics')} />
        <StatCard icon="🛏️" value={beds ? `${beds.occupiedBeds}/${beds.totalBeds}` : '—'} label="Beds Occupied" color="#f59e0b" onClick={() => navigate('/beds')} />
        <StatCard icon="🏪" value={pharma?.lowStockCount}     label="Low Stock Alerts" color="#dc2626" onClick={() => navigate('/pharmacy')} />
        <StatCard icon="📅" value={summary?.todayAppointments} label="Today's Appts"   color="#6d28d9" onClick={() => navigate('/appointments')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        {/* Today's appointments */}
        <div style={{ background: 'white', borderRadius: 18, padding: 22, border: '1px solid #f0f4f8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📅 Today's Appointments</div>
            <span onClick={() => navigate('/appointments')} style={{ fontSize: 12, color: '#6d28d9', cursor: 'pointer', fontWeight: 600 }}>All →</span>
          </div>
          {recentAppts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No appointments scheduled for today.</div>
          ) : recentAppts.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < recentAppts.length - 1 ? '1px solid #f8fafd' : 'none', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                {(a.patient?.user?.name || 'P')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{a.patient?.user?.name || 'Patient'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>with {a.doctor?.user?.name || 'Doctor'} at {a.appointmentTime}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '2px 8px', borderRadius: 20 }}>{a.status}</span>
            </div>
          ))}
        </div>

        {/* System alerts */}
        <div style={{ background: 'white', borderRadius: 18, padding: 22, border: '1px solid #f0f4f8' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🔔 System Alerts</div>
          {[
            { icon: '🛏️', msg: beds ? `${beds.occupiedBeds} of ${beds.totalBeds} beds occupied` : 'Loading…', color: '#f59e0b', path: '/beds' },
            { icon: '🏪', msg: pharma ? `${pharma.lowStockCount || 0} medicines low on stock` : 'Loading…', color: '#dc2626', path: '/pharmacy' },
            { icon: '📅', msg: `${recentAppts.length} appointments today`, color: '#1b6ca8', path: '/appointments' },
            { icon: '💰', msg: 'View billing & revenue', color: '#6d28d9', path: '/billing' },
          ].map((a, i) => (
            <div key={i} onClick={() => navigate(a.path)} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, background: `${a.color}08`, border: `1px solid ${a.color}20`, marginBottom: 8, cursor: 'pointer', alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>✚</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>Loading dashboard…</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case 'PATIENT': return <PatientDashboard user={user} />;
    case 'DOCTOR':  return <DoctorDashboard user={user} />;
    case 'ADMIN':   return <AdminDashboard user={user} />;
    default:        return <PatientDashboard user={user} />;
  }
}
