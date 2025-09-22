import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const mockUseAuth = vi.fn();

vi.mock('@cks-auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../hubs/AdminHub', () => ({
  default: () => <div>admin hub view</div>,
}));

vi.mock('@cks-auth/pages/Login', () => ({
  default: () => <div>login page</div>,
}));

import { AuthenticatedApp, UnauthenticatedApp } from '../App';

describe('App routing', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      status: 'ready',
      role: 'admin',
      code: 'admin',
      error: null,
      refresh: vi.fn(),
    });
  });

  it('renders admin hub at /hub for admin users', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/hub']}>
        <AuthenticatedApp />
      </MemoryRouter>
    );

    expect(html).toContain('admin hub view');
  });

  it('shows contractor stub when role is contractor', () => {
    mockUseAuth.mockReturnValue({
      status: 'ready',
      role: 'contractor',
      code: 'contractor',
      error: null,
      refresh: vi.fn(),
    });

    const html = renderToString(
      <MemoryRouter initialEntries={['/hub']}>
        <AuthenticatedApp />
      </MemoryRouter>
    );

    expect(html).toContain('Coming soon');
  });

  it('routes unknown signed-out paths to the login page', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/unknown']}>
        <UnauthenticatedApp />
      </MemoryRouter>
    );

    expect(html).toContain('login page');
  });
});
