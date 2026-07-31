import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LogOut, HeartPulse, Menu, X,
  Home, UserRound, FolderOpen, FilePlus, TrendingUp, SlidersHorizontal,
} from 'lucide-react';
import { OfflineBadge, GemmaBadge } from './ui';

const nav = [
  { to: '/',          icon: Home,               label: 'Dashboard'  },
  { to: '/patients',  icon: UserRound,           label: 'Patients'   },
  { to: '/cases',     icon: FolderOpen,          label: 'Cases'      },
  { to: '/new-case',  icon: FilePlus,            label: 'New Case'   },
  { to: '/analytics', icon: TrendingUp,          label: 'Analytics'  },
  { to: '/settings',  icon: SlidersHorizontal,   label: 'Settings'   },
];

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
          isActive
            ? 'bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-200'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} strokeWidth={isActive ? 2.5 : 1.75} className="flex-shrink-0" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ onLogout, onNavClick }) {
  return (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-200">
            <HeartPulse size={18} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none tracking-tight">SafeBirth</p>
            <p className="text-[10px] text-gray-400 mt-0.5 tracking-widest uppercase">Clinical AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <NavItem key={item.to} {...item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2.5">
        <OfflineBadge />
        <GemmaBadge />
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors mt-1 group"
        >
          <LogOut size={12} className="group-hover:text-red-500" /> Lock clinic
        </button>
      </div>
    </>
  );
}

export default function Layout({ onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f5]">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-white border-r border-gray-100 flex-col">
        <SidebarContent onLogout={onLogout} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40 transform transition-transform duration-200 md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>
        <SidebarContent onLogout={onLogout} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <HeartPulse size={14} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold text-gray-900">SafeBirth</span>
          </div>
          <div className="w-9" /> {/* spacer */}
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
