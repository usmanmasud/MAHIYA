import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, UserCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, PageHeader, EmptyState } from '../components/ui';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCases().then(d => setCases(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Cases" subtitle={`${cases.length} total`} />

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading cases...</div>
        ) : cases.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No cases yet"
            action={<Link to="/new-case" className="text-xs text-emerald-600 hover:text-emerald-700">Start a new case</Link>}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {cases.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <UserCircle size={15} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 font-medium">{c.patient_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.symptoms || 'No symptoms recorded'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
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
