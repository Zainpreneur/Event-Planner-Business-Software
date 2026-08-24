import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/events', label: 'Events', icon: '🎉' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/vendors', label: 'Vendors', icon: '🧰' },
  { to: '/invoices', label: 'Invoices', icon: '💳' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-lg text-white">🗓️</div>
          <span className="text-base font-semibold text-neutral-900">SoiréeOS</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100'
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-4">
          <p className="truncate text-sm font-medium text-neutral-800">{user?.name}</p>
          <p className="truncate text-xs text-neutral-500">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
