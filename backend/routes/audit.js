const express = require('express');
const { getDb, persist } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const db = await getDb();
  const { action, entity, entity_id, detail } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  db.run(
    'INSERT INTO audit_logs (action, entity, entity_id, detail) VALUES (?, ?, ?, ?)',
    [action, entity || null, entity_id || null, detail ? JSON.stringify(detail) : null]
  );
  persist();
  res.status(201).json({ success: true });
});

module.exports = router;
