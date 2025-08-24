import { test, expect } from '@playwright/test';

test.describe('Login Page Cross-Browser Tests', () => {
  test('should display logo and slogan correctly on all browsers', async ({ page }) => {
    await page.goto('/');
    
    // Check that logo is visible and not cut off
    const logo = page.locator('img[alt="CKS"]');
    await expect(logo).toBeVisible();
    
    // Check that slogan is visible
    const slogan = page.locator('text="Manifested by Freedom"');
    await expect(slogan).toBeVisible();
    
    // Check that form elements are properly positioned
    const usernameField = page.locator('input[type="text"]');
    const passwordField = page.locator('input[type="password"]');
    const signInButton = page.locator('button[type="submit"]');
    
    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(signInButton).toBeVisible();
    
    // Take screenshot for visual comparison
    await page.screenshot({ path: `login-${test.info().project.name}.png`, fullPage: true });
  });

  test('should handle responsive design correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/');
    
    const logo = page.locator('img[alt="CKS"]');
    const slogan = page.locator('text="Manifested by Freedom"');
    
    await expect(logo).toBeVisible();
    await expect(slogan).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: `login-mobile-${test.info().project.name}.png`, fullPage: true });
  });

  test('should not have overlapping elements', async ({ page }) => {
    await page.goto('/');
    
    // Get bounding boxes to ensure no overlap
    const logo = page.locator('img[alt="CKS"]');
    const form = page.locator('form');
    
    const logoBox = await logo.boundingBox();
    const formBox = await form.boundingBox();
    
    // Logo should be above form (logo bottom < form top)
    if (logoBox && formBox) {
      expect(logoBox.y + logoBox.height).toBeLessThan(formBox.y);
    }
  });
});