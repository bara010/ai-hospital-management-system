import { Link } from 'react-router-dom';

function initials(user) {
  const first = user?.firstName || '';
  const last = user?.lastName || '';
  const value = `${first} ${last}`.trim() || user?.email || 'U';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function Navbar({ title, subtitle, onOpenMobile, unreadCount, quickActions = [], user }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
          onClick={onOpenMobile}
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-dark lg:text-lg">{title}</h1>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="order-3 w-full lg:order-none lg:w-auto lg:flex-1 lg:max-w-md">
          <div className="relative">
            <input className="input pl-9" placeholder="Search doctors, appointments, records" />
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.to} className="btn-secondary hidden lg:inline-flex">
              {action.label}
            </Link>
          ))}

          <Link
            to="/notifications"
            className="relative inline-flex rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Open notifications"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V10a6 6 0 1 0-12 0v4.2c0 .5-.2 1-.6 1.4L4 17h5" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>

          <Link to="/profile" className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white">
            {initials(user) || 'U'}
          </Link>
        </div>
      </div>
    </header>
  );
}
