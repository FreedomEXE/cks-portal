import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Page from '../components/Page';

// Stub UserWidget so we can detect presence
vi.mock('../components/UserWidget', () => ({ default: () => <div data-testid="user-widget" /> }));

describe('Page header UserWidget visibility', () => {
  it('shows UserWidget on non-admin routes', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/hubs/crew' }]}>
        <Routes>
          <Route path="/hubs/crew" element={<Page title="Crew Hub">ok</Page>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByTestId('user-widget')).toBeInTheDocument();
  });

  it('hides UserWidget on admin routes', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/jobs' }]}>
        <Routes>
          <Route path="/admin/jobs" element={<Page title="Admin Jobs">ok</Page>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByTestId('user-widget')).not.toBeInTheDocument();
  });
});
