const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'mahiya.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT,
      age INTEGER,
      gravida INTEGER,
      para INTEGER,
      lmp TEXT,
      village TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      symptoms TEXT,
      voice_note_path TEXT,
      image_path TEXT,
      ai_analysis TEXT,
      urgency_level TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      patient_id TEXT,
      summary TEXT,
      danger_signs TEXT,
      actions TEXT,
      facility TEXT,
      generated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );
  `);

  persist();
  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, persist };
