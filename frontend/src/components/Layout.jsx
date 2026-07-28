import { NavLink, Outlet } from 'react-router-dom';
import { Users, FolderOpen, Plus, Settings, Activity } from 'lucide-react';
import { OfflineBadge } from './ui';

const nav = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/new-case', icon: Plus, label: 'New Case' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
        <div className="px-5 py-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#e8e3dc] flex items-center justify-center">
              <span className="text-[#0f0f0f] text-xs font-bold">M</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e8e3dc] leading-none">Mahiya Edge</p>
              <p className="text-[10px] text-[#555] mt-0.5">Clinical Intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-[#1e1e1e] text-[#e8e3dc]'
                    : 'text-[#555] hover:text-[#999] hover:bg-[#141414]'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[#1a1a1a]">
          <OfflineBadge />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
