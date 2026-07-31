import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, ClipboardList, PlusCircle, BarChart2, Settings, HeartPulse } from 'lucide-react';
import { OfflineBadge, GemmaBadge } from './ui';

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/patients',  icon: Users,           label: 'Patients'   },
  { to: '/cases',     icon: ClipboardList,   label: 'Cases'      },
  { to: '/new-case',  icon: PlusCircle,      label: 'New Case'   },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics'  },
  { to: '/settings',  icon: Settings,        label: 'Settings'   },
];

export default function Layout({ onLogout }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f5]">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <HeartPulse size={16} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">SafeBirth</p>
              <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide uppercase">Clinical Intelligence</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <OfflineBadge />
          <GemmaBadge />
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-2"
          >
            <LogOut size={11} /> Lock clinic
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
