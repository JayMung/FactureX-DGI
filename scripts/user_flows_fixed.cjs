const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const EMAIL = 'test@test.com';
  const PASSWORD = 'testpass123';
  const BASE = 'http://100.77.106.28:5173';
  const results = [];

  // ─── LOGIN ──────────────────────────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const allErrors = [];
  p.on('console', m => { if (m.type() === 'error') allErrors.push(`[${m.location().url?.split('/').pop()}] ${m.text().substring(0, 200)}`); });
  p.on('pageerror', e => allErrors.push(`PAGE ERR: ${e.message.substring(0, 150)}`));
  
  await p.goto(`${BASE}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1000);
  await p.fill('input[type="text"]', EMAIL);
  await p.fill('input[type="password"]', PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(6000);
  
  const loginUrl = p.url();
  const loginOk = !loginUrl.includes('/login');
  console.log(`LOGIN: ${loginOk ? '✅' : '❌'} → ${loginUrl}`);
  
  if (!loginOk) {
    // Check error message on page
    const errText = await p.$eval('[class*="error"], [class*="alert"]', el => el.textContent).catch(() => 'no error element');
    console.log('Login error:', errText.substring(0, 200));
    await browser.close();
    return;
  }

  // Test each page using SAME page (navigate directly, don't create new contexts)
  const pages = [
    { name: 'DASHBOARD', url: '/dashboard', check: '/dashboard' },
    { name: 'CLIENTS', url: '/clients', check: '/clients' },
    { name: 'CLIENTS_NEW_MODAL', url: '/clients', check: '/clients' }, // modal opens on same page
    { name: 'FACTURES', url: '/factures', check: '/factures' },
    { name: 'FACTURES_NEW', url: '/factures/new', check: '/factures/new' },
    { name: 'DEVIS', url: '/devis', check: '/devis' },
    { name: 'POS', url: '/pos', check: '/pos' },
    { name: 'SETTINGS', url: '/settings', check: '/settings' },
  ];

  for (const pg of pages) {
    try {
      await p.goto(`${BASE}${pg.url}`, { timeout: 15000, waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(2000);
      const url = p.url();
      const ok = url.includes(pg.check) && !url.includes('/login');
      console.log(`${pg.name}: ${ok ? '✅' : '❌'} → ${url}`);
      results.push({ flow: pg.name, ok, url });
    } catch(e) {
      console.log(`${pg.name}: ❌ EXCEPTION → ${e.message.substring(0, 100)}`);
      results.push({ flow: pg.name, ok: false, error: e.message });
    }
  }

  // Try opening client modal
  try {
    const addBtn = await p.$('button:has-text("Nouveau Client"), button:has-text("Ajouter un client")');
    if (addBtn) {
      await addBtn.click();
      await p.waitForTimeout(1500);
      const hasForm = await p.$('input[name="name"], input[placeholder*="nom"], [role="dialog"]') !== null;
      console.log(`CLIENT_MODAL: ${hasForm ? '✅' : '❌'}`);
      results.push({ flow: 'CLIENT_MODAL', ok: hasForm });
    }
  } catch(e) {}

  await browser.close();

  // Print errors
  const realErrors = allErrors.filter(e => 
    !e.includes('CSP') && !e.includes('remixicon') && !e.includes('fonts/') &&
    !e.includes('Rate limit') && !e.includes('SecurityLogger')
  );
  if (realErrors.length > 0) {
    console.log('\n⚠️  Console Errors:');
    realErrors.forEach(e => console.log('  ', e.substring(0, 250)));
  }
  
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`\n=== ${passed}/${total} pages passed ===`);
})();
