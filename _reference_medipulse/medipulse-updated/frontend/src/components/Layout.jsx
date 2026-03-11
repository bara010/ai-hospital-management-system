import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationToastSystem from './NotificationToast';

function NavItem({ to, icon, label, active, color = '#0f4c75' }) {
  const [hov, setHov] = React.useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 10, marginBottom: 2,
          background: active ? `${color}14` : hov ? '#f8fafd' : 'transparent',
          borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 17, width: 20, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? color : '#4a5568' }}>{label}</span>
      </div>
    </Link>
  );
}

const ROLE_CONFIG = {
  PATIENT: {
    color: '#1b6ca8',
    bg: 'linear-gradient(135deg,#0f4c75,#1b6ca8)',
    label: 'Patient Portal',
    emoji: '🏥',
    nav: [
      { to: '/',              icon: '⚡', label: 'Dashboard' },
      { to: '/appointments',  icon: '📅', label: 'Appointments' },
      { to: '/online-doctor', icon: '🟢', label: 'Online Doctor' },
      { to: '/departments',   icon: '🏥', label: 'Departments' },
      { to: '/vitals',        icon: '❤️', label: 'Vitals' },
      { to: '/mood',          icon: '💙', label: 'Mood Check' },
      { to: '/adherence',     icon: '💊', label: 'Medications' },
      { to: '/nearby-hospitals', icon: '📍', label: 'Nearby Hospitals' },
      { to: '/settings',      icon: '⚙️', label: 'Settings' },
    ],
  },
  DOCTOR: {
    color: '#047857',
    bg: 'linear-gradient(135deg,#065f46,#047857)',
    label: 'Doctor Portal',
    emoji: '👨‍⚕️',
    nav: [
      { to: '/',              icon: '⚡', label: 'Dashboard' },
      { to: '/my-patients',   icon: '👥', label: 'My Patients' },
      { to: '/appointments',  icon: '📅', label: 'Appointments' },
      { to: '/online-doctor', icon: '🟢', label: 'Online Consults' },
      { to: '/departments',   icon: '🏥', label: 'Departments' },
      { to: '/vitals',        icon: '❤️', label: 'Patient Vitals' },
      { to: '/discharge',     icon: '📄', label: 'Discharge Summary' },
      { to: '/nearby-hospitals', icon: '📍', label: 'Nearby Hospitals' },
      { to: '/settings',      icon: '⚙️', label: 'Settings' },
    ],
  },
  ADMIN: {
    color: '#6d28d9',
    bg: 'linear-gradient(135deg,#312e81,#6d28d9)',
    label: 'Admin Control',
    emoji: '🛡️',
    nav: [
      { to: '/',              icon: '⚡', label: 'Dashboard' },
      { to: '/analytics',     icon: '📊', label: 'Analytics' },
      { to: '/beds',          icon: '🛏️', label: 'Bed Occupancy' },
      { to: '/pharmacy',      icon: '🏪', label: 'Pharmacy Stock' },
      { to: '/billing',       icon: '💰', label: 'Billing & Revenue' },
      { to: '/audit',         icon: '🔏', label: 'Audit Log' },
      { to: '/departments',   icon: '🏥', label: 'Departments' },
      { to: '/appointments',  icon: '📅', label: 'Appointments' },
      { to: '/admin-setup',   icon: '⚙️', label: 'System Setup' },
      { to: '/settings',      icon: '🔧', label: 'Settings' },
    ],
  },
  NURSE: {
    color: '#db2777',
    bg: 'linear-gradient(135deg,#be185d,#db2777)',
    label: 'Nurse Station',
    emoji: '👩‍⚕️',
    nav: [
      { to: '/',              icon: '⚡', label: 'Dashboard' },
      { to: '/vitals',        icon: '❤️', label: 'Log Vitals' },
      { to: '/adherence',     icon: '💊', label: 'Medication Round' },
      { to: '/beds',          icon: '🛏️', label: 'Ward Beds' },
      { to: '/settings',      icon: '⚙️', label: 'Settings' },
    ],
  },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const role   = user?.role || 'PATIENT';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.PATIENT;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', fontFamily: "'Outfit',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 3px; }
        a { text-decoration: none; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: 220, minHeight: '100vh', background: 'white',
        boxShadow: '2px 0 20px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0, overflow: 'hidden',
      }}>
        {/* Brand header */}
        <div style={{ padding: 16, background: config.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✚</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Georgia,serif' }}>MediPulse</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.8px' }}>{config.emoji} {config.label.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {config.nav.map(item => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
              color={config.color}
            />
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: 12, borderTop: '1px solid #f0f4f8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 11, background: '#f8fafd' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: config.color }}>{config.emoji} {user?.role}</div>
            </div>
            <button onClick={handleLogout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, padding: 2 }}>⏻</button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Topbar - NO notification bell */}
        <header style={{
          background: 'white', borderBottom: '1px solid #f0f4f8',
          padding: '0 24px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a202c' }}>
              {config.nav.find(n => n.to === location.pathname)?.label || 'Dashboard'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', background: '#f8fafd', padding: '6px 14px', borderRadius: 20, border: '1px solid #e2e8f0', fontWeight: 600 }}>
              {config.emoji} {role}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          <Outlet />
        </main>

        {/* ── Zomato-style notification toasts ── */}
        <NotificationToastSystem userId={user?.id} role={role} />
      </div>
    </div>
  );
}
