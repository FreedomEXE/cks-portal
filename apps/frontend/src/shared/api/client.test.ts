/**
 * Tests for apiFetch - Tombstone Fallback on 404
 *
 * Validates that apiFetch correctly handles 404 responses:
 * - Positive: 404 on detail endpoint → attempts tombstone snapshot
 * - Negative: 404 on non-detail endpoint → throws 404 immediately
 * - Edge: Detail endpoint 404 but snapshot unavailable → throws 404
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from './client';

// Mock the entity catalog import
vi.mock('../constants/entityCatalog', () => ({
  ENTITY_CATALOG: {
    order: {
      detailsEndpoint: (id: string) => `/api/order/${id}/details`,
    },
    report: {
      detailsEndpoint: (id: string) => `/api/reports/${id}/details`,
    },
    service: {
      detailsEndpoint: (id: string) => `/api/services/${id}/details`,
    },
    // Product has no detailsEndpoint
    product: {
      listEndpoint: '/api/products',
    },
  },
}));

// Mock LoadingService
vi.mock('../loading', () => ({
  start: () => () => {},
}));

describe('apiFetch - Tombstone Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Positive: 404 on detail endpoint → tombstone fallback', () => {
    it('should fetch tombstone snapshot for deleted order', async () => {
      const orderId = 'PO-001';
      const snapshotData = {
        orderId,
        title: 'Test Order',
        status: 'completed',
      };

      // Mock 404 for detail endpoint
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Order not found',
          json: async () => ({}),
        } as Response)
        // Mock success for snapshot endpoint
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              snapshot: snapshotData,
              deletedAt: '2025-01-15T10:00:00Z',
              deletedBy: 'ADMIN-001',
              deletionReason: 'Test deletion',
            },
          }),
        } as Response);

      const result = await apiFetch(`/api/order/${orderId}/details`);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        data: {
          ...snapshotData,
          isDeleted: true,
          deletedAt: '2025-01-15T10:00:00Z',
          deletedBy: 'ADMIN-001',
          deletionReason: 'Test deletion',
          isTombstone: true,
        },
        meta: {
          isTombstone: true,
        },
      });
    });

    it('should fetch tombstone snapshot for deleted report', async () => {
      const reportId = 'RPT-001';
      const snapshotData = {
        id: reportId,
        reportReason: 'Test Report',
        status: 'resolved',
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Report not found',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              snapshot: snapshotData,
              deletedAt: '2025-01-15T11:00:00Z',
              deletedBy: 'ADMIN-002',
              deletionReason: 'Archived and purged',
            },
          }),
        } as Response);

      const result = await apiFetch(`/api/reports/${reportId}/details`);

      expect(result.data).toMatchObject({
        ...snapshotData,
        isDeleted: true,
        isTombstone: true,
      });
      expect(result.meta?.isTombstone).toBe(true);
    });

    it('should fetch tombstone snapshot for deleted service', async () => {
      const serviceId = 'SVC-001';
      const snapshotData = {
        serviceId,
        title: 'Test Service',
        status: 'completed',
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Service not found',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              snapshot: snapshotData,
              deletedAt: '2025-01-15T12:00:00Z',
              deletedBy: 'ADMIN-003',
            },
          }),
        } as Response);

      const result = await apiFetch(`/api/services/${serviceId}/details`);

      expect(result.data).toMatchObject({
        ...snapshotData,
        isDeleted: true,
        isTombstone: true,
      });
    });
  });

  describe('Negative: 404 on non-detail endpoint → no tombstone attempt', () => {
    it('should throw 404 for list endpoints without tombstone attempt', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Products not found',
      } as Response);

      await expect(apiFetch('/api/products')).rejects.toThrow('Products not found');

      // Should only call fetch once (no snapshot attempt)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw 404 for action endpoints without tombstone attempt', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Action not found',
      } as Response);

      await expect(apiFetch('/api/order/PO-001/approve')).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw 404 for non-catalog endpoints without tombstone attempt', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      } as Response);

      await expect(apiFetch('/api/unknown/123/details')).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases: Snapshot unavailable or invalid', () => {
    it('should throw 404 when snapshot endpoint returns 404', async () => {
      const orderId = 'PO-001';

      global.fetch = vi.fn()
        // Detail endpoint 404
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Order not found',
        } as Response)
        // Snapshot endpoint also 404
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Snapshot not found',
        } as Response);

      await expect(apiFetch(`/api/order/${orderId}/details`)).rejects.toMatchObject({
        message: 'Order not found',
        status: 404,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw 404 when snapshot endpoint returns invalid data', async () => {
      const orderId = 'PO-001';

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Order not found',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: false, // Invalid snapshot response
            data: null,
          }),
        } as Response);

      await expect(apiFetch(`/api/order/${orderId}/details`)).rejects.toMatchObject({
        message: 'Order not found',
        status: 404,
      });
    });

    it('should throw 404 when snapshot endpoint returns malformed JSON', async () => {
      const orderId = 'PO-001';

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Order not found',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        } as Response);

      await expect(apiFetch(`/api/order/${orderId}/details`)).rejects.toMatchObject({
        message: 'Order not found',
        status: 404,
      });
    });
  });

  describe('Other status codes: No tombstone attempt', () => {
    it('should throw 401 without tombstone attempt', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      await expect(apiFetch('/api/order/PO-001/details')).rejects.toMatchObject({
        message: 'Unauthorized',
        status: 401,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw 403 without tombstone attempt', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      } as Response);

      await expect(apiFetch('/api/order/PO-001/details')).rejects.toMatchObject({
        message: 'Forbidden',
        status: 403,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw 500 without tombstone attempt', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      await expect(apiFetch('/api/order/PO-001/details')).rejects.toMatchObject({
        message: 'Internal Server Error',
        status: 500,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success cases: No tombstone attempt needed', () => {
    it('should return data for successful detail endpoint requests', async () => {
      const orderId = 'PO-001';
      const orderData = {
        orderId,
        title: 'Active Order',
        status: 'pending',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: orderData, success: true }),
      } as Response);

      const result = await apiFetch(`/api/order/${orderId}/details`);

      expect(result).toEqual({ data: orderData, success: true });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
