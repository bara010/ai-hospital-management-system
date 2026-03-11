import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patients as patientsApi, doctors as doctorsApi, auth as authApi } from '../services/api';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

const TAB_PATIENTS = 'patients';
const TAB_DOCTORS  = 'doctors';
const TAB_USERS    = 'users';

export default function AdminSetup() {
  const { user } = useAuth();
  const [tab, setTab]           = useState(TAB_PATIENTS);
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');

  // Patient edit modal
  const [editPt,   setEditPt]   = useState(null);
  // Doctor edit modal
  const [editDoc,  setEditDoc]  = useState(null);
  // Create profile modal
  const [createFor, setCreateFor] = useState(null); // { userId, name, email, role }

  if (user?.role !== 'ADMIN') return (
    <div style={{ textAlign: 'center', padding: 60, color: '#dc2626', fontWeight: 700, fontSize: 18 }}>
      🔒 Admin access only
    </div>
  );

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === TAB_PATIENTS) {
        const r = await patientsApi.getAll();
        setPatients(r.data || []);
      } else if (tab === TAB_DOCTORS) {
        const r = await doctorsApi.getAll();
        setDoctors(r.data || []);
      } else {
        const [uRes, pRes, dRes] = await Promise.all([
          API.get('/auth/users'),
          patientsApi.getAll(),
          doctorsApi.getAll(),
        ]);
        const allUsers    = uRes.data || [];
        const allPatients = pRes.data || [];
        const allDoctors  = dRes.data || [];

        // Tag each user with whether they have a linked profile
        const linkedPatientUserIds = new Set(allPatients.map(p => p.userId).filter(Boolean));
        const linkedDoctorUserIds  = new Set(allDoctors.map(d => d.userId).filter(Boolean));

        setUsers(allUsers.map(u => ({
          ...u,
          hasProfile: u.role === 'PATIENT'
            ? linkedPatientUserIds.has(u.id)
            : u.role === 'DOCTOR'
              ? linkedDoctorUserIds.has(u.id)
              : true, // ADMIN / NURSE always true (no profile needed)
        })));
      }
    } catch (e) { setError('Failed to load data'); }
    setLoading(false);
  };

  const flash = (m, isErr = false) => {
    if (isErr) setError(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  const savePatient = async (pt) => {
    try {
      await patientsApi.update(pt.id, pt);
      flash('Patient updated!');
      setEditPt(null);
      load();
    } catch { flash('Update failed', true); }
  };

  const saveDoctor = async (doc) => {
    try {
      await doctorsApi.update(doc.id, doc);
      flash('Doctor updated!');
      setEditDoc(null);
      load();
    } catch { flash('Update failed', true); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await API.delete(`/auth/users/${id}`);
      flash('User deleted');
      load();
    } catch { flash('Delete failed', true); }
  };

  // Create patient OR doctor profile for a user who has none
  const resetTotp = async (u) => {
    if (!window.confirm('Reset Google Authenticator for ' + u.name + '? They will need to re-scan QR code on next login.')) return;
    try {
      await authApi.resetTotp(u.id);
      flash('Google Authenticator reset for ' + u.name + '. They must re-setup on next login.');
      load();
    } catch { flash('Reset failed', true); }
  };

  const createProfile = async (form) => {
    try {
      if (createFor.role === 'PATIENT') {
        await patientsApi.create({
          userId:         createFor.userId,
          status:         form.status || 'OUTPATIENT',
          age:            form.age    || null,
          gender:         form.gender || 'Male',
          bloodGroup:     form.bloodGroup || '',
          medicalHistory: form.medicalHistory || '',
        });
        flash(`✅ Patient profile created for ${createFor.name}`);
      } else if (createFor.role === 'DOCTOR') {
        await doctorsApi.create({
          userId:          createFor.userId,
          name:            createFor.name,
          email:           createFor.email,
          department:      form.department || 'GENERAL_MEDICINE',
          specialization:  form.specialization || '',
          qualification:   form.qualification || '',
          availability:    form.availability || 'Mon-Fri 9am-5pm',
          consultationFee: form.consultationFee || 500,
        });
        flash(`✅ Doctor profile created for ${createFor.name}`);
      }
      setCreateFor(null);
      load();
    } catch (e) {
      flash(`Profile creation failed: ${e?.response?.data?.error || e.message}`, true);
    }
  };

  const unlinkedUsers = users.filter(u => !u.hasProfile && (u.role === 'PATIENT' || u.role === 'DOCTOR'));

  const tabs = [
    { key: TAB_PATIENTS, label: '👥 Patients',  count: patients.length },
    { key: TAB_DOCTORS,  label: '👨‍⚕️ Doctors',  count: doctors.length  },
    { key: TAB_USERS,    label: '🔑 All Users', count: users.length    },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#312e81,#6d28d9)', borderRadius: 22, padding: '26px 30px', marginBottom: 24, color: 'white' }}>
        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600, marginBottom: 4 }}>Admin Panel</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>⚙️ System Setup & Management</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Manage patients, doctors and user accounts</div>
      </div>

      {/* Flash messages */}
      {msg   && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', marginBottom: 14, color: '#166534', fontWeight: 600 }}>✅ {msg}</div>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', marginBottom: 14, color: '#991b1b', fontWeight: 600 }}>❌ {error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
              background: tab === t.key ? '#6d28d9' : 'white',
              color: tab === t.key ? 'white' : '#374151',
              boxShadow: tab === t.key ? '0 4px 14px rgba(109,40,217,0.3)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
            {t.label} <span style={{ background: tab === t.key ? 'rgba(255,255,255,0.2)' : '#f3f4f6', borderRadius: 20, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</div>
      ) : (
        <>
          {/* ── PATIENTS TAB ── */}
          {tab === TAB_PATIENTS && (
            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #f0f4f8', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafd' }}>
                    {['ID','Name','Email','Age','Gender','Blood','Status','Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 11, borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No patients found</td></tr>
                  ) : patients.map((p, i) => (
                    <tr key={p.id || i} style={{ borderBottom: '1px solid #f8fafd' }}>
                      <td style={{ padding: '11px 16px', color: '#94a3b8' }}>#{p.id}</td>
                      <td style={{ padding: '11px 16px', fontWeight: 600 }}>{p.name || p.user?.name || '—'}</td>
                      <td style={{ padding: '11px 16px', color: '#6b7280' }}>{p.email || p.user?.email || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>{p.age || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>{p.gender || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>{p.bloodGroup || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: p.status === 'INPATIENT' ? '#fef2f2' : '#f0fdf4', color: p.status === 'INPATIENT' ? '#dc2626' : '#166534', padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
                          {p.status || 'OUTPATIENT'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <button onClick={() => setEditPt({ ...p, name: p.name || '', age: p.age || '', gender: p.gender || 'Male', bloodGroup: p.bloodGroup || '', status: p.status || 'OUTPATIENT', medicalHistory: p.medicalHistory || '' })}
                          style={{ padding: '5px 12px', background: '#eff6ff', color: '#1b6ca8', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DOCTORS TAB ── */}
          {tab === TAB_DOCTORS && (
            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #f0f4f8', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafd' }}>
                    {['ID','Name','Email','Department','Specialization','Fee','Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 11, borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doctors.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No doctors found</td></tr>
                  ) : doctors.map((d, i) => (
                    <tr key={d.id || i} style={{ borderBottom: '1px solid #f8fafd' }}>
                      <td style={{ padding: '11px 16px', color: '#94a3b8' }}>#{d.id}</td>
                      <td style={{ padding: '11px 16px', fontWeight: 600 }}>{d.name || '—'}</td>
                      <td style={{ padding: '11px 16px', color: '#6b7280' }}>{d.email || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: '#eff6ff', color: '#1b6ca8', padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{d.department || '—'}</span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>{d.specialization || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>₹{d.consultationFee || 500}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <button onClick={() => setEditDoc({ ...d })}
                          style={{ padding: '5px 12px', background: '#f0fdf4', color: '#166534', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {tab === TAB_USERS && (
            <>
              {/* ── UNLINKED USERS BANNER ── */}
              {unlinkedUsers.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '16px 20px', marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, color: '#92400e', fontSize: 14, marginBottom: 10 }}>
                    ⚠️ {unlinkedUsers.length} user{unlinkedUsers.length > 1 ? 's' : ''} missing a profile — features like Mood Check won't work until a profile is created.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {unlinkedUsers.map(u => (
                      <div key={u.id} style={{ background: 'white', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a202c' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{u.email} · {u.role}</div>
                        </div>
                        <button
                          onClick={() => setCreateFor({ userId: u.id, name: u.name, email: u.email, role: u.role })}
                          style={{ padding: '6px 12px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                          ➕ Create Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unlinkedUsers.length === 0 && !loading && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '10px 16px', marginBottom: 14, color: '#166534', fontWeight: 600, fontSize: 13 }}>
                  ✅ All users have profiles linked — Mood Check and other features are working.
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 18, border: '1px solid #f0f4f8', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafd' }}>
                      {['ID','Name','Email','Role','Phone','Joined','Profile','2FA','Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 11, borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No users found</td></tr>
                    ) : users.map((u, i) => (
                      <tr key={u.id || i} style={{ borderBottom: '1px solid #f8fafd', background: !u.hasProfile && (u.role==='PATIENT'||u.role==='DOCTOR') ? '#fffbeb' : 'white' }}>
                        <td style={{ padding: '11px 16px', color: '#94a3b8' }}>#{u.id}</td>
                        <td style={{ padding: '11px 16px', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '11px 16px', color: '#6b7280' }}>{u.email}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{
                            background: u.role==='ADMIN' ? '#f5f3ff' : u.role==='DOCTOR' ? '#f0fdf4' : u.role==='NURSE' ? '#fdf2f8' : '#eff6ff',
                            color: u.role==='ADMIN' ? '#6d28d9' : u.role==='DOCTOR' ? '#166534' : u.role==='NURSE' ? '#be185d' : '#1b6ca8',
                            padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px' }}>{u.phone || '—'}</td>
                        <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '11px 16px' }}>
                          {(u.role === 'PATIENT' || u.role === 'DOCTOR') ? (
                            u.hasProfile
                              ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 12 }}>✅ Linked</span>
                              : <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 12 }}>⚠️ Missing</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          {(u.role === 'PATIENT' || u.role === 'DOCTOR' || u.role === 'ADMIN' || u.role === 'NURSE') && (
                            u.totpEnabled
                              ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 12 }}>✅ Active</span>
                              : <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 12 }}>⚠️ Not set</span>
                          )}
                        </td>
                        <td style={{ padding: '11px 16px', display: 'flex', gap: 6 }}>
                          {!u.hasProfile && (u.role === 'PATIENT' || u.role === 'DOCTOR') && (
                            <button onClick={() => setCreateFor({ userId: u.id, name: u.name, email: u.email, role: u.role })}
                              style={{ padding: '5px 10px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>
                              ➕ Create Profile
                            </button>
                          )}
                          {u.totpEnabled && (
                            <button onClick={() => resetTotp(u)}
                              style={{ padding: '5px 10px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>
                              🔄 Reset 2FA
                            </button>
                          )}
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => deleteUser(u.id)}
                              style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── EDIT PATIENT MODAL ── */}
      {editPt && (
        <Modal title="Edit Patient" onClose={() => setEditPt(null)} onSave={() => savePatient(editPt)}>
          <Field label="Age" value={editPt.age} onChange={v => setEditPt({...editPt, age: v})} type="number" />
          <Field label="Gender" value={editPt.gender} onChange={v => setEditPt({...editPt, gender: v})} select={['Male','Female','Other']} />
          <Field label="Blood Group" value={editPt.bloodGroup} onChange={v => setEditPt({...editPt, bloodGroup: v})} select={['A+','A-','B+','B-','O+','O-','AB+','AB-']} />
          <Field label="Status" value={editPt.status} onChange={v => setEditPt({...editPt, status: v})} select={['OUTPATIENT','INPATIENT','DISCHARGED']} />
          <Field label="Medical History" value={editPt.medicalHistory} onChange={v => setEditPt({...editPt, medicalHistory: v})} textarea />
        </Modal>
      )}

      {/* ── EDIT DOCTOR MODAL ── */}
      {editDoc && (
        <Modal title="Edit Doctor" onClose={() => setEditDoc(null)} onSave={() => saveDoctor(editDoc)}>
          <Field label="Department" value={editDoc.department} onChange={v => setEditDoc({...editDoc, department: v})}
            select={['GENERAL_MEDICINE','CARDIOLOGY','NEUROLOGY','ORTHOPEDICS','DERMATOLOGY','ENT','OPHTHALMOLOGY','PSYCHIATRY','PAEDIATRICS','GASTROENTEROLOGY','PULMONOLOGY','UROLOGY','DENTISTRY']} />
          <Field label="Specialization" value={editDoc.specialization} onChange={v => setEditDoc({...editDoc, specialization: v})} />
          <Field label="Qualification" value={editDoc.qualification} onChange={v => setEditDoc({...editDoc, qualification: v})} />
          <Field label="Availability" value={editDoc.availability} onChange={v => setEditDoc({...editDoc, availability: v})} />
          <Field label="Consultation Fee (₹)" value={editDoc.consultationFee} onChange={v => setEditDoc({...editDoc, consultationFee: v})} type="number" />
        </Modal>
      )}

      {/* ── CREATE PROFILE MODAL ── */}
      {createFor && <CreateProfileModal createFor={createFor} onClose={() => setCreateFor(null)} onSave={createProfile} />}
    </div>
  );
}

function CreateProfileModal({ createFor, onClose, onSave }) {
  const isPatient = createFor.role === 'PATIENT';
  const [form, setForm] = useState({
    status: 'OUTPATIENT', age: '', gender: 'Male', bloodGroup: 'O+', medicalHistory: '',
    department: 'GENERAL_MEDICINE', specialization: '', qualification: '', availability: 'Mon-Fri 9am-5pm', consultationFee: 500,
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: '#1a202c' }}>
          {isPatient ? '👤 Create Patient Profile' : '👨‍⚕️ Create Doctor Profile'}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          For: <strong>{createFor.name}</strong> ({createFor.email})
        </div>

        {isPatient ? (
          <>
            <Field label="Age" value={form.age} onChange={v => setForm({...form, age: v})} type="number" />
            <Field label="Gender" value={form.gender} onChange={v => setForm({...form, gender: v})} select={['Male','Female','Other']} />
            <Field label="Blood Group" value={form.bloodGroup} onChange={v => setForm({...form, bloodGroup: v})} select={['A+','A-','B+','B-','O+','O-','AB+','AB-']} />
            <Field label="Status" value={form.status} onChange={v => setForm({...form, status: v})} select={['OUTPATIENT','INPATIENT']} />
            <Field label="Medical History (optional)" value={form.medicalHistory} onChange={v => setForm({...form, medicalHistory: v})} textarea />
          </>
        ) : (
          <>
            <Field label="Department" value={form.department} onChange={v => setForm({...form, department: v})}
              select={['GENERAL_MEDICINE','CARDIOLOGY','NEUROLOGY','ORTHOPEDICS','DERMATOLOGY','ENT','OPHTHALMOLOGY','PSYCHIATRY','PAEDIATRICS','GASTROENTEROLOGY','PULMONOLOGY','UROLOGY','DENTISTRY']} />
            <Field label="Specialization" value={form.specialization} onChange={v => setForm({...form, specialization: v})} />
            <Field label="Qualification" value={form.qualification} onChange={v => setForm({...form, qualification: v})} />
            <Field label="Availability" value={form.availability} onChange={v => setForm({...form, availability: v})} />
            <Field label="Consultation Fee (₹)" value={form.consultationFee} onChange={v => setForm({...form, consultationFee: v})} type="number" />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{ padding: '10px 24px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
            ➕ Create Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, onSave, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>{title}</div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onSave} style={{ padding: '10px 20px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', select, textarea }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>{label.toUpperCase()}</label>
      {select ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white' }}>
          {select.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : textarea ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
      ) : (
        <input value={value || ''} onChange={e => onChange(e.target.value)} type={type}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
      )}
    </div>
  );
}
