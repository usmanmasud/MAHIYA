import { useEffect, useState } from 'react';
import { Users, ClipboardList, FileText, AlertTriangle, BarChart2, Search } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, PageHeader } from '../components/ui';

const URGENCY_COLORS = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  moderate: 'bg-yellow-400',
  low:      'bg-emerald-500',
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-sm text-gray-500">Could not load analytics.</div>;

  const { totals, cases_by_day, urgency_breakdown, recent_audit } = data;
  const maxDay = Math.max(...(cases_by_day ?? []).map(d => d.count), 1);

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="Analytics" subtitle="Clinic consultation and referral metrics" />

      {/* Totals */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Patients',  value: totals.patients,  icon: Users,          color: 'text-blue-500',    bg: 'bg-blue-50'    },
          { label: 'Cases',     value: totals.cases,     icon: ClipboardList,  color: 'text-violet-500',  bg: 'bg-violet-50'  },
          { label: 'Referrals', value: totals.referrals, icon: FileText,       color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Critical',  value: totals.critical,  icon: AlertTriangle,  color: 'text-red-500',     bg: 'bg-red-50'     },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} strokeWidth={1.75} />
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Cases last 14 days */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Cases — Last 14 Days</p>
          </div>
          {cases_by_day.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-24">
              {cases_by_day.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gray-900 rounded-sm transition-all"
                    style={{ height: `${Math.round((d.count / maxDay) * 80)}px`, minHeight: '4px' }}
                    title={`${d.day}: ${d.count}`}
                  />
                  <span className="text-[9px] text-gray-400 rotate-45 origin-left">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Urgency breakdown */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Urgency Breakdown</p>
          </div>
          {urgency_breakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {urgency_breakdown.map(({ urgency_level, count }) => {
                const pct = Math.round((count / totals.cases) * 100);
                return (
                  <div key={urgency_level}>
                    <div className="flex items-center justify-between mb-1">
                      <UrgencyBadge level={urgency_level} />
                      <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${URGENCY_COLORS[urgency_level] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Audit log */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Search size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-800">Recent Audit Log</span>
        </div>
        {recent_audit.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No audit entries yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent_audit.map((log, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{log.action}</span>
                  {log.entity && (
                    <span className="text-xs text-gray-400 ml-2">{log.entity} · {log.entity_id?.slice(0, 8)}</span>
                  )}
                </div>
                <span className="text-xs text-gray-300">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
