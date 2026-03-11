import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

function SidebarItem({ item, active, collapsed }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-blue-50 text-primary'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
      {!collapsed ? <span>{item.label}</span> : null}
    </Link>
  );
}

export default function Sidebar({
  items,
  currentPath,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  roleLabel,
  onLogout,
}) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={`fixed z-40 flex h-screen flex-col border-r border-slate-200 bg-white shadow-soft transition-all duration-200 lg:sticky lg:top-0 ${
          mobileOpen ? 'left-0' : '-left-80 lg:left-0'
        } ${collapsed ? 'w-20' : 'w-72'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          {!collapsed ? (
            <div>
              <BrandLogo to="/" showText textClassName="text-lg font-extrabold tracking-tight text-dark" />
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{roleLabel}</p>
            </div>
          ) : (
            <BrandLogo to="/" showText={false} iconSize={30} />
          )}
          <button
            type="button"
            className="hidden rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 lg:inline-flex"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 4 13 10 7 16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              active={item.match(currentPath)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="border-t border-slate-200 px-3 py-4">
          <button
            type="button"
            onClick={onLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Logout' : undefined}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
            </svg>
            {!collapsed ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
