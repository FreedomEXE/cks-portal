# Center Hub Testing Documentation

## Overview

Testing strategies and specifications for Center hub components, focusing on territory management, contractor coordination, and regional operations validation.

## Testing Strategy

### Testing Pyramid

```
     E2E Tests (10%)
   ─────────────────
 Integration Tests (20%)
 ─────────────────────────
    Unit Tests (70%)
 ─────────────────────────────
```

### Test Categories

1. **Unit Tests**: Individual components and functions
2. **Integration Tests**: Component interactions and API integration
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: Load and response time testing
5. **Security Tests**: Authorization and data protection

## Unit Testing

### Component Testing

#### CenterRecentActions Component

```typescript
// CenterRecentActions.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CenterRecentActions from '../CenterRecentActions';
import * as centerApi from '../../api/center';

// Mock the API module
jest.mock('../../api/center');
const mockCenterApi = centerApi as jest.Mocked<typeof centerApi>;

describe('CenterRecentActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading state initially', () => {
    mockCenterApi.getCenterActivity.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<CenterRecentActions code="CEN-001" />);
    
    expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(3);
  });

  it('displays activities when loaded successfully', async () => {
    const mockActivities = [
      {
        activity_id: 'act-001',
        center_id: 'CEN-001',
        activity_type: 'territory_update',
        description: 'Territory boundaries updated',
        created_at: '2025-01-01T12:00:00Z'
      }
    ];
    
    mockCenterApi.getCenterActivity.mockResolvedValue({
      data: mockActivities
    });
    
    render(<CenterRecentActions code="CEN-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Territory boundaries updated')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockCenterApi.getCenterActivity.mockRejectedValue(
      new Error('Network error')
    );
    
    render(<CenterRecentActions code="CEN-001" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('clears activities when clear button is clicked', async () => {
    mockCenterApi.getCenterActivity.mockResolvedValue({
      data: [{ activity_id: 'act-001', description: 'Test activity' }]
    });
    mockCenterApi.clearCenterActivity.mockResolvedValue({ success: true });
    
    render(<CenterRecentActions code="CEN-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test activity')).toBeInTheDocument();
    });
    
    const clearButton = screen.getByText('Clear All');
    await userEvent.click(clearButton);
    
    await waitFor(() => {
      expect(mockCenterApi.clearCenterActivity).toHaveBeenCalledWith('CEN-001');
    });
  });

  it('displays mock data when no code provided', () => {
    render(<CenterRecentActions />);
    
    // Should display mock activities
    expect(screen.getByText(/Territory boundaries updated/)).toBeInTheDocument();
  });
});
```

#### useCenterData Hook Testing

```typescript
// useCenterData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useCenterData } from '../useCenterData';
import * as centerApi from '../../utils/centerApi';
import * as centerAuth from '../../utils/centerAuth';

jest.mock('../../utils/centerApi');
jest.mock('../../utils/centerAuth');

const mockCenterApi = centerApi as jest.Mocked<typeof centerApi>;
const mockCenterAuth = centerAuth as jest.Mocked<typeof centerAuth>;

describe('useCenterData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCenterAuth.validateCenterRole.mockReturnValue(true);
  });

  it('fetches center data on mount', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue({
        data: { center_id: 'CEN-001', name: 'Test Center' }
      }),
      ok: true,
      status: 200
    };
    
    mockCenterApi.centerApiFetch.mockResolvedValue(mockResponse as any);
    
    const { result } = renderHook(() => useCenterData());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({
        center_id: 'CEN-001',
        name: 'Test Center'
      });
    });
  });

  it('handles 404 errors with fallback', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      ok: false,
      status: 404
    };
    
    mockCenterApi.centerApiFetch.mockResolvedValue(mockResponse as any);
    
    const { result } = renderHook(() => useCenterData());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data.center_id).toBe('CEN-000');
      expect(result.current.data._stub).toBe(true);
    });
  });

  it('refetches data when refetch is called', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue({
        data: { center_id: 'CEN-001' }
      }),
      ok: true
    };
    
    mockCenterApi.centerApiFetch.mockResolvedValue(mockResponse as any);
    
    const { result } = renderHook(() => useCenterData());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Clear mock calls
    mockCenterApi.centerApiFetch.mockClear();
    
    // Call refetch
    result.current.refetch();
    
    await waitFor(() => {
      expect(mockCenterApi.centerApiFetch).toHaveBeenCalledTimes(1);
    });
  });
});
```

### API Testing

