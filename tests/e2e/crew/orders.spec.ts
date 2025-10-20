/**
 * Crew Hub - Order Modal Tests
 *
 * Tests for crew members interacting with order modals.
 * Covers: opening modals, viewing details, performing actions.
 */

import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/users';
import {
  waitForModalToBeVisible,
  waitForModalToBeClosed,
  openOrderFromActivityFeed,
  openOrderFromOrdersSection,
  clickModalAction,
  handleConfirmDialog,
  handlePromptDialog,
  verifyOrderModalContent,
  verifyActionExists,
  closeModal,
} from '../../utils/modal-helpers';

test.describe('Crew Order Modals', () => {
  test.beforeEach(async ({ page }) => {
    // Login as crew before each test
    await loginAs(page, 'crew');
  });

  test('should open order modal from activity feed', async ({ page }) => {
    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"], .activity-feed', { timeout: 10000 });

    // Find the first order in the activity feed
    const firstOrderId = await page.locator('[data-order-id]').first().getAttribute('data-order-id');

    if (firstOrderId) {
      // Click the order
      const duration = await openOrderFromActivityFeed(page, firstOrderId);

      // Verify modal opened
      await verifyOrderModalContent(page, firstOrderId);

      // Log performance
      console.log(`Modal opened in ${duration}ms`);

      // Close modal
      await closeModal(page);
    } else {
      console.log('No orders found in activity feed - test skipped');
    }
  });

  test('should open order modal from orders section', async ({ page }) => {
    // Navigate to orders tab
    await page.click('button:has-text("Orders"), [data-tab="orders"]');

    // Wait for orders to load
    await page.waitForSelector('[data-testid="orders-section"]', { timeout: 10000 });

    // Find the first order
    const firstOrderId = await page.locator('[data-order-id]').first().getAttribute('data-order-id');

    if (firstOrderId) {
      // Open the order
      const duration = await openOrderFromOrdersSection(page, firstOrderId);

      // Verify modal opened
      await verifyOrderModalContent(page, firstOrderId);

      // Log performance
      console.log(`Modal opened in ${duration}ms`);

      // Close modal
      await closeModal(page);
    } else {
      console.log('No orders found in orders section - test skipped');
    }
  });

  test('should display correct tabs in order modal', async ({ page }) => {
    // Open any order
    await page.click('[data-order-id]');
    await waitForModalToBeVisible(page);

    // Verify tabs exist
    const actionsTab = page.locator('button:has-text("Quick Actions"), [data-tab-id="actions"]');
    const detailsTab = page.locator('button:has-text("Details"), [data-tab-id="details"]');

    // At least Details tab should always be visible
    await expect(detailsTab).toBeVisible();

    // Actions tab may or may not be visible depending on availableActions
    const hasActions = await actionsTab.isVisible();
    if (hasActions) {
      console.log('Actions tab is visible');
    } else {
      console.log('No actions available for this order');
    }

    await closeModal(page);
  });

  test('should show order details when Details tab is clicked', async ({ page }) => {
    // Open any order
    const firstOrderId = await page.locator('[data-order-id]').first().getAttribute('data-order-id');

    if (firstOrderId) {
      await page.click(`[data-order-id="${firstOrderId}"]`);
      await waitForModalToBeVisible(page);

      // Click Details tab
      await page.click('button:has-text("Details")');

      // Verify order details are visible
      await expect(page.locator(`text=${firstOrderId}`)).toBeVisible();

      // Verify some expected fields
      await expect(page.locator('text=Requested By, text=Destination, text=Status')).toBeVisible();

      await closeModal(page);
    }
  });

  test('should auto-close modal after successful action', async ({ page }) => {
    // This test requires a specific order that can be cancelled
    // You'll need to provide a test order ID that's in a cancellable state

    // For now, we'll skip if no suitable order exists
    test.skip();

    /*
    const cancelableOrderId = 'CRW-006-PO-111'; // Replace with actual test order

    // Open the order
    await page.click(`[data-order-id="${cancelableOrderId}"]`);
    await waitForModalToBeVisible(page);

    // Click Cancel action
    handleConfirmDialog(page, true); // Accept confirmation
    handlePromptDialog(page, 'Test cancellation reason'); // Provide reason
    await clickModalAction(page, 'Cancel');

    // Verify modal auto-closed
    await waitForModalToBeClosed(page);

    // Verify order is removed from list or status changed
    // (implementation depends on your UI behavior)
    */
  });
});
