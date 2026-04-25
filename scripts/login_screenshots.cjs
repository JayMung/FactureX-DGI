const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  
  // Login with test account
  console.log('Navigating to login...');
  await page.goto('http://100.77.106.28:5173/login', { timeout: 30000, waitUntil: 'networkidle' });
  
  console.log('Filling login form...');
  await page.fill('input[type="text"]', 'test@test.com');
  await page.fill('input[type="password"]', 'testpass123');
  
  console.log('Submitting...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  await page.waitForLoadState('networkidle');
  
  const url = page.url();
  console.log('Current URL after login:', url);
  
  // Screenshot dashboard
  await page.screenshot({ path: '/home/jay/screenshots/dashboard_auth.png', fullPage: false });
  console.log('Dashboard screenshot saved');
  
  // Navigate to other pages
  const routes = ['/factures', '/clients', '/devis', '/settings', '/pos-caisse'];
  for (const r of routes) {
    try {
      await page.goto('http://100.77.106.28:5173' + r, { timeout: 15000, waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const fname = r.replace(/^\//, '').replace('/', '_');
      await page.screenshot({ path: '/home/jay/screenshots/' + fname + '_auth.png', fullPage: false });
      console.log('Screenshot saved:', r, '->', page.url());
    } catch(e) {
      console.log('Failed:', r, e.message.substring(0, 100));
    }
  }
  
  await browser.close();
  console.log('Done!');
})();