```typescript
// center.test.ts
import * as centerApi from '../center';
import { centerApiFetch } from '../../utils/centerApi';

jest.mock('../../utils/centerApi');
const mockFetch = centerApiFetch as jest.MockedFunction<typeof centerApiFetch>;

describe('Center API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCenterProfile', () => {
    it('fetches center profile successfully', async () => {
      const mockProfile = {
        center_id: 'CEN-001',
        name: 'Test Center',
        region: 'North'
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: mockProfile })
      } as any);
      
      const result = await centerApi.getCenterProfile('CEN-001');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/center/profile?code=CEN-001'
      );
      expect(result.data).toEqual(mockProfile);
    });

    it('throws error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      } as any);
      
      await expect(centerApi.getCenterProfile('CEN-001'))
        .rejects
        .toThrow('Failed to fetch center profile: 500');
    });
  });

  describe('getCenterTerritories', () => {
    it('fetches territories with correct parameters', async () => {
      const mockTerritories = [
        { territory_id: 'TER-001', name: 'North Territory' }
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: mockTerritories })
      } as any);
      
      const result = await centerApi.getCenterTerritories('CEN-001');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/center/territories?code=CEN-001'
      );
      expect(result.data).toEqual(mockTerritories);
    });
  });
});
```

## Integration Testing

### Component Integration

```typescript
// CenterDashboard.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CenterProvider } from '../context/CenterContext';
import CenterDashboard from '../CenterDashboard';
import { server } from '../../../__mocks__/server';
import { centerHandlers } from '../../../__mocks__/handlers';

// Setup MSW for API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Center Dashboard Integration', () => {
  const renderWithProvider = (centerId = 'CEN-001') => {
    return render(
      <CenterProvider centerId={centerId}>
        <CenterDashboard />
      </CenterProvider>
    );
  };

  it('loads complete dashboard with all components', async () => {
    server.use(...centerHandlers);
    
    renderWithProvider();
    
    // Wait for all async operations
    await waitFor(() => {
      expect(screen.getByTestId('center-dashboard')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify all major components loaded
    expect(screen.getByTestId('performance-overview')).toBeInTheDocument();
    expect(screen.getByTestId('territory-map')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activities')).toBeInTheDocument();
    expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
  });

  it('handles API failures gracefully', async () => {
    // Mock API failures
    server.use(
      rest.get('/api/center/profile', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );
    
    renderWithProvider();
    
    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });
});
```

## End-to-End Testing

### User Workflow Tests

```typescript
// center-workflows.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Center Hub Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as center user
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'center@test.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to center hub
    await page.goto('/CEN-001/hub');
    await expect(page.locator('[data-testid="center-dashboard"]')).toBeVisible();
  });

  test('Territory Assignment Workflow', async ({ page }) => {
    // Navigate to territories
    await page.click('text=Territories');
    await expect(page).toHaveURL(/.*territories/);
    
    // Select a territory
    await page.click('[data-testid="territory-TER-001"]');
    await expect(page.locator('[data-testid="territory-details"]')).toBeVisible();
    
    // Assign contractor
    await page.click('[data-testid="assign-contractor-button"]');
    await page.selectOption('[data-testid="contractor-select"]', 'CON-123');
    await page.click('[data-testid="confirm-assignment"]');
    
    // Verify assignment
    await expect(page.locator('text=Contractor assigned successfully')).toBeVisible();
  });

  test('Performance Metrics Access', async ({ page }) => {
    // Navigate to reports
    await page.click('text=Reports');
    await expect(page).toHaveURL(/.*reports/);
    
    // Select performance report
    await page.selectOption('[data-testid="report-type"]', 'performance');
    await page.selectOption('[data-testid="time-period"]', '30d');
    await page.click('[data-testid="generate-report"]');
    
    // Wait for report generation
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible({ timeout: 10000 });
    
    // Verify key metrics are displayed
    await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-satisfaction"]')).toBeVisible();
  });

  test('Order Escalation Workflow', async ({ page }) => {
    // Navigate to orders
    await page.click('text=Orders');
    await expect(page).toHaveURL(/.*orders/);
    
    // Find high-priority order
    await page.click('[data-testid="filter-priority"]');
    await page.selectOption('[data-testid="priority-filter"]', 'urgent');
    
    // Select order for escalation
    await page.click('[data-testid="order-ORD-123456"] [data-testid="escalate-button"]');
    
    // Fill escalation form
    await page.fill('[data-testid="escalation-reason"]', 'Customer complaint requiring immediate attention');
    await page.selectOption('[data-testid="escalation-level"]', 'regional_manager');
    await page.click('[data-testid="submit-escalation"]');
    
    // Verify escalation
    await expect(page.locator('text=Order escalated successfully')).toBeVisible();
  });
});
```

