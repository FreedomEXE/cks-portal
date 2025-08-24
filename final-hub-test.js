const { chromium } = require('playwright');

const templateUsers = [
  { username: 'mgr-000', name: 'Manager' },
  { username: 'con-000', name: 'Contractor' },
  { username: 'cus-000', name: 'Customer' },
  { username: 'cen-000', name: 'Center' },
  { username: 'crw-000', name: 'Crew' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  console.log('🎯 === FINAL TEMPLATE HUB STATUS TEST ===\n');
  
  let working = 0;
  let total = templateUsers.length;
  
  for (const testUser of templateUsers) {
    const page = await browser.newPage();
    
    try {
      console.log(`Testing ${testUser.name} Hub (${testUser.username})...`);
      
      await page.goto('http://localhost:5183/login');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="identifier"]', testUser.username);
      await page.fill('input[name="password"]', 'CksDemo!2025');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/hub')) {
        const title = await page.textContent('h1').catch(() => '');
        const buttons = await page.$$eval('button', btns => btns.length);
        
        console.log(`✅ ${testUser.name}: Working (${buttons} buttons)`);
        working++;
      } else {
        console.log(`❌ ${testUser.name}: Failed (still on login)`);
      }
      
    } catch (error) {
      console.log(`❌ ${testUser.name}: Error - ${error.message}`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  
  console.log(`\n📊 === FINAL RESULTS ===`);
  console.log(`Working Hubs: ${working}/${total} (${Math.round(working/total*100)}%)`);
  
  if (working === total) {
    console.log('🎉 ALL TEMPLATE HUBS ARE NOW WORKING!');
  } else {
    console.log(`⚠️  ${total - working} hubs still need fixes`);
  }
})();