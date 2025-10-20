/**
 * Modal Helper Utilities
 *
 * Reusable functions for interacting with modals across all tests.
 * Helps ensure consistent behavior and reduces code duplication.
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for a modal to be visible
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in ms
 */
export async function waitForModalToBeVisible(page: Page, timeout = 10000): Promise<void> {
  // Wait for modal root to appear
  await page.waitForSelector('[role="dialog"], .modal, [data-modal="true"]', {
    state: 'visible',
    timeout
  });
}

/**
 * Wait for a modal to be closed
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in ms
 */
export async function waitForModalToBeClosed(page: Page, timeout = 10000): Promise<void> {
  // Wait for modal to disappear
  await page.waitForSelector('[role="dialog"], .modal, [data-modal="true"]', {
    state: 'hidden',
    timeout
  });
}

/**
 * Close a modal by clicking the X button
 *
 * @param page - Playwright page object
 */
export async function closeModal(page: Page): Promise<void> {
  // Click close button (adjust selector if needed)
  await page.click('button[aria-label="Close"], button.closeX, [data-testid="modal-close"]');
  await waitForModalToBeClosed(page);
}

/**
 * Open order modal from activity feed
 *
 * @param page - Playwright page object
 * @param orderId - Order ID to click
 * @returns Time taken to open modal in ms
 */
export async function openOrderFromActivityFeed(page: Page, orderId: string): Promise<number> {
  const startTime = Date.now();

  // Click on activity with this order ID
  await page.click(`[data-order-id="${orderId}"], text=${orderId}`);

  // Wait for modal to appear
  await waitForModalToBeVisible(page);

  const duration = Date.now() - startTime;
  return duration;
}

/**
 * Open order modal from orders section
 *
 * @param page - Playwright page object
 * @param orderId - Order ID to click
 * @returns Time taken to open modal in ms
 */
export async function openOrderFromOrdersSection(page: Page, orderId: string): Promise<number> {
  const startTime = Date.now();

  // Navigate to orders tab first
  await page.click('button:has-text("Orders"), [data-tab="orders"]');

  // Click on the order card or "View Details" button
  await page.click(`[data-order-id="${orderId}"] button:has-text("View Details"), text=${orderId}`);

  // Wait for modal to appear
  await waitForModalToBeVisible(page);

  const duration = Date.now() - startTime;
  return duration;
}

/**
 * Open service modal from activity feed
 *
 * @param page - Playwright page object
 * @param serviceId - Service ID to click
 */
export async function openServiceFromActivityFeed(page: Page, serviceId: string): Promise<void> {
  await page.click(`[data-service-id="${serviceId}"], text=${serviceId}`);
  await waitForModalToBeVisible(page);
}

/**
 * Open report/feedback modal from activity feed
 *
 * @param page - Playwright page object
 * @param reportId - Report/Feedback ID to click
 */
export async function openReportFromActivityFeed(page: Page, reportId: string): Promise<void> {
  await page.click(`[data-report-id="${reportId}"], text=${reportId}`);
  await waitForModalToBeVisible(page);
}

/**
 * Click an action button in the modal
 *
 * @param page - Playwright page object
 * @param actionLabel - Label of the action button (e.g., "Accept", "Cancel")
 */
export async function clickModalAction(page: Page, actionLabel: string): Promise<void> {
  // Ensure we're in the Actions tab if tabs exist
  const actionsTab = page.locator('button:has-text("Quick Actions"), [data-tab-id="actions"]');
  if (await actionsTab.isVisible()) {
    await actionsTab.click();
  }

  // Click the action button
  await page.click(`button:has-text("${actionLabel}")`);
}

/**
 * Handle confirmation dialogs (window.confirm)
 *
 * @param page - Playwright page object
 * @param accept - Whether to accept or cancel the dialog
 */
export async function handleConfirmDialog(page: Page, accept: boolean = true): Promise<void> {
  page.once('dialog', async dialog => {
    expect(dialog.type()).toBe('confirm');
    if (accept) {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });
}

/**
 * Handle prompt dialogs (window.prompt)
 *
 * @param page - Playwright page object
 * @param input - Text to enter in the prompt
 */
export async function handlePromptDialog(page: Page, input: string): Promise<void> {
  page.once('dialog', async dialog => {
    expect(dialog.type()).toBe('prompt');
    await dialog.accept(input);
  });
}

/**
 * Verify modal contains specific order details
 *
 * @param page - Playwright page object
 * @param orderId - Order ID to verify
 */
export async function verifyOrderModalContent(page: Page, orderId: string): Promise<void> {
  await waitForModalToBeVisible(page);

  // Verify order ID is displayed
  await expect(page.locator(`text=${orderId}`)).toBeVisible();

  // Verify modal has the expected structure
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
}

/**
 * Verify an action button exists in the modal
 *
 * @param page - Playwright page object
 * @param actionLabel - Action label to check for
 */
export async function verifyActionExists(page: Page, actionLabel: string): Promise<void> {
  const button = page.locator(`button:has-text("${actionLabel}")`);
  await expect(button).toBeVisible();
}

/**
 * Verify an action button does NOT exist in the modal (RBAC check)
 *
 * @param page - Playwright page object
 * @param actionLabel - Action label that should not exist
 */
export async function verifyActionDoesNotExist(page: Page, actionLabel: string): Promise<void> {
  const button = page.locator(`button:has-text("${actionLabel}")`);
  await expect(button).not.toBeVisible();
}

/**
 * Measure modal open performance
 *
 * @param page - Playwright page object
 * @param openFn - Function that triggers modal open
 * @returns Object with timing metrics
 */
export async function measureModalPerformance(
  page: Page,
  openFn: () => Promise<void>
): Promise<{ duration: number; apiCalls: string[] }> {
  const apiCalls: string[] = [];

  // Track API calls
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('/order/') || request.url().includes('/service/')) {
      apiCalls.push(request.url());
    }
  });

  const startTime = Date.now();
  await openFn();
  await waitForModalToBeVisible(page);
  const duration = Date.now() - startTime;

  return { duration, apiCalls };
}
