import { test, expect } from '@playwright/test';

test('Debug admin module imports', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:3005');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Execute JavaScript to test the imports
  const result = await page.evaluate(async () => {
    try {
      console.log('Testing admin config import...');
      const configModule = await import('./src/hub/roles/admin/config.v1.json');
      console.log('Config loaded:', configModule);
      
      console.log('Testing admin index import...');
      const indexModule = await import('./src/hub/roles/admin/index.ts');
      console.log('Index loaded:', indexModule);
      
      console.log('Testing Dashboard component import...');
      const dashboardModule = await import('./src/hub/roles/admin/tabs/Dashboard.tsx');
      console.log('Dashboard loaded:', dashboardModule);
      
      return {
        configSuccess: !!configModule,
        indexSuccess: !!indexModule, 
        dashboardSuccess: !!dashboardModule,
        configData: configModule.default || configModule,
        indexData: indexModule.default || indexModule
      };
    } catch (error) {
      console.error('Import error:', error);
      return {
        error: error.message,
        stack: error.stack
      };
    }
  });
  
  console.log('Import test result:', JSON.stringify(result, null, 2));
});