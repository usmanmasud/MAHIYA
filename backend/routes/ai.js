const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '..', '..', 'storage', 'uploads'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// Pass API key to Python subprocess via environment
function getPyEnv() {
  return {
    ...process.env,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  };
}

function runPython(scriptPath, input) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [scriptPath], { env: getPyEnv() });
    let output = '', errOut = '';
    py.stdin.write(input);
    py.stdin.end();
    py.stdout.on('data', d => { output += d.toString(); });
    py.stderr.on('data', d => { errOut += d.toString(); });
    py.on('close', code => {
      if (code !== 0) return reject(new Error(errOut || 'Python process failed'));
      try { resolve(JSON.parse(output)); }
      catch { reject(new Error('Invalid JSON from Python process')); }
    });
  });
}

function runAnalysis(input) {
  return runPython(path.join(__dirname, '..', '..', 'ai', 'analyze.py'), input);
}

router.post('/analyze', async (req, res) => {
  const { symptoms, patient, language = 'en', image_description = '' } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'symptoms required' });

  try {
    const result = await runAnalysis(JSON.stringify({ symptoms, patient, language, image_description }));
    res.json(result);
  } catch (err) {
    console.error('AI process error:', err.message);
    res.json(fallbackAnalysis(symptoms, patient, language));
  }
});

// ---------------------------------------------------------------------------
// Voice transcription — faster-whisper (fully offline)
// ---------------------------------------------------------------------------
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'audio file required' });

  const audioPath = req.file.path;
  const language = req.body.language || 'en';
  const whisperLang = language === 'ha' ? 'ha' : 'en';

  try {
    const transcript = await runPython(
      path.join(__dirname, '..', '..', 'ai', 'transcribe.py'),
      JSON.stringify({ audio_path: audioPath, language: whisperLang })
    );
    res.json(transcript);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(audioPath, () => {});
  }
});

// ---------------------------------------------------------------------------
// Image upload — store file, return path for case attachment
// ---------------------------------------------------------------------------
router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'image file required' });
  res.json({
    path: req.file.path,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

// ---------------------------------------------------------------------------
// Status — checks Ollama first, then API key
// ---------------------------------------------------------------------------
router.get('/status', async (req, res) => {
  const key = process.env.GEMINI_API_KEY || '';
  const apiLive = key.length > 10 && key !== 'your_api_key_here';

  // Check if Ollama is running locally
  let ollamaLive = false;
  try {
    const http = require('http');
    await new Promise((resolve, reject) => {
      const r = http.get('http://localhost:11434/api/tags', res => {
        ollamaLive = res.statusCode === 200;
        resolve();
      });
      r.on('error', reject);
      r.setTimeout(1000, () => { r.destroy(); reject(); });
    });
  } catch {}

  const mode = ollamaLive ? 'local' : apiLive ? 'api' : 'keyword';
  res.json({
    gemma_live: ollamaLive || apiLive,
    ollama_live: ollamaLive,
    api_live: apiLive,
    mode,
    model: ollamaLive ? `ollama/${process.env.OLLAMA_MODEL || 'gemma3'}` : apiLive ? 'gemma-3-27b-it' : null,
    label: ollamaLive ? '🟢 Gemma local (offline)' : apiLive ? '🌐 Gemma API' : '⚙️ Keyword fallback',
  });
});

function fallbackAnalysis(symptoms, patient, language = 'en') {
  const s = (symptoms || '').toLowerCase();
  const isHa = language === 'ha';
  const dangerSigns = [];
  let urgency = 'low';

  const checks = [
    { words: ['bleed', 'hemorrhage', 'jini', 'zubar jini'], sign: 'Postpartum Hemorrhage (PPH) suspected', level: 'critical' },
    { words: ['convuls', 'seizure', 'fit', 'jiri', 'farfadiya'], sign: 'Eclampsia suspected', level: 'critical' },
    { words: ['headache', 'vision', 'swelling', 'ciwon kai', 'kumburi'], sign: 'Preeclampsia signs present', level: 'high' },
    { words: ['fever', 'baby', 'newborn', 'zazzabi', 'jariiri'], sign: 'Neonatal Sepsis risk', level: 'high' },
  ];

  for (const { words, sign, level } of checks) {
    if (words.some(w => s.includes(w))) {
      dangerSigns.push(sign);
      if (level === 'critical') urgency = 'critical';
      else if (level === 'high' && urgency !== 'critical') urgency = 'high';
    }
  }

  return {
    patient_summary: `${patient?.name || 'Patient'} presenting with: ${symptoms}`,
    symptoms_recorded: symptoms,
    danger_signs: dangerSigns.length ? dangerSigns : ['No immediate danger signs identified'],
    urgency_level: urgency,
    immediate_actions: urgency === 'critical'
      ? ['Call for emergency transport immediately', 'Do not leave patient alone', 'Establish IV access if trained', 'Prepare referral note']
      : ['Monitor vital signs every 15 minutes', 'Reassess in 30 minutes', 'Document findings'],
    referral_recommendation: urgency === 'critical' || urgency === 'high'
      ? 'Refer to nearest secondary health facility immediately'
      : 'Continue monitoring. Refer if condition worsens.',
    reasoning: 'Keyword-based assessment (Gemma API unavailable). Based on WHO Maternal Health Guidelines.',
    confidence: 'low',
    gemma_powered: false,
    disclaimer: isHa
      ? 'Wannan kayan aiki yana tallafawa yanke shawara na asibiti kuma baya maye gurbin hukuncin likita.'
      : 'This tool supports clinical decision-making and does not replace professional medical judgment.',
    language_used: language,
  };
}

module.exports = router;
