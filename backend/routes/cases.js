const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, persist } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await getDb();
  const { patient_id } = req.query;
  const sql = patient_id
    ? `SELECT c.*, p.name as patient_name FROM cases c JOIN patients p ON c.patient_id = p.id WHERE c.patient_id = '${patient_id}' ORDER BY c.created_at DESC`
    : `SELECT c.*, p.name as patient_name FROM cases c JOIN patients p ON c.patient_id = p.id ORDER BY c.created_at DESC`;
  const result = db.exec(sql);
  const cols = result[0]?.columns || [];
  const rows = (result[0]?.values || []).map(row =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
  stmt.bind([req.params.id]);
  if (!stmt.step()) return res.status(404).json({ error: 'Not found' });
  const row = stmt.getAsObject();
  if (row.ai_analysis) row.ai_analysis = JSON.parse(row.ai_analysis);
  res.json(row);
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { patient_id, symptoms, urgency_level } = req.body;
  const id = uuidv4();
  db.run(
    'INSERT INTO cases (id, patient_id, symptoms, urgency_level) VALUES (?, ?, ?, ?)',
    [id, patient_id, symptoms || null, urgency_level || 'unknown']
  );
  persist();
  res.status(201).json({ id, patient_id, symptoms, urgency_level });
});

router.patch('/:id/analysis', async (req, res) => {
  const db = await getDb();
  const { ai_analysis, urgency_level } = req.body;
  db.run(
    'UPDATE cases SET ai_analysis = ?, urgency_level = ? WHERE id = ?',
    [JSON.stringify(ai_analysis), urgency_level, req.params.id]
  );
  persist();
  res.json({ success: true });
});

module.exports = router;
