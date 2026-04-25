const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const EMAIL = 'test@test.com';
  const PASSWORD = 'testpass123';
  const results = [];

  // ─── FLOW 1: LOGIN ───────────────────────────────────────────────
  let loginOk = false;
  let cookies = null;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    const consoleErrors = [];
    p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    p.on('pageerror', e => consoleErrors.push('PAGE ERROR: ' + e.message));
    
    await p.goto('http://100.77.106.28:5173/login', { timeout: 20000, waitUntil: 'networkidle' });
    await p.fill('input[type="text"]', EMAIL);
    await p.fill('input[type="password"]', PASSWORD);
    await p.click('button[type="submit"]');
    await p.waitForTimeout(6000);
    
    const url = p.url();
    loginOk = !url.includes('/login') && !url.includes('/auth');
    cookies = await ctx.cookies();
    results.push({ flow: 'LOGIN', ok: loginOk, url, errors: consoleErrors });
    console.log('LOGIN:', loginOk ? 'OK' : 'FAIL', 'URL:', url);
    await ctx.close();
  } catch(e) {
    results.push({ flow: 'LOGIN', ok: false, error: e.message });
    console.log('LOGIN EXCEPTION:', e.message);
  }

  if (!loginOk) {
    console.log('\nLOGIN FAILED, stopping here');
    await browser.close();
    return;
  }

  // ─── FLOW 2: CLIENTS PAGE ───────────────────────────────────────
  try {
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p2 = await ctx2.newPage();
    const consoleErrors2 = [];
    p2.on('console', m => { if (m.type() === 'error') consoleErrors2.push(m.text()); });
    p2.on('pageerror', e => consoleErrors2.push('PAGE ERROR: ' + e.message));
    
    await p2.goto('http://100.77.106.28:5173/clients', { timeout: 20000, waitUntil: 'networkidle' });
    await p2.waitForTimeout(3000);
    
    const url2 = p2.url();
    const onClients = url2.includes('/clients');
    results.push({ flow: 'CLIENTS_PAGE', ok: onClients, url: url2, errors: consoleErrors2 });
    console.log('CLIENTS_PAGE:', onClients ? 'OK' : 'FAIL');
    
    // Try adding a client via modal
    const addBtn = await p2.$('button:has-text("Nouveau Client")');
    if (addBtn) {
      await addBtn.click();
      await p2.waitForTimeout(2000);
      const formVisible = await p2.$('input[name="name"], input[placeholder*="nom"]') !== null;
      console.log('CLIENT_MODAL:', formVisible ? 'OK' : 'FAIL');
      results.push({ flow: 'CLIENT_MODAL', ok: formVisible, url: p2.url() });
    }
    await ctx2.close();
  } catch(e) {
    console.log('CLIENTS EXCEPTION:', e.message);
  }

  // ─── FLOW 3: FACTURES PAGE ──────────────────────────────────────
  try {
    const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p3 = await ctx3.newPage();
    const consoleErrors3 = [];
    p3.on('console', m => { if (m.type() === 'error') consoleErrors3.push(m.text()); });
    
    await p3.goto('http://100.77.106.28:5173/factures', { timeout: 20000, waitUntil: 'networkidle' });
    await p3.waitForTimeout(2000);
    
    const url3 = p3.url();
    results.push({ flow: 'FACTURES_PAGE', ok: url3.includes('/factures'), url: url3, errors: consoleErrors3 });
    console.log('FACTURES_PAGE:', url3.includes('/factures') ? 'OK' : 'FAIL');
    await ctx3.close();
  } catch(e) {
    console.log('FACTURES EXCEPTION:', e.message);
  }

  // ─── FLOW 4: FACTURES/NEW ───────────────────────────────────────
  try {
    const ctx4 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p4 = await ctx4.newPage();
    const consoleErrors4 = [];
    p4.on('console', m => { if (m.type() === 'error') consoleErrors4.push(m.text()); });
    
    await p4.goto('http://100.77.106.28:5173/factures/new', { timeout: 20000, waitUntil: 'networkidle' });
    await p4.waitForTimeout(2000);
    
    const url4 = p4.url();
    const onNewPage = url4.includes('/factures/new') && !url4.includes('/login');
    results.push({ flow: 'FACTURES_NEW', ok: onNewPage, url: url4, errors: consoleErrors4 });
    console.log('FACTURES_NEW:', onNewPage ? 'OK' : 'FAIL', 'URL:', url4);
    await ctx4.close();
  } catch(e) {
    console.log('FACTURES_NEW EXCEPTION:', e.message);
  }

  // ─── FLOW 5: DEVIS PAGE ─────────────────────────────────────────
  try {
    const ctx5 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p5 = await ctx5.newPage();
    const consoleErrors5 = [];
    p5.on('console', m => { if (m.type() === 'error') consoleErrors5.push(m.text()); });
    
    await p5.goto('http://100.77.106.28:5173/devis', { timeout: 20000, waitUntil: 'networkidle' });
    await p5.waitForTimeout(2000);
    
    const url5 = p5.url();
    results.push({ flow: 'DEVIS_PAGE', ok: url5.includes('/devis'), url: url5, errors: consoleErrors5 });
    console.log('DEVIS_PAGE:', url5.includes('/devis') ? 'OK' : 'FAIL');
    await ctx5.close();
  } catch(e) {
    console.log('DEVIS EXCEPTION:', e.message);
  }

  // ─── FLOW 6: POS ───────────────────────────────────────────────
  try {
    const ctx6 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p6 = await ctx6.newPage();
    const consoleErrors6 = [];
    p6.on('console', m => { if (m.type() === 'error') consoleErrors6.push(m.text()); });
    
    await p6.goto('http://100.77.106.28:5173/pos', { timeout: 20000, waitUntil: 'networkidle' });
    await p6.waitForTimeout(2000);
    
    const url6 = p6.url();
    results.push({ flow: 'POS_PAGE', ok: url6.includes('/pos'), url: url6, errors: consoleErrors6 });
    console.log('POS_PAGE:', url6.includes('/pos') ? 'OK' : 'FAIL');
    await ctx6.close();
  } catch(e) {
    console.log('POS EXCEPTION:', e.message);
  }

  await browser.close();
  
  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    const status = r.ok ? '✅' : '❌';
    console.log(`${status} ${r.flow}`);
    const realErrors = (r.errors || []).filter(e => 
      !e.includes('CSP') && !e.includes('remixicon') && !e.includes('Rate limit') &&
      !e.includes('fonts/') && !e.includes('cdn.jsdelivr')
    );
    if (realErrors.length > 0) {
      realErrors.forEach(e => console.log(`   ⚠️  ${e.substring(0, 200)}`));
    }
  }
})();
