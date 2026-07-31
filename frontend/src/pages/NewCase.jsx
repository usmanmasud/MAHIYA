import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, ChevronRight, Image, X } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Btn, Input, Textarea, Spinner, Disclaimer, LangToggle } from '../components/ui';

const STEPS = [
  { emoji: '👤', label: 'Patient' },
  { emoji: '📊', label: 'Vitals' },
  { emoji: '🩺', label: 'Symptoms' },
  { emoji: '🤖', label: 'Analyse' },
];

// Structured danger-sign checklist shown in symptoms step
const DANGER_CHECKLIST = [
  { id: 'bleeding',    en: 'Heavy vaginal bleeding',        ha: 'Zubar jini mai yawa' },
  { id: 'convulsion',  en: 'Convulsions / fits',            ha: 'Jiri / farfadiya' },
  { id: 'headache',    en: 'Severe headache',               ha: 'Ciwon kai mai ƙarfi' },
  { id: 'vision',      en: 'Blurred / disturbed vision',    ha: 'Rashin gani' },
  { id: 'swelling',    en: 'Swelling of face / hands',      ha: 'Kumburi a fuska / hannaye' },
  { id: 'fever',       en: 'High fever',                    ha: 'Zazzabi mai tsanani' },
  { id: 'no_fetal',    en: 'Reduced / no fetal movement',   ha: 'Ƙarancin motsin jariri' },
  { id: 'baby_feed',   en: 'Newborn not feeding',           ha: 'Jariiri baya ci' },
  { id: 'baby_breath', en: 'Newborn breathing difficulty',  ha: 'Jariiri yana wahalar numfashi' },
  { id: 'labour',      en: 'Prolonged / obstructed labour', ha: 'Wahalar haihuwa mai tsawo' },
];

const PH = {
  ha: { name: 'Sunan majiyyaci...', village: 'Ƙauye / LGA...', symptoms: 'Rubuta alamomin ciwo...' },
  en: { name: 'e.g. Fatima Musa',  village: 'e.g. Kano LGA',  symptoms: 'Describe symptoms, observations...' },
};

