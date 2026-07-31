const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function getPin() {
  return localStorage.getItem('clinic_pin') || '';
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      'x-clinic-pin': getPin(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Auth
  login: (pin) => fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  }).then(r => r.ok ? r.json() : Promise.reject(new Error('Invalid PIN'))),

  // Patients
  getPatients: () => req('GET', '/patients'),
  getPatient: (id) => req('GET', `/patients/${id}`),
  createPatient: (data) => req('POST', '/patients', data),

  // Cases
  getCases: (patient_id) => req('GET', `/cases${patient_id ? `?patient_id=${patient_id}` : ''}`),
  getCase: (id) => req('GET', `/cases/${id}`),
  createCase: (data) => req('POST', '/cases', data),
  updateAnalysis: (id, data) => req('PATCH', `/cases/${id}/analysis`, data),

  // Referrals
  getReferral: (case_id) => req('GET', `/referrals/${case_id}`),
  createReferral: (data) => req('POST', '/referrals', data),

  // AI
  analyze: (data) => req('POST', '/ai/analyze', data),
  aiStatus: () => req('GET', '/ai/status'),

  async transcribe(audioBlob, language = 'en') {
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    form.append('language', language);
    const res = await fetch(`${BASE}/ai/transcribe`, {
      method: 'POST',
      headers: { 'x-clinic-pin': getPin() },
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Transcription failed');
    return data.text;
  },

  async uploadImage(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${BASE}/ai/image`, {
      method: 'POST',
      headers: { 'x-clinic-pin': getPin() },
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Analytics
  getAnalytics: () => req('GET', '/analytics'),

  // Audit
  log: (action, entity, entity_id, detail) =>
    req('POST', '/audit', { action, entity, entity_id, detail }),
};
