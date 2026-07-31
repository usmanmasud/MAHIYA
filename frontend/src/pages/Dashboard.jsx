import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FolderOpen, AlertTriangle, FilePlus, ArrowRight, Languages, TrendingUp, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, Btn } from '../components/ui';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPatients(), api.getCases()])
      .then(([p, c]) => {
        setPatients(Array.isArray(p) ? p : []);
        setCases(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const critical = cases.filter(c => c.urgency_level === 'critical' || c.urgency_level === 'high');
  const recent = cases.slice(0, 6);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-5 sm:p-8 max-w-5xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
          <p className="text-sm text-gray-400 mt-1">Here's what's happening at your clinic today.</p>
        </div>
        <Link to="/new-case">
          <Btn variant="green" className="w-full sm:w-auto justify-center">
            <FilePlus size={15} /> New Case
          </Btn>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Total Patients',
            value: patients.length,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            trend: 'Registered',
          },
          {
            label: 'Total Cases',
            value: cases.length,
            icon: FolderOpen,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            border: 'border-violet-100',
            trend: 'All time',
          },
          {
            label: 'High Priority',
            value: critical.length,
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            trend: 'Need attention',
          },
        ].map(({ label, value, icon: Icon, color, bg, border, trend }) => (
          <Card key={label} className={`p-5 border ${border}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-3">{label}</p>
                <p className="text-4xl font-bold text-gray-900">{loading ? '—' : value}</p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <TrendingUp size={10} /> {trend}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} strokeWidth={1.75} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Cases — takes 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen size={15} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">Recent Cases</span>
              </div>
              <Link to="/cases" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 font-medium">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : recent.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <FolderOpen size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No cases yet</p>
                <Link to="/new-case" className="text-xs text-emerald-600 hover:text-emerald-700 mt-1.5 inline-flex items-center gap-1">
                  Start your first case <ArrowRight size={10} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent.map(c => (
                  <Link
                    key={c.id}
                    to={`/cases/${c.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-500">
                          {c.patient_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">{c.patient_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{c.symptoms || 'No symptoms recorded'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <UrgencyBadge level={c.urgency_level} />
                      <span className="text-xs text-gray-300 hidden sm:block">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick actions */}
          <Card className="p-5">
            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link to="/new-case" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <FilePlus size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900">New Case</p>
                  <p className="text-xs text-emerald-600">Register & analyse</p>
                </div>
              </Link>
              <Link to="/patients" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Users size={14} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Patients</p>
                  <p className="text-xs text-gray-400">View all records</p>
                </div>
              </Link>
              <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={14} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Analytics</p>
                  <p className="text-xs text-gray-400">Clinic metrics</p>
                </div>
              </Link>
            </div>
          </Card>

          {/* Priority alert */}
          {!loading && critical.length > 0 && (
            <Card className="p-5 border-red-100 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-xs font-semibold text-red-700 tracking-wide uppercase">Priority Alert</p>
              </div>
              <p className="text-sm text-red-700">
                <span className="font-bold">{critical.length}</span> case{critical.length > 1 ? 's' : ''} require{critical.length === 1 ? 's' : ''} immediate attention.
              </p>
              <Link to="/cases" className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                Review now <ArrowRight size={10} />
              </Link>
            </Card>
          )}

          {/* Language tip */}
          <Card className="p-5 border-emerald-100 bg-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <Languages size={14} className="text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">Language Support</p>
            </div>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Speak in <strong>Hausa or English</strong> when recording symptoms. The AI understands both.
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}
