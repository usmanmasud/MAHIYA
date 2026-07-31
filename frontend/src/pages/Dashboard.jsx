import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, AlertTriangle, PlusCircle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, Btn, PageHeader } from '../components/ui';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPatients(), api.getCases()])
      .then(([p, c]) => { setPatients(Array.isArray(p) ? p : []); setCases(Array.isArray(c) ? c : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const critical = cases.filter(c => c.urgency_level === 'critical' || c.urgency_level === 'high');
  const recent = cases.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title={`${greeting}`}
        subtitle="Here's what's happening at your clinic today."
        action={
          <Link to="/new-case">
            <Btn><PlusCircle size={14} /> New Case</Btn>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: patients.length, icon: Users,          color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { label: 'Total Cases',    value: cases.length,    icon: ClipboardList,  color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'High Priority',  value: critical.length, icon: AlertTriangle,  color: 'text-red-500',    bg: 'bg-red-50'    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} strokeWidth={1.75} />
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{loading ? '—' : value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Cases */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">Recent Cases</span>
          <Link to="/cases" className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading cases...</div>
        ) : recent.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No cases yet</p>
            <Link to="/new-case" className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block">
              Start your first case
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Users size={13} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 font-medium">{c.patient_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.symptoms || 'No symptoms recorded'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <UrgencyBadge level={c.urgency_level} />
                  <span className="text-xs text-gray-300">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Tip */}
      <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Languages size={13} className="text-emerald-700" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-800 mb-0.5">Language support</p>
          <p className="text-sm text-emerald-700">You can speak in <strong>Hausa or English</strong> when recording symptoms. The AI understands both languages.</p>
        </div>
      </div>
    </div>
  );
}

function Languages({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
    </svg>
  );
}
