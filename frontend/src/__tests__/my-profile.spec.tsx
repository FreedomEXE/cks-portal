import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import MyProfile from '../pages/MyProfile';

// Minimal mock for useMeProfile to avoid network
vi.mock('../hooks/useMeProfile', () => ({
  default: () => ({ loading: false, error: null, kind: 'crew', data: { crew_id: '001-A', name: 'Crew Demo' } }),
}));

// Mock Profile components to simple markers to avoid deep tree requirements
vi.mock('../pages/Hubs/Crew/CrewProfile', () => ({ default: ({ showHeader }: any) => <div data-testid="crew-profile" data-showheader={String(!!showHeader)} /> }));

// Page relies on Page layout; we can stub UserWidget to reduce noise if needed
vi.mock('../components/UserWidget', () => ({ default: () => <div data-testid="user-widget" /> }));

describe('MyProfile page', () => {
  it('renders tabs-only profile (no header card) for non-admin roles', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/me/profile' }] }>
        <MyProfile />
      </MemoryRouter>
    );
    // Our stubbed CrewProfile exposes showHeader=false via prop marker
    const crew = screen.getByTestId('crew-profile');
    expect(crew).toBeInTheDocument();
    expect(crew.getAttribute('data-showheader')).toBe('false');
  });
});
