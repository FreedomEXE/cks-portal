const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Debugging login page...');
    await page.goto('http://localhost:5184/login');
    await page.waitForTimeout(3000);
    
    console.log('📄 Page title:', await page.title());
    console.log('🔗 Current URL:', page.url());
    
    // Look for input fields
    const inputs = await page.locator('input').all();
    console.log(`📝 Found ${inputs.length} input fields:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type').catch(() => 'unknown');
      const placeholder = await input.getAttribute('placeholder').catch(() => '');
      const name = await input.getAttribute('name').catch(() => '');
      console.log(`   ${i + 1}. Type: ${type}, Placeholder: "${placeholder}", Name: "${name}"`);
    }
    
    // Look for buttons
    const buttons = await page.locator('button').all();
    console.log(`🔘 Found ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent().catch(() => '');
      console.log(`   ${i + 1}. Text: "${text}"`);
    }
    
    // Try to manually fill the form
    console.log('\n🖋️  Trying to fill login form manually...');
    
    // Fill identifier (first input)
    if (inputs.length > 0) {
      await inputs[0].fill('mgr-001');
      console.log('✓ Filled first input with mgr-001');
    }
    
    // Fill password (second input)
    if (inputs.length > 1) {
      await inputs[1].fill('test123');
      console.log('✓ Filled second input with test123');
    }
    
    // Click submit button
    if (buttons.length > 0) {
      await buttons[0].click();
      console.log('✓ Clicked first button');
      await page.waitForTimeout(3000);
    }
    
    // Check result
    console.log('\n📊 After submit attempt:');
    console.log('🔗 Current URL:', page.url());
    
    const bodyText = await page.textContent('body');
    if (bodyText.includes("Couldn't find")) {
      console.log('❌ Account not found error detected');
    } else if (bodyText.includes('error') || bodyText.includes('Error')) {
      console.log('⚠️  Some error detected');
    } else if (page.url().includes('hub')) {
      console.log('✅ Looks like login succeeded!');
    }
    
    console.log('\n⏳ Browser staying open for 60 seconds...');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
})();