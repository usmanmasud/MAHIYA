import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, UrgencyBadge } from '../components/ui';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCases().then(setCases).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">📋 Cases</h1>
        <p className="text-sm text-gray-400 mt-1">{cases.length} total</p>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading cases... ⏳</div>
        ) : cases.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-2xl mb-2">📂</p>
            <p className="text-sm text-gray-500">No cases yet.</p>
            <Link to="/new-case" className="text-xs text-gray-400 hover:text-gray-700 mt-1 inline-block">Start a new case →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cases.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{c.patient_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.symptoms || 'No symptoms recorded'}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <UrgencyBadge level={c.urgency_level} />
                  <span className="text-xs text-gray-300 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
