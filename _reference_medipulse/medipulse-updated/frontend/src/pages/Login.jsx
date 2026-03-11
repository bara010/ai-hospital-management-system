import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';

const FEATURES = [
  { icon: '🔐', title: 'Google Authenticator',  desc: 'Secure 2FA login — no SMS or email OTP needed' },
  { icon: '🤖', title: 'AI Risk Analysis',       desc: 'ML models predict readmission & no-shows in real time' },
  { icon: '💊', title: 'Smart Reminders',        desc: 'Personalized medication schedules & adherence tracking' },
  { icon: '📊', title: 'Analytics Dashboard',   desc: 'Live hospital KPIs, bed occupancy, and billing insights' },
  { icon: '🟢', title: 'Online Doctor',          desc: 'Real-time consultations between patients & doctors' },
];

function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.padEnd(6, ' ').split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      onChange(value.slice(0, i) + value.slice(i + 1));
      if (i > 0) inputs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) inputs.current[i + 1]?.focus();
  };
  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const arr = value.split('');
    arr[i] = char;
    onChange(arr.join('').slice(0, 6));
    if (i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 10);
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p) { onChange(p); inputs.current[Math.min(p.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '20px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] === ' ' ? '' : digits[i]}
          onChange={e => handleChange(i, e)} onKeyDown={e => handleKey(i, e)} onPaste={handlePaste}
          disabled={disabled}
          style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800,
            border: `2px solid ${value[i] ? '#3b82f6' : '#e5e7eb'}`, borderRadius: 12, outline: 'none',
            fontFamily: 'inherit', background: value[i] ? '#eff6ff' : '#f9fafb', color: '#1e40af',
            transition: 'all 0.15s', boxShadow: value[i] ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none' }} />
      ))}
    </div>
  );
}

