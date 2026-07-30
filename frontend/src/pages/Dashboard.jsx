import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{greeting} 👋</h1>
          <p className="text-sm text-gray-400 mt-1">Here's what's happening at your clinic today.</p>
        </div>
        <Link to="/new-case">
          <Btn>➕ New Case</Btn>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: patients.length, emoji: '👩‍⚕️' },
          { label: 'Total Cases',    value: cases.length,    emoji: '📋' },
          { label: 'High Priority',  value: critical.length, emoji: '🚨' },
        ].map(({ label, value, emoji }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">{label}</span>
              <span className="text-lg">{emoji}</span>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{loading ? '—' : value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Cases */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">📋 Recent Cases</span>
          <Link to="/cases" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all →</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading cases...</div>
        ) : recent.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-2xl mb-2">🏥</p>
            <p className="text-sm text-gray-500">No cases yet.</p>
            <Link to="/new-case" className="text-xs text-gray-400 hover:text-gray-700 mt-1 inline-block">Start your first case →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm text-gray-800 font-medium">{c.patient_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.symptoms || 'No symptoms recorded'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <UrgencyBadge level={c.urgency_level} />
                  <span className="text-xs text-gray-300">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick tip */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <p className="text-xs text-blue-600 font-medium mb-1">💡 Tip</p>
        <p className="text-sm text-blue-700">You can speak in <strong>Hausa or English</strong> when recording symptoms. The AI understands both languages.</p>
      </div>
    </div>
  );
}
