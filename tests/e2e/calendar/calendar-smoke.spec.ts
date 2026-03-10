import { test, expect, type Page, type Locator } from '@playwright/test';
import { seededTestUsers } from '../../fixtures/users';
import { waitForModalToBeVisible } from '../../utils/modal-helpers';

function modalRoot(page: Page): Locator {
  return page.locator('[role="dialog"], .modal, [data-modal="true"]').last();
}

async function applyDevAuth(page: Page, role: string, code: string) {
  await page.addInitScript(({ nextRole, nextCode }) => {
    window.sessionStorage.setItem('cks_dev_role', nextRole);
    window.sessionStorage.setItem('cks_dev_code', nextCode.toUpperCase());
    window.dispatchEvent(new CustomEvent('cks:dev-auth-changed'));
  }, { nextRole: role, nextCode: code });
}

test.describe('Calendar Smoke - TEST Ecosystem', () => {
  test.describe.configure({ mode: 'serial' });

  test('manager calendar opens a service modal and shows the embedded schedule tab', async ({ page }) => {
    await applyDevAuth(page, seededTestUsers.manager.role, seededTestUsers.manager.code);
    await page.goto('/hub?tab=calendar');

    await expect(page.getByText('Upcoming Events')).toBeVisible({ timeout: 30000 });

    const eventButton = page.getByRole('button', { name: /Test Service/i }).first();
    await expect(eventButton).toBeVisible({ timeout: 30000 });
    await eventButton.click();

    await waitForModalToBeVisible(page, 15000);
    const dialog = modalRoot(page);

    await expect(dialog).toContainText(/CEN-001-TEST-SRV-00[123]/);

    const scheduleTab = dialog.getByRole('button', { name: 'Schedule', exact: true }).first();
    await expect(scheduleTab).toBeVisible();
    await scheduleTab.click();

    await expect(dialog.getByText('Service Schedule')).toBeVisible();
    await expect(dialog.getByText('Calendar events materialized for this service from existing scheduling workflows.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Test Service/i }).first()).toBeVisible();
  });

  test('crew profile shows only TEST crew schedule data', async ({ page }) => {
    await applyDevAuth(page, seededTestUsers.crew.role, seededTestUsers.crew.code);
    await page.goto('/hub?tab=profile');

    await expect(page.getByText('My Schedule')).toBeVisible();
    await expect(page.getByText('Upcoming calendar events tied to your crew assignments and accepted work.')).toBeVisible();

    const eventButton = page.getByRole('button', { name: /Test Service/i }).first();
    await expect(eventButton).toBeVisible({ timeout: 30000 });
    await eventButton.click();

    await waitForModalToBeVisible(page, 15000);
    const dialog = modalRoot(page);

    await expect(dialog).toContainText('CEN-001-TEST-SRV-001');
  });
});
