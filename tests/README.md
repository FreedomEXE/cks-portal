# E2E Testing with Playwright

This directory contains end-to-end tests for the CKS Portal using Playwright.

## Setup

1. **Install dependencies** (already done if you've run `pnpm install`):
   ```bash
   pnpm install
   ```

2. **Configure test credentials** (already done):
   - Credentials are stored in `.env.test` (not committed to git)
   - All test users share password: `ckstest123`

3. **Start the development server**:
   ```bash
   pnpm dev:frontend
   ```

## Running Tests

### Run all tests:
```bash
pnpm test:e2e
```

### Run specific test file:
```bash
pnpm exec playwright test tests/e2e/crew/orders.spec.ts
```

### Run in headed mode (see browser):
```bash
pnpm exec playwright test --headed
```

### Run in debug mode (step through tests):
```bash
pnpm exec playwright test --debug
```

### Run performance tests only:
```bash
pnpm exec playwright test tests/e2e/crew/performance.spec.ts
```

## Test Structure

```
tests/
├── e2e/
│   ├── crew/          # Crew hub tests
│   ├── manager/       # Manager hub tests
│   ├── warehouse/     # Warehouse hub tests
│   ├── contractor/    # Contractor hub tests
│   ├── customer/      # Customer hub tests
│   ├── center/        # Center hub tests
│   └── admin/         # Admin hub tests
├── fixtures/
│   └── users.ts       # Login helpers and test user data
└── utils/
    └── modal-helpers.ts  # Reusable modal interaction utilities
```

## Test Users

| Role | Email | Code | Name |
|------|-------|------|------|
| Manager | janedoe+clerk_test@example.com | MGR-012 | Jane |
| Contractor | bobdole+clerk_test@example.com | CON-010 | Maria |
| Customer | jimmycarter+clerk_test@example.com | CUS-015 | Bob |
| Center | bennyblanco+clerk_test@example.com | CEN-010 | Penelope |
| Crew | jamesjimmy+clerk_test@example.com | CRW-006 | Wario |
| Warehouse | warehousetest+clerk_test@example.com | WHS-004 | Manuel |
| Admin | admin@ckscontracting.ca | FREEDOM_EXE | Freedom |

All passwords: `ckstest123`

## Writing New Tests

### Example: Basic Modal Test

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/users';
import { openOrderFromActivityFeed, verifyOrderModalContent } from '../../utils/modal-helpers';

test('should open order modal', async ({ page }) => {
  await loginAs(page, 'crew');

  const orderId = 'CRW-006-PO-111';
  await openOrderFromActivityFeed(page, orderId);
  await verifyOrderModalContent(page, orderId);
});
```

### Example: Performance Test

```typescript
import { test } from '@playwright/test';
import { loginAs } from '../../fixtures/users';
import { measureModalPerformance } from '../../utils/modal-helpers';

test('measure modal open time', async ({ page }) => {
  await loginAs(page, 'crew');

  const { duration, apiCalls } = await measureModalPerformance(page, async () => {
    await page.click('[data-order-id="CRW-006-PO-111"]');
  });

  console.log(`Modal opened in ${duration}ms`);
  console.log(`API calls: ${apiCalls.length}`);
});
```

## Reports

After running tests, view the HTML report:
```bash
pnpm exec playwright show-report
```

Test results are saved to:
- HTML Report: `playwright-report/`
- JSON Results: `test-results/results.json`
- Screenshots/Videos: `test-results/` (on failure only)

## Debugging Failed Tests

1. **Check screenshots** in `test-results/` folder
2. **Watch video recordings** of failed tests
3. **View trace** with `pnpm exec playwright show-trace test-results/trace.zip`
4. **Run in debug mode** with `--debug` flag

## Performance Tracking

The performance tests track:
- Modal open time (target: <2000ms, current: ~4000ms)
- API call count during modal open
- Duplicate API calls (optimization opportunities)

Run performance tests regularly to track improvements:
```bash
pnpm test:e2e:perf
```

## CI/CD Integration

Tests can be run in CI with:
```bash
pnpm exec playwright test --reporter=github
```

Environment variables:
- `CI=true` - Enables CI mode (no parallel, retries enabled)
- `PLAYWRIGHT_BASE_URL` - Override base URL
- `TEST_PASSWORD` - Override test password

## Troubleshooting

### Tests fail with "Cannot find module"
Run `pnpm install` to ensure all dependencies are installed.

### Login fails with timeout
- Check that frontend is running on `http://localhost:3000`
- Verify test credentials in `.env.test`
- Adjust selectors in `tests/fixtures/users.ts` if Clerk UI changed

### Modal doesn't open
- Check selector in `tests/utils/modal-helpers.ts`
- Add `data-testid` attributes to your components for more reliable selectors

### Performance tests show <2s but feel slow
- Check network throttling settings
- Run tests without other apps running
- Performance may vary based on backend response times
