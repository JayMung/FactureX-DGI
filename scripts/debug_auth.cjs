const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const EMAIL = 'test@test.com';
  const PASSWORD = 'testpass123';
  
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  
  const consoleMessages = [];
  const networkRequests = [];
  
  p.on('console', m => consoleMessages.push(`[${m.type()}] ${m.text().substring(0, 200)}`));
  p.on('request', req => {
    if (req.url().includes('/factures') || req.url().includes('/clients') || req.url().includes('supabase')) {
      networkRequests.push(`${req.method()} ${req.url().substring(0, 100)}`);
    }
  });
  p.on('response', resp => {
    if (resp.url().includes('supabase') || resp.url().includes('/auth')) {
      networkRequests.push(`  <- ${resp.status()} ${resp.url().substring(0, 80)}`);
    }
  });
  
  // Login
  await p.goto('http://100.77.106.28:5173/login', { timeout: 20000, waitUntil: 'networkidle' });
  await p.fill('input[type="text"]', EMAIL);
  await p.fill('input[type="password"]', PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(6000);
  
  console.log('After login URL:', p.url());
  console.log('\n--- Cookies after login ---');
  const cookies = await ctx.cookies();
  for (const c of cookies) {
    console.log(`  ${c.name} = ${c.value.substring(0, 30)}... (httpOnly=${c.httpOnly}, secure=${c.secure})`);
  }
  
  // Navigate to clients
  console.log('\n--- Navigating to /clients ---');
  await p.goto('http://100.77.106.28:5173/clients', { timeout: 20000, waitUntil: 'networkidle' });
  console.log('After /clients URL:', p.url());
  
  // Check localStorage
  console.log('\n--- localStorage ---');
  const ls = await p.evaluate(() => {
    const keys = Object.keys(localStorage);
    const result = {};
    for (const k of keys) {
      if (k.includes('supabase') || k.includes('auth') || k.includes('token')) {
        result[k] = localStorage.getItem(k);
      }
    }
    return result;
  });
  console.log(JSON.stringify(ls, null, 2));
  
  console.log('\n--- Network (supabase/auth) ---');
  networkRequests.forEach(r => console.log(r));
  
  await browser.close();
})();
