require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'storage')));

app.use('/api/patients', require('./routes/patients'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/ai', require('./routes/ai'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', offline: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mahiya Edge API running on :${PORT}`));
