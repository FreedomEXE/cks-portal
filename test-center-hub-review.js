const { chromium } = require('playwright');

async function reviewCenterHub() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Reviewing Center Hub dashboard for UI issues...\n');
    
    // Login to center hub
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'ctr-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'center-hub-current-dashboard.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: center-hub-current-dashboard.png');
    
    // Check header positioning
    const hubTitle = await page.locator('h1:has-text("Center Hub")').first();
    if (await hubTitle.isVisible()) {
      const titleBox = await hubTitle.boundingBox();
      console.log(`📍 "Center Hub" title position: ${titleBox ? 'x: ' + titleBox.x + ', width: ' + titleBox.width : 'not found'}`);
    }
    
    // Check for redundant buttons
    const bottomButtons = await page.locator('button').allTextContents();
    console.log('🔲 All buttons found:', bottomButtons.filter(text => text.includes('Management') || text.includes('Schedules') || text.includes('Services') || text.includes('Reports')));
    
    // Check dashboard sections
    const dashboardSections = await page.evaluate(() => {
      const sections = [];
      document.querySelectorAll('h2, h3').forEach(heading => {
        if (heading.textContent.includes('Operational') || heading.textContent.includes('Dashboard') || heading.textContent.includes('Metrics')) {
          sections.push(heading.textContent.trim());
        }
      });
      return sections;
    });
    
    console.log('📊 Dashboard sections found:', dashboardSections);
    
    console.log('\n✅ Center Hub review complete - screenshot captured for analysis');
    
  } catch (error) {
    console.error('❌ Error reviewing center hub:', error);
  } finally {
    // Keep browser open for 5 seconds to see the current state
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

reviewCenterHub().catch(console.error);