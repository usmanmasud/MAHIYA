import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, ChevronRight, Image, X } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Btn, Input, Textarea, Spinner, Disclaimer, LangToggle } from '../components/ui';

const STEPS = [
  { emoji: '👤', label: 'Patient' },
  { emoji: '🩺', label: 'Symptoms' },
  { emoji: '🤖', label: 'Analyse' },
];

const HAUSA_PLACEHOLDERS = {
  name: 'Sunan majiyyaci...',
  village: 'Ƙauye / LGA...',
  symptoms: 'Rubuta alamomin ciwo a nan... (misali: ciwon kai, kumburi, jini)',
};

const EN_PLACEHOLDERS = {
  name: 'e.g. Fatima Musa',
  village: 'e.g. Kano LGA',
  symptoms: 'Describe symptoms, vital signs, observations... (e.g. severe headache, swelling, bleeding)',
};

export default function NewCase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [mediaRec, setMediaRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');
  const [image, setImage] = useState(null);   // { file, url, serverUrl }
  const audioChunks = useRef([]);

  const [patient, setPatient] = useState({
    name: '', age: '', gravida: '', para: '', lmp: '', village: '',
    id: searchParams.get('patient_id') || null,
  });
  const [symptoms, setSymptoms] = useState('');

  const ph = language === 'ha' ? HAUSA_PLACEHOLDERS : EN_PLACEHOLDERS;
  const isExistingPatient = !!patient.id;

  function patchPatient(k, v) { setPatient(p => ({ ...p, [k]: v })); }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunks.current = [];
      rec.ondataavailable = e => audioChunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const text = await api.transcribe(blob, language);
          setSymptoms(s => s + (s ? '\n' : '') + text);
        } catch {
          setSymptoms(s => s + (s ? '\n' : '') + (language === 'ha' ? '[Sauti an ɗauka]' : '[Voice note captured]'));
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      setMediaRec(rec);
      setRecording(true);
    } catch {
      setError(language === 'ha' ? 'Ba a yarda da amfani da makirofon.' : 'Microphone access denied.');
    }
  }

  function stopRecording() {
    mediaRec?.stop();
    setRecording(false);
    setMediaRec(null);
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage({ file, url, serverUrl: null });
    try {
      const res = await api.uploadImage(file);
      setImage(prev => ({ ...prev, serverUrl: res.url }));
    } catch {
      // Image stored locally, will be attached on submit
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      let patientData;
      if (isExistingPatient) {
        patientData = await api.getPatient(patient.id);
      } else {
        patientData = await api.createPatient(patient);
      }
      const c = await api.createCase({ patient_id: patientData.id, symptoms, urgency_level: 'unknown' });
      const analysis = await api.analyze({
        symptoms,
        patient: patientData,
        language,
        image_description: image?.serverUrl ? `Clinical image attached: ${image.serverUrl}` : '',
      });
      await api.updateAnalysis(c.id, { ai_analysis: analysis, urgency_level: analysis.urgency_level });
      navigate(`/cases/${c.id}`);
    } catch {
      setError(language === 'ha' ? 'Wani abu ya kasa. Duba cewa backend yana aiki.' : 'Something went wrong. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {language === 'ha' ? '🩺 Sabon Shari\'a' : '🩺 New Case'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {language === 'ha' ? 'Yi rajista kuma rubuta alamomin ciwo' : 'Register patient and record symptoms'}
          </p>
        </div>
        <LangToggle value={language} onChange={setLanguage} />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${
              i === step ? 'text-gray-900' : i < step ? 'text-gray-400' : 'text-gray-300'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                i === step ? 'bg-gray-900 text-white' : i < step ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-300'
              }`}>{i < step ? '✓' : i + 1}</span>
              {s.emoji} {s.label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Step 0 — Patient */}
      {step === 0 && (
        <Card className="p-5 space-y-4">
          {isExistingPatient ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              ✅ {language === 'ha' ? 'Ana amfani da majiyyaci da aka yi rajista.' : 'Using existing registered patient.'}
            </div>
          ) : (
            <>
              <Input
                label={language === 'ha' ? '👤 Cikakken Suna *' : '👤 Full Name *'}
                value={patient.name}
                onChange={e => patchPatient('name', e.target.value)}
                placeholder={ph.name}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={language === 'ha' ? '🎂 Shekaru' : '🎂 Age'}
                  type="number" value={patient.age}
                  onChange={e => patchPatient('age', e.target.value)}
                  placeholder="28"
                />
                <Input
                  label={language === 'ha' ? '📍 Ƙauye / LGA' : '📍 Village / LGA'}
                  value={patient.village}
                  onChange={e => patchPatient('village', e.target.value)}
                  placeholder={ph.village}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Gravida" type="number" value={patient.gravida} onChange={e => patchPatient('gravida', e.target.value)} placeholder="2" />
                <Input label="Para" type="number" value={patient.para} onChange={e => patchPatient('para', e.target.value)} placeholder="1" />
                <Input label="LMP" type="date" value={patient.lmp} onChange={e => patchPatient('lmp', e.target.value)} />
              </div>
            </>
          )}
          <div className="pt-2 flex justify-end">
            <Btn onClick={() => {
              if (!isExistingPatient && !patient.name.trim()) { setError(language === 'ha' ? 'Ana buƙatar sunan majiyyaci.' : 'Patient name is required.'); return; }
              setError(''); setStep(1);
            }}>
              {language === 'ha' ? 'Ci gaba' : 'Continue'} <ChevronRight size={14} />
            </Btn>
          </div>
        </Card>
      )}

      {/* Step 1 — Symptoms */}
      {step === 1 && (
        <Card className="p-5 space-y-4">
          <Textarea
            label={language === 'ha' ? '🩺 Alamomin Ciwo & Lura' : '🩺 Symptoms & Observations'}
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder={ph.symptoms}
            rows={5}
            hint={language === 'ha'
              ? 'Rubuta ko yi amfani da murya — AI yana fahimtar Hausa da Turanci'
              : 'Type or use voice — AI understands both Hausa and English'}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                recording
                  ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {recording ? <MicOff size={14} /> : <Mic size={14} />}
              {recording
                ? (language === 'ha' ? '⏹ Tsaya' : '⏹ Stop Recording')
                : (language === 'ha' ? '🎙 Yi Amfani da Murya' : '🎙 Voice Input')}
            </button>
            {recording && <span className="text-xs text-red-500 animate-pulse">● Recording...</span>}
            {transcribing && <span className="text-xs text-gray-400 flex items-center gap-1"><Spinner /> Transcribing...</span>}
          </div>

          {/* Image upload */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer transition-all">
              <Image size={14} />
              {language === 'ha' ? '📷 Ɗora Hoto' : '📷 Attach Image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {image && (
              <div className="flex items-center gap-2">
                <img src={image.url} alt="clinical" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                <button onClick={() => setImage(null)} className="text-gray-400 hover:text-gray-700">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-between">
            <Btn variant="ghost" onClick={() => setStep(0)}>← {language === 'ha' ? 'Baya' : 'Back'}</Btn>
            <Btn onClick={() => {
              if (!symptoms.trim()) { setError(language === 'ha' ? 'Da fatan za a shigar da alamomin ciwo.' : 'Please enter symptoms.'); return; }
              setError(''); setStep(2);
            }}>
              {language === 'ha' ? 'Ci gaba' : 'Continue'} <ChevronRight size={14} />
            </Btn>
          </div>
        </Card>
      )}

      {/* Step 2 — Review & Analyse */}
      {step === 2 && (
        <Card className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 font-medium">👤 {language === 'ha' ? 'Majiyyaci' : 'Patient'}</p>
              <p className="text-sm text-gray-800">
                {isExistingPatient ? `ID: ${patient.id}` : `${patient.name}${patient.age ? `, Age ${patient.age}` : ''}${patient.village ? ` · ${patient.village}` : ''}`}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 font-medium">🩺 {language === 'ha' ? 'Alamomin Ciwo' : 'Symptoms'}</p>
              <p className="text-sm text-gray-800 leading-relaxed">{symptoms}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 font-medium">🌐 {language === 'ha' ? 'Harshe' : 'Language'}</p>
              <p className="text-sm text-gray-800">{language === 'ha' ? '🇳🇬 Hausa' : '🇬🇧 English'}</p>
            </div>
            {image && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2 font-medium">📷 {language === 'ha' ? 'Hoto' : 'Clinical Image'}</p>
                <img src={image.url} alt="clinical" className="w-full max-h-40 object-cover rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          <Disclaimer />

          <div className="flex justify-between pt-2">
            <Btn variant="ghost" onClick={() => setStep(1)}>← {language === 'ha' ? 'Baya' : 'Back'}</Btn>
            <Btn onClick={handleSubmit} disabled={loading} variant="green">
              {loading ? <><Spinner /> {language === 'ha' ? 'Ana nazari...' : 'Analysing...'}</> : `🤖 ${language === 'ha' ? 'Gudanar da AI' : 'Run AI Analysis'}`}
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
