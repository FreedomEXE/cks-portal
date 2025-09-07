/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * test-direct-manager-hub.js
 * 
 * Direct test of Manager Hub URL to check welcome message
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing direct Manager Hub URL...');

    // Navigate directly to the Manager Hub for MGR-001
    console.log('1. Navigating directly to /MGR-001/hub...');
    await page.goto('http://localhost:5183/MGR-001/hub');
    await page.waitForTimeout(3000);

    // Wait for the page to load and check the welcome message
    console.log('2. Checking for welcome message...');
    
    // Check current URL to confirm we're on the right page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Look for welcome message
    try {
      const welcomeText = await page.locator('text=/Welcome.*MGR-\\d+/').first().textContent({ timeout: 5000 });
      console.log('Welcome message found:', welcomeText);
      
      if (welcomeText.includes('MGR-001') && welcomeText.includes('Maria')) {
        console.log('✅ SUCCESS: Correct user data displayed!');
        console.log('   Expected: Welcome, Maria (MGR-001)');
        console.log('   Actual:  ', welcomeText);
      } else if (welcomeText.includes('MGR-002') || welcomeText.includes('Manager Demo')) {
        console.log('❌ ISSUE: Still showing wrong data:');
        console.log('   Expected: Welcome, Maria (MGR-001)');
        console.log('   Actual:  ', welcomeText);
      } else {
        console.log('⚠️ UNKNOWN: Unexpected welcome format:', welcomeText);
      }
    } catch (error) {
      console.log('❌ Welcome message not found or timeout:', error.message);
      
      // Try to find any text on the page to debug
      try {
        const pageContent = await page.textContent('body');
        console.log('Page content preview:', pageContent.substring(0, 500));
      } catch (e) {
        console.log('Could not read page content');
      }
    }

    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Browser console error:', msg.text());
      } else if (msg.type() === 'log' && msg.text().includes('useManagerData')) {
        console.log('🔍 Manager data debug:', msg.text());
      }
    });

    await page.waitForTimeout(5000); // Keep browser open to inspect

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  await browser.close();
})();