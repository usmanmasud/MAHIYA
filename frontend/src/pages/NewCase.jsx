import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Btn, Input, Textarea, Spinner, Disclaimer } from '../components/ui';

const STEPS = ['Patient', 'Symptoms', 'Analyse'];

export default function NewCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [mediaRec, setMediaRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [patient, setPatient] = useState({ name: '', age: '', gravida: '', para: '', lmp: '', village: '' });
  const [symptoms, setSymptoms] = useState('');
  const [language, setLanguage] = useState('en');

  function patchPatient(k, v) { setPatient(p => ({ ...p, [k]: v })); }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        // In production: send audio to speech-to-text endpoint
        // For now, just indicate recording was captured
        setSymptoms(s => s + (s ? ' ' : '') + '[Voice note captured]');
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      setMediaRec(rec);
      setRecording(true);
    } catch {
      setError('Microphone access denied.');
    }
  }

  function stopRecording() {
    mediaRec?.stop();
    setRecording(false);
    setMediaRec(null);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const p = await api.createPatient(patient);
      const c = await api.createCase({ patient_id: p.id, symptoms, urgency_level: 'unknown' });
      const analysis = await api.analyze({ symptoms, patient: p, language });
      await api.updateAnalysis(c.id, { ai_analysis: analysis, urgency_level: analysis.urgency_level });
      navigate(`/cases/${c.id}`);
    } catch (e) {
      setError('Something went wrong. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#e8e3dc]">New Case</h1>
        <p className="text-sm text-[#555] mt-1">Register patient and record symptoms</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 text-xs font-medium ${i === step ? 'text-[#e8e3dc]' : i < step ? 'text-[#555]' : 'text-[#333]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                i === step ? 'bg-[#e8e3dc] text-[#0f0f0f]' : i < step ? 'bg-[#2a2a2a] text-[#666]' : 'bg-[#1a1a1a] text-[#333]'
              }`}>{i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={12} className="text-[#2a2a2a]" />}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400 mb-4 bg-red-950 border border-red-900 rounded-xl px-4 py-3">{error}</p>}

      {step === 0 && (
        <Card className="p-5 space-y-4">
          <Input label="Full Name *" value={patient.name} onChange={e => patchPatient('name', e.target.value)} placeholder="Fatima Musa" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Age" type="number" value={patient.age} onChange={e => patchPatient('age', e.target.value)} placeholder="28" />
            <Input label="Village / LGA" value={patient.village} onChange={e => patchPatient('village', e.target.value)} placeholder="Kano" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Gravida" type="number" value={patient.gravida} onChange={e => patchPatient('gravida', e.target.value)} placeholder="2" />
            <Input label="Para" type="number" value={patient.para} onChange={e => patchPatient('para', e.target.value)} placeholder="1" />
            <Input label="LMP" type="date" value={patient.lmp} onChange={e => patchPatient('lmp', e.target.value)} />
          </div>
          <div className="pt-2 flex justify-end">
            <Btn onClick={() => { if (!patient.name.trim()) { setError('Patient name is required.'); return; } setError(''); setStep(1); }}>
              Continue <ChevronRight size={14} />
            </Btn>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666] font-medium uppercase tracking-wide">Language</span>
            <div className="flex gap-1">
              {['en', 'ha'].map(l => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${language === l ? 'bg-[#e8e3dc] text-[#0f0f0f]' : 'bg-[#1e1e1e] text-[#555] hover:text-[#999]'}`}>
                  {l === 'en' ? 'English' : 'Hausa'}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Symptoms & Observations"
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder={language === 'ha' ? 'Rubuta alamomin ciwo a nan...' : 'Describe symptoms, vital signs, observations...'}
            rows={5}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                recording
                  ? 'bg-red-950 text-red-400 border border-red-900 animate-pulse'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:text-[#999]'
              }`}
            >
              {recording ? <MicOff size={14} /> : <Mic size={14} />}
              {recording ? 'Stop Recording' : 'Voice Input'}
            </button>
            <span className="text-xs text-[#444]">Speak in Hausa or English</span>
          </div>

          <div className="pt-2 flex justify-between">
            <Btn variant="ghost" onClick={() => setStep(0)}>Back</Btn>
            <Btn onClick={() => { if (!symptoms.trim()) { setError('Please enter symptoms.'); return; } setError(''); setStep(2); }}>
              Continue <ChevronRight size={14} />
            </Btn>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-xs text-[#555] mb-1 uppercase tracking-wide font-medium">Patient</p>
              <p className="text-sm text-[#ccc]">{patient.name}, {patient.age && `Age ${patient.age}`} {patient.village && `· ${patient.village}`}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-xs text-[#555] mb-1 uppercase tracking-wide font-medium">Symptoms</p>
              <p className="text-sm text-[#ccc] leading-relaxed">{symptoms}</p>
            </div>
          </div>

          <Disclaimer />

          <div className="flex justify-between pt-2">
            <Btn variant="ghost" onClick={() => setStep(1)}>Back</Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? <><Spinner /> Analysing...</> : 'Run AI Analysis'}
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
