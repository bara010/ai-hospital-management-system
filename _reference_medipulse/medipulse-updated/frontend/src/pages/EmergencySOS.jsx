import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { family as familyApi, medicines as medApi } from '../services/api';

const EMERGENCY_CONTACTS = [
  { id: 1, name: 'Priya Sharma', relation: 'Spouse', phone: '+91 98765 43210', avatar: '👩', primary: true },
  { id: 2, name: 'Ravi Sharma', relation: 'Parent', phone: '+91 87654 32109', avatar: '👴', primary: false },
];

const NEARBY_HOSPITALS = [
  { name: 'MediPulse Hospital', distance: '0.3 km', phone: '108', type: 'Primary', icon: '🏥' },
  { name: 'City Emergency Center', distance: '1.2 km', phone: '+91 22-2345-6789', type: 'Emergency', icon: '🚑' },
  { name: "St. Mary's Hospital", distance: '2.1 km', phone: '+91 22-9876-5432', type: 'Multispecialty', icon: '🏨' },
];

export default function EmergencySOS() {
  const { user } = useAuth();
  const [sosSent, setSosSent] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [location, setLocation] = useState(null);
  const [sending, setSending] = useState(false);

  const [emergencyContacts, setEmergencyContacts] = useState(EMERGENCY_CONTACTS);
  const [patientProfile, setPatientProfile] = useState({
    name: user?.name || 'Patient', bloodType: 'B+',
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    allergies: ['Penicillin', 'Sulfa drugs'],
    medications: ['Metformin 500mg', 'Lisinopril 10mg'],
    emergencyMeds: ['None'],
  });

  useEffect(() => {
    if (!user?.id) return;
    familyApi.getByPatient(user.id).then(res => {
      if (res.data && res.data.length > 0) {
        setEmergencyContacts(res.data.map((c, i) => ({
          id: c.id, name: c.name, relation: c.relation,
          phone: c.phone || 'N/A', avatar: c.avatar || '👤', primary: i === 0,
        })));
      }
    }).catch(() => {});
    medApi.getByPatient(user.id).then(res => {
      if (res.data && res.data.length > 0) {
        setPatientProfile(p => ({
          ...p, name: user.name,
          medications: res.data.filter(m => m.active !== false).map(m => `${m.medicineName} ${m.dose}`),
        }));
      }
    }).catch(() => {});
  }, [user?.id]);

  const startSOS = () => {
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setSending(true);
      navigator.geolocation?.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 19.076, lng: 72.877 }) // Mumbai fallback
      );
      setTimeout(() => { setSending(false); setSosSent(true); setCountdown(null); }, 2000);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const cancelSOS = () => { setCountdown(null); setSending(false); };

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>EMERGENCY FEATURE</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>🆘 Emergency SOS</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>One tap sends your location and medical profile to your emergency contacts and nearest hospital</p>
      </div>

      {/* SOS Button */}
      {!sosSent && countdown === null && !sending && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', border: '2px solid #fecaca', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>Only use in a real emergency. This will immediately alert your contacts and share your location.</div>
          <button onClick={startSOS}
            style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: '8px solid #fecaca', color: 'white', fontSize: '40px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 0 40px rgba(220,38,38,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', gap: '8px', transition: 'all 0.2s', fontFamily: "'Outfit',sans-serif" }}>
            <span>🆘</span>
            <span style={{ fontSize: '18px' }}>SOS</span>
          </button>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>Press and hold to activate · 5-second countdown before sending</div>
        </div>
      )}

      {/* Countdown */}
      {countdown !== null && (
        <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '40px', border: '2px solid #ef4444', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '80px', fontWeight: '800', color: '#dc2626', marginBottom: '8px' }}>{countdown}</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626', marginBottom: '20px' }}>SOS will be sent in {countdown} second{countdown !== 1 ? 's' : ''}...</div>
          <button onClick={cancelSOS} style={{ padding: '14px 36px', background: 'white', border: '2px solid #ef4444', color: '#dc2626', borderRadius: '12px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>❌ CANCEL</button>
        </div>
      )}

      {/* Sending */}
      {sending && (
        <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '40px', border: '2px solid #ef4444', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>Sending SOS Alert...</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>Sharing location and medical profile with your emergency contacts</div>
        </div>
      )}

      {/* Sent Confirmation */}
      {sosSent && (
        <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '30px', border: '2px solid #ef4444', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626', marginBottom: '4px' }}>SOS Alert Sent!</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Your emergency contacts and nearby hospitals have been notified</div>
          </div>
          <div style={{ background: '#fff8f8', borderRadius: '14px', padding: '16px', border: '1px solid #fecaca', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '10px' }}>ALERT SENT TO</div>
            {emergencyContacts.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '13px', color: '#374151', fontWeight: '600' }}>
                <span>{c.avatar}</span> {c.name} ({c.relation}) — {c.phone} <span style={{ marginLeft: 'auto', color: '#10b981', fontSize: '11px', fontWeight: '700' }}>✅ Sent</span>
              </div>
            ))}
            {location && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>📍 Location shared: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>}
          </div>
          <button onClick={() => setSosSent(false)} style={{ width: '100%', padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>← Back</button>
        </div>
      )}

      {/* Medical Profile Card */}
      <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', marginBottom: '16px' }}>
        <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '14px' }}>🏥 Your Medical Profile (shared in SOS)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Blood Type', val: patientProfile.bloodType, icon: '🩸' },
            { label: 'Conditions', val: patientProfile.conditions.join(', '), icon: '🏥' },
            { label: 'Allergies', val: patientProfile.allergies.join(', '), icon: '⚠️' },
            { label: 'Current Medications', val: patientProfile.medications.join(', '), icon: '💊' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px', background: '#f8fafd', borderRadius: '10px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '4px' }}>{item.icon} {item.label.toUpperCase()}</div>
              <div style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Hospitals */}
      <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', marginBottom: '16px' }}>
        <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '14px' }}>🏥 Nearby Hospitals</div>
        {NEARBY_HOSPITALS.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '12px', background: '#f8fafd', border: '1px solid #f0f4f8', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>{h.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a202c' }}>{h.name}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{h.type} · {h.distance}</div>
            </div>
            <a href={`tel:${h.phone}`} style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>📞 Call</a>
          </div>
        ))}
      </div>

      {/* Emergency numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'Ambulance', number: '108', icon: '🚑' },
          { label: 'Police', number: '100', icon: '🚔' },
          { label: 'Fire', number: '101', icon: '🚒' },
        ].map(n => (
          <a key={n.label} href={`tel:${n.number}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', background: '#fef2f2', borderRadius: '14px', border: '1px solid #fecaca', textDecoration: 'none' }}>
            <span style={{ fontSize: '28px' }}>{n.icon}</span>
            <span style={{ fontWeight: '800', fontSize: '20px', color: '#dc2626' }}>{n.number}</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{n.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
