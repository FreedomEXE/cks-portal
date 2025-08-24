const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'http://localhost:5173';
const ADMIN_CREDENTIALS = { username: 'Freedom_exe', password: 'Fr33dom123!' };

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `ui-review-${name}.png`, 
    fullPage: true 
  });
}

// Helper function to wait for page load
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

test.describe('CKS Portal UI Review - All Hubs', () => {
  
  test('1. Login Page UI Review', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    
    console.log('\n=== LOGIN PAGE UI REVIEW ===');
    
    // Check login page elements
    const title = await page.textContent('h1');
    console.log('✓ Page Title:', title);
    
    // Look for logo
    const logoExists = await page.locator('img').count() > 0;
    console.log('✓ Logo Present:', logoExists);
    
    // Check form elements
    const usernameField = await page.locator('input[type="text"], input[placeholder*="username" i]').count() > 0;
    const passwordField = await page.locator('input[type="password"]').count() > 0;
    console.log('✓ Username Field:', usernameField);
    console.log('✓ Password Field:', passwordField);
    
    await takeScreenshot(page, 'login-page');
    console.log('✓ Screenshot saved: ui-review-login-page.png\n');
  });

  test('2. Admin Hub UI Review', async ({ page }) => {
    console.log('\n=== ADMIN HUB UI REVIEW ===');
    
    // Login as admin
    await page.goto(BASE_URL);
    await page.fill('input[type="text"], input[placeholder*="username" i]', ADMIN_CREDENTIALS.username);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await waitForPageLoad(page);
    
    // Should be on admin hub
    const url = page.url();
    console.log('✓ Current URL:', url);
    
    // Check welcome message
    const welcomeText = await page.textContent('body');
    const hasWelcome = welcomeText.includes('Freedom_exe') || welcomeText.includes('Admin');
    console.log('✓ Welcome Message:', hasWelcome);
    
    // Check navigation tabs
    const navButtons = await page.locator('button').all();
    const navTexts = [];
    for (const btn of navButtons) {
      const text = await btn.textContent();
      if (text && text.length > 2 && text.length < 20) {
        navTexts.push(text.trim());
      }
    }
    console.log('✓ Navigation Buttons:', navTexts);
    
    await takeScreenshot(page, 'admin-hub-dashboard');
    
    // Test Directory section
    const directoryBtn = await page.locator('button:has-text("Directory"), button:has-text("directory")').first();
    if (await directoryBtn.count() > 0) {
      await directoryBtn.click();
      await waitForPageLoad(page);
      
      // Check directory tabs
      const directoryTabs = await page.locator('button').all();
      const tabTexts = [];
      for (const tab of directoryTabs) {
        const text = await tab.textContent();
        if (text && (text.includes('Contractor') || text.includes('Manager') || text.includes('Customer') || text.includes('Center') || text.includes('Crew'))) {
          tabTexts.push(text.trim());
        }
      }
      console.log('✓ Directory Tabs:', tabTexts);
      
      await takeScreenshot(page, 'admin-hub-directory');
    }
    
    // Test Create section
    const createBtn = await page.locator('button:has-text("Create"), button:has-text("create")').first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await waitForPageLoad(page);
      await takeScreenshot(page, 'admin-hub-create');
    }
    
    console.log('✓ Admin Hub Screenshots Complete\n');
  });

  test('3. Test All Hub Types UI (Mock Users)', async ({ page }) => {
    console.log('\n=== ALL HUBS UI REVIEW ===');
    
    // We'll need to check what hub URLs are available
    const hubTypes = [
      { name: 'Manager', url: '/mgr-001/hub', color: 'blue' },
      { name: 'Contractor', url: '/con-001/hub', color: 'green' },
      { name: 'Customer', url: '/cus-001/hub', color: 'yellow' },
      { name: 'Center', url: '/cen-001/hub', color: 'orange' },
      { name: 'Crew', url: '/crw-001/hub', color: 'red' }
    ];
    
    for (const hub of hubTypes) {
      console.log(`--- Testing ${hub.name} Hub ---`);
      
      // Try to access hub directly (might not work without auth)
      await page.goto(`${BASE_URL}${hub.url}`);
      await waitForPageLoad(page);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log(`✗ ${hub.name} Hub: Redirected to login (expected without auth)`);
        continue;
      }
      
      // Check if we're on the hub
      const bodyText = await page.textContent('body');
      const hasHubContent = bodyText.includes(hub.name) || bodyText.includes('Hub');
      console.log(`✓ ${hub.name} Hub Loaded:`, hasHubContent);
      
      // Look for hub-specific color theming
      const styles = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colors = [];
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          const bgColor = style.backgroundColor;
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            colors.push(bgColor);
          }
        }
        return colors.slice(0, 5); // First 5 colors found
      });
      console.log(`✓ ${hub.name} Hub Colors:`, styles);
      
      // Check for logout button
      const logoutBtn = await page.locator('button:has-text("Log out"), button:has-text("logout")').count();
      console.log(`✓ ${hub.name} Hub Logout Button:`, logoutBtn > 0);
      
      await takeScreenshot(page, `${hub.name.toLowerCase()}-hub`);
      console.log(`✓ Screenshot: ui-review-${hub.name.toLowerCase()}-hub.png`);
    }
  });

  test('4. Responsive Design Check', async ({ page }) => {
    console.log('\n=== RESPONSIVE DESIGN CHECK ===');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Standard' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    // Login first
    await page.goto(BASE_URL);
    await page.fill('input[type="text"], input[placeholder*="username" i]', ADMIN_CREDENTIALS.username);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await waitForPageLoad(page);
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForPageLoad(page);
      
      console.log(`--- ${viewport.name} (${viewport.width}x${viewport.height}) ---`);
      
      // Check if content is visible and properly sized
      const bodyRect = await page.locator('body').boundingBox();
      const contentFits = bodyRect.width <= viewport.width;
      console.log(`✓ Content Fits Viewport:`, contentFits);
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`✓ No Horizontal Scroll:`, !hasHorizontalScroll);
      
      await takeScreenshot(page, `responsive-${viewport.name.toLowerCase().replace(' ', '-')}`);
    }
    
    console.log('✓ Responsive Design Screenshots Complete\n');
  });

  test('5. UI/UX Assessment Summary', async ({ page }) => {
    console.log('\n=== UI/UX ASSESSMENT SUMMARY ===');
    
    // Login to admin for final assessment
    await page.goto(BASE_URL);
    await page.fill('input[type="text"], input[placeholder*="username" i]', ADMIN_CREDENTIALS.username);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await waitForPageLoad(page);
    
    // Performance check
    const performanceEntries = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('navigation');
      return perfEntries.length > 0 ? {
        loadTime: Math.round(perfEntries[0].loadEventEnd - perfEntries[0].loadEventStart),
        domContentLoaded: Math.round(perfEntries[0].domContentLoadedEventEnd - perfEntries[0].domContentLoadedEventStart)
      } : null;
    });
    
    if (performanceEntries) {
      console.log('✓ Page Load Time:', performanceEntries.loadTime, 'ms');
      console.log('✓ DOM Content Loaded:', performanceEntries.domContentLoaded, 'ms');
    }
    
    // Accessibility quick check
    const hasProperHeadings = await page.locator('h1, h2, h3').count() > 0;
    const hasAltTexts = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const imagesWithAlt = document.querySelectorAll('img[alt]');
      return images.length === 0 || imagesWithAlt.length === images.length;
    });
    const hasFocusableElements = await page.locator('button, input, a').count() > 0;
    
    console.log('✓ Proper Headings:', hasProperHeadings);
    console.log('✓ Images Have Alt Text:', hasAltTexts);
    console.log('✓ Focusable Elements:', hasFocusableElements);
    
    // Color contrast check (basic)
    const hasGoodContrast = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let darkBackgrounds = 0;
      let lightText = 0;
      
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        
        if (bgColor.includes('0, 0, 0') || bgColor.includes('rgb(0, 0, 0)')) darkBackgrounds++;
        if (textColor.includes('255, 255, 255') || textColor.includes('rgb(255, 255, 255)')) lightText++;
      }
      
      return darkBackgrounds > 0 && lightText > 0;
    });
    console.log('✓ Good Color Contrast:', hasGoodContrast);
    
    console.log('\n=== FINAL UI REVIEW COMPLETE ===');
    console.log('All screenshots saved with prefix: ui-review-*');
    console.log('Ready for UI/UX evaluation and feedback.\n');
  });

});