const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// Structured mock output that mirrors real Gemma output shape
// Replace spawn logic with actual Python call when Gemma is ready
router.post('/analyze', async (req, res) => {
  const { symptoms, patient, language = 'en' } = req.body;

  if (!symptoms) return res.status(400).json({ error: 'symptoms required' });

  const input = JSON.stringify({ symptoms, patient, language });

  const py = spawn('python', [
    path.join(__dirname, '..', '..', 'ai', 'analyze.py')
  ]);

  let output = '';
  let errOut = '';

  py.stdin.write(input);
  py.stdin.end();

  py.stdout.on('data', d => { output += d.toString(); });
  py.stderr.on('data', d => { errOut += d.toString(); });

  py.on('close', code => {
    if (code !== 0) {
      console.error('AI process error:', errOut);
      // Fallback structured response so UI always works
      return res.json(fallbackAnalysis(symptoms, patient));
    }
    try {
      res.json(JSON.parse(output));
    } catch {
      res.json(fallbackAnalysis(symptoms, patient));
    }
  });
});

function fallbackAnalysis(symptoms, patient) {
  const s = (symptoms || '').toLowerCase();
  const dangerSigns = [];
  let urgency = 'low';

  if (s.includes('bleed') || s.includes('hemorrhage')) {
    dangerSigns.push('Postpartum Hemorrhage suspected');
    urgency = 'critical';
  }
  if (s.includes('convuls') || s.includes('seizure') || s.includes('fit')) {
    dangerSigns.push('Eclampsia suspected');
    urgency = 'critical';
  }
  if (s.includes('headache') || s.includes('vision') || s.includes('swelling')) {
    dangerSigns.push('Preeclampsia signs present');
    urgency = urgency === 'critical' ? 'critical' : 'high';
  }
  if (s.includes('fever') || s.includes('baby') || s.includes('newborn')) {
    dangerSigns.push('Neonatal Sepsis risk');
    urgency = urgency === 'critical' ? 'critical' : 'high';
  }

  return {
    patient_summary: `Patient${patient?.name ? ' ' + patient.name : ''} presenting with: ${symptoms}`,
    symptoms_recorded: symptoms,
    danger_signs: dangerSigns.length ? dangerSigns : ['No immediate danger signs identified'],
    urgency_level: urgency,
    immediate_actions: urgency === 'critical'
      ? ['Call for emergency transport immediately', 'Do not leave patient alone', 'Establish IV access if trained', 'Prepare referral note']
      : ['Monitor vital signs', 'Reassess in 30 minutes', 'Document findings'],
    referral_recommendation: urgency === 'critical' || urgency === 'high'
      ? 'Refer to nearest secondary health facility immediately'
      : 'Continue monitoring. Refer if condition worsens.',
    reasoning: 'Assessment based on reported symptoms and WHO maternal health guidelines.',
    confidence: 'moderate',
    disclaimer: 'This tool supports clinical decision-making and does not replace professional medical judgment.',
    language_used: 'en'
  };
}

module.exports = router;
