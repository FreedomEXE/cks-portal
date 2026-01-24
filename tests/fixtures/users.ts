/**
 * Test User Credentials and Login Helpers
 *
 * All test users share the same password for simplicity.
 * Credentials are stored in .env.test (not committed to git).
 */

import { Page } from '@playwright/test';

export type Role = 'crew' | 'manager' | 'warehouse' | 'contractor' | 'customer' | 'center' | 'admin';

export interface TestUser {
  email: string;
  code: string;
  name: string;
  role: Role;
}

/**
 * Test user accounts
 */
export const testUsers: Record<Role, TestUser> = {
  manager: {
    email: 'janedoe+clerk_test@example.com',
    code: 'MGR-012',
    name: 'Jane',
    role: 'manager'
  },
  contractor: {
    email: 'bobdole+clerk_test@example.com',
    code: 'CON-010',
    name: 'Maria',
    role: 'contractor'
  },
  customer: {
    email: 'jimmycarter+clerk_test@example.com',
    code: 'CUS-015',
    name: 'Bob',
    role: 'customer'
  },
  center: {
    email: 'bennyblanco+clerk_test@example.com',
    code: 'CEN-010',
    name: 'Penelope',
    role: 'center'
  },
  crew: {
    email: 'jamesjimmy+clerk_test@example.com',
    code: 'CRW-006',
    name: 'Wario',
    role: 'crew'
  },
  warehouse: {
    email: 'warehousetest+clerk_test@example.com',
    code: 'WHS-004',
    name: 'Manuel',
    role: 'warehouse'
  },
  admin: {
    email: 'admin@ckscontracting.ca',
    code: 'FREEDOM_EXE',
    name: 'Freedom',
    role: 'admin'
  }
};

/**
 * Get test password from environment variable
 */
function getTestPassword(): string {
  const password = process.env.TEST_PASSWORD || 'CksTest!2026-Alpha';
  return password;
}

/**
 * Login as a specific role
 *
 * Simply fills out the login form like a human would.
 *
 * @param page - Playwright page object
 * @param role - Role to login as
 * @returns User that was logged in
 */
export async function loginAs(page: Page, role: Role): Promise<TestUser> {
  const user = testUsers[role];
  const password = getTestPassword();

  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await page.waitForLoadState('networkidle');

  // Fill in username (use CKS code, not email)
  const usernameInput = page.locator('input[type="text"]').first();
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await usernameInput.fill(user.code);

  // Fill in password
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);

  // Click sign in button
  await page.click('button:has-text("Sign in")');

  // Wait for navigation away from login page (don't force a specific URL)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });

  // Give the page a moment to fully load
  await page.waitForLoadState('networkidle');

  return user;
}

/**
 * Login and navigate to a specific hub
 *
 * @param page - Playwright page object
 * @param role - Role to login as
 */
export async function loginAndNavigate(page: Page, role: Role): Promise<TestUser> {
  const user = await loginAs(page, role);

  // Ensure we're on the correct hub page
  const expectedPath = role === 'admin' ? '/admin' : `/${role}`;
  if (!page.url().includes(expectedPath)) {
    await page.goto(expectedPath);
  }

  return user;
}

/**
 * Logout current user
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Adjust selector based on your logout button location
  await page.click('button[aria-label="User menu"], button:has-text("Sign out")');
  await page.waitForURL('/sign-in', { timeout: 10000 });
}
