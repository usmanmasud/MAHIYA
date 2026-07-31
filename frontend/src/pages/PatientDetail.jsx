import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlusCircle, UserCircle, Calendar, MapPin, ClipboardList } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, Btn, EmptyState } from '../components/ui';

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

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading...</div>;
  if (!patient) return <div className="p-8 text-sm text-gray-500">Patient not found.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/patients" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <ArrowLeft size={15} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <UserCircle size={20} className="text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{patient.name}</h1>
        </div>
        <Link to={`/new-case?patient_id=${id}`}>
          <Btn><PlusCircle size={14} /> New Case</Btn>
        </Link>
      </div>

      <Card className="p-5 mb-4">
        <p className="text-xs text-gray-400 font-medium mb-4 tracking-wide uppercase">Patient Info</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Age',          value: patient.age,     icon: UserCircle },
            { label: 'Village / LGA', value: patient.village, icon: MapPin     },
            { label: 'Gravida',      value: patient.gravida  },
            { label: 'Para',         value: patient.para     },
            { label: 'LMP',          value: patient.lmp,     icon: Calendar   },
            { label: 'Registered',   value: patient.created_at && new Date(patient.created_at).toLocaleDateString(), icon: Calendar },
          ].filter(({ value }) => value).map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-gray-700 font-medium flex items-center gap-1.5">
                {Icon && <Icon size={12} className="text-gray-300" />}
                {value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">Cases</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cases.length}</span>
        </div>
        {cases.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No cases for this patient yet" />
        ) : (
          <div className="divide-y divide-gray-50">
            {cases.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm text-gray-700 truncate max-w-xs">{c.symptoms || 'No symptoms recorded'}</p>
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
