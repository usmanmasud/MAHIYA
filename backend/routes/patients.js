const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, persist } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM patients ORDER BY created_at DESC');
  const cols = result[0]?.columns || [];
  const rows = (result[0]?.values || []).map(row =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM patients WHERE id = ?');
  stmt.bind([req.params.id]);
  if (!stmt.step()) return res.status(404).json({ error: 'Not found' });
  res.json(stmt.getAsObject());
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { name, age, gravida, para, lmp, village } = req.body;
  const id = uuidv4();
  db.run(
    'INSERT INTO patients (id, name, age, gravida, para, lmp, village) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, age || null, gravida || null, para || null, lmp || null, village || null]
  );
  persist();
  res.status(201).json({ id, name, age, gravida, para, lmp, village });
});

module.exports = router;
