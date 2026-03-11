import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { onlineConsult, doctors as doctorsApi } from '../services/api';

// ─── helpers ─────────────────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function parseChat(json) {
  try { return JSON.parse(json || '[]'); } catch { return []; }
}

const STATUS_COLOR = {
  WAITING:     { bg: '#fffbeb', color: '#d97706', label: '⏳ Waiting for doctor' },
  ACCEPTED:    { bg: '#f0fdf4', color: '#059669', label: '✅ Doctor connected' },
  IN_PROGRESS: { bg: '#eff6ff', color: '#2563eb', label: '💬 In progress' },
  COMPLETED:   { bg: '#f8fafd', color: '#6b7280', label: '🏁 Completed' },
  CANCELLED:   { bg: '#fef2f2', color: '#dc2626', label: '❌ Cancelled' },
};

// ─── DOCTOR PROFILE CARD ─────────────────────────────────────────────────────
function DoctorProfileCard({ consult }) {
  if (!consult.doctorName || consult.status === 'WAITING') return null;
  const initials = consult.doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const deptColors = {
    CARDIOLOGY: '#dc2626', NEUROLOGY: '#059669', DERMATOLOGY: '#db2777',
    ORTHOPAEDICS: '#d97706', ORTHOPEDICS: '#d97706', PAEDIATRICS: '#7c3aed',
    GENERAL_MEDICINE: '#1b6ca8', GENERAL: '#1b6ca8', ENT: '#0891b2',
    OPHTHALMOLOGY: '#6d28d9', PSYCHIATRY: '#4338ca', PULMONOLOGY: '#0284c7',
  };
  const deptColor = deptColors[consult.doctorDepartment] || '#047857';

  return (
    <div style={{ background: `linear-gradient(135deg, ${deptColor}15, ${deptColor}05)`, border: `1px solid ${deptColor}30`, borderRadius: 14, padding: '14px 18px', margin: '8px 0 4px', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${deptColor}, ${deptColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c' }}>Dr. {consult.doctorName}</div>
        <div style={{ fontSize: 12, color: deptColor, fontWeight: 700 }}>{consult.doctorDeptLabel || consult.doctorSpecialization || consult.doctorDepartment}</div>
        {consult.doctorQualification && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{consult.doctorQualification}</div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        {consult.doctorFee && (
          <div style={{ fontSize: 14, fontWeight: 800, color: deptColor }}>₹{consult.doctorFee}</div>
        )}
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>consultation</div>
        <div style={{ marginTop: 4, background: '#f0fdf4', color: '#059669', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>🟢 ONLINE</div>
      </div>
    </div>
  );
}
function ChatWindow({ consult, myRole, myName, onSend, onEnd, onRefresh }) {
  const [msg, setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef         = useRef(null);
  const chat              = parseChat(consult.chatJson);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consult.chatJson]);

  // Auto-refresh every 3s while active
  useEffect(() => {
    if (['COMPLETED', 'CANCELLED'].includes(consult.status)) return;
    const t = setInterval(onRefresh, 3000);
    return () => clearInterval(t);
  }, [consult.status, onRefresh]);

  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await onSend(msg.trim());
      setMsg('');
    } finally { setSending(false); }
  };

  const senderColor = (sender) => sender === 'PATIENT' ? '#1b6ca8' : '#047857';

  const isActive = ['ACCEPTED', 'IN_PROGRESS', 'WAITING'].includes(consult.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #f0f4f8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: myRole === 'PATIENT' ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : 'linear-gradient(135deg,#065f46,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>
            {myRole === 'PATIENT' ? (consult.doctorName ? `Dr. ${consult.doctorName}` : '🟢 Waiting for a doctor...') : consult.patientName}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
            {STATUS_COLOR[consult.status]?.label}
          </div>
        </div>
        {isActive && myRole === 'DOCTOR' && (
          <button onClick={onEnd} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, color: 'white', padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
            End Consult
          </button>
        )}
        {isActive && myRole === 'PATIENT' && consult.status !== 'WAITING' && (
          <button onClick={onEnd} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, color: 'white', padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
            End Consult
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafd' }}>
        {/* Real doctor profile card — shown to patient once doctor connects */}
        {myRole === 'PATIENT' && <DoctorProfileCard consult={consult} />}

        {/* Symptoms bubble */}
        <div style={{ alignSelf: 'center', background: '#fff', border: '1px dashed #e2e8f0', borderRadius: 12, padding: '10px 16px', fontSize: 12, color: '#64748b', maxWidth: 320, textAlign: 'center' }}>
          📋 Patient's symptoms: <strong>{consult.symptoms || 'Not specified'}</strong>
        </div>

        {consult.status === 'WAITING' && myRole === 'PATIENT' && (
          <div style={{ alignSelf: 'center', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 20px', fontSize: 13, color: '#92400e', textAlign: 'center' }}>
            ⏳ Looking for an available doctor...<br />
            <span style={{ fontSize: 11, opacity: 0.8 }}>This usually takes a few minutes</span>
          </div>
        )}

        {chat.map((m, i) => {
          const isMe = m.sender === myRole;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%',
                background: isMe ? (myRole === 'PATIENT' ? '#1b6ca8' : '#047857') : 'white',
                color: isMe ? 'white' : '#1a202c',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '10px 14px',
                fontSize: 13.5,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: isMe ? 'none' : '1px solid #f0f4f8',
              }}>
                {!isMe && <div style={{ fontSize: 10, fontWeight: 700, color: senderColor(m.sender), marginBottom: 4 }}>{m.senderName}</div>}
                {m.text}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{timeAgo(m.time)}</div>
              </div>
            </div>
          );
        })}

        {['COMPLETED', 'CANCELLED'].includes(consult.status) && (
          <div style={{ alignSelf: 'center', background: '#f8fafd', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 20px', fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
            {consult.status === 'COMPLETED' ? '🏁 Consultation ended' : '❌ Consultation cancelled'}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isActive && consult.status !== 'WAITING' && (
        <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #f0f4f8', display: 'flex', gap: 10 }}>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type your message..."
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={send} disabled={!msg.trim() || sending}
            style={{ padding: '10px 20px', background: myRole === 'PATIENT' ? '#1b6ca8' : '#047857', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: (!msg.trim() || sending) ? 0.5 : 1 }}
          >
            {sending ? '...' : '➤'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PATIENT VIEW ─────────────────────────────────────────────────────────────
function PatientOnlineDoctor({ user }) {
  const [consults,  setConsults]  = useState([]);
  const [active,    setActive]    = useState(null);
  const [symptoms,  setSymptoms]  = useState('');
  const [requesting, setRequesting] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    try {
      const res = await onlineConsult.byPatient(user.id);
      const list = res.data || [];
      setConsults(list);
      // keep active updated
      if (active) {
        const updated = list.find(c => c.id === active.id);
        if (updated) setActive(updated);
      }
    } catch {}
    setLoading(false);
  }, [user.id, active?.id]);

  useEffect(() => { load(); }, [user.id]);

  const handleRequest = async () => {
    if (!symptoms.trim()) { setError('Please describe your symptoms'); return; }
    setRequesting(true); setError('');
    try {
      const res = await onlineConsult.request({ patientId: user.id, patientName: user.name, symptoms });
      await load();
      const newConsult = (await onlineConsult.getById(res.data.id)).data;
      setActive(newConsult);
      setSymptoms('');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to request consult');
    }
    setRequesting(false);
  };

  const handleSend = async (text) => {
    await onlineConsult.sendMessage(active.id, { sender: 'PATIENT', senderName: user.name, text });
    await load();
  };

  const handleEnd = async () => {
    await onlineConsult.cancel(active.id);
    await load();
    setActive(null);
  };

  const handleRefresh = useCallback(async () => {
    if (!active) return;
    try {
      const res = await onlineConsult.getById(active.id);
      setActive(res.data);
    } catch {}
  }, [active?.id]);

  const openConsults = consults.filter(c => ['WAITING', 'ACCEPTED', 'IN_PROGRESS'].includes(c.status));
  const pastConsults = consults.filter(c => ['COMPLETED', 'CANCELLED'].includes(c.status));

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: 22, padding: '24px 28px', marginBottom: 22, color: 'white' }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, fontWeight: 600 }}>Real-time</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🟢 Online Doctor</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Connect with a doctor now — no appointment needed</div>
      </div>

      {active ? (
        <div style={{ height: 520 }}>
          <ChatWindow
            consult={active}
            myRole="PATIENT"
            myName={user.name}
            onSend={handleSend}
            onEnd={handleEnd}
            onRefresh={handleRefresh}
          />
          <button onClick={() => setActive(null)} style={{ marginTop: 12, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            ← Back to list
          </button>
        </div>
      ) : (
        <>
          {/* Request new consult */}
          {openConsults.length === 0 && (
            <div style={{ background: 'white', borderRadius: 18, padding: 24, border: '1px solid #f0f4f8', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>📋 Request Online Consultation</div>
              {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13, border: '1px solid #fecaca' }}>⚠️ {error}</div>}
              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms or reason for consultation..."
                rows={4}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleRequest} disabled={requesting}
                style={{ marginTop: 12, width: '100%', padding: '14px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 15, opacity: requesting ? 0.7 : 1 }}
              >
                {requesting ? '⏳ Requesting...' : '🟢 Connect with a Doctor Now'}
              </button>
            </div>
          )}

          {/* Active consults */}
          {openConsults.length > 0 && (
            <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #bbf7d0', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#059669', marginBottom: 14 }}>🟢 Active Consultations</div>
              {openConsults.map(c => (
                <div key={c.id} onClick={() => setActive(c)}
                  style={{ display: 'flex', gap: 14, padding: '14px', borderRadius: 14, border: '1px solid #f0f4f8', marginBottom: 8, cursor: 'pointer', background: '#f8fafd', alignItems: 'center', transition: 'all 0.2s' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: STATUS_COLOR[c.status]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: c.doctorName ? 16 : 22, fontWeight: 800, color: '#047857', flexShrink: 0 }}>
                    {c.doctorName ? c.doctorName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : (c.status === 'WAITING' ? '⏳' : '💬')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.doctorName ? `Dr. ${c.doctorName}` : 'Waiting for a doctor'}</div>
                    {c.doctorSpecialization && <div style={{ fontSize: 11, color: '#047857', fontWeight: 600 }}>{c.doctorSpecialization}</div>}
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.symptoms}</div>
                    <div style={{ fontSize: 11, marginTop: 2, fontWeight: 700, color: STATUS_COLOR[c.status]?.color }}>{STATUS_COLOR[c.status]?.label}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#1b6ca8', fontWeight: 600 }}>Open →</span>
                </div>
              ))}
            </div>
          )}

          {/* Past consults */}
          {pastConsults.length > 0 && (
            <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a202c', marginBottom: 14 }}>📋 Past Consultations</div>
              {pastConsults.slice(0, 5).map(c => (
                <div key={c.id} onClick={() => setActive(c)}
                  style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: 12, border: '1px solid #f0f4f8', marginBottom: 8, cursor: 'pointer', alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f8fafd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏁</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.doctorName ? `Dr. ${c.doctorName}` : 'No doctor assigned'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(c.createdAt)} · {c.symptoms}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[c.status]?.color, background: STATUS_COLOR[c.status]?.bg, padding: '2px 8px', borderRadius: 20 }}>{c.status}</span>
                </div>
              ))}
            </div>
          )}

          {loading && consults.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✚</div>
              Loading...
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── DOCTOR VIEW ──────────────────────────────────────────────────────────────
function DoctorOnlineConsults({ user }) {
  const [waiting,  setWaiting]  = useState([]);
  const [mine,     setMine]     = useState([]);
  const [active,   setActive]   = useState(null);
  const [myDoctor, setMyDoctor] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const [wRes, docRes] = await Promise.all([
        onlineConsult.waiting(),
        doctorsApi.getAll(),
      ]);
      setWaiting(wRes.data || []);

      const allDocs = docRes.data || [];
      const myDoc = allDocs.find(d => d.userId === user.id || d.user?.id === user.id);
      setMyDoctor(myDoc || null);

      if (myDoc) {
        const mRes = await onlineConsult.byDoctor(myDoc.id);
        const active_consults = (mRes.data || []).filter(c => ['ACCEPTED', 'IN_PROGRESS'].includes(c.status));
        setMine(active_consults);
        if (active) {
          const updated = (mRes.data || []).find(c => c.id === active.id);
          if (updated) setActive(updated);
        }
      }
    } catch {}
    setLoading(false);
  }, [user.id, active?.id]);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [user.id]);

  const handleAccept = async (consult) => {
    await onlineConsult.accept(consult.id, {
      userId:     user.id,                    // ← real user id to look up doctor profile
      doctorId:   myDoctor?.id || user.id,
      doctorName: user.name,
    });
    await load();
    const updated = (await onlineConsult.getById(consult.id)).data;
    setActive(updated);
  };

  const handleSend = async (text) => {
    await onlineConsult.sendMessage(active.id, { sender: 'DOCTOR', senderName: user.name, text });
    await load();
  };

  const handleEnd = async () => {
    await onlineConsult.end(active.id);
    await load();
    setActive(null);
  };

  const handleRefresh = useCallback(async () => {
    if (!active) return;
    try {
      const res = await onlineConsult.getById(active.id);
      setActive(res.data);
    } catch {}
  }, [active?.id]);

  if (active) return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ height: 560 }}>
        <ChatWindow
          consult={active}
          myRole="DOCTOR"
          myName={user.name}
          onSend={handleSend}
          onEnd={handleEnd}
          onRefresh={handleRefresh}
        />
      </div>
      <button onClick={() => setActive(null)} style={{ marginTop: 12, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
        ← Back to queue
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 22, padding: '24px 28px', marginBottom: 22, color: 'white' }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, fontWeight: 600 }}>Doctor Console</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🟢 Online Consult Queue</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Accept and respond to patient consultation requests in real-time</div>
      </div>

      {/* My active consults */}
      {mine.length > 0 && (
        <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #bbf7d0', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#059669', marginBottom: 14 }}>💬 My Active Consultations ({mine.length})</div>
          {mine.map(c => (
            <div key={c.id} onClick={() => setActive(c)}
              style={{ display: 'flex', gap: 14, padding: '14px', borderRadius: 14, border: '1px solid #f0f4f8', marginBottom: 8, cursor: 'pointer', background: '#f0fdf4', alignItems: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#047857', fontSize: 18 }}>
                {c.patientName?.[0] || 'P'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.patientName}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.symptoms}</div>
                <div style={{ fontSize: 11, marginTop: 2, fontWeight: 700, color: '#059669' }}>{STATUS_COLOR[c.status]?.label}</div>
              </div>
              <span style={{ fontSize: 13, color: '#047857', fontWeight: 700 }}>Continue →</span>
            </div>
          ))}
        </div>
      )}

      {/* Waiting queue */}
      <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #f0f4f8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a202c' }}>⏳ Patients Waiting</div>
          <div style={{ background: waiting.length > 0 ? '#fef3c7' : '#f0fdf4', color: waiting.length > 0 ? '#d97706' : '#059669', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {waiting.length} waiting
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading queue...</div>
        ) : waiting.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No patients waiting</div>
            <div style={{ fontSize: 12 }}>New requests will appear here automatically</div>
          </div>
        ) : waiting.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 14, padding: '14px', borderRadius: 14, border: '1px solid #fef3c7', background: '#fffbeb', marginBottom: 10, alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#d97706', fontSize: 18 }}>
              {c.patientName?.[0] || 'P'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{c.patientName}</div>
              <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>📋 {c.symptoms}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{timeAgo(c.createdAt)}</div>
            </div>
            <button
              onClick={() => handleAccept(c)}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#065f46,#047857)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}
            >
              ✅ Accept
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function OnlineDoctor() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'PATIENT') return <PatientOnlineDoctor user={user} />;
  if (user.role === 'DOCTOR')  return <DoctorOnlineConsults user={user} />;
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🟢</div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>Online consults are for patients and doctors only.</div>
    </div>
  );
}