export default function Login() {
  const [step, setStep]         = useState('credentials'); // credentials | totp
  const [form, setForm]         = useState({ email: '', password: '' });
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeFeature, setActive] = useState(0);
  const [animating, setAnimating]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const id = setInterval(() => {
      setAnimating(true);
      setTimeout(() => { setActive(p => (p + 1) % FEATURES.length); setAnimating(false); }, 300);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Step 1 — verify password
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await auth.loginSendOtp(form);
      setStep('totp');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  // Step 2 — verify Google Authenticator code
  const handleVerifyTotp = async () => {
    if (code.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const res = await auth.loginVerifyOtp({ email: form.email, otp: code });
      login({ name: res.data.name, email: res.data.email, role: res.data.role, id: res.data.id }, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
      setCode('');
    }
    setLoading(false);
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::placeholder{color:#9ca3af}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
        .login-card{animation:fadeIn 0.5s ease both}
        .input-wrap input:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.12)!important;background:#fff!important}
        .submit-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 25px rgba(30,64,175,0.35)}
        @media(max-width:900px){.left-panel{display:none!important}.right-panel{width:100%!important;padding:24px!important}}
      `}</style>

      {/* Left branding panel */}
      <div className="left-panel" style={s.left}>
        <div style={s.blob1}/><div style={s.blob2}/><div style={s.blob3}/>
        <div style={s.logo}>
          <div style={s.logoIcon}><span style={{fontSize:26}}>✚</span></div>
          <div>
            <div style={s.logoText}>MediPulse</div>
            <div style={s.logoSub}>HEALTH INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        <div style={{marginBottom:40}}>
          <h1 style={s.headline}>Smart Healthcare,<br/><span style={{opacity:0.7}}>Reimagined.</span></h1>
          <p style={s.subline}>Oracle-powered, AI-driven hospital management with Google Authenticator 2FA security.</p>
        </div>
        <div style={{...s.featureCard, opacity: animating ? 0 : 1, transition:'opacity 0.3s'}}>
          <div style={s.featureIcon}>{FEATURES[activeFeature].icon}</div>
          <div>
            <div style={s.featureTitle}>{FEATURES[activeFeature].title}</div>
            <div style={s.featureDesc}>{FEATURES[activeFeature].desc}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:16}}>
          {FEATURES.map((_,i) => (
            <div key={i} onClick={()=>setActive(i)} style={{width:i===activeFeature?24:8,height:8,borderRadius:4,background:i===activeFeature?'#fff':'rgba(255,255,255,0.35)',cursor:'pointer',transition:'all 0.3s'}}/>
          ))}
        </div>
        <div style={s.statsBar}>
          {[['50K+','Patients'],['98%','Uptime'],['<200ms','Response'],['Google 2FA','Secured']].map(([v,l])=>(
            <div key={l} style={{textAlign:'center'}}>
              <div style={{fontWeight:800,fontSize:18,letterSpacing:'-0.5px'}}>{v}</div>
              <div style={{fontSize:11,opacity:0.6,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="right-panel" style={s.right}>
        <div className="login-card" style={s.card}>

          <div style={s.oracleBadge}>
            <span style={{fontSize:12}}>🔴</span>
            <span style={{fontWeight:600,fontSize:11,color:'#dc2626',letterSpacing:'0.5px'}}>ORACLE DATABASE</span>
            <span style={s.badgeDot}/>
            <span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>Connected</span>
          </div>

          {/* ── STEP 1: Password ── */}
          {step === 'credentials' && (
            <>
              <div style={{marginBottom:24}}>
                <h2 style={s.cardTitle}>Welcome back 👋</h2>
                <p style={s.cardSub}>Sign in with your password + Google Authenticator</p>
              </div>

              {error && <div style={{...s.errorBox,animation:'shake 0.4s ease'}}><span>⚠️</span><span>{error}</span></div>}

              <form onSubmit={handleVerifyPassword} style={{marginTop:16}}>
                <div style={{marginBottom:14}}>
                  <label style={s.label}>EMAIL ADDRESS</label>
                  <div className="input-wrap" style={s.inputWrap}>
                    <span style={s.inputIcon}>✉️</span>
                    <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                      type="email" placeholder="your@email.com" required style={s.input}/>
                  </div>
                </div>

                <div style={{marginBottom:20}}>
                  <label style={s.label}>PASSWORD</label>
                  <div className="input-wrap" style={s.inputWrap}>
                    <span style={s.inputIcon}>🔒</span>
                    <input value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                      type={showPass?'text':'password'} placeholder="••••••••" required style={{...s.input,paddingRight:44}}/>
                    <button type="button" onClick={()=>setShowPass(p=>!p)} style={s.eyeBtn}>{showPass?'🙈':'👁️'}</button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="submit-btn"
                  style={{...s.submitBtn,opacity:loading?0.85:1,cursor:loading?'not-allowed':'pointer'}}>
                  {loading
                    ? <span style={{display:'flex',alignItems:'center',gap:10,justifyContent:'center'}}>
                        <span style={{display:'inline-block',width:18,height:18,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                        Verifying…
                      </span>
                    : '→ Continue to Google Authenticator'
                  }
                </button>
              </form>

              <div style={s.securityRow}>
                {['🔐 AES-256','🛡️ JWT Auth','📱 Google 2FA'].map(c=><span key={c} style={s.chip}>{c}</span>)}
              </div>
              <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'#9ca3af'}}>
                New to MediPulse?{' '}<Link to="/register" style={{color:'#3b82f6',fontWeight:700,textDecoration:'none'}}>Create account</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Google Authenticator Code ── */}
          {step === 'totp' && (
            <>
              <div style={{textAlign:'center',marginBottom:20}}>
                {/* Google Authenticator icon */}
                <div style={{width:72,height:72,borderRadius:20,background:'linear-gradient(135deg,#4285F4,#34A853)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:36,boxShadow:'0 8px 24px rgba(66,133,244,0.35)'}}>
                  🔐
                </div>
                <h2 style={{...s.cardTitle,textAlign:'center'}}>Google Authenticator</h2>
                <p style={{...s.cardSub,textAlign:'center',lineHeight:1.7}}>
                  Open <strong>Google Authenticator</strong> on your phone<br/>
                  and enter the <strong>6-digit code</strong> for MediPulse.
                </p>
              </div>

              <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:12,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#1e40af',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:16}}>⏱</span>
                <span>Code refreshes every <strong>30 seconds</strong>. Use the current code shown in the app.</span>
              </div>

              {error && <div style={{...s.errorBox,animation:'shake 0.4s ease'}}><span>⚠️</span><span>{error}</span></div>}

              <OtpInput value={code} onChange={setCode} disabled={loading}/>

              <button onClick={handleVerifyTotp} disabled={loading||code.length<6} className="submit-btn"
                style={{...s.submitBtn,opacity:(loading||code.length<6)?0.65:1,cursor:(loading||code.length<6)?'not-allowed':'pointer',marginTop:4}}>
                {loading
                  ? <span style={{display:'flex',alignItems:'center',gap:10,justifyContent:'center'}}>
                      <span style={{display:'inline-block',width:18,height:18,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                      Verifying…
                    </span>
                  : '✓ Verify & Sign In'
                }
              </button>

              <button onClick={()=>{setStep('credentials');setCode('');setError('');}}
                style={{display:'block',margin:'12px auto 0',background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
                ← Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  root:{minHeight:'100vh',display:'flex',fontFamily:"'Inter',system-ui,sans-serif",background:'#0f172a'},
  left:{flex:1,position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 56px',color:'#fff',background:'linear-gradient(145deg,#0f172a 0%,#1e3a5f 40%,#0f4c75 100%)'},
  blob1:{position:'absolute',top:-80,right:-80,width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.18),transparent 70%)',pointerEvents:'none'},
  blob2:{position:'absolute',bottom:-60,left:-60,width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)',pointerEvents:'none'},
  blob3:{position:'absolute',top:'50%',left:'40%',width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)',pointerEvents:'none'},
  logo:{display:'flex',alignItems:'center',gap:14,marginBottom:44},
  logoIcon:{width:52,height:52,borderRadius:16,background:'rgba(255,255,255,0.12)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,0.2)',animation:'float 4s ease-in-out infinite'},
  logoText:{fontWeight:900,fontSize:26,letterSpacing:'-1px'},
  logoSub:{fontSize:10,opacity:0.55,letterSpacing:'2px',fontWeight:500,marginTop:2},
  headline:{fontSize:42,fontWeight:900,lineHeight:1.1,letterSpacing:'-1.5px',marginBottom:16},
  subline:{fontSize:15,opacity:0.7,lineHeight:1.7,maxWidth:380},
  featureCard:{display:'flex',alignItems:'flex-start',gap:16,padding:'18px 20px',borderRadius:16,background:'rgba(255,255,255,0.08)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.12)',marginBottom:12},
  featureIcon:{fontSize:32,lineHeight:1},
  featureTitle:{fontWeight:700,fontSize:15,marginBottom:4},
  featureDesc:{fontSize:13,opacity:0.65,lineHeight:1.5},
  statsBar:{display:'flex',justifyContent:'space-between',marginTop:28,padding:'18px 24px',borderRadius:14,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff'},
  right:{width:480,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 32px',background:'#f8fafc'},
  card:{background:'#fff',borderRadius:28,padding:'36px 34px',width:'100%',boxShadow:'0 24px 60px rgba(0,0,0,0.1)',border:'1px solid rgba(0,0,0,0.06)'},
  oracleBadge:{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:20,background:'#fff7f7',border:'1px solid #fecaca',marginBottom:20,width:'fit-content'},
  badgeDot:{width:5,height:5,borderRadius:'50%',background:'#d1d5db'},
  cardTitle:{fontSize:24,fontWeight:900,color:'#0f172a',marginBottom:6,letterSpacing:'-0.5px'},
  cardSub:{color:'#94a3b8',fontSize:14},
  errorBox:{background:'#fff5f5',color:'#b91c1c',padding:'12px 16px',borderRadius:12,marginBottom:12,fontSize:13,border:'1px solid #fecaca',display:'flex',alignItems:'center',gap:10},
  label:{fontSize:11,fontWeight:700,color:'#374151',letterSpacing:'0.8px',display:'block',marginBottom:6},
  inputWrap:{position:'relative',display:'flex',alignItems:'center'},
  inputIcon:{position:'absolute',left:14,fontSize:16,pointerEvents:'none',zIndex:1},
  input:{width:'100%',padding:'13px 16px 13px 42px',border:'1.5px solid #e5e7eb',borderRadius:12,fontSize:14,outline:'none',fontFamily:'inherit',background:'#f9fafb',color:'#111827',transition:'all 0.2s'},
  eyeBtn:{position:'absolute',right:12,background:'none',border:'none',cursor:'pointer',fontSize:16,padding:4,lineHeight:1},
  submitBtn:{width:'100%',padding:'14px',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',border:'none',borderRadius:14,fontSize:15,fontWeight:700,fontFamily:'inherit',transition:'all 0.2s'},
  securityRow:{display:'flex',gap:8,justifyContent:'center',marginTop:18,flexWrap:'wrap'},
  chip:{padding:'5px 10px',borderRadius:20,background:'#f1f5f9',fontSize:11,color:'#64748b',fontWeight:600,border:'1px solid #e2e8f0'},
};
