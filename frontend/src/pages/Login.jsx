import { useState } from 'react';
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center text-3xl mx-auto mb-4">
            🩺
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Mahiya Edge</h1>
          <p className="text-sm text-gray-400 mt-1">Enter clinic PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
          {/* PIN dots */}
          <div className="flex justify-center gap-3 py-2">
            {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-colors ${
                i < pin.length ? 'bg-gray-900' : 'bg-gray-200'
              }`} />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (d === '⌫') setPin(p => p.slice(0, -1));
                  else if (d !== '') handleKey(String(d));
                }}
                className={`h-12 rounded-xl text-sm font-medium transition-colors ${
                  d === '' ? '' :
                  d === '⌫' ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' :
                  'bg-gray-50 text-gray-800 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner /> Verifying...</> : 'Unlock'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          📴 Works fully offline · 🔒 Encrypted storage
        </p>
      </div>
    </div>
  );
}
