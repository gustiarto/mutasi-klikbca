const express = require('express');
const { getMutasiPuppeteer } = require('./klikbca-puppeteer');
const { loadDb, saveDb, findMutasiInDb } = require('./mutasi-db');
const axios = require('axios');
const cron = require('node-cron');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Middleware HMAC SHA256 Auth untuk semua endpoint
const API_SECRET = process.env.AUTH_TOKEN || 'klikbca-secret-token';
app.use((req, res, next) => {
  const receivedHmac = req.headers['x-api-key'];
  let payload = '';
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    payload = JSON.stringify(req.body || {});
  }
  const expectedHmac = crypto.createHmac('sha256', API_SECRET).update(payload).digest('hex');
  if (!receivedHmac || receivedHmac !== expectedHmac) {
    return res.status(401).json({ error: 'Unauthorized (HMAC)' });
  }
  next();
});

// Konfigurasi user_id & pin (bisa dari ENV)
const USER_ID = process.env.KLIKBCA_USER_ID || 'ISI_USER_ID';
const PIN = process.env.KLIKBCA_PIN || 'ISI_PIN';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'WEBHOOK_URL';
const WEBHOOK_BASIC_USER = process.env.WEBHOOK_BASIC_USER || '';
const WEBHOOK_BASIC_PASS = process.env.WEBHOOK_BASIC_PASS || '';
const CRON_INTERVAL = process.env.CRON_INTERVAL || '*/10 * * * *';

// Cron job dengan interval dari ENV
cron.schedule(CRON_INTERVAL, async () => {
  console.log(`[CRON] Fetching mutasi at ${new Date().toISOString()}`);
  try {
    const data = await getMutasiPuppeteer(USER_ID, PIN);
    let db = loadDb();
    let changed = false;
    for (const mutasi of data) {
      if (!findMutasiInDb(db, mutasi)) {
        // Data baru
        const fetch_datetime = new Date().toISOString();
        // Kirim webhook
        try {
          const payload = JSON.stringify(mutasi);
          const hmac = crypto.createHmac('sha256', API_SECRET).update(payload).digest('hex');
          const axiosConfig = {
            timeout: 10000,
            headers: { 'x-api-key': hmac }
          };
          const resp = await axios.post(WEBHOOK_URL, mutasi, axiosConfig);
          const { entryid, uniqueid } = resp.data || {};
          db.push({ ...mutasi, fetch_datetime, status_webhook: { entryid, uniqueid } });
          console.log(`[WEBHOOK] Sent for ${mutasi.tanggal} - ${mutasi.keterangan}`);
        } catch (e) {
          db.push({ ...mutasi, fetch_datetime, status_webhook: { error: e.message } });
          console.log(`[WEBHOOK] Failed for ${mutasi.tanggal} - ${mutasi.keterangan}`);
        }
        changed = true;
      }
    }
    if (changed) saveDb(db);
  } catch (err) {
    console.error('[CRON ERROR]', err.message);
  }
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

// Endpoint untuk melihat isi db
app.get('/mutasi-db', (req, res) => {
  const db = loadDb();
  res.json(db);
});

const PORT = process.env.PORT || 3040;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
