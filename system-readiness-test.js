const { chromium } = require('playwright');

async function systemReadinessTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const results = {
    passed: [],
    failed: [],
    warnings: [],
    criticalIssues: [],
    readinessScore: 0
  };

  function logResult(test, status, message, critical = false) {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    results[status].push(result);
    if (critical) results.criticalIssues.push(result);
    
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
  }

  try {
    console.log('🚀 CKS Portal System Readiness Assessment\n');
    
    // Test 1: Admin Login and Core Functions
    console.log('=== ADMIN AUTHENTICATION & CORE FUNCTIONS ===');
    try {
      await page.goto('http://localhost:5183/login');
      await page.waitForLoadState('networkidle');
      
      // Look for Clerk login form
      await page.waitForSelector('input', { timeout: 10000 });
      
      const identifierInput = page.locator('input[name="identifier"], input[type="email"], input[type="text"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button:has-text("Sign in"), button:has-text("Continue"), button[type="submit"]').first();
      
      if (await identifierInput.count() > 0 && await passwordInput.count() > 0) {
        await identifierInput.fill('freedom_exe');
        await passwordInput.fill('Fr33dom123!');
        await submitButton.click();
        
        await page.waitForTimeout(5000);
        const currentUrl = page.url();
        
        if (currentUrl.includes('/hub/admin')) {
          logResult('Admin Login', 'passed', 'Admin successfully logged into admin hub');
          
          // Test Admin Dashboard
          await page.screenshot({ path: 'readiness-admin-dashboard.png' });
          const dashboardContent = await page.textContent('body');
          if (dashboardContent.includes('Dashboard') || dashboardContent.includes('Welcome')) {
            logResult('Admin Dashboard', 'passed', 'Admin dashboard loads with content');
          } else {
            logResult('Admin Dashboard', 'failed', 'Admin dashboard appears empty', true);
          }
          
          // Test Admin Directory
          const directoryTab = page.locator('text=Directory, div:has-text("Directory")').first();
          if (await directoryTab.count() > 0) {
            await directoryTab.click();
            await page.waitForTimeout(2000);
            logResult('Admin Directory Access', 'passed', 'Can navigate to Admin Directory');
            
            // Test Orders tab specifically
            const ordersTab = page.locator('text=Orders, div:has-text("Orders")').first();
            if (await ordersTab.count() > 0) {
              await ordersTab.click();
              await page.waitForTimeout(2000);
              logResult('Admin Orders List', 'passed', 'Orders tab accessible in Directory');
            } else {
              logResult('Admin Orders List', 'failed', 'Orders tab not found in Directory', true);
            }
          } else {
            logResult('Admin Directory Access', 'failed', 'Cannot find Directory tab', true);
          }
          
          // Test Admin Create functionality
          const createTab = page.locator('text=Create, div:has-text("Create")').first();
          if (await createTab.count() > 0) {
            await createTab.click();
            await page.waitForTimeout(2000);
            logResult('Admin Create Access', 'passed', 'Can navigate to Admin Create');
          } else {
            logResult('Admin Create Access', 'failed', 'Cannot find Create tab', true);
          }
          
          // Test Admin Assign functionality
          const assignTab = page.locator('text=Assign, div:has-text("Assign")').first();
          if (await assignTab.count() > 0) {
            await assignTab.click();
            await page.waitForTimeout(2000);
            const assignContent = await page.textContent('body');
            if (assignContent.includes('Assignment') || assignContent.includes('Crew')) {
              logResult('Admin Assign Functionality', 'passed', 'Assign tab loads with crew assignment features');
            } else {
              logResult('Admin Assign Functionality', 'warnings', 'Assign tab exists but content unclear');
            }
          } else {
            logResult('Admin Assign Access', 'failed', 'Cannot find Assign tab', true);
          }
        } else {
          logResult('Admin Login', 'failed', `Admin login failed - redirected to ${currentUrl}`, true);
        }
      } else {
        logResult('Admin Login Form', 'failed', 'Cannot find login form elements', true);
      }
    } catch (error) {
      logResult('Admin Authentication', 'failed', `Admin auth error: ${error.message}`, true);
    }
    
    // Test 2: Template User Logins
    console.log('\n=== TEMPLATE USER AUTHENTICATION ===');
    const templateUsers = [
      { username: 'WH-000', role: 'warehouse', hubPath: '/hub/warehouse' },
      { username: 'CRW-000', role: 'crew', hubPath: '/hub/crew' },
      { username: 'CUS-000', role: 'customer', hubPath: '/hub/customer' }
    ];
    
    for (const user of templateUsers) {
      try {
        await page.goto('http://localhost:5183/login');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const identifierInput = page.locator('input[name="identifier"], input[type="email"], input[type="text"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        const submitButton = page.locator('button:has-text("Sign in"), button:has-text("Continue"), button[type="submit"]').first();
        
        if (await identifierInput.count() > 0 && await passwordInput.count() > 0) {
          await identifierInput.fill(user.username);
          await passwordInput.fill('CksDemo!2025');
          await submitButton.click();
          
          await page.waitForTimeout(5000);
          const currentUrl = page.url();
          
          if (currentUrl.includes(user.hubPath)) {
            logResult(`${user.role} Login`, 'passed', `${user.username} successfully logged into ${user.role} hub`);
            
            // Take screenshot of hub
            await page.screenshot({ path: `readiness-${user.role}-hub.png` });
            
            // Check for basic hub content
            const hubContent = await page.textContent('body');
            if (hubContent.includes('Dashboard') || hubContent.includes('Profile') || hubContent.includes('Welcome')) {
              logResult(`${user.role} Hub Content`, 'passed', `${user.role} hub loads with expected content`);
            } else {
              logResult(`${user.role} Hub Content`, 'warnings', `${user.role} hub content unclear`);
            }
            
          } else if (currentUrl.includes('/login')) {
            logResult(`${user.role} Login`, 'failed', `${user.username} login failed - remained on login page`);
          } else {
            logResult(`${user.role} Login`, 'warnings', `${user.username} redirected to unexpected page: ${currentUrl}`);
          }
        }
      } catch (error) {
        logResult(`${user.role} Authentication`, 'failed', `${user.username} auth error: ${error.message}`);
      }
    }
    
    // Test 3: Backend API Health
    console.log('\n=== BACKEND API HEALTH CHECK ===');
    const criticalAPIs = [
      { endpoint: '/health', name: 'Health Check' },
      { endpoint: '/test-db', name: 'Database Connection' },
      { endpoint: '/api/admin/crew', name: 'Admin Crew API' },
      { endpoint: '/api/admin/orders', name: 'Admin Orders API' },
      { endpoint: '/api/warehouse/profile', name: 'Warehouse Profile API' },
      { endpoint: '/api/warehouse/inventory', name: 'Warehouse Inventory API' }
    ];
    
    for (const api of criticalAPIs) {
      try {
        const response = await page.request.get(`http://localhost:5000${api.endpoint}`);
        if (response.ok()) {
          logResult(api.name, 'passed', `${api.endpoint} API working`);
        } else {
          logResult(api.name, 'failed', `${api.endpoint} returned ${response.status()}`, api.endpoint.includes('/admin/') || api.endpoint.includes('/warehouse/'));
        }
      } catch (error) {
        logResult(api.name, 'failed', `${api.endpoint} error: ${error.message}`, true);
      }
    }
    
    // Calculate readiness score
    const totalTests = results.passed.length + results.failed.length + results.warnings.length;
    const passedTests = results.passed.length;
    const warningTests = results.warnings.length;
    results.readinessScore = Math.round(((passedTests + (warningTests * 0.5)) / totalTests) * 100);
    
    // Final Assessment
    console.log('\n=== SYSTEM READINESS ASSESSMENT ===');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`🚨 Critical Issues: ${results.criticalIssues.length}`);
    console.log(`📊 Readiness Score: ${results.readinessScore}%`);
    
    let readinessLevel = 'NOT READY';
    if (results.readinessScore >= 90 && results.criticalIssues.length === 0) {
      readinessLevel = 'PRODUCTION READY';
    } else if (results.readinessScore >= 75 && results.criticalIssues.length <= 2) {
      readinessLevel = 'TESTING READY';
    } else if (results.readinessScore >= 50) {
      readinessLevel = 'DEVELOPMENT READY';
    }
    
    console.log(`🎯 OVERALL ASSESSMENT: ${readinessLevel}`);
    
    if (results.criticalIssues.length > 0) {
      console.log('\n=== CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION ===');
      results.criticalIssues.forEach(issue => {
        console.log(`🚨 ${issue.test}: ${issue.message}`);
      });
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    if (readinessLevel === 'PRODUCTION READY') {
      console.log('✅ System is ready for user testing and production deployment');
      console.log('✅ All core functionality is working');
      console.log('✅ Authentication system is functional');
      console.log('✅ API endpoints are responding correctly');
    } else if (readinessLevel === 'TESTING READY') {
      console.log('⚠️  System is ready for comprehensive user testing');
      console.log('⚠️  Minor issues should be addressed but won\'t block testing');
      console.log('✅ Core user flows are functional');
    } else {
      console.log('❌ System needs development work before user testing');
      console.log('❌ Critical authentication or API issues must be resolved');
      console.log('❌ Focus on fixing failed tests before proceeding');
    }
    
  } catch (error) {
    console.error('❌ System readiness test failed:', error);
    logResult('System Test', 'failed', `Critical system error: ${error.message}`, true);
  }
  
  await browser.close();
  return results;
}

systemReadinessTest().then(results => {
  console.log('\n🎯 System Readiness Assessment Complete!');
  process.exit(results.criticalIssues.length > 0 ? 1 : 0);
});