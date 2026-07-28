import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FolderOpen, AlertTriangle, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, Btn } from '../components/ui';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPatients(), api.getCases()])
      .then(([p, c]) => { setPatients(p); setCases(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const critical = cases.filter(c => c.urgency_level === 'critical' || c.urgency_level === 'high');
  const recent = cases.slice(0, 5);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e8e3dc]">Overview</h1>
          <p className="text-sm text-[#555] mt-1">Mahiya Edge — Offline Clinical Intelligence</p>
        </div>
        <Link to="/new-case">
          <Btn><Plus size={14} /> New Case</Btn>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: patients.length, icon: Users },
          { label: 'Total Cases', value: cases.length, icon: FolderOpen },
          { label: 'High Priority', value: critical.length, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#555] font-medium uppercase tracking-wide">{label}</span>
              <Icon size={14} className="text-[#333]" />
            </div>
            <p className="text-3xl font-semibold text-[#e8e3dc]">{loading ? '—' : value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Cases */}
      <Card>
        <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
          <span className="text-sm font-medium text-[#ccc]">Recent Cases</span>
          <Link to="/cases" className="text-xs text-[#555] hover:text-[#999] transition-colors">View all</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-[#444]">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#444]">No cases yet.</p>
            <Link to="/new-case" className="text-xs text-[#666] hover:text-[#999] mt-1 inline-block">Start a new case →</Link>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {recent.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a1a] transition-colors">
                <div>
                  <p className="text-sm text-[#ccc]">{c.patient_name}</p>
                  <p className="text-xs text-[#555] mt-0.5 line-clamp-1">{c.symptoms || 'No symptoms recorded'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <UrgencyBadge level={c.urgency_level} />
                  <span className="text-xs text-[#444]">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
