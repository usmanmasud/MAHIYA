const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await getDb();

  const q = sql => {
    const r = db.exec(sql);
    return r[0]?.values?.[0]?.[0] ?? 0;
  };

  const rows = sql => {
    const r = db.exec(sql);
    const cols = r[0]?.columns || [];
    return (r[0]?.values || []).map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
  };

  res.json({
    totals: {
      patients:  q('SELECT COUNT(*) FROM patients'),
      cases:     q('SELECT COUNT(*) FROM cases'),
      referrals: q('SELECT COUNT(*) FROM referrals'),
      critical:  q("SELECT COUNT(*) FROM cases WHERE urgency_level = 'critical'"),
      high:      q("SELECT COUNT(*) FROM cases WHERE urgency_level = 'high'"),
      moderate:  q("SELECT COUNT(*) FROM cases WHERE urgency_level = 'moderate'"),
      low:       q("SELECT COUNT(*) FROM cases WHERE urgency_level = 'low'"),
    },
    // Cases per day (last 14 days)
    cases_by_day: rows(`
      SELECT date(created_at) as day, COUNT(*) as count
      FROM cases
      WHERE created_at >= date('now', '-14 days')
      GROUP BY day ORDER BY day ASC
    `),
    // Top danger signs from AI analyses
    urgency_breakdown: rows(`
      SELECT urgency_level, COUNT(*) as count
      FROM cases
      WHERE urgency_level != 'unknown'
      GROUP BY urgency_level
    `),
    // Recent audit log
    recent_audit: rows(`
      SELECT action, entity, entity_id, detail, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 20
    `),
  });
});

module.exports = router;
