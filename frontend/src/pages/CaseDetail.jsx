import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { api } from '../lib/api';
import { Card, UrgencyBadge, Btn, Spinner, Disclaimer } from '../components/ui';

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
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-[#444]">Loading case...</div>;
  if (!caseData) return <div className="p-8 text-sm text-[#555]">Case not found.</div>;

  const a = caseData.ai_analysis;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/cases" className="text-[#555] hover:text-[#999] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[#e8e3dc]">Case Analysis</h1>
          <p className="text-xs text-[#555] mt-0.5">{new Date(caseData.created_at).toLocaleString()}</p>
        </div>
        <UrgencyBadge level={caseData.urgency_level} />
      </div>

      {/* Symptoms */}
      <Card className="p-5 mb-4">
        <p className="text-xs text-[#555] uppercase tracking-wide font-medium mb-2">Reported Symptoms</p>
        <p className="text-sm text-[#ccc] leading-relaxed">{caseData.symptoms || 'None recorded'}</p>
      </Card>

      {/* AI Analysis */}
      {a ? (
        <div className="space-y-4">
          {/* Danger Signs */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className={a.urgency_level === 'critical' || a.urgency_level === 'high' ? 'text-red-400' : 'text-[#555]'} />
              <span className="text-xs text-[#666] uppercase tracking-wide font-medium">Danger Signs</span>
            </div>
            <ul className="space-y-1.5">
              {(a.danger_signs || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#ccc]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#444] flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          {/* Immediate Actions */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-xs text-[#666] uppercase tracking-wide font-medium">Immediate Actions</span>
            </div>
            <ol className="space-y-1.5">
              {(a.immediate_actions || []).map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#ccc]">
                  <span className="text-[#444] text-xs mt-0.5 font-mono w-4 flex-shrink-0">{i + 1}.</span>
                  {action}
                </li>
              ))}
            </ol>
          </Card>

          {/* Referral Recommendation */}
          <Card className="p-5">
            <p className="text-xs text-[#555] uppercase tracking-wide font-medium mb-2">Referral Recommendation</p>
            <p className="text-sm text-[#ccc] leading-relaxed">{a.referral_recommendation}</p>
          </Card>

          {/* Reasoning */}
          <Card className="p-5">
            <p className="text-xs text-[#555] uppercase tracking-wide font-medium mb-2">Reasoning</p>
            <p className="text-sm text-[#888] leading-relaxed">{a.reasoning}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-[#444]">Confidence:</span>
              <span className="text-xs text-[#666] capitalize">{a.confidence}</span>
            </div>
          </Card>

          <Disclaimer />

          {/* Generate Referral */}
          {!referral ? (
            <Btn onClick={generateReferral} disabled={generating} className="w-full justify-center">
              {generating ? <><Spinner /> Generating...</> : <><FileText size={14} /> Generate Referral Note</>}
            </Btn>
          ) : (
            <ReferralNote referral={referral} />
          )}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Loader size={20} className="text-[#444] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-[#555]">Analysis pending...</p>
        </Card>
      )}
    </div>
  );
}

function ReferralNote({ referral }) {
  return (
    <Card className="p-5 border-emerald-900">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={14} className="text-emerald-500" />
        <span className="text-sm font-medium text-[#ccc]">Referral Note</span>
        <span className="ml-auto text-xs text-[#444]">{new Date(referral.generated_at).toLocaleString()}</span>
      </div>
      <div className="space-y-3 text-sm text-[#ccc]">
        <p className="leading-relaxed">{referral.summary}</p>
        {referral.danger_signs?.length > 0 && (
          <div>
            <p className="text-xs text-[#555] mb-1 uppercase tracking-wide font-medium">Danger Signs</p>
            <p>{referral.danger_signs.join(', ')}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-[#555] mb-1 uppercase tracking-wide font-medium">Recommended Facility</p>
          <p>{referral.facility}</p>
        </div>
      </div>
      <button
        onClick={() => window.print()}
        className="mt-4 text-xs text-[#555] hover:text-[#999] transition-colors"
      >
        Print / Save as PDF
      </button>
    </Card>
  );
}
