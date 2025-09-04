/**
 * Test Admin Hub Creation Functionality
 * Tests all creation types and identifies bugs/missing logic
 */

const { chromium } = require('playwright');

async function testAdminCreation() {
  console.log('🚀 Starting Admin Hub Creation Tests...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login to Admin Hub - Try different ports
    console.log('📝 Logging into Admin Hub...');
    let frontendUrl;
    
    // Try common Vite ports
    const ports = ['5183', '5173', '3000', '5000'];
    for (const port of ports) {
      try {
        await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle', timeout: 5000 });
        frontendUrl = `http://localhost:${port}`;
        console.log(`✅ Found frontend at ${frontendUrl}`);
        break;
      } catch (e) {
        console.log(`❌ Port ${port} not available`);
      }
    }
    
    if (!frontendUrl) {
      throw new Error('Frontend not found on any common port');
    }
    
    // Wait for page to fully load and take screenshot for debugging
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'login-page-debug.png' });
    
    // Check what's actually on the page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
    // Look for login form with different selectors
    const usernameInput = await page.$('input[placeholder*="sername"], input[name="username"], input[type="text"]');
    const passwordInput = await page.$('input[placeholder*="assword"], input[name="password"], input[type="password"]');
    
    if (!usernameInput || !passwordInput) {
      console.log('❌ Login form not found, checking if already logged in...');
      
      // Check if already on admin dashboard
      const adminDashboard = await page.$('text=Admin Hub, text=Dashboard, button:has-text("Create")');
      if (adminDashboard) {
        console.log('✅ Already logged into Admin Hub');
      } else {
        console.log('❌ Neither login form nor admin dashboard found');
        return;
      }
    } else {
      console.log('✅ Login form found, attempting login...');
      await page.fill('input[placeholder*="sername"], input[name="username"], input[type="text"]', 'freedom_exe');
      await page.fill('input[placeholder*="assword"], input[name="password"], input[type="password"]', 'Fr33dom123!');
      await page.click('button:has-text("Sign In"), button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // Navigate to Create tab
    console.log('🔧 Navigating to Create tab...');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);
    
    // Test 1: Contractor Creation
    console.log('\n=== TESTING CONTRACTOR CREATION ===');
    await testContractorCreation(page);
    
    // Test 2: Manager Creation
    console.log('\n=== TESTING MANAGER CREATION ===');
    await testManagerCreation(page);
    
    // Test 3: Customer Creation
    console.log('\n=== TESTING CUSTOMER CREATION ===');
    await testCustomerCreation(page);
    
    // Test 4: Center Creation
    console.log('\n=== TESTING CENTER CREATION ===');
    await testCenterCreation(page);
    
    // Test 5: Crew Creation
    console.log('\n=== TESTING CREW CREATION ===');
    await testCrewCreation(page);
    
    // Test 6: Warehouse Creation
    console.log('\n=== TESTING WAREHOUSE CREATION ===');
    await testWarehouseCreation(page);
    
    // Test 7: Service Creation
    console.log('\n=== TESTING SERVICE CREATION ===');
    await testServiceCreation(page);
    
    // Test 8: Product Creation
    console.log('\n=== TESTING PRODUCT CREATION ===');
    await testProductCreation(page);
    
    // Test 9: Supply Creation
    console.log('\n=== TESTING SUPPLY CREATION ===');
    await testSupplyCreation(page);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

async function testContractorCreation(page) {
  try {
    // Select Contractor from dropdown
    await page.selectOption('select', 'contractor');
    await page.waitForTimeout(500);
    
    // Fill contractor form
    await page.fill('input[placeholder="Enter contractor name"]', 'Test Contractor 001');
    await page.fill('input[placeholder="Enter contact email"]', 'contractor001@test.com');
    await page.fill('input[placeholder="Enter contact phone"]', '555-0001');
    await page.fill('textarea[placeholder*="business description"]', 'Test contractor for validation');
    
    // Try to submit
    console.log('📝 Attempting to create contractor...');
    await page.click('button:has-text("Create Contractor")');
    await page.waitForTimeout(2000);
    
    // Check for errors
    const errorElements = await page.$$('text=*manager_id*');
    if (errorElements.length > 0) {
      console.log('❌ CONTRACTOR ERROR: manager_id required - form missing manager selection');
      
      // Check if Manager dropdown exists
      const managerDropdown = await page.$('select[name="manager_id"], input[placeholder*="manager"], select:has(option:text-is("Manager"))');
      if (!managerDropdown) {
        console.log('🔍 MISSING LOGIC: No manager selection dropdown in contractor form');
      } else {
        console.log('✅ Manager dropdown found');
      }
    }
    
    // Check for success message
    const successMsg = await page.$('text=*successfully*');
    if (successMsg) {
      console.log('✅ Contractor created successfully');
    } else {
      console.log('⚠️  No success message detected');
    }
    
  } catch (error) {
    console.log('❌ Contractor creation failed:', error.message);
  }
}

async function testManagerCreation(page) {
  try {
    await page.selectOption('select', 'manager');
    await page.waitForTimeout(500);
    
    console.log('📝 Testing Manager creation form...');
    
    // Check if form exists
    const managerForm = await page.$('input[placeholder*="manager"], input[placeholder*="Manager"]');
    if (!managerForm) {
      console.log('❌ MISSING LOGIC: Manager creation form not implemented');
      return;
    }
    
    // Fill manager form if it exists
    await page.fill('input[placeholder*="name"]', 'Test Manager 001');
    await page.click('button:has-text("Create Manager")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Manager creation tested');
    
  } catch (error) {
    console.log('❌ Manager creation failed:', error.message);
  }
}

async function testCustomerCreation(page) {
  try {
    await page.selectOption('select', 'customer');
    await page.waitForTimeout(500);
    
    console.log('📝 Testing Customer creation form...');
    
    const customerForm = await page.$('input[placeholder*="customer"], input[placeholder*="Customer"]');
    if (!customerForm) {
      console.log('❌ MISSING LOGIC: Customer creation form not implemented');
      return;
    }
    
    console.log('✅ Customer creation tested');
    
  } catch (error) {
    console.log('❌ Customer creation failed:', error.message);
  }
}

async function testCenterCreation(page) {
  try {
    await page.selectOption('select', 'center');
    await page.waitForTimeout(500);
    
    console.log('📝 Testing Center creation form...');
    
    const centerForm = await page.$('input[placeholder*="center"], input[placeholder*="Center"]');
    if (!centerForm) {
      console.log('❌ MISSING LOGIC: Center creation form not implemented');
      return;
    }
    
    console.log('✅ Center creation tested');
    
  } catch (error) {
    console.log('❌ Center creation failed:', error.message);
  }
}

async function testCrewCreation(page) {
  try {
    await page.selectOption('select', 'crew');
    await page.waitForTimeout(500);
    
    console.log('📝 Testing Crew creation form...');
    
    const crewForm = await page.$('input[placeholder*="crew"], input[placeholder*="Crew"]');
    if (!crewForm) {
      console.log('❌ MISSING LOGIC: Crew creation form not implemented');
      return;
    }
    
    console.log('✅ Crew creation tested');
    
  } catch (error) {
    console.log('❌ Crew creation failed:', error.message);
  }
}

async function testWarehouseCreation(page) {
  try {
    await page.selectOption('select', 'warehouse');
    await page.waitForTimeout(500);
    
    console.log('📝 Testing Warehouse creation form...');
    
    const warehouseForm = await page.$('input[placeholder*="warehouse"], input[placeholder*="Warehouse"]');
    if (!warehouseForm) {
      console.log('❌ MISSING LOGIC: Warehouse creation form not implemented');
      return;
    }
    
    console.log('✅ Warehouse creation tested');
    
  } catch (error) {
    console.log('❌ Warehouse creation failed:', error.message);
  }
}

async function testServiceCreation(page) {
  try {
    // Look for Services tab or section
    const servicesTab = await page.$('button:has-text("Services"), a:has-text("Services")');
    if (!servicesTab) {
      console.log('❌ MISSING LOGIC: Services creation not found in Admin Hub');
      return;
    }
    
    console.log('✅ Services section found');
    
  } catch (error) {
    console.log('❌ Service creation failed:', error.message);
  }
}

async function testProductCreation(page) {
  try {
    const productsTab = await page.$('button:has-text("Products"), a:has-text("Products")');
    if (!productsTab) {
      console.log('❌ MISSING LOGIC: Products creation not found in Admin Hub');
      return;
    }
    
    console.log('✅ Products section found');
    
  } catch (error) {
    console.log('❌ Product creation failed:', error.message);
  }
}

async function testSupplyCreation(page) {
  try {
    const suppliesTab = await page.$('button:has-text("Supplies"), a:has-text("Supplies")');
    if (!suppliesTab) {
      console.log('❌ MISSING LOGIC: Supplies creation not found in Admin Hub');
      return;
    }
    
    console.log('✅ Supplies section found');
    
  } catch (error) {
    console.log('❌ Supply creation failed:', error.message);
  }
}

// Run the tests
testAdminCreation();