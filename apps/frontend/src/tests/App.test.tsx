import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProvidersWrapper } from './renderWithProviders';
import { buildLegacyHubRedirect } from '../shared/utils/hubRouting';

vi.mock('@cks/auth', () => ({
  useAuth: vi.fn(),
  Login: () => <div>login page</div>,
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hubs/AdminHub', () => ({
  default: ({ activeTab }: { activeTab: string }) => <div>admin hub view:{activeTab}</div>,
}));

vi.mock('../hubs/ContractorHub', () => ({
  default: () => <div>Coming soon: contractor hub</div>,
}));

import { AuthenticatedApp, UnauthenticatedApp } from '../App';
import { useAuth } from '@cks/auth';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('App routing', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      status: 'ready',
      role: 'admin',
      code: 'admin',
      fullName: null,
      firstName: null,
      ownerFirstName: null,
      accessStatus: 'active',
      accessTier: 'premium',
      accessSource: 'direct',
      error: null,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders admin hub at /hub for admin users', () => {
    const html = renderToString(
      <ProvidersWrapper route="/hub" currentUserId="TEST-ADMIN" role="admin">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );

    expect(html).toContain('admin hub view');
  });

  it('renders schedule tab at /hub/schedule path', () => {
    const html = renderToString(
      <ProvidersWrapper route="/hub/schedule" currentUserId="TEST-ADMIN" role="admin">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );

    expect(html).toContain('admin hub view:<!-- -->calendar');
  });

  it('accepts warehouse inventory and deliveries tab slugs', () => {
    const inventoryHtml = renderToString(
      <ProvidersWrapper route="/hub/inventory" currentUserId="TEST-ADMIN" role="admin">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );
    const deliveriesHtml = renderToString(
      <ProvidersWrapper route="/hub/deliveries" currentUserId="TEST-ADMIN" role="admin">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );

    expect(inventoryHtml).toContain('admin hub view:<!-- -->inventory');
    expect(deliveriesHtml).toContain('admin hub view:<!-- -->deliveries');
  });

  it('renders nested schedule routes as the schedule tab', () => {
    const html = renderToString(
      <ProvidersWrapper route="/hub/schedule/week/2026-03-12" currentUserId="TEST-ADMIN" role="admin">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );

    expect(html).toContain('admin hub view:<!-- -->calendar');
  });

  it('promotes legacy schedule query state into the new path format', () => {
    const redirect = buildLegacyHubRedirect(
      new URLSearchParams('tab=schedule&view=week&date=2026-03-12&scope=manager:MGR-001'),
    );

    expect(redirect).toBe('/hub/schedule/week/2026-03-12?scope=manager%3AMGR-001');
  });

  it('shows contractor stub when role is contractor', () => {
    mockUseAuth.mockReturnValue({
      status: 'ready',
      role: 'contractor',
      code: 'contractor',
      fullName: null,
      firstName: null,
      ownerFirstName: null,
      accessStatus: 'active',
      accessTier: 'premium',
      accessSource: 'direct',
      error: null,
      refresh: vi.fn(),
    });

    const html = renderToString(
      <ProvidersWrapper route="/hub" currentUserId="TEST-CONTRACTOR" role="contractor">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );

    expect(html).toContain('Coming soon');
  });

  it('keeps the access gate hidden by default for locked non-admin users', () => {
    mockUseAuth.mockReturnValue({
      status: 'ready',
      role: 'crew',
      code: 'CRW-012',
      fullName: null,
      firstName: null,
      ownerFirstName: null,
      accessStatus: 'locked',
      accessTier: null,
      accessSource: null,
      error: null,
      refresh: vi.fn(),
    });

    const html = renderToString(
      <ProvidersWrapper route="/hub" currentUserId="TEST-CREW" role="crew">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );

    expect(html).not.toContain('Activate your account');
  });

  // TODO: Fix SSR rendering for UnauthenticatedApp
  // Issue: renderToString returns empty string due to environment guards
  // See: docs/TEST_UNBLOCK_STATUS.md for details
  // Options: Switch to DOM render with jsdom OR add environment mocks
  it.skip('routes unknown signed-out paths to the login page', () => {
    const html = renderToString(
      <ProvidersWrapper route="/unknown">
        <UnauthenticatedApp />
      </ProvidersWrapper>
    );

    expect(html).toContain('login page');
  });
});
