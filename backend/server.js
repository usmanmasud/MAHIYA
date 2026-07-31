require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-clinic-pin'],
};

app.use(cors(corsOptions));
app.options('{*path}', cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'storage')));

// PIN auth middleware — protects all /api routes except /api/health and /api/auth
const CLINIC_PIN = process.env.CLINIC_PIN || '1234';
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth')) return next();
  const token = req.headers['x-clinic-pin'] || req.query.pin;
  if (token !== CLINIC_PIN) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// Auth endpoint — validate PIN, return session token (same PIN for simplicity)
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  if (pin !== CLINIC_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  res.json({ token: CLINIC_PIN, ok: true });
});

app.use('/api/patients',  require('./routes/patients'));
app.use('/api/cases',     require('./routes/cases'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/audit',     require('./routes/audit'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', offline: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mahiya Edge API running on :${PORT}`));
