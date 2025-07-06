const puppeteer = require('puppeteer');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ambil data mutasi rekening dan parsing ke JSON
async function getMutasiPuppeteer(user_id, pin, logger = console) {
  logger.info?.('START: Launching browser');
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  logger.info?.('STEP: Open KlikBCA login page');
  await page.goto('https://ibank.klikbca.com/', { waitUntil: 'networkidle2' });

  logger.info?.(`STEP: Fill USER ID and PIN`, { user_id, pin });
  await page.type('#txt_user_id', user_id);
  await page.type('#txt_pswd', pin);
  logger.info?.('STEP: Submit login');
  await Promise.all([
    page.click('#btnSubmit'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  logger.info?.('STEP: Check login error');
  const pageContent = await page.content();
  if (pageContent.includes('Anda dapat melakukan login kembali setelah 5 menit') || pageContent.includes('You can re-login after 5 minutes')) {
    await browser.close();
    logger.error?.('ERROR: Login gagal 5 menit');
    throw new Error('Login gagal: Anda dapat melakukan login kembali setelah 5 menit.');
  }
  if (pageContent.includes('User ID/Password Anda salah') || pageContent.includes('Your User ID/Password is Wrong')) {
    await browser.close();
    logger.error?.('ERROR: Login gagal user/pin salah');
    throw new Error('Login gagal: User ID atau PIN salah.');
  }

  logger.info?.('STEP: Navigasi ke menu Mutasi Rekening');
  const frames = await page.frames();
  const menuFrame = frames.find(f => f.name() === 'menu');
  if (!menuFrame) {
    logger.error?.('ERROR: Frame menu tidak ditemukan');
    const headerFrame = frames.find(f => f.name() === 'header');
    if (headerFrame) {
      try {
        await headerFrame.waitForSelector('a[onclick*="logout"]', { timeout: 10000 });
        await headerFrame.click('a[onclick*="logout"]');
      } catch (e) {
        logger.warn?.('WARN: Logout gagal');
      }
    }
    throw new Error('Frame menu tidak ditemukan');
  }
  await menuFrame.waitForSelector('a[href="account_information_menu.htm"]', { timeout: 10000 });
  await menuFrame.click('a[href="account_information_menu.htm"]');
  await delay(1000);
  await menuFrame.waitForSelector('a[onclick*="accountstmt.do?value(actions)=acct_stmt"]', { timeout: 10000 });
  await menuFrame.evaluate(() => {
    const mutasi = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Mutasi Rekening'));
    if (mutasi) mutasi.click();
  });
  await delay(1000);

  logger.info?.('STEP: Klik tombol Lihat Mutasi Rekening di frame atm');
  const atmFrame = frames.find(f => f.name() === 'atm');
  if (!atmFrame) {
    logger.error?.('ERROR: Frame atm tidak ditemukan');
    const headerFrame = frames.find(f => f.name() === 'header');
    if (headerFrame) {
      try {
        await headerFrame.waitForSelector('a[onclick*="logout"]', { timeout: 10000 });
        await headerFrame.click('a[onclick*="logout"]');
      } catch (e) {
        logger.warn?.('WARN: Logout gagal');
      }
    }
    throw new Error('Frame atm tidak ditemukan');
  }
  await atmFrame.waitForSelector('input[name="value(submit1)"]', { timeout: 10000 });
  await atmFrame.click('input[name="value(submit1)"]');
  await delay(2000);

  logger.info?.('STEP: Tunggu tabel mutasi muncul');
  await atmFrame.waitForSelector('table[border="1"]', { timeout: 10000 });

  logger.info?.('STEP: Scrape data mutasi');
  const data = await atmFrame.evaluate(() => {
    const result = [];
    const tables = Array.from(document.querySelectorAll('table[border="1"]'));
    let mutasiTable = null;
    let headerTexts = [];
    for (const table of tables) {
      const header = table.querySelector('tr');
      if (!header) continue;
      headerTexts = Array.from(header.querySelectorAll('th,td')).map(th => th.innerText.trim().toLowerCase());
      if (
        headerTexts.some(h => h.includes('tgl')) &&
        headerTexts.some(h => h.includes('keterangan')) &&
        headerTexts.some(h => h.includes('mutasi'))
      ) {
        mutasiTable = table;
        break;
      }
    }
    if (!mutasiTable) {
      return result;
    }
    const rows = mutasiTable.querySelectorAll('tr');
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].querySelectorAll('td');
      if (cols.length >= 6) {
        result.push({
          tanggal: cols[0].innerText.trim(),
          keterangan: cols[1].innerText.trim().replace(/\n/g, ' ').replace(/\s+/g, ' '),
          cabang: cols[2].innerText.trim(),
          mutasi: cols[3].innerText.trim(),
          tipe: cols[4].innerText.trim(),
          saldo: cols[5].innerText.trim(),
        });
      }
    }
    return result;
  });

  logger.info?.('STEP: Logout KlikBCA');
  const headerFrame = frames.find(f => f.name() === 'header');
  if (headerFrame) {
    try {
      await headerFrame.waitForSelector('a[onclick*="logout"]', { timeout: 10000 });
      await headerFrame.click('a[onclick*="logout"]');
      await delay(2000);
    } catch (e) {
      logger.warn?.('WARN: Logout gagal');
    }
  }

  await browser.close();
  logger.info?.('DONE: Selesai');
  return data;
}

module.exports = { getMutasiPuppeteer };
