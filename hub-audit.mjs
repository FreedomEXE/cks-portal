import { chromium } from 'playwright';
import fs from 'fs';

const roles = [
  { code: 'MGR', name: 'manager', displayName: 'Manager Hub' },
  { code: 'CON', name: 'contractor', displayName: 'Contractor Hub' },
  { code: 'CUS', name: 'customer', displayName: 'Customer Hub' },
  { code: 'CTR', name: 'center', displayName: 'Center Hub' },
  { code: 'CRW', name: 'crew', displayName: 'Crew Hub' },
  { code: 'WAR', name: 'warehouse', displayName: 'Warehouse Hub' }
];
const baseUrl = 'http://localhost:3012';

async function auditHub(roleObj) {
  console.log(`\n🔍 Auditing ${roleObj.displayName}...`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to the role hub - check if it uses routing like /hub/manager or query params
    await page.goto(`${baseUrl}/hub/${roleObj.name}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Give it time to load
    
    // Get the page title and main content
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Try to find tabs or navigation elements (modern React tabs)
    const tabs = await page.$$eval('[role="tab"], [data-state="active"], [data-state="inactive"], button[data-tab], .tabs-list button', 
      elements => elements.map(el => ({
        text: el.textContent?.trim(),
        href: el.getAttribute('href'),
        className: el.className,
        id: el.id,
        dataState: el.getAttribute('data-state')
      }))
    ).catch(() => []);
    
    // Alternative: look for any clickable navigation elements
    const navElements = await page.$$eval('a, button', 
      elements => elements
        .map(el => ({
          text: el.textContent?.trim(),
          href: el.getAttribute('href'),
          className: el.className,
          id: el.id
        }))
        .filter(el => el.text && el.text.length > 0 && el.text.length < 50)
    ).catch(() => []);
    
    // Get main content areas
    const contentAreas = await page.$$eval('[class*="content"], [class*="main"], [class*="dashboard"], main, .container', 
      elements => elements.map(el => ({
        className: el.className,
        id: el.id,
        textContent: el.textContent?.trim().substring(0, 200)
      }))
    ).catch(() => []);
    
    // Take a screenshot
    await page.screenshot({ path: `C:\\Users\\rizz5\\OneDrive\\Desktop\\CKS\\cks-portal\\${roleObj.name}-hub-screenshot.png`, fullPage: true });
    
    // Get current URL to see if there are route changes
    const currentUrl = page.url();
    
    const auditData = {
      role: roleObj.name,
      displayName: roleObj.displayName,
      code: roleObj.code,
      title,
      url: currentUrl,
      tabs: tabs.filter(tab => tab.text && tab.text.length > 0),
      navigation: navElements.filter(nav => nav.text && nav.text.length > 0).slice(0, 20), // Top 20 nav elements
      contentAreas: contentAreas.slice(0, 10), // Top 10 content areas
      timestamp: new Date().toISOString()
    };
    
    console.log(`Found ${tabs.length} tabs and ${navElements.length} navigation elements`);
    
    // If we found tabs, try clicking on them to see different content
    if (tabs.length > 0) {
      console.log(`Tabs found: ${tabs.map(t => t.text).join(', ')}`);
      
      // Try clicking each tab to see content
      for (const tab of tabs.slice(0, 5)) { // Limit to first 5 tabs
        try {
          if (tab.text) {
            console.log(`  Checking tab: ${tab.text}`);
            await page.click(`text="${tab.text}"`, { timeout: 5000 });
            await page.waitForTimeout(1000);
            
            // Get content for this tab
            const tabContent = await page.$$eval('[class*="content"], [class*="main"], main', 
              elements => elements.map(el => el.textContent?.trim().substring(0, 100))
            ).catch(() => []);
            
            auditData[`tab_${tab.text.toLowerCase().replace(/\s+/g, '_')}`] = tabContent;
          }
        } catch (error) {
          console.log(`    Could not click tab ${tab.text}: ${error.message}`);
        }
      }
    }
    
    return auditData;
    
  } catch (error) {
    console.error(`Error auditing ${roleObj.displayName}:`, error);
    return {
      role: roleObj.name,
      displayName: roleObj.displayName,
      code: roleObj.code,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

async function auditAllHubs() {
  console.log('🚀 Starting hub audit process...');
  console.log('📍 Target URL:', baseUrl);
  
  const allAuditData = {};
  
  for (const roleObj of roles) {
    const auditData = await auditHub(roleObj);
    allAuditData[roleObj.name] = auditData;
    
    // Write individual role data
    fs.writeFileSync(
      `C:\\Users\\rizz5\\OneDrive\\Desktop\\CKS\\cks-portal\\${roleObj.name}-hub-audit.json`,
      JSON.stringify(auditData, null, 2)
    );
    
    console.log(`✅ ${roleObj.displayName} audit completed`);
    
    // Wait between hubs to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Write combined audit data
  fs.writeFileSync(
    'C:\\Users\\rizz5\\OneDrive\\Desktop\\CKS\\cks-portal\\all-hubs-audit.json',
    JSON.stringify(allAuditData, null, 2)
  );
  
  console.log('\n🎉 Hub audit completed successfully!');
  console.log('📁 Files created:');
  roles.forEach(roleObj => {
    console.log(`  - ${roleObj.name}-hub-audit.json`);
    console.log(`  - ${roleObj.name}-hub-screenshot.png`);
  });
  console.log('  - all-hubs-audit.json');
}

auditAllHubs().catch(console.error);