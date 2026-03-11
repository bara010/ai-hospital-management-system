import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { telemedicine as teleApi } from '../services/api';

const UPCOMING_CALLS = [
  { id: 1, doctor: 'Dr. Priya Sharma', specialty: 'Cardiology', icon: '👩‍⚕️', date: 'Today', time: '3:00 PM', duration: '20 min', type: 'Follow-up', status: 'ready', roomId: 'MPX-3829' },
  { id: 2, doctor: 'Dr. Arjun Mehta', specialty: 'Neurology', icon: '👨‍⚕️', date: 'Tomorrow', time: '10:30 AM', duration: '30 min', type: 'Consultation', status: 'scheduled', roomId: 'MPX-4421' },
  { id: 3, doctor: 'Dr. Kavita Nair', specialty: 'Orthopedics', icon: '👩‍⚕️', date: 'Mar 12', time: '2:00 PM', duration: '15 min', type: 'Review', status: 'scheduled', roomId: 'MPX-8813' },
];

const PAST_CALLS = [
  { id: 4, doctor: 'Dr. Priya Sharma', specialty: 'Cardiology', date: 'Feb 20', duration: '18 min', notes: 'Adjusted Metformin dosage. Next check in 2 weeks.', recording: true },
  { id: 5, doctor: 'Dr. Arjun Mehta', specialty: 'Neurology', date: 'Feb 10', duration: '25 min', notes: 'MRI results reviewed. No new lesions detected.', recording: false },
];

