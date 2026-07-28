const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, persist } = require('../db');

const router = express.Router();

router.get('/:case_id', async (req, res) => {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM referrals WHERE case_id = ?');
  stmt.bind([req.params.case_id]);
  if (!stmt.step()) return res.status(404).json({ error: 'Not found' });
  const row = stmt.getAsObject();
  row.danger_signs = JSON.parse(row.danger_signs || '[]');
  row.actions = JSON.parse(row.actions || '[]');
  res.json(row);
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { case_id, patient_id, summary, danger_signs, actions, facility } = req.body;
  const id = uuidv4();
  db.run(
    'INSERT INTO referrals (id, case_id, patient_id, summary, danger_signs, actions, facility) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, case_id, patient_id, summary, JSON.stringify(danger_signs || []), JSON.stringify(actions || []), facility || null]
  );
  persist();
  res.status(201).json({ id, case_id, patient_id, summary, danger_signs, actions, facility });
});

module.exports = router;
