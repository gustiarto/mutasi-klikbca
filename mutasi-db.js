const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'mutasi-db.json');

function loadDb() {
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function findMutasiInDb(db, mutasi) {
  // Cek unik: tanggal, keterangan, mutasi, tipe, saldo
  return db.find(entry =>
    entry.tanggal === mutasi.tanggal &&
    entry.keterangan === mutasi.keterangan &&
    entry.mutasi === mutasi.mutasi &&
    entry.tipe === mutasi.tipe &&
    entry.saldo === mutasi.saldo
  );
}

module.exports = { loadDb, saveDb, findMutasiInDb, DB_PATH };
