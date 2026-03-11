import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BrandLogo from './BrandLogo';
import { notificationApi } from '../services/hospitoApi';
import { registerFcmTokenIfPossible } from '../services/fcm';
import { useAuth } from '../hooks/useAuth';

function roleDashboard(role) {
  if (role === 'PATIENT') return '/patient/dashboard';
  if (role === 'DOCTOR') return '/doctor/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/';
}

const ROLE_LABELS = {
  PATIENT: 'Patient Workspace',
  DOCTOR: 'Doctor Workspace',
  ADMIN: 'Admin Workspace',
};

function icon(path) {
  return function Icon({ className = 'h-5 w-5' }) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        {path.map((p, idx) => (
          <path key={idx} d={p} />
        ))}
      </svg>
    );
  };
}

const Icons = {
  dashboard: icon(['M3 3h8v8H3z', 'M13 3h8v5h-8z', 'M13 10h8v11h-8z', 'M3 13h8v8H3z']),
  doctors: icon(['M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z', 'M4 21a8 8 0 0 1 16 0']),
  appointments: icon(['M7 2v4', 'M17 2v4', 'M3 9h18', 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z']),
  notifications: icon(['M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V10a6 6 0 1 0-12 0v4.2c0 .5-.2 1-.6 1.4L4 17h5', 'M10 20a2 2 0 0 0 4 0']),
  medications: icon(['M6 4h12v6H6z', 'M8 10v10', 'M16 10v10', 'M4 20h16']),
  messages: icon(['M4 5h16v11H7l-3 3z']),
  ai: icon(['M12 4v3', 'M12 17v3', 'M4 12h3', 'M17 12h3', 'M6.8 6.8l2.1 2.1', 'M15.1 15.1l2.1 2.1', 'M17.2 6.8l-2.1 2.1', 'M8.9 15.1l-2.1 2.1', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z']),
  emergency: icon(['M12 2 3 7v6c0 5.5 3.8 9.6 9 11 5.2-1.4 9-5.5 9-11V7l-9-5Z', 'M12 8v8', 'M8 12h8']),
  profile: icon(['M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0']),
  settings: icon(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V22a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z']),
};

function pageTitle(pathname, search, role) {
  if (pathname === roleDashboard(role)) return 'Dashboard';
  if (pathname === '/doctors') return 'Doctors';
  if (pathname === '/appointments') return 'Appointments';
  if (pathname === '/notifications') return 'Notifications';
  if (pathname === '/medications') return 'Medications';
  if (pathname === '/messages') return 'Messages';
  if (pathname === '/ai-health-assistant') return 'AI Health Assistant';
  if (pathname === '/emergency') return 'Emergency';
  if (pathname === '/profile') {
    const section = new URLSearchParams(search).get('section');
    return section === 'settings' ? 'Settings' : 'Profile';
  }
  if (pathname.startsWith('/book/')) return 'Appointment Booking';
  if (pathname.startsWith('/video/')) return 'Video Consultation';
  if (pathname === '/login') return 'Login';
  if (pathname === '/register') return 'Register';
  return 'HOSPITO';
}

export default function AppLayout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isAuthenticated) return;
    registerFcmTokenIfPossible();
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await notificationApi.list();
        if (mounted) setNotifications(Array.isArray(data) ? data.slice(0, 10) : []);
      } catch {
        if (mounted) setNotifications([]);
      }
    };
    loadNotifications();
    window.addEventListener('hospito-notifications-updated', loadNotifications);
    return () => {
      mounted = false;
      window.removeEventListener('hospito-notifications-updated', loadNotifications);
    };
  }, [isAuthenticated]);

  const role = user?.role;
  const dashboard = roleDashboard(role);
  const roleLabel = ROLE_LABELS[role] || 'Workspace';

  const navItems = useMemo(() => {
    const items = [
      { key: 'dashboard', label: 'Dashboard', to: dashboard, icon: Icons.dashboard, match: (p, s) => p === dashboard },
      { key: 'doctors', label: 'Doctors', to: '/doctors', icon: Icons.doctors, match: (p) => p === '/doctors' },
      { key: 'appointments', label: 'Appointments', to: '/appointments', icon: Icons.appointments, match: (p) => p === '/appointments' },
      { key: 'notifications', label: 'Notifications', to: '/notifications', icon: Icons.notifications, match: (p) => p === '/notifications' },
    ];

    if (role !== 'ADMIN') {
      items.push(
        { key: 'medications', label: 'Medications', to: '/medications', icon: Icons.medications, match: (p) => p === '/medications' },
        { key: 'messages', label: 'Messages', to: '/messages', icon: Icons.messages, match: (p) => p === '/messages' }
      );
    }

    if (role === 'PATIENT') {
      items.push(
        { key: 'ai', label: 'AI Health Assistant', to: '/ai-health-assistant', icon: Icons.ai, match: (p) => p === '/ai-health-assistant' },
        { key: 'emergency', label: 'Emergency', to: '/emergency', icon: Icons.emergency, match: (p) => p === '/emergency' }
      );
    }

    items.push(
      { key: 'profile', label: 'Profile', to: '/profile', icon: Icons.profile, match: (p, s) => p === '/profile' && new URLSearchParams(s).get('section') !== 'settings' },
      { key: 'settings', label: 'Settings', to: '/profile?section=settings', icon: Icons.settings, match: (p, s) => p === '/profile' && new URLSearchParams(s).get('section') === 'settings' }
    );

    return items;
  }, [dashboard, role]);

  const quickActions = useMemo(() => {
    if (role === 'PATIENT') return [{ label: 'Book Doctor', to: '/doctors' }, { label: 'Emergency', to: '/emergency' }];
    if (role === 'DOCTOR') return [{ label: 'Messages', to: '/messages' }, { label: 'Appointments', to: '/appointments' }];
    if (role === 'ADMIN') return [{ label: 'Operations', to: '/appointments' }, { label: 'Directory', to: '/doctors' }];
    return [];
  }, [role]);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
            <BrandLogo to="/" />
            <nav className="flex items-center gap-2">
              <Link to="/" className="btn-secondary">Home</Link>
              <Link to="/doctors" className="btn-secondary">Doctors</Link>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </div>
    );
  }

  const subtitle = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        items={navItems.map((item) => ({
          ...item,
          match: (path) => item.match(path, location.search),
        }))}
        currentPath={location.pathname}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        roleLabel={roleLabel}
        onLogout={onLogout}
      />

      <div className="min-w-0 flex-1">
        <Navbar
          title={pageTitle(location.pathname, location.search, role)}
          subtitle={subtitle}
          onOpenMobile={() => setMobileSidebarOpen(true)}
          unreadCount={notifications.filter((n) => !n.read).length}
          quickActions={quickActions}
          user={user}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}

