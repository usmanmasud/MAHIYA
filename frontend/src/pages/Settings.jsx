import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Disclaimer } from '../components/ui';

const GUIDELINES = [
  '📘 WHO Maternal Health Guidelines',
  '🇳🇬 Nigeria FMOH Emergency Obstetric Care',
  '👶 Integrated Management of Childhood Illness (IMCI)',
];

const DANGER_SIGNS = [
  { ha: 'Jini mai yawa', en: 'Heavy bleeding (PPH)' },
  { ha: 'Jiri / Farfadiya', en: 'Convulsions / Eclampsia' },
  { ha: 'Ciwon kai mai ƙarfi', en: 'Severe headache (Preeclampsia)' },
  { ha: 'Zazzabi a jariiri', en: 'Fever in newborn (Neonatal Sepsis)' },
  { ha: 'Wahalar haihuwa', en: 'Obstructed labour' },
];

export default function Settings() {
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    api.aiStatus().then(setAiStatus).catch(() => setAiStatus({ gemma_live: false, mode: 'Backend offline' }));
  }, []);

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">⚙️ Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Platform configuration & reference</p>
      </div>

      <div className="space-y-4">

        {/* Gemma Status */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 font-medium mb-3">🤖 AI Engine</p>
          {aiStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                  aiStatus.gemma_live
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {aiStatus.gemma_live ? '✨ Gemma 4 live' : '⚙️ Keyword fallback'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Model</span>
                <span className="text-gray-700">{aiStatus.model || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Mode</span>
                <span className="text-gray-700">{aiStatus.mode}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Checking AI status...</p>
          )}

          {aiStatus && !aiStatus.gemma_live && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-2">
              <p className="font-medium">🔑 To enable Gemma 4:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Go to <span className="font-mono">aistudio.google.com/app/apikey</span></li>
                <li>Create a free API key</li>
                <li>Open <span className="font-mono">backend/.env</span></li>
                <li>Set <span className="font-mono">GEMINI_API_KEY=your_key</span></li>
                <li>Restart the backend server</li>
              </ol>
            </div>
          )}
        </Card>

        {/* Platform info */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 font-medium mb-3">🖥 Platform</p>
          <div className="space-y-3 text-sm">
            {[
              ['Version', '1.0.0-mvp'],
              ['💾 Storage', 'Local SQLite — AES-256 encrypted'],
              ['🔒 Auth', 'PIN-protected'],
              ['🌐 Languages', 'English 🇬🇧 + Hausa 🇳🇬'],
              ['📡 Network', 'Works fully offline (keyword mode)'],
              ['📱 PWA', 'Installable — works offline'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Guidelines */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 font-medium mb-3">📚 Clinical Guidelines</p>
          <div className="space-y-2 text-sm text-gray-600">
            {GUIDELINES.map(g => <p key={g}>{g}</p>)}
          </div>
        </Card>

        {/* Hausa keywords */}
        <Card className="p-5">
          <p className="text-xs text-gray-400 font-medium mb-3">🇳🇬 Hausa Danger Sign Keywords</p>
          <p className="text-xs text-gray-400 mb-3">The AI recognises these Hausa terms automatically:</p>
          <div className="space-y-2">
            {DANGER_SIGNS.map(({ ha, en }) => (
              <div key={ha} className="flex items-center justify-between text-sm">
                <span className="text-gray-800 font-medium">{ha}</span>
                <span className="text-gray-400 text-xs">{en}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Disclaimer />
        </Card>
      </div>
    </div>
  );
}
