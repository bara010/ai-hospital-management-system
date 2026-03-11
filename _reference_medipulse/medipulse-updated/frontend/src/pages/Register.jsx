import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';

function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.padEnd(6, ' ').split('');
  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      onChange(value.slice(0, i) + value.slice(i + 1));
      if (i > 0) inputs.current[i-1]?.focus();
    }
  };
  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g,'').slice(-1);
    if (!char) return;
    const arr = value.split('');
    arr[i] = char;
    onChange(arr.join('').slice(0,6));
    if (i < 5) setTimeout(()=>inputs.current[i+1]?.focus(), 10);
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p) { onChange(p); inputs.current[Math.min(p.length,5)]?.focus(); }
    e.preventDefault();
  };
  return (
    <div style={{display:'flex',gap:10,justifyContent:'center',margin:'20px 0'}}>
      {[0,1,2,3,4,5].map(i=>(
        <input key={i} ref={el=>inputs.current[i]=el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i]===' '?'':digits[i]}
          onChange={e=>handleChange(i,e)} onKeyDown={e=>handleKey(i,e)} onPaste={handlePaste}
          disabled={disabled}
          style={{width:48,height:56,textAlign:'center',fontSize:22,fontWeight:800,
            border:`2px solid ${value[i]?'#3b82f6':'#e5e7eb'}`,borderRadius:12,outline:'none',
            fontFamily:'inherit',background:value[i]?'#eff6ff':'#f9fafb',color:'#1e40af',
            transition:'all 0.15s',boxShadow:value[i]?'0 0 0 3px rgba(59,130,246,0.15)':'none'}}/>
      ))}
    </div>
  );
}

