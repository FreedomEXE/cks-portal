# Contractor Hub - Testing Guide

## Testing Strategy

### Testing Pyramid
```
E2E Tests (5%)
├── Critical user journeys
├── Cross-browser compatibility  
└── Integration scenarios

Integration Tests (25%)
├── API integration
├── Component integration
└── Data flow validation

Unit Tests (70%)
├── Component logic
├── Utility functions
├── Hooks and state management
└── Data transformations
```

## Unit Testing

### Component Testing
```typescript
// ContractorRecentActions.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ContractorRecentActions from '../components/ContractorRecentActions';
import * as contractorApi from '../utils/contractorApi';

// Mock API calls
vi.mock('../utils/contractorApi');

describe('ContractorRecentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    render(<ContractorRecentActions code="CON-001" />);
    expect(screen.getByText('Loading recent actions...')).toBeInTheDocument();
  });

  it('displays activities when loaded', async () => {
    const mockActivities = [
      {
        activity_id: 'act-001',
        description: 'Order assigned',
        activity_type: 'order_assigned',
        created_at: new Date().toISOString()
      }
    ];

    vi.mocked(contractorApi.contractorApiFetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockActivities }),
      text: () => Promise.resolve(JSON.stringify({ data: mockActivities }))
    } as Response);

    render(<ContractorRecentActions code="CON-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Order assigned')).toBeInTheDocument();
    });
  });

  it('handles clear activity action', async () => {
    // Test clear activity functionality
    vi.mocked(contractorApi.contractorApiFetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);

    render(<ContractorRecentActions code="CON-001" />);
    
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    // Mock confirm dialog
    window.confirm = vi.fn(() => true);
    
    await waitFor(() => {
      expect(contractorApi.contractorApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clear-activity'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
```

### Hook Testing
```typescript
// useContractorData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useContractorData } from '../hooks/useContractorData';
import * as contractorApi from '../utils/contractorApi';

vi.mock('../utils/contractorApi');

describe('useContractorData', () => {
  it('fetches contractor data successfully', async () => {
    const mockContractor = {
      contractor_id: 'CON-001',
      name: 'Test Contractor',
      email: 'test@contractor.com'
    };

    vi.mocked(contractorApi.contractorApiFetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockContractor })
    } as Response);

    const { result } = renderHook(() => useContractorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockContractor);
      expect(result.current.error).toBeNull();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(contractorApi.contractorApiFetch).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useContractorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });
  });
});
```

### Utility Testing
```typescript
// contractorApi.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildContractorApiUrl, contractorApiFetch } from '../utils/contractorApi';

describe('contractorApi utilities', () => {
  describe('buildContractorApiUrl', () => {
    it('builds URL with base path', () => {
      const url = buildContractorApiUrl('/profile');
      expect(url).toBe('/api/contractor/profile');
    });

    it('includes query parameters', () => {
      const url = buildContractorApiUrl('/orders', { status: 'active', limit: 10 });
      expect(url).toBe('/api/contractor/orders?status=active&limit=10');
    });

    it('filters out empty parameters', () => {
      const url = buildContractorApiUrl('/test', { 
        valid: 'value', 
        empty: '', 
        null: null, 
        undefined: undefined 
      });
      expect(url).toBe('/api/contractor/test?valid=value');
    });
  });

  describe('contractorApiFetch', () => {
    it('includes required headers', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as Response);

      await contractorApiFetch('/test');

      expect(fetchSpy).toHaveBeenCalledWith('/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Accept': 'application/json',
          'x-hub-type': 'contractor'
        })
      }));
    });
  });
});
```

## Integration Testing

### API Integration Tests
```typescript
// contractor.integration.test.ts
import { describe, it, expect } from 'vitest';
import { setupTestServer } from '../../../test/setup';
import { contractorApiFetch, buildContractorApiUrl } from '../utils/contractorApi';

const server = setupTestServer();

describe('Contractor API Integration', () => {
  it('fetches contractor profile', async () => {
    const response = await contractorApiFetch(
      buildContractorApiUrl('/profile', { code: 'CON-TEST' })
    );
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('contractor_id');
    expect(data).toHaveProperty('name');
  });

  it('updates contractor profile', async () => {
    const updateData = {
      name: 'Updated Contractor Name',
      phone: '(555) 123-4567'
    };

    const response = await contractorApiFetch(
      buildContractorApiUrl('/profile'),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }
    );

    expect(response.ok).toBe(true);
  });

  it('handles authentication errors', async () => {
    // Test without authentication headers
    const response = await fetch('/api/contractor/profile');
    expect(response.status).toBe(401);
  });
});
```

