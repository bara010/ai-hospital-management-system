import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patients as patientsApi, healthAnalysis, appointments as apptApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function SmartDoctorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [bookForm, setBookForm] = useState({ date: '', time: '10:00', reason: '' });
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!user) return;
    patientsApi.getByUserId(user.id).then(r => {
      const pid = r.data.id;
      setPatientId(pid);
      return healthAnalysis.getRecommended(pid);
    }).then(r => {
      setData(r.data);
    }).catch(() => {
      setData({ doctors: [], suggestedDepartment: 'GENERAL_MEDICINE', departmentLabel: 'General Physician', emergencyLevel: 'NORMAL', severityScore: 0 });
    }).finally(() => setLoading(false));
  }, [user]);

  const handleBook = async () => {
    if (!booking || !bookForm.date) return;
    try {
      await apptApi.book({
        patientId, doctorId: booking.id,
        appointmentDate: bookForm.date,
        appointmentTime: bookForm.time,
        reason: bookForm.reason || `Consultation - ${data.predictedCondition || 'General'}`,
      });
      setBooked(true);
    } catch (e) {
      alert('Booking failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const emerColor = (l) => l === 'CRITICAL' ? '#dc2626' : l === 'HIGH' ? '#f59e0b' : l === 'MODERATE' ? '#3b82f6' : '#16a34a';

  const S = {
    page: { minHeight: '100vh', background: '#f0f4f8', padding: '32px 16px', fontFamily: "'Outfit',sans-serif" },
    wrap: { maxWidth: 800, margin: '0 auto' },
    card: { background: 'white', borderRadius: 20, padding: 28, marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
    title: { fontSize: 26, fontWeight: 800, color: '#1a202c', marginBottom: 4 },
    sub: { fontSize: 14, color: '#64748b', marginBottom: 0 },
    docCard: (sel) => ({
      border: `2px solid ${sel ? '#3b82f6' : '#e5e7eb'}`, borderRadius: 16, padding: 20, marginBottom: 12,
      background: sel ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'all 0.2s',
    }),
    btn: { padding: '12px 24px', borderRadius: 12, border: 'none', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
    input: { padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  };

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 18, color: '#64748b' }}>Loading recommendations…</div></div>;

  if (booked) return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>Appointment Booked!</div>
        <div style={{ color: '#64748b', marginBottom: 24 }}>Your appointment with Dr. {booking?.name} has been confirmed.</div>
        <button onClick={() => navigate('/appointments')} style={{ ...S.btn, background: '#16a34a', color: 'white' }}>View Appointments</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.title}>🏥 Smart Doctor Finder</div>
          <div style={S.sub}>Doctors matched to your condition — only specialists you need</div>
        </div>

        {/* Condition Summary */}
        {data && (
          <div style={{ ...S.card, background: `linear-gradient(135deg,${emerColor(data.emergencyLevel)}18,white)`, border: `1.5px solid ${emerColor(data.emergencyLevel)}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginBottom: 4 }}>MATCHED DEPARTMENT</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1a202c' }}>🏥 {data.departmentLabel}</div>
                {data.predictedCondition && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Likely: {data.predictedCondition}</div>}
              </div>
              <div style={{ textAlign: 'center', background: `${emerColor(data.emergencyLevel)}15`, borderRadius: 14, padding: '12px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1 }}>EMERGENCY</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: emerColor(data.emergencyLevel) }}>{data.emergencyLevel || 'NORMAL'}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: emerColor(data.emergencyLevel) }}>{data.severityScore || 0}%</div>
              </div>
            </div>
            {!data.predictedCondition && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef3c7', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                💡 No analysis run yet. <span style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }} onClick={() => navigate('/health-input')}>Run Health Assessment →</span>
              </div>
            )}
          </div>
        )}

        {/* Doctors List */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1a202c', marginBottom: 16 }}>
            {data?.doctors?.length > 0 ? `${data.doctors.length} Specialist(s) Available` : 'No specialists found for this department'}
          </div>

          {data?.doctors?.length === 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, color: '#64748b', fontSize: 14 }}>
              No doctors registered under this department yet. Please contact the hospital to add specialists, or book with a General Physician.
              <br/><button onClick={() => navigate('/appointments')} style={{ ...S.btn, background: '#3b82f6', color: 'white', marginTop: 12 }}>Browse All Doctors</button>
            </div>
          )}

          {data?.doctors?.map(doc => (
            <div key={doc.id} style={S.docCard(booking?.id === doc.id)} onClick={() => setBooking(doc)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>
                      {(doc.name || 'D').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>Dr. {doc.name}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{doc.specialization} · {doc.qualification}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginLeft: 50 }}>⏰ {doc.availability}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>₹{doc.consultationFee}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>per visit</div>
                </div>
              </div>
              {booking?.id === doc.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Date</div>
                      <input type="date" value={bookForm.date} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))} style={S.input} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Time</div>
                      <input type="time" value={bookForm.time}
                        onChange={e => setBookForm(f => ({ ...f, time: e.target.value }))} style={S.input} />
                    </div>
                  </div>
                  <input placeholder="Reason for visit (optional)" value={bookForm.reason}
                    onChange={e => setBookForm(f => ({ ...f, reason: e.target.value }))}
                    style={{ ...S.input, width: '100%', marginBottom: 10, boxSizing: 'border-box' }} />
                  <button onClick={handleBook} style={{ ...S.btn, background: '#16a34a', color: 'white', width: '100%' }}>
                    ✅ Confirm Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