function CountdownTimer({ target }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const t = new Date();
      t.setHours(15, 0, 0); // 3:00 PM today
      const diff = Math.max(0, t - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(diff < 1000 ? 'Starting...' : `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
  }, []);
  return <span style={{ fontFamily: 'monospace', fontWeight: '800' }}>{time}</span>;
}

function MockVideoCall({ call, onEnd }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const fmtElapsed = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Main video area */}
      <div style={{ width: '820px', maxWidth: '95vw', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
        {/* Remote video (doctor) - simulated */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', height: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ fontSize: '80px', marginBottom: '16px' }}>{call.icon}</div>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>{call.doctor}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{call.specialty}</div>

          {/* Recording indicator */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(220,38,38,0.8)', padding: '5px 12px', borderRadius: '20px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
            <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>REC</span>
          </div>

          {/* Timer */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: '20px', color: 'white', fontSize: '13px', fontFamily: 'monospace', fontWeight: '700' }}>
            {fmtElapsed(elapsed)}
          </div>

          {/* Room ID */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
            Room: {call.roomId}
          </div>

          {/* Self video PiP */}
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '140px', height: '100px', borderRadius: '12px', background: videoOff ? '#374151' : 'linear-gradient(135deg,#374151,#1f2937)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            {videoOff ? <><span style={{ fontSize: '24px' }}>🚫</span><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginTop: '4px' }}>Camera off</span></> : <><span style={{ fontSize: '28px' }}>🙂</span><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', marginTop: '4px' }}>You</span></>}
          </div>
        </div>

        {/* Controls */}
        <div style={{ background: '#0f172a', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {[
            { icon: muted ? '🔇' : '🎤', label: muted ? 'Unmute' : 'Mute', action: () => setMuted(!muted), active: muted, color: muted ? '#ef4444' : undefined },
            { icon: videoOff ? '📷' : '📹', label: videoOff ? 'Start Video' : 'Stop Video', action: () => setVideoOff(!videoOff), active: videoOff, color: videoOff ? '#ef4444' : undefined },
            { icon: '💬', label: 'Chat', action: () => {}, color: '#1b6ca8' },
            { icon: '📋', label: 'Notes', action: () => {}, color: '#6c63ff' },
            { icon: '🖥️', label: 'Share Screen', action: () => {}, color: '#10b981' },
          ].map((c, i) => (
            <button key={i} onClick={c.action}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px 16px', borderRadius: '14px', background: c.active ? '#7f1d1d' : 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', minWidth: '64px', transition: 'all 0.2s', fontFamily: "'Outfit',sans-serif" }}>
              <span style={{ fontSize: '22px' }}>{c.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '600', opacity: 0.8 }}>{c.label}</span>
            </button>
          ))}

          {/* End call */}
          <button onClick={onEnd}
            style={{ padding: '14px 28px', borderRadius: '14px', background: '#dc2626', border: 'none', color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Outfit',sans-serif", marginLeft: '16px' }}>
            📞 End Call
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

export default function Telemedicine() {
  const { user } = useAuth();
  const [upcomingCalls, setUpcomingCalls] = useState(UPCOMING_CALLS);
  const [pastCalls, setPastCalls] = useState(PAST_CALLS);

  useEffect(() => {
    if (user?.id) {
      teleApi.getByPatient(user.id).then(res => {
        if (res.data) {
          if (res.data.upcoming && res.data.upcoming.length > 0) {
            setUpcomingCalls(res.data.upcoming.map(s => ({
              id: s.id, doctor: s.doctorName, specialty: s.specialty,
              icon: s.doctorIcon || '👨‍⚕️', date: s.sessionDate,
              time: s.sessionTime, duration: s.duration,
              type: s.type, status: s.status, roomId: s.roomId,
            })));
          }
          if (res.data.past && res.data.past.length > 0) {
            setPastCalls(res.data.past.map(s => ({
              id: s.id, doctor: s.doctorName, specialty: s.specialty,
              date: (s.sessionDate || '').slice(0, 10),
              duration: s.durationMinutes > 0 ? `${s.durationMinutes} min` : s.duration,
              notes: s.notes || 'Session completed.', recording: false,
            })));
          }
        }
      }).catch(() => {});
    }
  }, [user?.id]);
  const [activeCall, setActiveCall] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [deviceCheck, setDeviceCheck] = useState({ mic: true, camera: true, internet: true });

  const joinCall = (call) => setActiveCall(call);
  const endCall = () => setActiveCall(null);

  return (
    <div>
      {activeCall && <MockVideoCall call={activeCall} onEnd={endCall} />}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>VIRTUAL CARE · PRO</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.5px' }}>📹 Telemedicine</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>HD video consultations with your care team — no travel required</p>
      </div>

      {/* Device Check */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px 20px', border: '1px solid #f0f4f8', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a202c' }}>Device Check</div>
        {[
          { icon: '🎤', label: 'Microphone', ok: deviceCheck.mic },
          { icon: '📷', label: 'Camera', ok: deviceCheck.camera },
          { icon: '🌐', label: 'Internet', ok: deviceCheck.internet },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: d.ok ? '#16a34a' : '#dc2626' }}>
            {d.icon} {d.label} <span>{d.ok ? '✅' : '❌'}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>All systems ready for video calls</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'white', padding: '8px', borderRadius: '14px', border: '1px solid #f0f4f8' }}>
        {[
          { id: 'upcoming', label: '📅 Upcoming Calls', count: upcomingCalls.length },
          { id: 'history', label: '📼 Call History', count: pastCalls.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '11px', border: 'none', background: tab === t.id ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : '#f8fafd', color: tab === t.id ? 'white' : '#4a5568', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: "'Outfit',sans-serif" }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {upcomingCalls.map(call => (
            <div key={call.id} style={{ background: 'white', borderRadius: '18px', padding: '22px', border: `1.5px solid ${call.status==='ready'?'#1b6ca8':'#f0f4f8'}`, boxShadow: call.status==='ready'?'0 4px 20px rgba(27,108,168,0.12)':'0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>{call.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c' }}>{call.doctor}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', background: call.status==='ready'?'#eff6ff':'#f8fafd', color: call.status==='ready'?'#1b6ca8':'#94a3b8', padding: '2px 8px', borderRadius: '20px', border: `1px solid ${call.status==='ready'?'#bfdbfe':'#e2e8f0'}` }}>
                      {call.status==='ready'?'🟢 Ready to Join':'📅 Scheduled'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>{call.specialty} · {call.type} · {call.duration}</div>
                  <div style={{ fontSize: '13px', color: '#4a5568', fontWeight: '600', marginTop: '4px' }}>
                    {call.date} at {call.time}
                    {call.status==='ready' && <span style={{ marginLeft: '10px', color: '#1b6ca8' }}>Starts in: <CountdownTimer /></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {call.status === 'ready' && (
                    <button onClick={() => joinCall(call)}
                      style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📹 Join Now
                    </button>
                  )}
                  <button style={{ padding: '12px 20px', background: 'white', color: '#4a5568', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pastCalls.map(call => (
            <div key={call.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📼</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '2px' }}>{call.doctor}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{call.specialty} · {call.date} · {call.duration}</div>
                  <div style={{ fontSize: '13px', color: '#374151', background: '#f8fafd', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f0f4f8', lineHeight: '1.5' }}>
                    📋 {call.notes}
                  </div>
                </div>
                {call.recording && (
                  <button style={{ padding: '8px 16px', background: '#f0f7ff', color: '#1b6ca8', border: '1px solid #bfdbfe', borderRadius: '10px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>
                    ▶ Watch Recording
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
