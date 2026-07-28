import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Btn, Input } from '../components/ui';

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
        <h1 className="text-xl font-semibold text-[#e8e3dc]">Patients</h1>
        <Link to="/new-case">
          <Btn><Plus size={14} /> New Case</Btn>
        </Link>
      </div>

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or village..."
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#e8e3dc] placeholder-[#444] focus:border-[#444] transition-colors"
        />
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-[#444]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#444]">
            {query ? 'No patients match your search.' : 'No patients registered yet.'}
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {filtered.map(p => (
              <Link key={p.id} to={`/patients/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-[#1a1a1a] transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-[#555]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#ccc] font-medium">{p.name}</p>
                  <p className="text-xs text-[#555] mt-0.5">
                    {[p.age && `Age ${p.age}`, p.village, p.gravida && `G${p.gravida}P${p.para || 0}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-[#444]">{new Date(p.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
