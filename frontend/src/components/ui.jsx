import { Wifi, WifiOff, Cpu } from 'lucide-react';
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
      online ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      {online ? <Wifi size={11} /> : <WifiOff size={11} />}
      {online ? 'Online' : '📴 Offline mode'}
    </span>
  );
}

export function UrgencyBadge({ level }) {
  const map = {
    critical: 'bg-red-50 text-red-700 border border-red-200',
    high:     'bg-orange-50 text-orange-700 border border-orange-200',
    moderate: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low:      'bg-green-50 text-green-700 border border-green-200',
    unknown:  'bg-gray-100 text-gray-500 border border-gray-200',
  };
  const emoji = { critical: '🔴', high: '🟠', moderate: '🟡', low: '🟢', unknown: '⚪' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${map[level] || map.unknown}`}>
      {emoji[level] || '⚪'} {level}
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
    green:   'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]',
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
      {label && <label className="text-xs text-gray-500 font-medium">{label}</label>}
      <input
        {...props}
        className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:bg-white transition-colors"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, hint, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-gray-500 font-medium">{label}</label>}
      <textarea
        {...props}
        className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:bg-white transition-colors resize-none"
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
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mt-4">
      <span className="text-base leading-none mt-0.5">⚕️</span>
      <p className="text-xs text-blue-700 leading-relaxed">
        This tool supports clinical decision-making and does not replace professional medical judgment.
      </p>
    </div>
  );
}

export function GemmaBadge() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    api.aiStatus().then(setStatus).catch(() => setStatus({ gemma_live: false, label: '⚙️ Keyword fallback' }));
  }, []);

  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
      status.ollama_live
        ? 'bg-green-50 text-green-700 border border-green-200'
        : status.api_live
        ? 'bg-purple-50 text-purple-700 border border-purple-200'
        : 'bg-gray-100 text-gray-500 border border-gray-200'
    }`}>
      <Cpu size={11} />
      {status.label || (status.gemma_live ? '✨ Gemma live' : 'Keyword mode')}
    </span>
  );
}

export function LangToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {[['en', '🇬🇧 English'], ['ha', '🇳🇬 Hausa']].map(([code, label]) => (
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
