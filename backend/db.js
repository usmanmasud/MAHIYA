const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'database', 'mahiya.db');

// Encryption key: set DB_ENCRYPTION_KEY in .env (32-char string)
// If not set, falls back to a device-stable key derived from hostname
function getKey() {
  const raw = process.env.DB_ENCRYPTION_KEY || require('os').hostname() + '_mahiya_edge_key';
  return crypto.createHash('sha256').update(raw).digest(); // 32 bytes
}

function encryptDb(data) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  // Prepend IV so we can decrypt later: [16 bytes IV][encrypted data]
  return Buffer.concat([iv, encrypted]);
}

function decryptDb(data) {
  const key = getKey();
  const iv = data.slice(0, 16);
  const encrypted = data.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const raw = fs.readFileSync(DB_PATH);
    // Detect if file is encrypted (new format) or legacy plaintext SQLite
    const isEncrypted = raw.slice(0, 6).toString() !== 'SQLite';
    const dbData = isEncrypted ? decryptDb(raw) : raw;
    db = new SQL.Database(dbData);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      gravida INTEGER,
      para INTEGER,
      lmp TEXT,
      village TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      symptoms TEXT,
      voice_note_path TEXT,
      image_path TEXT,
      ai_analysis TEXT,
      urgency_level TEXT DEFAULT 'unknown',
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
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
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const data = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, encryptDb(data));
}

module.exports = { getDb, persist };
