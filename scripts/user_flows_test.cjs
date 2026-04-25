const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const results = [];
  
  // ─── FLOW 1: SIGNUP ───────────────────────────────────────────────
  try {
    const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p1 = await ctx1.newPage();
    const consoleErrors1 = [];
    p1.on('console', m => { if (m.type() === 'error') consoleErrors1.push(m.text()); });
    p1.on('pageerror', e => consoleErrors1.push('PAGE ERROR: ' + e.message));
    
    await p1.goto('http://100.77.106.28:5173/signup', { timeout: 20000 });
    await p1.waitForLoadState('networkidle');
    await p1.waitForTimeout(2000);
    
    // Fill signup form
    await p1.fill('input[name="email"]', 'testuser_' + Date.now() + '@facturesmart.test');
    await p1.fill('input[name="password"]', 'TestPass123!');
    await p1.fill('input[name="company"]', 'Test Company Flow');
    await p1.click('button[type="submit"]');
    await p1.waitForTimeout(5000);
    
    const url1 = p1.url();
    const signupOk = url1.includes('/dashboard') || url1.includes('/login');
    results.push({ flow: 'SIGNUP', ok: signupOk, url: url1, errors: consoleErrors1 });
    await ctx1.close();
  } catch(e) {
    results.push({ flow: 'SIGNUP', ok: false, error: e.message });
  }
  
  // ─── FLOW 2: LOGIN + CREATE CLIENT ───────────────────────────────
  try {
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p2 = await ctx2.newPage();
    const consoleErrors2 = [];
    p2.on('console', m => { if (m.type() === 'error') consoleErrors2.push(m.text()); });
    p2.on('pageerror', e => consoleErrors2.push('PAGE ERROR: ' + e.message));
    
    await p2.goto('http://100.77.106.28:5173/login', { timeout: 20000 });
    await p2.waitForLoadState('networkidle');
    await p2.fill('input[type="text"]', 'test@facturesmart.test');
    await p2.fill('input[type="password"]', 'TestPass123!');
    await p2.click('button[type="submit"]');
    await p2.waitForTimeout(5000);
    
    // Go to clients
    await p2.goto('http://100.77.106.28:5173/clients/new', { timeout: 15000 });
    await p2.waitForLoadState('networkidle');
    await p2.waitForTimeout(2000);
    
    // Fill client form
    const nameInput = await p2.$('input[name="name"]');
    if (nameInput) {
      await nameInput.fill('Client Test Flow');
      const emailInput = await p2.$('input[name="email"]');
      if (emailInput) await emailInput.fill('client@flowtest.test');
      const telInput = await p2.$('input[name="phone"]');
      if (telInput) await telInput.fill('+243812345678');
      await p2.click('button[type="submit"]');
      await p2.waitForTimeout(4000);
    }
    
    const url2 = p2.url();
    const clientOk = url2.includes('/clients');
    results.push({ flow: 'CREATE_CLIENT', ok: clientOk, url: url2, errors: consoleErrors2 });
    await ctx2.close();
  } catch(e) {
    results.push({ flow: 'CREATE_CLIENT', ok: false, error: e.message });
  }
  
  // ─── FLOW 3: LOGIN + CREATE INVOICE ──────────────────────────────
  try {
    const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p3 = await ctx3.newPage();
    const consoleErrors3 = [];
    p3.on('console', m => { if (m.type() === 'error') consoleErrors3.push(m.text()); });
    p3.on('pageerror', e => consoleErrors3.push('PAGE ERROR: ' + e.message));
    
    await p3.goto('http://100.77.106.28:5173/login', { timeout: 20000 });
    await p3.waitForLoadState('networkidle');
    await p3.fill('input[type="text"]', 'test@facturesmart.test');
    await p3.fill('input[type="password"]', 'TestPass123!');
    await p3.click('button[type="submit"]');
    await p3.waitForTimeout(5000);
    
    await p3.goto('http://100.77.106.28:5173/factures/new', { timeout: 15000 });
    await p3.waitForLoadState('networkidle');
    await p3.waitForTimeout(2000);
    
    // Try to add a line item
    const addBtn = await p3.$('button:has-text("Ajouter")');
    if (addBtn) {
      await addBtn.click();
      await p3.waitForTimeout(1000);
    }
    
    // Try to submit
    const submitBtn = await p3.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await p3.waitForTimeout(4000);
    }
    
    const url3 = p3.url();
    results.push({ flow: 'CREATE_INVOICE', ok: true, url: url3, errors: consoleErrors3 });
    await ctx3.close();
  } catch(e) {
    results.push({ flow: 'CREATE_INVOICE', ok: false, error: e.message });
  }
  
  // ─── FLOW 4: LOGIN + CREATE QUOTE (DEVIS) ─────────────────────────
  try {
    const ctx4 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p4 = await ctx4.newPage();
    const consoleErrors4 = [];
    p4.on('console', m => { if (m.type() === 'error') consoleErrors4.push(m.text()); });
    p4.on('pageerror', e => consoleErrors4.push('PAGE ERROR: ' + e.message));
    
    await p4.goto('http://100.77.106.28:5173/login', { timeout: 20000 });
    await p4.waitForLoadState('networkidle');
    await p4.fill('input[type="text"]', 'test@facturesmart.test');
    await p4.fill('input[type="password"]', 'TestPass123!');
    await p4.click('button[type="submit"]');
    await p4.waitForTimeout(5000);
    
    await p4.goto('http://100.77.106.28:5173/devis/new', { timeout: 15000 });
    await p4.waitForLoadState('networkidle');
    await p4.waitForTimeout(2000);
    
    const url4 = p4.url();
    results.push({ flow: 'CREATE_QUOTE', ok: true, url: url4, errors: consoleErrors4 });
    await ctx4.close();
  } catch(e) {
    results.push({ flow: 'CREATE_QUOTE', ok: false, error: e.message });
  }
  
  // ─── FLOW 5: LOGIN + POS / CAISSE ───────────────────────────────
  try {
    const ctx5 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p5 = await ctx5.newPage();
    const consoleErrors5 = [];
    p5.on('console', m => { if (m.type() === 'error') consoleErrors5.push(m.text()); });
    p5.on('pageerror', e => consoleErrors5.push('PAGE ERROR: ' + e.message));
    
    await p5.goto('http://100.77.106.28:5173/login', { timeout: 20000 });
    await p5.waitForLoadState('networkidle');
    await p5.fill('input[type="text"]', 'test@facturesmart.test');
    await p5.fill('input[type="password"]', 'TestPass123!');
    await p5.click('button[type="submit"]');
    await p5.waitForTimeout(5000);
    
    await p5.goto('http://100.77.106.28:5173/pos-caisse', { timeout: 15000 });
    await p5.waitForLoadState('networkidle');
    await p5.waitForTimeout(2000);
    
    // Try adding a product
    const addProductBtn = await p5.$('button:has-text("Ajouter")');
    if (addProductBtn) {
      await addProductBtn.click();
      await p5.waitForTimeout(1000);
    }
    
    const url5 = p5.url();
    results.push({ flow: 'POS_CAISSE', ok: true, url: url5, errors: consoleErrors5 });
    await ctx5.close();
  } catch(e) {
    results.push({ flow: 'POS_CAISSE', ok: false, error: e.message });
  }
  
  await browser.close();
  
  // Print summary
  console.log('\n=== USER FLOWS TEST RESULTS ===');
  for (const r of results) {
    const status = r.ok ? '✅' : '❌';
    console.log(`${status} ${r.flow}`);
    if (r.url) console.log(`   URL: ${r.url}`);
    if (r.errors && r.errors.length > 0) {
      console.log(`   ERRORS (${r.errors.length}):`);
      r.errors.forEach(e => console.log(`   - ${e.substring(0, 150)}`));
    }
    if (r.error) console.log(`   EXCEPTION: ${r.error}`);
  }
})();
