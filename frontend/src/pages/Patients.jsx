import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Btn } from '../components/ui';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPatients().then(setPatients).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.village?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">👩‍⚕️ Patients</h1>
        <Link to="/new-case"><Btn>➕ New Case</Btn></Link>
      </div>

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or village..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 transition-colors shadow-sm"
        />
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading patients... ⏳</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-2xl mb-2">👥</p>
            <p className="text-sm text-gray-500">{query ? 'No patients match your search.' : 'No patients registered yet.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(p => (
              <Link key={p.id} to={`/patients/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-base">
                  👤
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
