const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🎯 === TESTING CENTER HUB AUTHENTICATION ===');
    
    // Navigate to login
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(2000);
    
    // Fill login form
    await page.fill('input[name="identifier"]', 'cen-000');
    await page.fill('input[name="password"]', 'CksDemo!2025');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('✓ Post-login URL:', currentUrl);
    
    // Check for error messages
    const errorElements = await page.$$('.cl-formFieldErrorText, .cl-identityPreview__error, [role="alert"]');
    if (errorElements.length > 0) {
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log('❌ Authentication error:', errorText);
      }
    }
    
    // Check if we're on the hub page or still on login
    if (currentUrl.includes('/hub')) {
      console.log('✅ Successfully reached hub page');
      
      // Check for content
      const title = await page.textContent('h1, h2, .hub-title, [data-testid="hub-title"]').catch(() => null);
      console.log('✓ Hub title:', title);
      
      // Check for buttons
      const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(Boolean));
      console.log('✓ Buttons found:', buttons.length, buttons);
      
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page - authentication failed');
      
      // Check browser console for errors
      page.on('console', msg => console.log('Browser console:', msg.text()));
      
    } else {
      console.log('❓ Redirected to unexpected page:', currentUrl);
    }
    
    await page.waitForTimeout(3000); // Keep browser open to see result
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();