import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import ManagerHubRoutes from '../../Manager/HubRoutes';

// Minimal fetch mock
const origFetch = global.fetch;

function mockList(path: string, items: any[]) {
  (global.fetch as any) = vi.fn(async (input: RequestInfo) => {
    if (typeof input === 'string' && input.includes(path)) {
      return new Response(JSON.stringify({ items }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
}

describe('ManagerHub smoke', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    (console.error as any).mockRestore?.();
    global.fetch = origFetch;
  });

  it('renders customers list', async () => {
    mockList('/manager/customers', [{ customer_id: 'CUST-1', company_name: 'Acme' }]);
    render(
      <MemoryRouter initialEntries={['/x/hub/customers']}>
        <Routes>
          <Route path='/:username/hub/*' element={<ManagerHubRoutes />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByText('Customers');
    await screen.findByText('Acme');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('renders contractors list', async () => {
    mockList('/manager/contractors', [{ contractor_id: 'CON-1', company_name: 'BuildCo' }]);
    render(
      <MemoryRouter initialEntries={['/x/hub/contractors']}>
        <Routes>
          <Route path='/:username/hub/*' element={<ManagerHubRoutes />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByText('Contractors');
    await screen.findByText('BuildCo');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('renders centers list', async () => {
    mockList('/manager/centers', [{ center_id: 'CTR-1', name: 'CenterOne' }]);
    render(
      <MemoryRouter initialEntries={['/x/hub/centers']}>
        <Routes>
          <Route path='/:username/hub/*' element={<ManagerHubRoutes />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByText('Centers');
    await screen.findByText('CenterOne');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('renders crew list', async () => {
    mockList('/manager/crew', [{ crew_id: 'CRW-1', name: 'Crew One' }]);
    render(
      <MemoryRouter initialEntries={['/x/hub/crew']}>
        <Routes>
          <Route path='/:username/hub/*' element={<ManagerHubRoutes />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByText('Crew');
    await screen.findByText('Crew One');
    expect(console.error).not.toHaveBeenCalled();
  });
});
