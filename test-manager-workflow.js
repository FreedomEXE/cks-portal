/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * test-manager-workflow.js
 * 
 * Playwright test to verify MGR-001 workflow:
 * 1. Login to admin hub
 * 2. Navigate to directory
 * 3. Click on MGR-001
 * 4. Verify it shows correct manager data
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Manager Hub routing for MGR-001...');

    // Step 1: Navigate to admin login
    console.log('1. Navigating to admin hub...');
    await page.goto('http://localhost:5183/admin');
    await page.waitForTimeout(2000);

    // Step 2: Navigate to directory 
    console.log('2. Opening directory...');
    const directoryButton = page.locator('text=Directory');
    if (await directoryButton.count() > 0) {
      await directoryButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Find and click MGR-001
    console.log('3. Looking for MGR-001 in directory...');
    
    // Look for MGR-001 in the managers table
    const managerRow = page.locator('tr:has-text("MGR-001")');
    if (await managerRow.count() > 0) {
      console.log('✅ Found MGR-001 in directory');
      
      // Click on MGR-001 (look for a link or button in that row)
      const mgr001Link = managerRow.locator('a, button').first();
      if (await mgr001Link.count() > 0) {
        await mgr001Link.click();
        console.log('4. Clicked on MGR-001, waiting for navigation...');
        await page.waitForTimeout(3000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        // Check if we're on the manager hub
        if (currentUrl.includes('MGR-001') && currentUrl.includes('hub')) {
          console.log('✅ Successfully navigated to MGR-001 hub');
          
          // Step 4: Check the welcome message
          console.log('5. Checking welcome message...');
          
          // Look for welcome message
          const welcomeText = await page.locator('text=/Welcome.*MGR-\d+/').first().textContent().catch(() => null);
          if (welcomeText) {
            console.log('Welcome message found:', welcomeText);
            
            if (welcomeText.includes('MGR-001') && welcomeText.includes('Maria')) {
              console.log('✅ SUCCESS: Correct user data displayed!');
            } else if (welcomeText.includes('MGR-002') || welcomeText.includes('Manager Demo')) {
              console.log('❌ ISSUE: Still showing wrong data:', welcomeText);
              console.log('Expected: Welcome, Maria (MGR-001)!');
            } else {
              console.log('⚠️ UNKNOWN: Unexpected welcome format:', welcomeText);
            }
          } else {
            console.log('❌ Welcome message not found');
          }
          
          // Check for any console errors
          page.on('console', msg => {
            if (msg.type() === 'error') {
              console.log('🚨 Browser console error:', msg.text());
            } else if (msg.type() === 'log' && msg.text().includes('useManagerData')) {
              console.log('🔍 Manager data debug:', msg.text());
            }
          });
          
        } else {
          console.log('❌ Wrong URL after clicking MGR-001:', currentUrl);
        }
      } else {
        console.log('❌ No clickable link found for MGR-001');
      }
    } else {
      console.log('❌ MGR-001 not found in directory');
      
      // Debug: show what managers are listed
      const allRows = await page.locator('tbody tr').count();
      console.log(`Found ${allRows} rows in directory`);
      
      for (let i = 0; i < Math.min(allRows, 5); i++) {
        const rowText = await page.locator('tbody tr').nth(i).textContent();
        console.log(`Row ${i}:`, rowText);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  await page.waitForTimeout(5000); // Keep browser open to inspect
  await browser.close();
})();