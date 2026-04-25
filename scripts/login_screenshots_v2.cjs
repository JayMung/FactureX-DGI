const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  // Login
  await page.goto('http://100.77.106.28:5173/login', { timeout: 30000, waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'test@test.com');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  await page.waitForLoadState('networkidle');
  
  // Take screenshots of all key pages
  const routes = [
    '/dashboard',
    '/factures', 
    '/clients',
    '/devis',
    '/settings',
    '/pos-caisse'
  ];
  
  for (const r of routes) {
    try {
      await page.goto('http://100.77.106.28:5173' + r, { timeout: 20000, waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // extra wait for dynamic content
      const fname = r.replace(/^\//, '') + '_v2';
      await page.screenshot({ path: '/home/jay/screenshots/' + fname + '.png', fullPage: false });
      console.log('OK:', r, '->', page.url());
    } catch(e) {
      console.log('FAIL:', r, e.message.substring(0, 80));
    }
  }
  
  await browser.close();
  console.log('Done!');
})();
