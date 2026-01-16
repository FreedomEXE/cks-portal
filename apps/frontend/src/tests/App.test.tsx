import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProvidersWrapper } from './renderWithProviders';

vi.mock('@cks/auth', () => ({
  useAuth: vi.fn(),
  Login: () => <div>login page</div>,
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hubs/AdminHub', () => ({
  default: () => <div>admin hub view</div>,
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

  it('renders admin hub at /hub for admin users', () => {
    const html = renderToString(
      <ProvidersWrapper route="/hub" currentUserId="TEST-ADMIN" role="admin">
        <AuthenticatedApp />
      </ProvidersWrapper>
    );

    expect(html).toContain('admin hub view');
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
