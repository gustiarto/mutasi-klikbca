const express = require('express');
const { getMutasiPuppeteer } = require('./klikbca-puppeteer');

const app = express();
app.use(express.json());

// Middleware autentikasi sederhana (Bearer Token)
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'klikbca-secret-token';
app.use((req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Endpoint POST /mutasi
app.post('/mutasi', async (req, res) => {
  const { user_id, pin } = req.body;
  if (!user_id || !pin) {
    return res.status(400).json({ error: 'user_id dan pin wajib diisi' });
  }
  try {
    const data = await getMutasiPuppeteer(user_id, pin);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3040;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
