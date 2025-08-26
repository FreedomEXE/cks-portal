const { chromium } = require('playwright');

async function mapCrewHubFields() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Mapping Crew Hub Profile Fields...\n');
    
    // Login to crew hub
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'crw-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    console.log('📋 CREW HUB PROFILE FIELD MAPPING\n');
    console.log('=' .repeat(50));
    
    // First, get the OG Brain section at the top
    console.log('\n🧠 OG BRAIN SECTION (Top of Page):');
    console.log('-'.repeat(40));
    
    try {
      // Look for the header section with user info
      const headerInfo = await page.locator('.card, [style*="background"], div').first().evaluate((el) => {
        return el.textContent || '';
      });
      
      // Get all visible text elements that might contain profile info
      const profileElements = await page.locator('div').evaluateAll((elements) => {
        return elements
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 0 && text.length < 100)
          .slice(0, 20); // Get first 20 meaningful text elements
      });
      
      console.log('Header/Profile Info Found:');
      profileElements.forEach((text, index) => {
        if (text && !text.includes('Vite') && !text.includes('DevTools')) {
          console.log(`  ${index + 1}. ${text}`);
        }
      });
      
    } catch (error) {
      console.log('Could not extract OG Brain section info automatically');
    }
    
    console.log('\n👤 MY PROFILE SECTION:');
    console.log('-'.repeat(40));
    
    // Click on "My Profile" tab/button
    try {
      const profileButton = page.locator('button:has-text("My Profile")');
      if (await profileButton.isVisible()) {
        console.log('Found "My Profile" button, clicking...');
        await profileButton.click();
        await page.waitForTimeout(2000);
        
        // Get all form fields, labels, and data in the profile section
        const profileData = await page.evaluate(() => {
          const fields = [];
          
          // Get all input fields
          const inputs = document.querySelectorAll('input, select, textarea');
          inputs.forEach((input, index) => {
            const label = input.previousElementSibling?.textContent || 
                         input.parentElement?.querySelector('label')?.textContent ||
                         input.placeholder || 
                         `Input ${index + 1}`;
            fields.push({
              type: 'input',
              label: label.trim(),
              value: input.value,
              inputType: input.type || input.tagName.toLowerCase()
            });
          });
          
          // Get all labels and their associated text
          const labels = document.querySelectorAll('label, dt, th');
          labels.forEach(label => {
            const text = label.textContent?.trim();
            if (text && text.length > 0) {
              const value = label.nextElementSibling?.textContent?.trim() || '';
              fields.push({
                type: 'label',
                label: text,
                value: value
              });
            }
          });
          
          // Get any displayed data values
          const dataElements = document.querySelectorAll('[class*="value"], [class*="data"], dd, td');
          dataElements.forEach((el, index) => {
            const text = el.textContent?.trim();
            if (text && text.length > 0 && text.length < 50) {
              fields.push({
                type: 'data',
                label: `Data ${index + 1}`,
                value: text
              });
            }
          });
          
          return fields;
        });
        
        // Filter and organize the profile data
        const uniqueFields = [];
        const seenLabels = new Set();
        
        profileData.forEach(field => {
          if (!seenLabels.has(field.label) && field.label.length > 0) {
            seenLabels.add(field.label);
            uniqueFields.push(field);
          }
        });
        
        console.log('Profile Fields Found:');
        uniqueFields.forEach((field, index) => {
          if (field.value) {
            console.log(`  ${index + 1}. ${field.label}: ${field.value} (${field.type})`);
          } else {
            console.log(`  ${index + 1}. ${field.label} (${field.type})`);
          }
        });
        
      } else {
        console.log('Could not find "My Profile" button');
        
        // Try to get any profile-like information from the current view
        const allText = await page.locator('body').textContent();
        console.log('Available page content (first 500 chars):');
        console.log(allText?.substring(0, 500) + '...');
      }
      
    } catch (error) {
      console.log('Error accessing profile section:', error.message);
    }
    
    // Take a screenshot for manual review
    await page.screenshot({ path: 'crew-hub-profile-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved as "crew-hub-profile-screenshot.png"');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Crew Hub Profile Field Mapping Complete');
    console.log('Review the screenshot and console output above to document fields');
    
  } catch (error) {
    console.error('Error during field mapping:', error);
  } finally {
    await browser.close();
  }
}

mapCrewHubFields().catch(console.error);