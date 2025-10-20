/**
 * Crew Hub - Performance Tests
 *
 * Tests to measure and track performance metrics.
 * Helps identify the 4-5 second modal delay and track improvements.
 */

import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/users';
import { measureModalPerformance, openOrderFromActivityFeed } from '../../utils/modal-helpers';

test.describe('Crew Hub Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'crew');
  });

  test('measure order modal open time from activity feed', async ({ page }) => {
    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"], .activity-feed', { timeout: 10000 });

    // Get first order ID
    const firstOrderId = await page.locator('[data-order-id]').first().getAttribute('data-order-id');

    if (!firstOrderId) {
      test.skip();
      return;
    }

    // Measure performance
    const { duration, apiCalls } = await measureModalPerformance(page, async () => {
      await page.click(`[data-order-id="${firstOrderId}"]`);
    });

    console.log(`\n=== Modal Performance Report ===`);
    console.log(`Order ID: ${firstOrderId}`);
    console.log(`Open Duration: ${duration}ms`);
    console.log(`API Calls Made: ${apiCalls.length}`);
    apiCalls.forEach(url => console.log(`  - ${url}`));
    console.log(`================================\n`);

    // Current expectation: ~4000ms (will improve this threshold over time)
    // For now, just warn if it's slow
    if (duration > 2000) {
      console.warn(`⚠️  Modal took ${duration}ms to open (target: <2000ms)`);
    }

    // Fail if extremely slow (>10 seconds indicates something is broken)
    expect(duration).toBeLessThan(10000);
  });

  test('measure order modal open time from orders section', async ({ page }) => {
    // Navigate to orders tab
    await page.click('button:has-text("Orders")');
    await page.waitForSelector('[data-testid="orders-section"]', { timeout: 10000 });

    // Get first order ID
    const firstOrderId = await page.locator('[data-order-id]').first().getAttribute('data-order-id');

    if (!firstOrderId) {
      test.skip();
      return;
    }

    // Measure performance
    const { duration, apiCalls } = await measureModalPerformance(page, async () => {
      await page.click(`[data-order-id="${firstOrderId}"] button:has-text("View Details")`);
    });

    console.log(`\n=== Orders Section Modal Performance ===`);
    console.log(`Order ID: ${firstOrderId}`);
    console.log(`Open Duration: ${duration}ms`);
    console.log(`API Calls Made: ${apiCalls.length}`);
    apiCalls.forEach(url => console.log(`  - ${url}`));
    console.log(`=========================================\n`);

    if (duration > 2000) {
      console.warn(`⚠️  Modal took ${duration}ms to open (target: <2000ms)`);
    }

    expect(duration).toBeLessThan(10000);
  });

  test('track API call count during modal open', async ({ page }) => {
    const apiCalls: string[] = [];
    const duplicateCalls = new Map<string, number>();

    // Track all API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/order/') || url.includes('/hub/')) {
        apiCalls.push(url);

        // Track duplicates
        const count = duplicateCalls.get(url) || 0;
        duplicateCalls.set(url, count + 1);
      }
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Open a modal
    const firstOrderId = await page.locator('[data-order-id]').first().getAttribute('data-order-id');
    if (firstOrderId) {
      await page.click(`[data-order-id="${firstOrderId}"]`);
      await page.waitForSelector('[role="dialog"]');

      console.log(`\n=== API Call Analysis ===`);
      console.log(`Total API calls: ${apiCalls.length}`);

      // Check for duplicate calls (potential optimization opportunity)
      const duplicates = Array.from(duplicateCalls.entries()).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log(`\n⚠️  Duplicate API calls detected:`);
        duplicates.forEach(([url, count]) => {
          console.log(`  ${count}x: ${url}`);
        });
      }

      console.log(`=========================\n`);
    }
  });
});
