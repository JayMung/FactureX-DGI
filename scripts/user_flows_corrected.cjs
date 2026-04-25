const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
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
    await p.fill('input[type="text"]', 'test@facturesmart.test');
    await p.fill('input[type="password"]', 'TestPass123!');
    await p.click('button[type="submit"]');
    await p.waitForTimeout(5000);
    
    const url = p.url();
    loginOk = !url.includes('/login');
    cookies = await ctx.cookies();
    results.push({ flow: 'LOGIN', ok: loginOk, url, errors: consoleErrors });
    await ctx.close();
  } catch(e) {
    results.push({ flow: 'LOGIN', ok: false, error: e.message });
  }

  if (!loginOk) {
    console.log('LOGIN FAILED, skipping other flows');
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
    return;
  }

  // ─── FLOW 2: CLIENTS PAGE + OPEN CREATE MODAL ───────────────────
  try {
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p2 = await ctx2.newPage();
    const consoleErrors2 = [];
    p2.on('console', m => { if (m.type() === 'error') consoleErrors2.push(m.text()); });
    p2.on('pageerror', e => consoleErrors2.push('PAGE ERROR: ' + e.message));
    
    await p2.goto('http://100.77.106.28:5173/clients', { timeout: 20000, waitUntil: 'networkidle' });
    await p2.waitForTimeout(3000);
    
    // Click "Nouveau Client" button
    const addBtn = await p2.$('button:has-text("Nouveau Client")');
    if (addBtn) {
      await addBtn.click();
      await p2.waitForTimeout(2000);
      const url = p2.url();
      // Check if form/modal appeared
      const formVisible = await p2.$('input[name="name"]') !== null || 
                          await p2.$('[role="dialog"]') !== null ||
                          await p2.$('form') !== null;
      results.push({ flow: 'CLIENTS_OPEN_MODAL', ok: formVisible, url, errors: consoleErrors2 });
    } else {
      results.push({ flow: 'CLIENTS_OPEN_MODAL', ok: false, error: 'Button Nouveau Client not found' });
    }
    await ctx2.close();
  } catch(e) {
    results.push({ flow: 'CLIENTS_OPEN_MODAL', ok: false, error: e.message });
  }

  // ─── FLOW 3: FACTURES PAGE + NAVIGATE TO /factures/new ─────────
  try {
    const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p3 = await ctx3.newPage();
    const consoleErrors3 = [];
    p3.on('console', m => { if (m.type() === 'error') consoleErrors3.push(m.text()); });
    p3.on('pageerror', e => consoleErrors3.push('PAGE ERROR: ' + e.message));
    
    await p3.goto('http://100.77.106.28:5173/factures/new', { timeout: 20000, waitUntil: 'networkidle' });
    await p3.waitForTimeout(3000);
    
    const url3 = p3.url();
    // Check if we're on the create page (not on login)
    const onCreatePage = url3.includes('/factures/new');
    results.push({ flow: 'FACTURES_NEW', ok: onCreatePage, url: url3, errors: consoleErrors3 });
    await ctx3.close();
  } catch(e) {
    results.push({ flow: 'FACTURES_NEW', ok: false, error: e.message });
  }

  // ─── FLOW 4: DEVIS PAGE ─────────────────────────────────────────
  try {
    const ctx4 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p4 = await ctx4.newPage();
    const consoleErrors4 = [];
    p4.on('console', m => { if (m.type() === 'error') consoleErrors4.push(m.text()); });
    p4.on('pageerror', e => consoleErrors4.push('PAGE ERROR: ' + e.message));
    
    await p4.goto('http://100.77.106.28:5173/devis', { timeout: 20000, waitUntil: 'networkidle' });
    await p4.waitForTimeout(2000);
    
    // Check for "Nouveau Devis" button
    const devisBtn = await p4.$('button:has-text("Nouveau Devis")');
    const url4 = p4.url();
    results.push({ flow: 'DEVIS_PAGE', ok: url4.includes('/devis'), url: url4, hasDevisButton: !!devisBtn, errors: consoleErrors4 });
    await ctx4.close();
  } catch(e) {
    results.push({ flow: 'DEVIS_PAGE', ok: false, error: e.message });
  }

  // ─── FLOW 5: POS PAGE ───────────────────────────────────────────
  try {
    const ctx5 = await browser.newContext({ viewport: { width: 1280, height: 900 }, cookies });
    const p5 = await ctx5.newPage();
    const consoleErrors5 = [];
    p5.on('console', m => { if (m.type() === 'error') consoleErrors5.push(m.text()); });
    p5.on('pageerror', e => consoleErrors5.push('PAGE ERROR: ' + e.message));
    
    await p5.goto('http://100.77.106.28:5173/pos', { timeout: 20000, waitUntil: 'networkidle' });
    await p5.waitForTimeout(2000);
    
    const url5 = p5.url();
    results.push({ flow: 'POS_PAGE', ok: url5.includes('/pos'), url: url5, errors: consoleErrors5 });
    await ctx5.close();
  } catch(e) {
    results.push({ flow: 'POS_PAGE', ok: false, error: e.message });
  }

  await browser.close();
  
  console.log('\n=== CORRECTED USER FLOWS TEST RESULTS ===');
  for (const r of results) {
    const status = r.ok ? '✅' : '❌';
    console.log(`${status} ${r.flow} — ${r.url || r.error}`);
    if (r.errors && r.errors.length > 0) {
      const realErrors = r.errors.filter(e => !e.includes('CSP') && !e.includes('fonts/remixicon'));
      if (realErrors.length > 0) {
        console.log(`   REAL ERRORS (${realErrors.length}):`);
        realErrors.forEach(e => console.log(`   - ${e.substring(0, 200)}`));
      }
    }
  }
})();
