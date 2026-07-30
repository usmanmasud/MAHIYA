import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, Btn } from '../components/ui';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPatient(id), api.getCases(id)])
      .then(([p, c]) => { setPatient(p); setCases(c); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading... ⏳</div>;
  if (!patient) return <div className="p-8 text-sm text-gray-500">Patient not found.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/patients" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 flex-1">👤 {patient.name}</h1>
        <Link to={`/new-case?patient_id=${id}`}>
          <Btn>➕ New Case</Btn>
        </Link>
      </div>

      <Card className="p-5 mb-4">
        <p className="text-xs text-gray-400 font-medium mb-3">📋 Patient Info</p>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          {[
            ['🎂 Age', patient.age],
            ['📍 Village / LGA', patient.village],
            ['Gravida', patient.gravida],
            ['Para', patient.para],
            ['📅 LMP', patient.lmp],
            ['🗓 Registered', new Date(patient.created_at).toLocaleDateString()],
          ].map(([label, value]) => value ? (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-gray-700">{value}</p>
            </div>
          ) : null)}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-800">📋 Cases ({cases.length})</span>
        </div>
        {cases.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No cases for this patient yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cases.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm text-gray-700 line-clamp-1">{c.symptoms || 'No symptoms recorded'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleString()}</p>
                </div>
                <UrgencyBadge level={c.urgency_level} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