export default function Register() {
  const DEPARTMENTS = [
    { value: 'GENERAL_MEDICINE', label: '🏥 General Medicine', sub: 'General Physician' },
    { value: 'CARDIOLOGY', label: '❤️ Cardiology', sub: 'Heart Specialist' },
    { value: 'NEUROLOGY', label: '🧠 Neurology', sub: 'Brain & Nerve' },
    { value: 'OPHTHALMOLOGY', label: '👁️ Ophthalmology', sub: 'Eye Specialist' },
    { value: 'ENT', label: '👂 ENT', sub: 'Ear, Nose & Throat' },
    { value: 'ORTHOPEDICS', label: '🦴 Orthopedics', sub: 'Bone & Joint' },
    { value: 'GASTROENTEROLOGY', label: '🔬 Gastroenterology', sub: 'Digestive System' },
    { value: 'PULMONOLOGY', label: '🫁 Pulmonology', sub: 'Lung Specialist' },
    { value: 'DERMATOLOGY', label: '🧴 Dermatology', sub: 'Skin Specialist' },
    { value: 'UROLOGY', label: '💊 Urology', sub: 'Urinary System' },
    { value: 'PSYCHIATRY', label: '🧘 Psychiatry', sub: 'Mental Health' },
    { value: 'DENTISTRY', label: '🦷 Dentistry', sub: 'Oral Health' },
    { value: 'PAEDIATRICS', label: '👶 Paediatrics', sub: 'Child Specialist' },
    { value: 'EMERGENCY_MEDICINE', label: '🚨 Emergency Medicine', sub: 'Emergency Care' },
    { value: 'ONCOLOGY', label: '🩺 Oncology', sub: 'Cancer Specialist' },
    { value: 'RADIOLOGY', label: '📡 Radiology', sub: 'Imaging Specialist' },
    { value: 'ANESTHESIOLOGY', label: '💉 Anesthesiology', sub: 'Anesthesia' },
  ];

  const [step, setStep]         = useState('form');   // form | qr | verify
  const [form, setForm]         = useState({ name:'', email:'', password:'', phone:'', role:'PATIENT', department:'', specialization:'' });
  const [qrCodeUri, setQrUri]   = useState('');
  const [secret, setSecret]     = useState('');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [focus, setFocus]       = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  const [emailStatus, setEmailStatus] = useState('idle');
  const [emailError, setEmailError]   = useState('');
  const emailDebounce = useRef(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleEmailChange = useCallback((value) => {
    setForm(f=>({...f,email:value}));
    setEmailStatus('idle'); setEmailError('');
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setEmailStatus('invalid'); setEmailError('Invalid email format'); return;
    }
    clearTimeout(emailDebounce.current);
    emailDebounce.current = setTimeout(async () => {
      setEmailStatus('checking');
      try {
        await auth.validateEmail(value);
        setEmailStatus('valid'); setEmailError('');
      } catch(err) {
        if (err.response) {
          setEmailStatus('invalid');
          setEmailError(err.response.data?.error || 'Email not accepted');
        } else {
          setEmailStatus('idle'); setEmailError('');
        }
      }
    }, 700);
  }, []);

  // Step 1 → get QR code
  const handleSetupTotp = async (e) => {
    e.preventDefault();
    if (emailStatus === 'invalid') { setError(emailError); return; }
    if (emailStatus === 'checking') { setError('Please wait, checking your email...'); return; }
    if (!form.name.trim()) { setError('Please enter your full name'); return; }
    if (!form.phone.trim()) { setError('Phone number is required'); return; }
    if (form.role === 'DOCTOR') {
      if (!form.department) { setError('Please select your department'); return; }
      if (!form.specialization.trim()) { setError('Please enter your specialization'); return; }
    }
    setLoading(true); setError('');
    try {
      const res = await auth.registerSendOtp(form);
      setQrUri(res.data.qrCodeUri || '');
      setSecret(res.data.secret || '');
      setStep('qr');
    } catch(err) {
      setError(err.response?.data?.error || 'Setup failed. Please try again.');
    }
    setLoading(false);
  };

  // Step 2 → verify code
  const handleVerifyTotp = async () => {
    if (code.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const res = await auth.registerVerifyOtp({ email: form.email, code });
      login({ name:res.data.name, email:res.data.email, role:res.data.role, id:res.data.id }, res.data.token);
      navigate('/');
    } catch(err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
      setCode('');
    }
    setLoading(false);
  };

  const emailBorderColor = () => {
    if (emailStatus === 'valid')    return '#16a34a';
    if (emailStatus === 'invalid')  return '#dc2626';
    if (emailStatus === 'checking') return '#f59e0b';
    return focus === 'email' ? '#1b6ca8' : '#e2e8f0';
  };
  const emailHint = () => {
    if (emailStatus === 'checking') return { icon:'⟳', color:'#f59e0b', text:'Checking...' };
    if (emailStatus === 'valid')    return { icon:'✅', color:'#16a34a', text:'Email looks good' };
    if (emailStatus === 'invalid')  return { icon:'❌', color:'#dc2626', text: emailError };
    return null;
  };
  const hint = emailHint();

  const inp = (key, label, placeholder, type='text', required=true) => (
    <div style={{marginBottom:14}}>
      <label style={st.label}>{label}</label>
      <input
        value={form[key]}
        onChange={e=>key==='email'?handleEmailChange(e.target.value):setForm({...form,[key]:e.target.value})}
        type={type} placeholder={placeholder} required={required}
        onFocus={()=>setFocus(key)} onBlur={()=>setFocus(null)}
        style={{width:'100%',padding:'13px 16px',boxSizing:'border-box',
          border:`1.5px solid ${key==='email' ? emailBorderColor() : focus===key?'#1b6ca8':'#e2e8f0'}`,
          borderRadius:12,fontSize:14,outline:'none',background:focus===key?'#f8fbff':'#fafafa',
          fontFamily:'inherit',color:'#2d3748',transition:'all 0.2s'}}/>
      {key==='email' && hint && (
        <div style={{marginTop:5,fontSize:12,fontWeight:600,color:hint.color,display:'flex',alignItems:'center',gap:5}}>
          <span>{hint.icon}</span>{hint.text}
        </div>
      )}
    </div>
  );

  const roles = [
    {value:'PATIENT',icon:'🏥',label:'Patient'},
    {value:'DOCTOR', icon:'👨‍⚕️',label:'Doctor'},
    {value:'NURSE',  icon:'👩‍⚕️',label:'Nurse'},
    {value:'ADMIN',  icon:'🛡️',label:'Admin'},
  ];

  const canSubmit = !loading && emailStatus !== 'invalid' && emailStatus !== 'checking';

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f4c75 0%,#1b6ca8 50%,#2980b9 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
      `}</style>

      <div style={{background:'white',borderRadius:28,padding:'40px 38px',width:'100%',maxWidth:480,boxShadow:'0 32px 80px rgba(0,0,0,0.25)',animation:'fadeUp 0.5s ease'}}>

        {/* ── STEP 1: Registration form ── */}
        {step === 'form' && (
          <>
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#0f4c75,#1b6ca8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,color:'white'}}>✚</div>
                <div style={{fontWeight:800,fontSize:22,color:'#0f4c75',fontFamily:'Georgia,serif'}}>MediPulse</div>
              </div>
              <h2 style={{fontSize:22,fontWeight:800,color:'#1a202c',margin:'0 0 4px',letterSpacing:'-0.5px'}}>Create your account</h2>
              <p style={{color:'#94a3b8',fontSize:13,margin:0}}>Secured with Google Authenticator 2FA</p>
            </div>

            {error && <div style={{...st.errorBox,animation:'shake 0.4s ease'}}>⚠️ {error}</div>}

            <form onSubmit={handleSetupTotp}>
              {inp('name','FULL NAME','John Smith')}
              {inp('email','EMAIL ADDRESS','john@gmail.com','email')}
              {inp('password','PASSWORD','••••••••','password')}

              <div style={{marginBottom:14}}>
                <label style={st.label}>PHONE NUMBER</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:16}}>📱</span>
                  <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}
                    type="tel" placeholder="+91 98765 43210" required
                    onFocus={()=>setFocus('phone')} onBlur={()=>setFocus(null)}
                    style={{width:'100%',padding:'13px 16px 13px 40px',
                      border:`1.5px solid ${focus==='phone'?'#1b6ca8':'#e2e8f0'}`,
                      borderRadius:12,fontSize:14,outline:'none',background:focus==='phone'?'#f8fbff':'#fafafa',
                      fontFamily:'inherit',color:'#2d3748',transition:'all 0.2s'}}/>
                </div>
              </div>

              <div style={{marginBottom:22}}>
                <label style={st.label}>ACCOUNT TYPE</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {roles.map(r=>(
                    <button type="button" key={r.value} onClick={()=>setForm({...form,role:r.value,department:'',specialization:''})}
                      style={{padding:'10px',border:`1.5px solid ${form.role===r.value?'#1b6ca8':'#e2e8f0'}`,borderRadius:10,cursor:'pointer',
                        background:form.role===r.value?'#f0f7ff':'#fafafa',color:form.role===r.value?'#0f4c75':'#718096',
                        fontWeight:600,fontSize:13,fontFamily:'inherit',display:'flex',alignItems:'center',gap:6,justifyContent:'center',transition:'all 0.2s'}}>
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.role === 'DOCTOR' && (
                <div style={{background:'#f0f7ff',border:'1.5px solid #bfdbfe',borderRadius:14,padding:'16px',marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#1b6ca8',marginBottom:12}}>👨‍⚕️ DOCTOR PROFILE DETAILS</div>
                  <div style={{marginBottom:12}}>
                    <label style={{...st.label,color:'#1e40af'}}>DEPARTMENT <span style={{color:'#dc2626'}}>*</span></label>
                    <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}
                      style={{width:'100%',padding:'12px 14px',border:`1.5px solid ${form.department?'#3b82f6':'#bfdbfe'}`,
                        borderRadius:10,fontSize:13,outline:'none',background:'white',fontFamily:'inherit',cursor:'pointer'}}>
                      <option value="">— Select Department —</option>
                      {DEPARTMENTS.map(d=><option key={d.value} value={d.value}>{d.label} · {d.sub}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{...st.label,color:'#1e40af'}}>SPECIALIZATION <span style={{color:'#dc2626'}}>*</span></label>
                    <input value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})}
                      placeholder="e.g. Cardiologist, Pediatric Neurologist…"
                      style={{width:'100%',padding:'12px 14px',border:'1.5px solid #bfdbfe',borderRadius:10,fontSize:13,outline:'none',background:'white',fontFamily:'inherit',color:'#2d3748'}}/>
                  </div>
                </div>
              )}

              <button type="submit" disabled={!canSubmit}
                style={{...st.submitBtn,opacity:canSubmit?1:0.65,cursor:canSubmit?'pointer':'not-allowed'}}>
                {loading
                  ? <span style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
                      <span style={{display:'inline-block',width:16,height:16,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                      Setting up…
                    </span>
                  : '📱 Set Up Google Authenticator →'
                }
              </button>
            </form>

            <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'#94a3b8'}}>
              Already have an account?{' '}<Link to="/login" style={{color:'#1b6ca8',fontWeight:700,textDecoration:'none'}}>Sign in</Link>
            </p>
          </>
        )}

        {/* ── STEP 2: Scan QR code ── */}
        {step === 'qr' && (
          <>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{width:64,height:64,borderRadius:18,background:'linear-gradient(135deg,#4285F4,#34A853)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:34,boxShadow:'0 8px 24px rgba(66,133,244,0.3)'}}>
                📱
              </div>
              <h2 style={{fontSize:22,fontWeight:800,color:'#1a202c',marginBottom:6}}>Scan with Google Authenticator</h2>
              <p style={{color:'#64748b',fontSize:13,lineHeight:1.7}}>
                Open <strong>Google Authenticator</strong> → tap <strong>+</strong> → <strong>Scan QR code</strong>
              </p>
            </div>

            {/* QR Code */}
            {qrCodeUri ? (
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <div style={{padding:12,background:'white',border:'2px solid #e2e8f0',borderRadius:16,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
                  <img src={qrCodeUri} alt="Google Authenticator QR Code" style={{width:200,height:200,display:'block'}}/>
                </div>
              </div>
            ) : (
              <div style={{textAlign:'center',color:'#94a3b8',marginBottom:16}}>QR code loading…</div>
            )}

            {/* Manual entry option */}
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:12,padding:'10px 14px',marginBottom:16}}>
              <button onClick={()=>setShowSecret(s=>!s)}
                style={{background:'none',border:'none',color:'#1b6ca8',fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:'inherit',padding:0}}>
                {showSecret ? '🔽 Hide' : '▶ Can\'t scan? Enter code manually'}
              </button>
              {showSecret && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>Enter this key manually in Google Authenticator → <em>Enter a setup key</em>:</div>
                  <div style={{fontFamily:'monospace',fontSize:13,fontWeight:700,color:'#1e40af',background:'#eff6ff',padding:'8px 12px',borderRadius:8,letterSpacing:'2px',wordBreak:'break-all'}}>
                    {secret}
                  </div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>Account: MediPulse &nbsp;|&nbsp; Type: Time-based</div>
                </div>
              )}
            </div>

            <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:10,padding:'10px 14px',marginBottom:18,fontSize:12,color:'#166534',display:'flex',alignItems:'flex-start',gap:8}}>
              <span style={{fontSize:16}}>✅</span>
              <div>After scanning, Google Authenticator will show a <strong>6-digit code</strong> for MediPulse that refreshes every 30 seconds. Click below to enter it.</div>
            </div>

            <button onClick={()=>{ setStep('verify'); setCode(''); setError(''); }}
              style={{...st.submitBtn, marginBottom:10}}>
              I've scanned the QR code →
            </button>
            <button onClick={()=>{setStep('form');setError('');}}
              style={{display:'block',margin:'0 auto',background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
              ← Edit details
            </button>
          </>
        )}

        {/* ── STEP 3: Verify first code ── */}
        {step === 'verify' && (
          <>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:52,marginBottom:12}}>🔐</div>
              <h2 style={{fontSize:22,fontWeight:800,color:'#1a202c',marginBottom:8}}>Confirm your setup</h2>
              <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.7}}>
                Enter the <strong style={{color:'#1a202c'}}>6-digit code</strong> currently shown<br/>
                in Google Authenticator for <strong style={{color:'#1d4ed8'}}>MediPulse</strong>.
              </p>
            </div>

            <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'8px 14px',marginBottom:14,fontSize:12,color:'#1e40af',display:'flex',alignItems:'center',gap:8}}>
              <span>⏱</span><span>Code refreshes every 30 seconds — use the current one.</span>
            </div>

            {error && <div style={{...st.errorBox,animation:'shake 0.4s ease'}}>⚠️ {error}</div>}

            <OtpInput value={code} onChange={setCode} disabled={loading}/>

            <button onClick={handleVerifyTotp} disabled={loading||code.length<6}
              style={{...st.submitBtn,opacity:(loading||code.length<6)?0.65:1,cursor:(loading||code.length<6)?'not-allowed':'pointer',marginTop:4}}>
              {loading
                ? <span style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
                    <span style={{display:'inline-block',width:16,height:16,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                    Verifying…
                  </span>
                : '✓ Verify & Create Account'
              }
            </button>

            <button onClick={()=>{setStep('qr');setCode('');setError('');}}
              style={{display:'block',margin:'12px auto 0',background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
              ← Back to QR code
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const st = {
  label:{fontSize:11,fontWeight:700,color:'#4a5568',letterSpacing:'0.5px',display:'block',marginBottom:6},
  errorBox:{background:'#fff5f5',color:'#c53030',padding:'12px 16px',borderRadius:10,marginBottom:16,fontSize:13,border:'1px solid #fed7d7'},
  submitBtn:{width:'100%',padding:'14px',background:'linear-gradient(135deg,#0f4c75,#1b6ca8)',color:'white',border:'none',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.3px',transition:'all 0.2s'},
};
