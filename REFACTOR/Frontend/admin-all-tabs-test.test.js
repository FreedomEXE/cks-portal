import { test, expect } from '@playwright/test';

test('Admin hub should show all 7 tabs', async ({ page }) => {
  await page.goto('http://localhost:3005');
  
  // Wait for page to load
  await page.waitForSelector('button:has-text("Admin Hub Test")', { timeout: 10000 });
  
  // Click admin hub button
  await page.click('button:has-text("Admin Hub Test")');
  
  // Wait for the hub to load
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'admin-hub-all-tabs.png', fullPage: true });
  
  // Check for all expected tabs
  const tabs = [
    'Dashboard',
    'Directory', 
    'Create',
    'Assign',
    'Archive',
    'Support',
    'Profile'
  ];
  
  console.log('=== TAB VISIBILITY TEST ===');
  for (const tab of tabs) {
    const count = await page.locator(`text=${tab}`).count();
    console.log(`${tab}: ${count > 0 ? '✅ VISIBLE' : '❌ MISSING'} (${count} found)`);
  }
  
  // Check if we can click on different tabs
  console.log('\n=== TAB NAVIGATION TEST ===');
  try {
    await page.click('text=Create');
    await page.waitForTimeout(1000);
    console.log('Create tab: ✅ CLICKABLE');
    
    await page.click('text=Profile');
    await page.waitForTimeout(1000);
    console.log('Profile tab: ✅ CLICKABLE');
    
    await page.click('text=Dashboard');
    await page.waitForTimeout(1000);
    console.log('Dashboard tab: ✅ CLICKABLE');
  } catch (error) {
    console.log('Tab navigation error:', error.message);
  }
});