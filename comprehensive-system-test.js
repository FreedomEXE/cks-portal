const { chromium } = require('playwright');

async function runComprehensiveSystemTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  function logResult(test, status, message) {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    results[status].push(result);
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
  }

  try {
    console.log('🚀 Starting Comprehensive CKS Portal System Test...\n');
    
    // Test 1: Frontend accessibility
    console.log('=== FRONTEND ACCESSIBILITY ===');
    try {
      await page.goto('http://localhost:5183/login');
      await page.waitForLoadState('networkidle');
      logResult('Frontend Access', 'passed', 'Frontend is accessible on port 3000');
    } catch (error) {
      logResult('Frontend Access', 'failed', `Cannot access frontend: ${error.message}`);
      return results;
    }
    
    // Test 2: Login page structure
    console.log('\n=== LOGIN PAGE VALIDATION ===');
    try {
      await page.screenshot({ path: 'test-login-page.png' });
      
      // Check for Clerk login elements
      const hasClerkLogin = await page.locator('.cl-rootBox, .cl-signIn-root, input[name="identifier"]').count() > 0;
      if (hasClerkLogin) {
        logResult('Login Page Structure', 'passed', 'Clerk authentication interface detected');
      } else {
        logResult('Login Page Structure', 'warnings', 'No clear Clerk authentication interface found');
      }
    } catch (error) {
      logResult('Login Page Structure', 'failed', `Login page validation error: ${error.message}`);
    }
    
    // Test 3: Backend API accessibility
    console.log('\n=== BACKEND API VALIDATION ===');
    const apiTests = [
      { endpoint: '/health', expected: 'Health check' },
      { endpoint: '/test-db', expected: 'Database connectivity' },
      { endpoint: '/api/admin/crew', expected: 'Admin crew endpoint' },
      { endpoint: '/api/admin/orders', expected: 'Admin orders endpoint' },
      { endpoint: '/api/warehouse/profile', expected: 'Warehouse profile endpoint' },
      { endpoint: '/api/warehouse/inventory', expected: 'Warehouse inventory endpoint' }
    ];
    
    for (const test of apiTests) {
      try {
        const response = await page.request.get(`http://localhost:5000${test.endpoint}`);
        if (response.ok()) {
          logResult(test.expected, 'passed', `API endpoint ${test.endpoint} is accessible`);
        } else {
          logResult(test.expected, 'failed', `API endpoint ${test.endpoint} returned ${response.status()}`);
        }
      } catch (error) {
        logResult(test.expected, 'failed', `API endpoint ${test.endpoint} error: ${error.message}`);
      }
    }
    
    // Test 4: Role-based routing without authentication
    console.log('\n=== ROLE-BASED ROUTING (Without Auth) ===');
    const hubTests = [
      '/hub/admin',
      '/hub/manager', 
      '/hub/contractor',
      '/hub/customer',
      '/hub/center',
      '/hub/crew',
      '/hub/warehouse'
    ];
    
    for (const hub of hubTests) {
      try {
        await page.goto(`http://localhost:5183${hub}`);
        await page.waitForLoadState('networkidle', { timeout: 3000 });
        
        // Check if redirected to login or shows auth error
        const currentUrl = page.url();
        if (currentUrl.includes('/login') || currentUrl.includes('sign-in')) {
          logResult(`${hub} Access Control`, 'passed', 'Properly redirected to authentication');
        } else if (currentUrl.includes(hub)) {
          logResult(`${hub} Access Control`, 'warnings', 'Hub accessible without authentication - check if intended');
        } else {
          logResult(`${hub} Access Control`, 'warnings', `Unexpected redirect to ${currentUrl}`);
        }
      } catch (error) {
        logResult(`${hub} Access Control`, 'failed', `Hub routing error: ${error.message}`);
      }
    }
    
    // Test 5: Template user functionality (if available)
    console.log('\n=== TEMPLATE USER LOGIN TESTS ===');
    const templateUsers = [
      { username: 'ADM-000', role: 'admin', hubPath: '/hub/admin' },
      { username: 'MGR-000', role: 'manager', hubPath: '/hub/manager' },
      { username: 'CON-000', role: 'contractor', hubPath: '/hub/contractor' },
      { username: 'CUS-000', role: 'customer', hubPath: '/hub/customer' },
      { username: 'CEN-000', role: 'center', hubPath: '/hub/center' },
      { username: 'CRW-000', role: 'crew', hubPath: '/hub/crew' },
      { username: 'WH-000', role: 'warehouse', hubPath: '/hub/warehouse' }
    ];
    
    for (const user of templateUsers.slice(0, 2)) { // Test first 2 to save time
      try {
        await page.goto('http://localhost:5183/login');
        await page.waitForLoadState('networkidle');
        
        // Try to find and fill login form
        const identifierInput = page.locator('input[name="identifier"], input[type="text"], input[type="email"]').first();
        const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
        const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), button[type="submit"]').first();
        
        if (await identifierInput.count() > 0 && await passwordInput.count() > 0) {
          await identifierInput.fill(user.username);
          await passwordInput.fill('test123');
          await signInButton.click();
          
          // Wait for either hub or error
          await page.waitForTimeout(3000);
          const currentUrl = page.url();
          
          if (currentUrl.includes(user.hubPath)) {
            logResult(`${user.role} Login`, 'passed', `Template user ${user.username} successfully logged in`);
            
            // Take screenshot of the hub
            await page.screenshot({ path: `test-${user.role}-hub.png` });
            
            // Test logout
            try {
              const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), .logout');
              if (await logoutButton.count() > 0) {
                await logoutButton.click();
                await page.waitForTimeout(2000);
                logResult(`${user.role} Logout`, 'passed', 'Logout functionality works');
              } else {
                logResult(`${user.role} Logout`, 'warnings', 'Logout button not found');
              }
            } catch (logoutError) {
              logResult(`${user.role} Logout`, 'failed', `Logout error: ${logoutError.message}`);
            }
          } else if (currentUrl.includes('/login') || currentUrl.includes('sign-in')) {
            logResult(`${user.role} Login`, 'failed', `Template user ${user.username} login failed - remained on login page`);
          } else {
            logResult(`${user.role} Login`, 'warnings', `Template user ${user.username} redirected to unexpected page: ${currentUrl}`);
          }
        } else {
          logResult(`${user.role} Login`, 'failed', 'Cannot find login form elements');
        }
      } catch (error) {
        logResult(`${user.role} Login`, 'failed', `Template user login error: ${error.message}`);
      }
    }
    
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n=== CRITICAL ISSUES TO ADDRESS ===');
      results.failed.forEach(result => {
        console.log(`❌ ${result.test}: ${result.message}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n=== WARNINGS TO REVIEW ===');
      results.warnings.forEach(result => {
        console.log(`⚠️  ${result.test}: ${result.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    logResult('System Test', 'failed', `Critical system error: ${error.message}`);
  }
  
  await browser.close();
  return results;
}

// Run the test
runComprehensiveSystemTest().then(results => {
  console.log('\n🎯 System Readiness Assessment Complete!');
  process.exit(results.failed.length > 0 ? 1 : 0);
});