## Performance Testing

### Load Testing

```typescript
// performance.test.ts
import { test, expect } from '@playwright/test';

test.describe('Center Hub Performance', () => {
  test('Dashboard loads within performance budget', async ({ page }) => {
    // Start performance monitoring
    await page.coverage.startJSCoverage();
    
    const startTime = Date.now();
    await page.goto('/CEN-001/hub');
    
    // Wait for dashboard to be fully loaded
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="center-dashboard"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Assert performance requirements
    expect(loadTime).toBeLessThan(3000); // 3 second load time
    
    // Check JavaScript coverage
    const jsCoverage = await page.coverage.stopJSCoverage();
    const totalBytes = jsCoverage.reduce((acc, entry) => acc + entry.text.length, 0);
    expect(totalBytes).toBeLessThan(1024 * 1024); // 1MB JavaScript bundle
  });

  test('Territory map renders efficiently', async ({ page }) => {
    await page.goto('/CEN-001/hub/territories');
    
    // Monitor map rendering performance
    const startTime = Date.now();
    await expect(page.locator('[data-testid="territory-map"]')).toBeVisible();
    
    // Wait for all territories to render
    await page.waitForFunction(() => {
      const territories = document.querySelectorAll('[data-testid^="territory-"]');
      return territories.length >= 5; // Assuming 5+ territories
    });
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000); // 2 second map render
  });
});
```

## Security Testing

### Authorization Tests

```typescript
// security.test.ts
import { test, expect } from '@playwright/test';

test.describe('Center Hub Security', () => {
  test('Unauthorized access is prevented', async ({ page }) => {
    // Attempt to access center hub without login
    await page.goto('/CEN-001/hub');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth.*login/);
  });

  test('Cross-center access is prevented', async ({ page }) => {
    // Login as CEN-001 user
    await loginAsCenterUser(page, 'CEN-001');
    
    // Attempt to access CEN-002 hub
    await page.goto('/CEN-002/hub');
    
    // Should show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('Territory data is filtered by access', async ({ page }) => {
    // Login as limited center user
    await loginAsCenterUser(page, 'CEN-001', 'area');
    
    await page.goto('/CEN-001/hub/territories');
    
    // Should only see assigned territories
    const territories = page.locator('[data-testid^="territory-"]');
    await expect(territories).toHaveCount(1); // Limited access
  });

  test('Sensitive data is masked appropriately', async ({ page }) => {
    await loginAsCenterUser(page, 'CEN-001');
    
    await page.goto('/CEN-001/hub/customers');
    
    // Customer phone numbers should be masked
    const phoneNumbers = page.locator('[data-testid^="customer-phone-"]');
    const firstPhone = await phoneNumbers.first().textContent();
    expect(firstPhone).toMatch(/XXX-XXX-\d{4}/);
  });
});

async function loginAsCenterUser(page, centerId, level = 'regional') {
  // Helper function for consistent login
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', `${centerId.toLowerCase()}@test.com`);
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/.*hub/);
}
```

## Test Data Management

### Mock Data Factories

```typescript
// test-data.ts
export const centerTestData = {
  createMockCenter: (overrides = {}) => ({
    center_id: 'CEN-001',
    name: 'Test Center',
    region: 'North Region',
    email: 'center@test.com',
    phone: '(555) 123-4567',
    total_contractors: 25,
    total_customers: 150,
    efficiency_rating: 4.2,
    ...overrides
  }),

  createMockTerritory: (overrides = {}) => ({
    territory_id: 'TER-001',
    name: 'North Territory',
    center_id: 'CEN-001',
    contractor_count: 5,
    customer_count: 30,
    status: 'active',
    ...overrides
  }),

  createMockActivity: (overrides = {}) => ({
    activity_id: 'act-001',
    center_id: 'CEN-001',
    activity_type: 'territory_update',
    description: 'Territory boundaries updated',
    created_at: new Date().toISOString(),
    ...overrides
  })
};
```

## Continuous Integration

### Test Pipeline

```yaml
# .github/workflows/center-hub-tests.yml
name: Center Hub Tests

on:
  push:
    paths:
      - 'src/hub/roles/center/**'
  pull_request:
    paths:
      - 'src/hub/roles/center/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --testPathPattern=center --coverage
      
      - name: Run integration tests
        run: npm run test:integration -- center
      
      - name: Run E2E tests
        run: npm run test:e2e -- --grep="Center Hub"
      
      - name: Upload coverage
        uses: codecov/codecov-action@v1
        with:
          file: ./coverage/lcov.info
          flags: center-hub
```