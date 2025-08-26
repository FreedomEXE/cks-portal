const { chromium } = require('playwright');

async function mapCrewProfileTabs() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Mapping ALL Crew Hub Profile Tabs...\n');
    
    // Login to crew hub
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'crw-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Go to My Profile
    const profileButton = page.locator('button:has-text("My Profile")');
    await profileButton.click();
    await page.waitForTimeout(2000);
    
    console.log('📋 CREW HUB - MY PROFILE SECTION - ALL TABS');
    console.log('=' .repeat(60));
    
    // Find all profile tabs
    const tabs = ['Personal Info', 'Work Details', 'Certifications', 'Emergency Contact', 'Performance'];
    
    for (const tabName of tabs) {
      console.log(`\n🔸 TAB: ${tabName.toUpperCase()}`);
      console.log('-'.repeat(50));
      
      try {
        // Try to find and click the tab
        const tabButton = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}"), div:has-text("${tabName}")`).first();
        
        if (await tabButton.isVisible()) {
          console.log(`✅ Found "${tabName}" tab, clicking...`);
          await tabButton.click();
          await page.waitForTimeout(1500);
          
          // Extract all fields from this tab
          const tabData = await page.evaluate(() => {
            const fields = [];
            
            // Get all possible field containers
            const containers = document.querySelectorAll('div, section, fieldset, form, table');
            
            containers.forEach(container => {
              // Look for label-value pairs
              const labels = container.querySelectorAll('label, dt, th, .label, [class*="label"], [class*="field-name"]');
              labels.forEach(label => {
                const labelText = label.textContent?.trim();
                if (labelText && labelText.length > 0 && labelText.length < 50) {
                  let value = '';
                  
                  // Try to find associated value
                  const nextSibling = label.nextElementSibling;
                  const parent = label.parentElement;
                  
                  if (nextSibling) {
                    value = nextSibling.textContent?.trim() || nextSibling.value || '';
                  } else if (parent) {
                    const valueEl = parent.querySelector('input, select, textarea, .value, [class*="value"]');
                    if (valueEl) {
                      value = valueEl.textContent?.trim() || valueEl.value || '';
                    }
                  }
                  
                  fields.push({
                    label: labelText,
                    value: value || '[Field Present]',
                    type: 'label-value'
                  });
                }
              });
              
              // Look for input fields with placeholders or nearby text
              const inputs = container.querySelectorAll('input, select, textarea');
              inputs.forEach(input => {
                const placeholder = input.placeholder;
                const label = input.previousElementSibling?.textContent?.trim() || 
                             input.parentElement?.querySelector('label')?.textContent?.trim() ||
                             placeholder || 
                             input.name || 
                             input.id;
                
                if (label && label.length > 0) {
                  fields.push({
                    label: label,
                    value: input.value || placeholder || '[Input Field]',
                    type: input.type || input.tagName.toLowerCase()
                  });
                }
              });
              
              // Look for any displayed data
              const dataElements = container.querySelectorAll('[class*="data"], [class*="info"], dd, td');
              dataElements.forEach((el, index) => {
                const text = el.textContent?.trim();
                const prevText = el.previousElementSibling?.textContent?.trim();
                
                if (text && text.length > 0 && text.length < 100) {
                  fields.push({
                    label: prevText || `Data Item ${index + 1}`,
                    value: text,
                    type: 'data'
                  });
                }
              });
            });
            
            // Remove duplicates and filter
            const uniqueFields = [];
            const seenLabels = new Set();
            
            fields.forEach(field => {
              const cleanLabel = field.label.replace(/[:\*]/g, '').trim();
              if (cleanLabel.length > 0 && 
                  !seenLabels.has(cleanLabel) && 
                  !cleanLabel.includes('undefined') &&
                  !cleanLabel.toLowerCase().includes('vite') &&
                  !cleanLabel.toLowerCase().includes('devtools')) {
                seenLabels.add(cleanLabel);
                uniqueFields.push({
                  ...field,
                  label: cleanLabel
                });
              }
            });
            
            return uniqueFields;
          });
          
          // Display the fields found in this tab
          if (tabData.length > 0) {
            console.log(`📝 Fields found in "${tabName}" tab:`);
            tabData.forEach((field, index) => {
              console.log(`  ${index + 1}. ${field.label}: ${field.value} (${field.type})`);
            });
          } else {
            console.log(`⚠️  No specific fields detected in "${tabName}" tab - may need manual inspection`);
          }
          
          // Take screenshot of this tab
          await page.screenshot({ 
            path: `crew-profile-${tabName.toLowerCase().replace(/\s+/g, '-')}-tab.png`,
            fullPage: true 
          });
          console.log(`📸 Screenshot saved: crew-profile-${tabName.toLowerCase().replace(/\s+/g, '-')}-tab.png`);
          
        } else {
          console.log(`❌ Could not find "${tabName}" tab`);
          
          // If we can't find specific tabs, let's see what's available
          const availableTabs = await page.locator('[role="tab"], button, div').evaluateAll((elements) => {
            return elements
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length < 30 && 
                     (text.includes('Info') || text.includes('Details') || 
                      text.includes('Contact') || text.includes('Performance') ||
                      text.includes('Cert') || text.includes('Emergency')))
              .slice(0, 10);
          });
          
          console.log('Available tab-like elements:', availableTabs);
        }
        
      } catch (error) {
        console.log(`❌ Error processing "${tabName}" tab:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Crew Hub Profile Tabs Mapping Complete');
    console.log('📸 Individual screenshots saved for each tab found');
    
  } catch (error) {
    console.error('❌ Error during profile tabs mapping:', error);
  } finally {
    await browser.close();
  }
}

mapCrewProfileTabs().catch(console.error);