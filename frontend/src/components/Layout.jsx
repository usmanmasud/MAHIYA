import { NavLink, Outlet } from 'react-router-dom';
import { OfflineBadge, GemmaBadge } from './ui';

const nav = [
  { to: '/',          emoji: '🏠', label: 'Dashboard' },
  { to: '/patients',  emoji: '👩‍⚕️', label: 'Patients'  },
  { to: '/cases',     emoji: '📋', label: 'Cases'     },
  { to: '/new-case',  emoji: '➕', label: 'New Case'  },
  { to: '/settings',  emoji: '⚙️', label: 'Settings'  },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f5]">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm">
              🩺
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">Mahiya Edge</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Clinical Intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, emoji, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-base leading-none">{emoji}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <OfflineBadge />
          <GemmaBadge />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
