const { chromium } = require('playwright');

const testAccounts = [
  { username: 'mgr-000', password: 'CksDemo!2025', hubName: 'Manager' },
  { username: 'con-000', password: 'CksDemo!2025', hubName: 'Contractor' },
  { username: 'cus-000', password: 'CksDemo!2025', hubName: 'Customer' },
  { username: 'cen-000', password: 'CksDemo!2025', hubName: 'Center' },
  { username: 'crw-000', password: 'CksDemo!2025', hubName: 'Crew' }
];

async function testLogoutForAllHubs() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });

  let allPassed = true;
  
  for (const account of testAccounts) {
    console.log(`\n🧪 Testing ${account.hubName} hub logout (${account.username})`);
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Go to login page
      await page.goto('http://localhost:5183/login');
      await page.waitForTimeout(1000);
      
      // Login
      await page.fill('input[type="text"]', account.username);
      await page.fill('input[type="password"]', account.password);
      await page.click('button:has-text("Sign in")');
      
      // Wait for hub to load
      await page.waitForTimeout(3000);
      
      const hubUrl = page.url();
      if (!hubUrl.includes('/hub')) {
        console.log(`❌ ${account.hubName}: Failed to reach hub`);
        allPassed = false;
        await context.close();
        continue;
      }
      
      console.log(`✅ ${account.hubName}: Successfully logged into hub`);
      
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Log out")');
      const count = await logoutButton.count();
      
      if (count === 0) {
        console.log(`❌ ${account.hubName}: No logout button found`);
        allPassed = false;
        await context.close();
        continue;
      }
      
      console.log(`📍 ${account.hubName}: Found ${count} logout button(s), clicking...`);
      await logoutButton.first().click();
      
      // Wait for logout
      await page.waitForTimeout(4000);
      
      const finalUrl = page.url();
      if (finalUrl.includes('/login')) {
        console.log(`✅ ${account.hubName}: Logout successful!`);
      } else {
        console.log(`❌ ${account.hubName}: Logout failed, still at: ${finalUrl}`);
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`❌ ${account.hubName}: Error during test: ${error.message}`);
      allPassed = false;
    }
    
    await context.close();
  }
  
  await browser.close();
  
  console.log(`\n🏁 Final Result: ${allPassed ? 'ALL HUBS PASSED' : 'SOME HUBS FAILED'}`);
  return allPassed;
}

testLogoutForAllHubs().catch(console.error);