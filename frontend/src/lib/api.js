const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getPatients: () => req('GET', '/patients'),
  getPatient: (id) => req('GET', `/patients/${id}`),
  createPatient: (data) => req('POST', '/patients', data),

  getCases: (patient_id) => req('GET', `/cases${patient_id ? `?patient_id=${patient_id}` : ''}`),
  getCase: (id) => req('GET', `/cases/${id}`),
  createCase: (data) => req('POST', '/cases', data),
  updateAnalysis: (id, data) => req('PATCH', `/cases/${id}/analysis`, data),

  getReferral: (case_id) => req('GET', `/referrals/${case_id}`),
  createReferral: (data) => req('POST', '/referrals', data),

  analyze: (data) => req('POST', '/ai/analyze', data),
};
