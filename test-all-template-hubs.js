// Test All Template Hubs (Not Real User Hubs)
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5183';
const TEMPLATE_CREDENTIALS = [
  { role: 'Manager', username: 'mgr-000', password: 'CksDemo!2025', color: 'blue' },
  { role: 'Contractor', username: 'con-000', password: 'CksDemo!2025', color: 'green' },
  { role: 'Customer', username: 'cus-000', password: 'CksDemo!2025', color: 'yellow' },
  { role: 'Center', username: 'cen-000', password: 'CksDemo!2025', color: 'orange' },
  { role: 'Crew', username: 'crw-000', password: 'CksDemo!2025', color: 'red' }
];

async function testTemplateHub(credentials) {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log(`\n🎯 === TESTING ${credentials.role.toUpperCase()} TEMPLATE HUB ===`);
    
    // Navigate and login
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="text"], input[placeholder*="username" i]', credentials.username);
    await page.fill('input[type="password"]', credentials.password);
    
    const loginBtn = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("sign")').first();
    await loginBtn.click();
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('✓ Post-login URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('❌ ISSUE: Authentication failed - still on login page');
      await page.screenshot({ path: `${credentials.username}-auth-failed.png` });
      return { role: credentials.role, status: 'auth_failed', issues: ['Authentication failed'] };
    }
    
    // Analyze template hub content
    const pageContent = await page.textContent('body');
    const issues = [];
    const features = [];
    
    // Check for errors
    const hasErrors = pageContent.toLowerCase().includes('error') || 
                     pageContent.toLowerCase().includes('failed') ||
                     pageContent.toLowerCase().includes('undefined') ||
                     pageContent.toLowerCase().includes('no user id');
    
    if (hasErrors) {
      // Find specific error messages
      const errorLines = pageContent.split('\n').filter(line => 
        line.toLowerCase().includes('error') || 
        line.toLowerCase().includes('failed') ||
        line.toLowerCase().includes('no user id')
      );
      issues.push(`Errors found: ${errorLines.join(', ')}`);
    }
    
    // Check for proper template content
    const hasRoleContent = pageContent.toLowerCase().includes(credentials.role.toLowerCase());
    const hasHubTitle = pageContent.includes('Hub');
    
    if (hasRoleContent) features.push('Role-specific content visible');
    if (hasHubTitle) features.push('Hub title displayed');
    
    // Check navigation/buttons
    const buttons = await page.locator('button').all();
    const buttonTexts = [];
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.trim().length > 0) {
        buttonTexts.push(text.trim());
      }
    }
    
    console.log('✓ Buttons found:', buttonTexts.length, buttonTexts.slice(0, 8));
    
    if (buttonTexts.length > 1) {
      features.push(`${buttonTexts.length} interactive elements`);
    } else if (buttonTexts.length === 1 && buttonTexts[0].includes('Log out')) {
      issues.push('Only logout button visible - missing template content');
    }
    
    // Check for template data displays
    const hasTemplateData = pageContent.includes('Template') || 
                           pageContent.includes('Example') ||
                           pageContent.includes('Sample') ||
                           pageContent.includes('Demo');
    
    if (hasTemplateData) features.push('Template/demo data visible');
    
    // Test logout
    const logoutBtn = await page.locator('button:has-text("Log out"), button:has-text("logout")').first();
    let logoutWorks = false;
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      const postLogoutUrl = page.url();
      logoutWorks = postLogoutUrl.includes('/login');
      if (!logoutWorks) issues.push('Logout button not working');
    } else {
      issues.push('No logout button found');
    }
    
    // Take screenshot
    await page.screenshot({ path: `${credentials.username}-template-hub.png`, fullPage: true });
    
    // Determine overall status
    let status = 'working';
    if (hasErrors) status = 'has_errors';
    if (issues.length > 2) status = 'broken';
    
    console.log('✅ Features:', features.join(', '));
    if (issues.length > 0) {
      console.log('❌ Issues:', issues.join(', '));
    }
    console.log('📸 Screenshot:', `${credentials.username}-template-hub.png`);
    
    return {
      role: credentials.role,
      username: credentials.username,
      status: status,
      features: features,
      issues: issues,
      logoutWorks: logoutWorks,
      screenshot: `${credentials.username}-template-hub.png`
    };
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    await page.screenshot({ path: `${credentials.username}-error.png` });
    return {
      role: credentials.role,
      username: credentials.username,
      status: 'error',
      issues: [error.message]
    };
  } finally {
    await browser.close();
  }
}

async function runAllTemplateTests() {
  console.log('\n🧪 TESTING ALL TEMPLATE HUBS FOR STATIC CONTENT DISPLAY\n');
  console.log('Note: These are template hubs (crw-000, mgr-000, etc.) - they should show');
  console.log('static template content, NOT try to fetch real user data.\n');
  
  const results = [];
  
  for (const credentials of TEMPLATE_CREDENTIALS) {
    const result = await testTemplateHub(credentials);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause between tests
  }
  
  // Summary report
  console.log('\n📊 === TEMPLATE HUB TEST SUMMARY ===\n');
  
  results.forEach(result => {
    console.log(`**${result.role} Hub (${result.username})**:`);
    console.log(`   Status: ${result.status}`);
    if (result.features && result.features.length > 0) {
      console.log(`   ✅ Working: ${result.features.join(', ')}`);
    }
    if (result.issues && result.issues.length > 0) {
      console.log(`   ❌ Issues: ${result.issues.join(', ')}`);
    }
    console.log(`   📸 Screenshot: ${result.screenshot || 'Not captured'}`);
    console.log('');
  });
  
  const workingHubs = results.filter(r => r.status === 'working').length;
  const brokenHubs = results.filter(r => r.status !== 'working').length;
  
  console.log(`\n🎯 OVERALL: ${workingHubs} working, ${brokenHubs} need fixes`);
  console.log('\nNext step: Fix template hubs to show static content instead of');
  console.log('trying to fetch user data (which causes "No user ID" errors).\n');
}

runAllTemplateTests().catch(console.error);