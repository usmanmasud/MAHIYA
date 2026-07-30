const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// Pass API key to Python subprocess via environment
function getPyEnv() {
  return {
    ...process.env,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  };
}

function runAnalysis(input) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [
      path.join(__dirname, '..', '..', 'ai', 'analyze.py')
    ], { env: getPyEnv() });

    let output = '';
    let errOut = '';

    py.stdin.write(input);
    py.stdin.end();

    py.stdout.on('data', d => { output += d.toString(); });
    py.stderr.on('data', d => { errOut += d.toString(); });

    py.on('close', code => {
      if (code !== 0) return reject(new Error(errOut || 'Python process failed'));
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new Error('Invalid JSON from AI process'));
      }
    });
  });
}

router.post('/analyze', async (req, res) => {
  const { symptoms, patient, language = 'en' } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'symptoms required' });

  try {
    const result = await runAnalysis(JSON.stringify({ symptoms, patient, language }));
    res.json(result);
  } catch (err) {
    console.error('AI process error:', err.message);
    res.json(fallbackAnalysis(symptoms, patient, language));
  }
});

// Status endpoint — lets the UI show whether Gemma is live
router.get('/status', (req, res) => {
  const key = process.env.GEMINI_API_KEY || '';
  const live = key.length > 10 && key !== 'your_api_key_here';
  res.json({
    gemma_live: live,
    model: live ? 'gemma-3-27b-it' : null,
    mode: live ? 'Gemma 4 via Gemini API' : 'Keyword fallback (no API key)',
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
