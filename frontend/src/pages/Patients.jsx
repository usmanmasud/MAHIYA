import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, PlusCircle, UserCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Btn, PageHeader, EmptyState } from '../components/ui';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPatients().then(d => setPatients(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.village?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered`}
        action={<Link to="/new-case"><Btn><PlusCircle size={14} /> New Case</Btn></Link>}
      />

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or village..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none transition-colors shadow-sm"
        />
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading patients...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query ? 'No patients match your search' : 'No patients registered yet'}
            subtitle={!query ? 'Create a new case to register a patient' : undefined}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(p => (
              <Link key={p.id} to={`/patients/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={18} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[p.age && `Age ${p.age}`, p.village, p.gravida && `G${p.gravida}P${p.para || 0}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-gray-300">{new Date(p.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
