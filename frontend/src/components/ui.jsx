import { Wifi, WifiOff, Cpu, AlertTriangle, CheckCircle, Clock, Minus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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
      online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      {online ? <Wifi size={11} /> : <WifiOff size={11} />}
      {online ? 'Online' : 'Offline mode'}
    </span>
  );
}

export function UrgencyBadge({ level }) {
  const map = {
    critical: { cls: 'bg-red-50 text-red-700 border border-red-200',       icon: <AlertTriangle size={10} /> },
    high:     { cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <AlertTriangle size={10} /> },
    moderate: { cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: <Clock size={10} /> },
    low:      { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={10} /> },
    unknown:  { cls: 'bg-gray-100 text-gray-500 border border-gray-200',    icon: <Minus size={10} /> },
  };
  const { cls, icon } = map[level] || map.unknown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${cls}`}>
      {icon} {level}
    </span>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) {
  const base = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]',
    ghost:   'bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100',
    danger:  'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
    outline: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400',
    green:   'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input({ label, hint, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-gray-500 font-medium tracking-wide uppercase">{label}</label>}
      <input
        {...props}
        className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none transition-colors"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, hint, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-gray-500 font-medium tracking-wide uppercase">{label}</label>}
      <textarea
        {...props}
        className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none transition-colors resize-none"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function Spinner({ size = 'sm' }) {
  const s = size === 'lg' ? 'w-6 h-6 border-2' : 'w-4 h-4 border-2';
  return <div className={`${s} border-gray-200 border-t-gray-700 rounded-full animate-spin`} />;
}

export function Disclaimer() {
  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mt-4">
      <ShieldCheck size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-blue-700 leading-relaxed">
        This tool supports clinical decision-making and does not replace professional medical judgment.
      </p>
    </div>
  );
}

export function GemmaBadge() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    api.aiStatus().then(setStatus).catch(() => setStatus({ gemma_live: false, label: 'Keyword fallback' }));
  }, []);

  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
      status.ollama_live
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : status.api_live
        ? 'bg-purple-50 text-purple-700 border border-purple-200'
        : 'bg-gray-100 text-gray-500 border border-gray-200'
    }`}>
      <Cpu size={11} />
      {status.ollama_live ? 'Gemma local' : status.api_live ? 'Gemma API' : 'Keyword mode'}
    </span>
  );
}

export function LangToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {[['en', 'English'], ['ha', 'Hausa']].map(([code, label]) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === code ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="p-12 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon size={22} className="text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