### Component Integration Tests
```typescript
// ContractorHub.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContractorHub from '../index';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Contractor Hub Integration', () => {
  it('navigates between tabs correctly', async () => {
    renderWithRouter(<ContractorHub />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate to Orders tab
    fireEvent.click(screen.getByText('Orders'));
    
    await waitFor(() => {
      expect(screen.getByText('Order Management')).toBeInTheDocument();
    });

    // Navigate to Profile tab
    fireEvent.click(screen.getByText('MyProfile'));
    
    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
  });

  it('maintains state across tab navigation', async () => {
    renderWithRouter(<ContractorHub />);

    // Perform action in Dashboard
    const clearButton = await screen.findByText('Clear');
    fireEvent.click(clearButton);

    // Navigate away and back
    fireEvent.click(screen.getByText('Orders'));
    fireEvent.click(screen.getByText('Dashboard'));

    // Verify state is maintained
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });
});
```

## End-to-End Testing

### Critical User Journeys
```typescript
// contractor-e2e.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('Contractor Hub E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/CON-001/hub');
    // Add authentication setup
  });

  test('contractor can view and manage orders', async ({ page }) => {
    // Navigate to Orders tab
    await page.click('text=Orders');
    
    // Verify orders are loaded
    await expect(page.locator('[data-testid=orders-list]')).toBeVisible();
    
    // Click on first order
    await page.click('[data-testid=order-item]:first-child');
    
    // Verify order details modal
    await expect(page.locator('[data-testid=order-details]')).toBeVisible();
    
    // Update order status
    await page.selectOption('[data-testid=status-select]', 'in_progress');
    await page.click('[data-testid=save-status]');
    
    // Verify success message
    await expect(page.locator('text=Status updated successfully')).toBeVisible();
  });

  test('contractor can update profile information', async ({ page }) => {
    // Navigate to Profile tab
    await page.click('text=MyProfile');
    
    // Update phone number
    await page.fill('[data-testid=phone-input]', '(555) 987-6543');
    
    // Save changes
    await page.click('[data-testid=save-profile]');
    
    // Verify success
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    
    // Verify persisted change
    await page.reload();
    await expect(page.locator('[data-testid=phone-input]')).toHaveValue('(555) 987-6543');
  });

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('/api/contractor/**', route => route.abort());
    
    // Navigate to dashboard
    await page.goto('/CON-001/hub');
    
    // Verify fallback content is shown
    await expect(page.locator('text=Unable to load data')).toBeVisible();
    
    // Verify retry mechanism
    await page.click('[data-testid=retry-button]');
  });
});
```

## Test Data Management

### Mock Data Factory
```typescript
// mockData.ts
export const createMockContractor = (overrides = {}) => ({
  contractor_id: 'CON-001',
  name: 'Test Contractor',
  email: 'test@contractor.com',
  phone: '(555) 123-4567',
  business_type: 'llc',
  rating: 4.8,
  total_orders: 156,
  status: 'active',
  ...overrides
});

export const createMockOrder = (overrides = {}) => ({
  order_id: 'ORD-001',
  customer_name: 'John Smith',
  service_type: 'roofing',
  status: 'assigned',
  priority: 'medium',
  estimated_value: 2500.00,
  ...overrides
});

export const createMockActivity = (overrides = {}) => ({
  activity_id: 'act-001',
  description: 'Order assigned',
  activity_type: 'order_assigned',
  created_at: new Date().toISOString(),
  ...overrides
});
```

### Test Environment Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

## Performance Testing

### Load Testing Scenarios
- Concurrent user sessions
- Large dataset rendering
- API response time under load
- Memory usage optimization

### Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- ARIA label verification

---

*Comprehensive testing strategy for Contractor hub reliability*