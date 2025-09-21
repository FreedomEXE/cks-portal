import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/shared/api/admin', () => ({
  useAdminUsers: () => ({ data: [], isLoading: false, error: null }),
  fetchAdminUsers: vi.fn(),
}));

import AdminHub from '../src/hubs/AdminHub';

describe('AdminHub contractors tab', () => {
  it('imports without throwing', () => {
    expect(typeof AdminHub).toBe('function');
  });
});
