import { test, expect } from '@playwright/test';

test('Capture console logs when admin hub fails', async ({ page }) => {
  const consoleLogs = [];
  
  // Capture all console messages
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  await page.goto('http://localhost:3005');
  
  // Wait for page to load
  await page.waitForSelector('button:has-text("Admin Hub Test")', { timeout: 10000 });
  
  console.log('Before clicking admin hub - console logs:', consoleLogs.length);
  
  // Click admin hub button
  await page.click('button:has-text("Admin Hub Test")');
  
  // Wait for the error to appear
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'admin-console-debug.png', fullPage: true });
  
  // Print all console logs
  console.log('=== CONSOLE LOGS ===');
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.text}`);
    if (log.location && (log.location.url || log.location.lineNumber)) {
      console.log(`   Location: ${log.location.url}:${log.location.lineNumber}:${log.location.columnNumber}`);
    }
  });
  console.log('=== END LOGS ===');
});