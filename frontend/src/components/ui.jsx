import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineBadge() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
      online ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
    }`}>
      {online ? <Wifi size={11} /> : <WifiOff size={11} />}
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

export function UrgencyBadge({ level }) {
  const map = {
    critical: 'bg-red-950 text-red-400 border border-red-900',
    high: 'bg-orange-950 text-orange-400 border border-orange-900',
    moderate: 'bg-yellow-950 text-yellow-400 border border-yellow-900',
    low: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    unknown: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${map[level] || map.unknown}`}>
      {level}
    </span>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#161616] border border-[#222] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) {
  const base = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#e8e3dc] text-[#0f0f0f] hover:bg-white active:scale-[0.98]',
    ghost: 'bg-transparent text-[#888] hover:text-[#e8e3dc] hover:bg-[#1a1a1a]',
    danger: 'bg-red-950 text-red-400 hover:bg-red-900 border border-red-900',
    outline: 'bg-transparent border border-[#2a2a2a] text-[#ccc] hover:border-[#444] hover:text-white',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-[#666] font-medium uppercase tracking-wide">{label}</label>}
      <input
        {...props}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-[#e8e3dc] placeholder-[#444] focus:border-[#444] transition-colors"
      />
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-[#666] font-medium uppercase tracking-wide">{label}</label>}
      <textarea
        {...props}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-[#e8e3dc] placeholder-[#444] focus:border-[#444] transition-colors resize-none"
      />
    </div>
  );
}

export function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-[#333] border-t-[#e8e3dc] rounded-full animate-spin" />
  );
}

export function Disclaimer() {
  return (
    <p className="text-xs text-[#555] leading-relaxed border-t border-[#1e1e1e] pt-4 mt-4">
      ⚕ This tool supports clinical decision-making and does not replace professional medical judgment.
    </p>
  );
}
