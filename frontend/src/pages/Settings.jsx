import { useEffect, useState } from 'react';
import { Cpu, Database, Lock, Globe, Smartphone, BookOpen, AlertTriangle, Settings as SettingsIcon, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Disclaimer, PageHeader } from '../components/ui';

const GUIDELINES = [
  'WHO Maternal Health Guidelines',
  'Nigeria FMOH Emergency Obstetric Care',
  'Integrated Management of Childhood Illness (IMCI)',
];

const DANGER_SIGNS = [
  { ha: 'Jini mai yawa',       en: 'Heavy bleeding (PPH)'           },
  { ha: 'Jiri / Farfadiya',    en: 'Convulsions / Eclampsia'        },
  { ha: 'Ciwon kai mai ƙarfi', en: 'Severe headache (Preeclampsia)' },
  { ha: 'Zazzabi a jariiri',   en: 'Fever in newborn (Neonatal Sepsis)' },
  { ha: 'Wahalar haihuwa',     en: 'Obstructed labour'              },
];

export default function Settings() {
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    api.aiStatus().then(setAiStatus).catch(() => setAiStatus({ gemma_live: false, mode: 'Backend offline' }));
  }, []);

  return (
    <div className="p-8 max-w-xl">
      <PageHeader title="Settings" subtitle="Platform configuration & reference" />

      <div className="space-y-4">

        {/* AI Engine */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <Cpu size={13} className="text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800">AI Engine</p>
          </div>
          {aiStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                  aiStatus.gemma_live
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {aiStatus.gemma_live ? <><CheckCircle size={10} /> Gemma 4 live</> : 'Keyword fallback'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Model</span>
                <span className="text-gray-700 font-mono text-xs">{aiStatus.model || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Mode</span>
                <span className="text-gray-700 capitalize">{aiStatus.mode}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Checking AI status...</p>
          )}

          {aiStatus && !aiStatus.gemma_live && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-2">
              <p className="font-semibold">To enable Gemma 4:</p>
              <ol className="space-y-1 list-decimal list-inside leading-relaxed">
                <li>Go to <span className="font-mono bg-amber-100 px-1 rounded">aistudio.google.com/app/apikey</span></li>
                <li>Create a free API key</li>
                <li>Open <span className="font-mono bg-amber-100 px-1 rounded">backend/.env</span></li>
                <li>Set <span className="font-mono bg-amber-100 px-1 rounded">GEMINI_API_KEY=your_key</span></li>
                <li>Restart the backend server</li>
              </ol>
            </div>
          )}
        </Card>

        {/* Platform info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <SettingsIcon size={13} className="text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Platform</p>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Version',   value: '1.0.0-mvp',                      icon: null         },
              { label: 'Storage',   value: 'Local SQLite — AES-256 encrypted', icon: Database    },
              { label: 'Auth',      value: 'PIN-protected',                   icon: Lock        },
              { label: 'Languages', value: 'English + Hausa',                 icon: Globe       },
              { label: 'Network',   value: 'Works fully offline',             icon: Globe       },
              { label: 'PWA',       value: 'Installable — works offline',     icon: Smartphone  },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1.5">
                  {Icon && <Icon size={12} className="text-gray-300" />}
                  {label}
                </span>
                <span className="text-gray-700 text-xs">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Guidelines */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen size={13} className="text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Clinical Guidelines</p>
          </div>
          <div className="space-y-2">
            {GUIDELINES.map(g => (
              <div key={g} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                {g}
              </div>
            ))}
          </div>
        </Card>

        {/* Hausa keywords */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <AlertTriangle size={13} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Hausa Danger Sign Keywords</p>
          </div>
          <p className="text-xs text-gray-400 mb-4 ml-10">The AI recognises these Hausa terms automatically</p>
          <div className="space-y-2">
            {DANGER_SIGNS.map(({ ha, en }) => (
              <div key={ha} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
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
