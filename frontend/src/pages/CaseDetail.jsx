import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, Btn, Spinner, Disclaimer } from '../components/ui';

const URGENCY_BANNER = {
  critical: { bg: 'bg-red-50 border-red-200',   text: 'text-red-700',   emoji: '🚨', msg: 'CRITICAL — Refer immediately' },
  high:     { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', emoji: '⚠️', msg: 'HIGH PRIORITY — Act now' },
  moderate: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', emoji: '🟡', msg: 'MODERATE — Monitor closely' },
  low:      { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  emoji: '✅', msg: 'LOW — Continue monitoring' },
};

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [referral, setReferral] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCase(id)
      .then(c => {
        setCaseData(c);
        return api.getReferral(id).catch(() => null);
      })
      .then(r => setReferral(r))
      .finally(() => setLoading(false));
  }, [id]);

  async function generateReferral() {
    if (!caseData?.ai_analysis) return;
    setGenerating(true);
    const a = caseData.ai_analysis;
    try {
      const r = await api.createReferral({
        case_id: id,
        patient_id: caseData.patient_id,
        summary: a.patient_summary,
        danger_signs: a.danger_signs,
        actions: a.immediate_actions,
        facility: a.referral_recommendation,
      });
      setReferral(r);
      await api.log('REFERRAL_GENERATED', 'case', id, { urgency: caseData.urgency_level }).catch(() => {});
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading case... ⏳</div>;
  if (!caseData) return <div className="p-8 text-sm text-gray-500">Case not found.</div>;

  const a = caseData.ai_analysis;
  const banner = URGENCY_BANNER[caseData.urgency_level];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/cases" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">🩺 Case Analysis</h1>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(caseData.created_at).toLocaleString()}</p>
        </div>
        <UrgencyBadge level={caseData.urgency_level} />
      </div>

      {/* Urgency Banner */}
      {banner && (
        <div className={`border rounded-2xl px-5 py-4 mb-5 ${banner.bg}`}>
          <p className={`text-sm font-semibold ${banner.text}`}>{banner.emoji} {banner.msg}</p>
        </div>
      )}

      {/* Symptoms */}
      <Card className="p-5 mb-4">
        <p className="text-xs text-gray-400 font-medium mb-2">📝 Reported Symptoms</p>
        <p className="text-sm text-gray-700 leading-relaxed">{caseData.symptoms || 'None recorded'}</p>
      </Card>

      {a ? (
        <div className="space-y-4">
          {/* Danger Signs */}
          <Card className="p-5">
            <p className="text-xs text-gray-400 font-medium mb-3">🚩 Possible Danger Signs</p>
            <ul className="space-y-2">
              {(a.danger_signs || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="mt-0.5 text-red-400">⚠</span>
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          {/* Immediate Actions */}
          <Card className="p-5">
            <p className="text-xs text-gray-400 font-medium mb-3">✅ Immediate Actions</p>
            <ol className="space-y-2">
              {(a.immediate_actions || []).map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-300 text-xs mt-0.5 font-mono w-4 flex-shrink-0">{i + 1}.</span>
                  {action}
                </li>
              ))}
            </ol>
          </Card>

          {/* Referral Recommendation */}
          <Card className="p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">🏥 Referral Recommendation</p>
            <p className="text-sm text-gray-700 leading-relaxed">{a.referral_recommendation}</p>
          </Card>

          {/* Reasoning */}
          <Card className="p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">🧠 AI Reasoning</p>
            <p className="text-sm text-gray-600 leading-relaxed">{a.reasoning}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>Confidence: <span className="capitalize text-gray-600">{a.confidence}</span></span>
              {a.language_used && <span>Language: <span className="text-gray-600">{a.language_used === 'ha' ? '🇳🇬 Hausa' : '🇬🇧 English'}</span></span>}
              <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                a.gemma_powered
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                {a.gemma_powered ? '✨ Gemma 4' : '⚙️ Keyword mode'}
              </span>
            </div>
          </Card>

          <Disclaimer />

          {/* Generate Referral */}
          {!referral ? (
            <Btn onClick={generateReferral} disabled={generating} className="w-full justify-center" variant="outline">
              {generating ? <><Spinner /> Generating...</> : <><FileText size={14} /> 📄 Generate Referral Note</>}
            </Btn>
          ) : (
            <ReferralNote referral={referral} />
          )}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-gray-400 mt-3">Analysis pending...</p>
        </Card>
      )}
    </div>
  );
}

function ReferralNote({ referral }) {
  return (
    <Card className="p-5 border-green-200 bg-green-50">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={14} className="text-green-600" />
        <span className="text-sm font-medium text-green-800">📄 Referral Note</span>
        <span className="ml-auto text-xs text-gray-400">{new Date(referral.generated_at).toLocaleString()}</span>
      </div>
      <div className="space-y-3 text-sm text-gray-700">
        <p className="leading-relaxed">{referral.summary}</p>
        {referral.danger_signs?.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium">🚩 Danger Signs</p>
            <p>{Array.isArray(referral.danger_signs) ? referral.danger_signs.join(', ') : referral.danger_signs}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 mb-1 font-medium">🏥 Recommended Facility</p>
          <p>{referral.facility}</p>
        </div>
      </div>
      <button
        onClick={() => window.print()}
        className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
      >
        <Printer size={12} /> Print / Save as PDF
      </button>
    </Card>
  );
}