// Encode AudioBuffer -> WAV ArrayBuffer (16-bit PCM, mono)
function encodeWav(audioBuffer) {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++)
    pcm[i] = Math.max(-1, Math.min(1, samples[i])) * 0x7fff;
  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buf);
  const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, 36 + pcm.byteLength, true);
  write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); write(36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Int16Array(buf, 44).set(pcm);
  return buf;
}

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
  const [image, setImage] = useState(null);
  const [checklist, setChecklist] = useState({});
  const audioChunks = useRef([]);

  const [patient, setPatient] = useState({
    name: '', age: '', gravida: '', para: '', lmp: '', village: '',
    id: searchParams.get('patient_id') || null,
  });

  const [vitals, setVitals] = useState({
    bp_systolic: '', bp_diastolic: '', temperature: '', pulse: '', respiratory_rate: '', spo2: '',
  });

  const [symptoms, setSymptoms] = useState('');
  const isExistingPatient = !!patient.id;
  const ph = PH[language];

  function patchPatient(k, v) { setPatient(p => ({ ...p, [k]: v })); }
  function patchVitals(k, v) { setVitals(v2 => ({ ...v2, [k]: v })); }
  function toggleCheck(id) { setChecklist(c => ({ ...c, [id]: !c[id] })); }

  // Build vitals summary string for AI prompt
  function vitalsText() {
    const v = vitals;
    const parts = [];
    if (v.bp_systolic && v.bp_diastolic) parts.push(`BP: ${v.bp_systolic}/${v.bp_diastolic} mmHg`);
    if (v.temperature) parts.push(`Temp: ${v.temperature}°C`);
    if (v.pulse) parts.push(`Pulse: ${v.pulse} bpm`);
    if (v.respiratory_rate) parts.push(`RR: ${v.respiratory_rate}/min`);
    if (v.spo2) parts.push(`SpO2: ${v.spo2}%`);
    return parts.join(' | ');
  }

  // Build checklist summary for AI prompt
  function checklistText() {
    const checked = DANGER_CHECKLIST.filter(d => checklist[d.id]);
    if (!checked.length) return '';
    return 'Reported danger signs: ' + checked.map(d => language === 'ha' ? d.ha : d.en).join(', ');
  }

  function fullSymptoms() {
    return [checklistText(), vitalsText(), symptoms].filter(Boolean).join('\n');
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunks.current = [];
      rec.ondataavailable = e => audioChunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const webmBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setTranscribing(true);
        // Convert webm -> wav via AudioContext so faster-whisper can decode without ffmpeg
        let blob = webmBlob;
        try {
          const arrayBuf = await webmBlob.arrayBuffer();
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          const decoded = await audioCtx.decodeAudioData(arrayBuf);
          await audioCtx.close();
          const wav = encodeWav(decoded);
          blob = new Blob([wav], { type: 'audio/wav' });
        } catch { /* fallback to webm if conversion fails */ }
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

  function stopRecording() { mediaRec?.stop(); setRecording(false); setMediaRec(null); }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage({ file, url: URL.createObjectURL(file), serverUrl: null });
    try {
      const res = await api.uploadImage(file);
      setImage(prev => ({ ...prev, serverUrl: res.url }));
    } catch {}
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      let patientData = isExistingPatient
        ? await api.getPatient(patient.id)
        : await api.createPatient(patient);

      const allSymptoms = fullSymptoms();
      const c = await api.createCase({ patient_id: patientData.id, symptoms: allSymptoms, urgency_level: 'unknown' });

      const analysis = await api.analyze({
        symptoms: allSymptoms,
        patient: { ...patientData, vitals },
        language,
        image_description: image?.serverUrl ? `Clinical image attached: ${image.serverUrl}` : '',
      });

      await api.updateAnalysis(c.id, { ai_analysis: analysis, urgency_level: analysis.urgency_level });

      // Audit log
      await api.log('AI_ANALYSIS', 'case', c.id, {
        urgency: analysis.urgency_level,
        gemma_powered: analysis.gemma_powered,
        model: analysis.gemma_model,
      }).catch(() => {});

      navigate(`/cases/${c.id}`);
    } catch {
      setError(language === 'ha' ? 'Wani abu ya kasa. Duba cewa backend yana aiki.' : 'Something went wrong. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  function next() { setError(''); setStep(s => s + 1); }
  function back() { setError(''); setStep(s => s - 1); }

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
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1.5">
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
                <Input label={language === 'ha' ? '🎂 Shekaru' : '🎂 Age'} type="number" value={patient.age} onChange={e => patchPatient('age', e.target.value)} placeholder="28" />
                <Input label={language === 'ha' ? '📍 Ƙauye / LGA' : '📍 Village / LGA'} value={patient.village} onChange={e => patchPatient('village', e.target.value)} placeholder={ph.village} />
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
              next();
            }}>
              {language === 'ha' ? 'Ci gaba' : 'Continue'} <ChevronRight size={14} />
            </Btn>
          </div>
        </Card>
      )}

      {/* Step 1 — Vitals */}
      {step === 1 && (
        <Card className="p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium">
            📊 {language === 'ha' ? 'Alamomin Rayuwa (zaɓi)' : 'Vital Signs (optional)'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-medium">
                {language === 'ha' ? '🩸 Matsin Jini (Systolic)' : '🩸 BP Systolic (mmHg)'}
              </label>
              <input
                type="number" placeholder="120"
                value={vitals.bp_systolic}
                onChange={e => patchVitals('bp_systolic', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-medium">
                {language === 'ha' ? '🩸 Matsin Jini (Diastolic)' : '🩸 BP Diastolic (mmHg)'}
              </label>
              <input
                type="number" placeholder="80"
                value={vitals.bp_diastolic}
                onChange={e => patchVitals('bp_diastolic', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-medium">
                {language === 'ha' ? '🌡 Zafin Jiki (°C)' : '🌡 Temperature (°C)'}
              </label>
              <input
                type="number" step="0.1" placeholder="37.0"
                value={vitals.temperature}
                onChange={e => patchVitals('temperature', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-medium">
                {language === 'ha' ? '💓 Bugun Zuciya (bpm)' : '💓 Pulse (bpm)'}
              </label>
              <input
                type="number" placeholder="80"
                value={vitals.pulse}
                onChange={e => patchVitals('pulse', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-medium">
                {language === 'ha' ? '🫁 Numfashi (/min)' : '🫁 Resp. Rate (/min)'}
              </label>
              <input
                type="number" placeholder="18"
                value={vitals.respiratory_rate}
                onChange={e => patchVitals('respiratory_rate', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-medium">SpO2 (%)</label>
              <input
                type="number" placeholder="98"
                value={vitals.spo2}
                onChange={e => patchVitals('spo2', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Inline BP alert */}
          {vitals.bp_systolic >= 140 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
              ⚠️ {language === 'ha' ? 'Hawan jini mai tsanani — yi la\'akari da preeclampsia' : 'High BP detected — consider preeclampsia screening'}
            </div>
          )}

          <div className="pt-2 flex justify-between">
            <Btn variant="ghost" onClick={back}>← {language === 'ha' ? 'Baya' : 'Back'}</Btn>
            <Btn onClick={next}>{language === 'ha' ? 'Ci gaba' : 'Continue'} <ChevronRight size={14} /></Btn>
          </div>
        </Card>
      )}

      {/* Step 2 — Symptoms + Checklist */}
      {step === 2 && (
        <Card className="p-5 space-y-4">
          {/* Danger sign checklist */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-3">
              🚩 {language === 'ha' ? 'Alamomin Haɗari — Zaɓi duk da suka shafi' : 'Danger Signs — Check all that apply'}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {DANGER_CHECKLIST.map(d => (
                <label key={d.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  checklist[d.id]
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={!!checklist[d.id]}
                    onChange={() => toggleCheck(d.id)}
                    className="accent-red-600"
                  />
                  <span className="text-sm">{language === 'ha' ? d.ha : d.en}</span>
                </label>
              ))}
            </div>
          </div>

          <Textarea
            label={language === 'ha' ? '🩺 Ƙarin Bayani & Lura' : '🩺 Additional Symptoms & Observations'}
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder={ph.symptoms}
            rows={4}
            hint={language === 'ha' ? 'Rubuta ko yi amfani da murya' : 'Type or use voice input'}
          />

          <div className="flex items-center gap-3 flex-wrap">
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
                ? (language === 'ha' ? '⏹ Tsaya' : '⏹ Stop')
                : (language === 'ha' ? '🎙 Murya' : '🎙 Voice')}
            </button>
            {recording && <span className="text-xs text-red-500 animate-pulse">● Recording...</span>}
            {transcribing && <span className="text-xs text-gray-400 flex items-center gap-1"><Spinner /> Transcribing...</span>}

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer transition-all">
              <Image size={14} />
              {language === 'ha' ? '📷 Hoto' : '📷 Image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {image && (
              <div className="flex items-center gap-2">
                <img src={image.url} alt="clinical" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                <button onClick={() => setImage(null)} className="text-gray-400 hover:text-gray-700"><X size={14} /></button>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-between">
            <Btn variant="ghost" onClick={back}>← {language === 'ha' ? 'Baya' : 'Back'}</Btn>
            <Btn onClick={() => {
              const hasInput = Object.values(checklist).some(Boolean) || symptoms.trim() || vitalsText();
              if (!hasInput) { setError(language === 'ha' ? 'Da fatan za a shigar da bayani.' : 'Please enter symptoms or select danger signs.'); return; }
              next();
            }}>
              {language === 'ha' ? 'Ci gaba' : 'Continue'} <ChevronRight size={14} />
            </Btn>
          </div>
        </Card>
      )}

      {/* Step 3 — Review & Analyse */}
      {step === 3 && (
        <Card className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 font-medium">👤 {language === 'ha' ? 'Majiyyaci' : 'Patient'}</p>
              <p className="text-sm text-gray-800">
                {isExistingPatient ? `ID: ${patient.id}` : `${patient.name}${patient.age ? `, Age ${patient.age}` : ''}${patient.village ? ` · ${patient.village}` : ''}`}
              </p>
            </div>
            {vitalsText() && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1 font-medium">📊 {language === 'ha' ? 'Alamomin Rayuwa' : 'Vitals'}</p>
                <p className="text-sm text-gray-800">{vitalsText()}</p>
              </div>
            )}
            {Object.values(checklist).some(Boolean) && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-xs text-red-400 mb-2 font-medium">🚩 {language === 'ha' ? 'Alamomin Haɗari' : 'Danger Signs Reported'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {DANGER_CHECKLIST.filter(d => checklist[d.id]).map(d => (
                    <span key={d.id} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {language === 'ha' ? d.ha : d.en}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {symptoms && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1 font-medium">🩺 {language === 'ha' ? 'Ƙarin Bayani' : 'Additional Notes'}</p>
                <p className="text-sm text-gray-800 leading-relaxed">{symptoms}</p>
              </div>
            )}
            {image && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2 font-medium">📷 {language === 'ha' ? 'Hoto' : 'Clinical Image'}</p>
                <img src={image.url} alt="clinical" className="w-full max-h-40 object-cover rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          <Disclaimer />

          <div className="flex justify-between pt-2">
            <Btn variant="ghost" onClick={back}>← {language === 'ha' ? 'Baya' : 'Back'}</Btn>
            <Btn onClick={handleSubmit} disabled={loading} variant="green">
              {loading ? <><Spinner /> {language === 'ha' ? 'Ana nazari...' : 'Analysing...'}</> : `🤖 ${language === 'ha' ? 'Gudanar da AI' : 'Run AI Analysis'}`}
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
