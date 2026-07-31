import { useState } from 'react';
import { HeartPulse, Delete, WifiOff, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/ui';

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(pin);
      localStorage.setItem('clinic_pin', pin);
      onLogin();
    } catch {
      setError('Invalid PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKey(digit) {
    if (pin.length < 6) setPin(p => p + digit);
  }

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center p-6">
      <div className="w-full max-w-xs">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
            <HeartPulse size={26} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">SafeBirth</h1>
          <p className="text-sm text-gray-400 mt-1">Enter clinic PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">

          {/* PIN dots */}
          <div className="flex justify-center gap-3 py-2">
            {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all duration-150 ${
                i < pin.length ? 'bg-gray-900 scale-110' : 'bg-gray-200'
              }`} />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9,'',0,'del'].map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (d === 'del') setPin(p => p.slice(0, -1));
                  else if (d !== '') handleKey(String(d));
                }}
                className={`h-12 rounded-xl text-sm font-medium transition-colors ${
                  d === '' ? '' :
                  d === 'del' ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center' :
                  'bg-gray-50 text-gray-800 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                {d === 'del' ? <Delete size={15} className="mx-auto" /> : d}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center bg-red-50 border border-red-100 rounded-lg py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner /> Verifying...</> : 'Unlock'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><WifiOff size={11} /> Works offline</span>
          <span className="text-gray-200">·</span>
          <span className="flex items-center gap-1"><Lock size={11} /> Encrypted storage</span>
        </div>
      </div>
    </div>
  );
}
