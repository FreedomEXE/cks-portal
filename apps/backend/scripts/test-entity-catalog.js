/**
 * Entity Catalog Test Script
 *
 * Validates all entity catalog functionality:
 * - ID pattern matching
 * - Helper functions
 * - Capability checks
 * - Unknown entity fallback
 *
 * Run: node scripts/test-entity-catalog.js
 */

// Import from TypeScript using tsx
const path = require('path');
const catalogPath = path.join(__dirname, '../server/shared/entityCatalog.ts');

// Test data
const TEST_IDS = {
  // Valid IDs
  order_service: 'SO-123',
  order_product: 'PO-456',
  order_scoped: 'CEN-010-SO-789',
  order_lowercase: 'so-999',
  report: 'RPT-123',
  report_scoped: 'CEN-010-RPT-456',
  feedback: 'FBK-789',
  service: 'SRV-123',
  product_short: 'PROD-123',
  product_padded: 'PRD-00000123',
  manager: 'MGR-456',
  contractor: 'CON-789',
  customer: 'CUS-101',
  center: 'CEN-202',
  crew: 'CRW-303',
  warehouse: 'WAR-404',

  // Invalid IDs
  invalid_format: 'INVALID-999',
  invalid_empty: '',
  invalid_pattern: 'ORDER-123',
};

async function runTests() {
  console.log('='.repeat(80));
  console.log('Entity Catalog Test Suite');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Dynamically import the catalog
    const catalog = await import(catalogPath);
    const {
      ENTITY_CATALOG,
      getEntityDefinition,
      getEntityByIdPattern,
      getAllEntityTypes,
      supportsLifecycleAction,
      validateEntityId,
      getEntityTableMapping,
      getActivityType
    } = catalog;

    let passCount = 0;
    let failCount = 0;

    const assert = (condition, testName) => {
      if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passCount++;
      } else {
        console.log(`❌ FAIL: ${testName}`);
        failCount++;
      }
    };

    // ===== Test 1: Catalog Structure =====
    console.log('\n📋 Test Group 1: Catalog Structure');
    console.log('-'.repeat(80));

    assert(
      ENTITY_CATALOG.order !== undefined,
      'Catalog contains order entity'
    );

    assert(
      ENTITY_CATALOG.report !== undefined,
      'Catalog contains report entity'
    );

    assert(
      ENTITY_CATALOG.unknown !== undefined,
      'Catalog contains unknown fallback entity'
    );

    assert(
      Object.keys(ENTITY_CATALOG).length === 12,
      'Catalog contains exactly 12 entities (11 types + unknown)'
    );

    // ===== Test 2: ID Pattern Matching =====
    console.log('\n🔍 Test Group 2: ID Pattern Matching');
    console.log('-'.repeat(80));

    // Orders
    assert(
      getEntityByIdPattern(TEST_IDS.order_service).type === 'order',
      `Service order ID (${TEST_IDS.order_service}) resolves to order`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.order_product).type === 'order',
      `Product order ID (${TEST_IDS.order_product}) resolves to order`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.order_scoped).type === 'order',
      `Scoped order ID (${TEST_IDS.order_scoped}) resolves to order`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.order_lowercase).type === 'order',
      `Lowercase order ID (${TEST_IDS.order_lowercase}) resolves to order (case-insensitive)`
    );

    // Reports
    assert(
      getEntityByIdPattern(TEST_IDS.report).type === 'report',
      `Report ID (${TEST_IDS.report}) resolves to report`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.report_scoped).type === 'report',
      `Scoped report ID (${TEST_IDS.report_scoped}) resolves to report`
    );

    // Feedback
    assert(
      getEntityByIdPattern(TEST_IDS.feedback).type === 'feedback',
      `Feedback ID (${TEST_IDS.feedback}) resolves to feedback`
    );

    // Service
    assert(
      getEntityByIdPattern(TEST_IDS.service).type === 'service',
      `Service ID (${TEST_IDS.service}) resolves to service`
    );

    // Product (multiple formats)
    assert(
      getEntityByIdPattern(TEST_IDS.product_short).type === 'product',
      `Product ID short format (${TEST_IDS.product_short}) resolves to product`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.product_padded).type === 'product',
      `Product ID padded format (${TEST_IDS.product_padded}) resolves to product`
    );

    // User entities
    assert(
      getEntityByIdPattern(TEST_IDS.manager).type === 'manager',
      `Manager ID (${TEST_IDS.manager}) resolves to manager`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.contractor).type === 'contractor',
      `Contractor ID (${TEST_IDS.contractor}) resolves to contractor`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.customer).type === 'customer',
      `Customer ID (${TEST_IDS.customer}) resolves to customer`
    );

    // Location entities
    assert(
      getEntityByIdPattern(TEST_IDS.center).type === 'center',
      `Center ID (${TEST_IDS.center}) resolves to center`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.crew).type === 'crew',
      `Crew ID (${TEST_IDS.crew}) resolves to crew`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.warehouse).type === 'warehouse',
      `Warehouse ID (${TEST_IDS.warehouse}) resolves to warehouse`
    );

    // Unknown fallback
    assert(
      getEntityByIdPattern(TEST_IDS.invalid_format).type === 'unknown',
      `Invalid format ID (${TEST_IDS.invalid_format}) resolves to unknown`
    );

    assert(
      getEntityByIdPattern(TEST_IDS.invalid_pattern).type === 'unknown',
      `Invalid pattern ID (${TEST_IDS.invalid_pattern}) resolves to unknown`
    );

    // ===== Test 3: Helper Functions =====
    console.log('\n🔧 Test Group 3: Helper Functions');
    console.log('-'.repeat(80));

    // getEntityDefinition
    const orderDef = getEntityDefinition('order');
    assert(
      orderDef.type === 'order',
      'getEntityDefinition("order") returns order definition'
    );

    assert(
      orderDef.displayName === 'Order',
      'Order definition has correct displayName'
    );

    assert(
      orderDef.backendTable === 'orders',
      'Order definition has correct backendTable'
    );

    // Unknown fallback
    const unknownDef = getEntityDefinition('nonexistent');
    assert(
      unknownDef.type === 'unknown',
      'getEntityDefinition for non-existent type returns unknown'
    );

    // getAllEntityTypes
    const allTypes = getAllEntityTypes();
    assert(
      allTypes.length === 11,
      'getAllEntityTypes returns 11 types (excluding unknown)'
    );

    assert(
      !allTypes.includes('unknown'),
      'getAllEntityTypes excludes unknown entity'
    );

    assert(
      allTypes.includes('order') && allTypes.includes('report'),
      'getAllEntityTypes includes order and report'
    );

    // ===== Test 4: Capability Checks =====
    console.log('\n⚙️  Test Group 4: Capability Checks');
    console.log('-'.repeat(80));

    // Orders support everything
    assert(
      supportsLifecycleAction('order', 'archive') === true,
      'Orders support archive'
    );

    assert(
      supportsLifecycleAction('order', 'delete') === true,
      'Orders support delete'
    );

    assert(
      supportsLifecycleAction('order', 'restore') === true,
      'Orders support restore'
    );

    assert(
      supportsLifecycleAction('order', 'history') === true,
      'Orders support history'
    );

    assert(
      supportsLifecycleAction('order', 'tombstone') === true,
      'Orders support tombstone'
    );

    assert(
      supportsLifecycleAction('order', 'detailFetch') === true,
      'Orders support detailFetch'
    );

    // Products have limited support
    assert(
      supportsLifecycleAction('product', 'archive') === true,
      'Products support archive'
    );

    assert(
      supportsLifecycleAction('product', 'history') === false,
      'Products do NOT support history'
    );

    assert(
      supportsLifecycleAction('product', 'tombstone') === false,
      'Products do NOT support tombstone'
    );

    assert(
      supportsLifecycleAction('product', 'detailFetch') === false,
      'Products do NOT support detailFetch'
    );

    // Services pending features
    assert(
      supportsLifecycleAction('service', 'detailFetch') === false,
      'Services do NOT support detailFetch (pending)'
    );

    assert(
      supportsLifecycleAction('service', 'tombstone') === false,
      'Services do NOT support tombstone (pending)'
    );

    // Unknown supports nothing
    assert(
      supportsLifecycleAction('unknown', 'archive') === false,
      'Unknown entity does NOT support archive'
    );

    // ===== Test 5: Validation =====
    console.log('\n✅ Test Group 5: ID Validation');
    console.log('-'.repeat(80));

    // Valid IDs
    const validOrder = validateEntityId(TEST_IDS.order_service);
    assert(
      validOrder.valid === true && validOrder.type === 'order',
      `Valid order ID (${TEST_IDS.order_service}) passes validation`
    );

    const validReport = validateEntityId(TEST_IDS.report);
    assert(
      validReport.valid === true && validReport.type === 'report',
      `Valid report ID (${TEST_IDS.report}) passes validation`
    );

    // Invalid IDs
    const invalidFormat = validateEntityId(TEST_IDS.invalid_format);
    assert(
      invalidFormat.valid === false && invalidFormat.type === 'unknown',
      `Invalid format ID (${TEST_IDS.invalid_format}) fails validation`
    );

    const emptyId = validateEntityId(TEST_IDS.invalid_empty);
    assert(
      emptyId.valid === false && emptyId.reason === 'Empty ID',
      'Empty ID fails validation with correct reason'
    );

    // ===== Test 6: Backend-Specific Functions =====
    console.log('\n🗄️  Test Group 6: Backend-Specific Functions');
    console.log('-'.repeat(80));

    // getEntityTableMapping
    const orderMapping = getEntityTableMapping('order');
    assert(
      orderMapping.table === 'orders' && orderMapping.idColumn === 'order_id',
      'Order table mapping returns correct table and column'
    );

    const reportMapping = getEntityTableMapping('report');
    assert(
      reportMapping.table === 'reports' && reportMapping.idColumn === 'report_id',
      'Report table mapping returns correct table and column'
    );

    const feedbackMapping = getEntityTableMapping('feedback');
    assert(
      feedbackMapping.table === 'reports',
      'Feedback shares table with reports'
    );

    // getActivityType
    const orderArchived = getActivityType('order', 'archived');
    assert(
      orderArchived === 'order_archived',
      'Order archived activity type is correct'
    );

    const orderDeleted = getActivityType('order', 'deleted');
    assert(
      orderDeleted === 'order_hard_deleted',
      'Order deleted activity type is correct'
    );

    const reportCreated = getActivityType('report', 'created');
    assert(
      reportCreated === 'report_created',
      'Report created activity type is correct'
    );

    // ===== Test 7: Entity-Specific Details =====
    console.log('\n📝 Test Group 7: Entity-Specific Details');
    console.log('-'.repeat(80));

    // Order tokens
    const orderTokens = ENTITY_CATALOG.order.idToken;
    assert(
      Array.isArray(orderTokens) && orderTokens.includes('SO') && orderTokens.includes('PO'),
      'Order has both SO and PO tokens'
    );

    // Product tokens
    const productTokens = ENTITY_CATALOG.product.idToken;
    assert(
      Array.isArray(productTokens) && productTokens.includes('PROD') && productTokens.includes('PRD'),
      'Product has both PROD and PRD tokens'
    );

    // Manager scope prefix
    const managerPrefix = ENTITY_CATALOG.manager.scopePrefix;
    assert(
      managerPrefix === 'MGR-',
      'Manager has correct scope prefix'
    );

    // Service canonical token
    const serviceToken = ENTITY_CATALOG.service.idToken;
    assert(
      serviceToken === 'SRV',
      'Service uses SRV token (not SVC)'
    );

    // ===== Summary =====
    console.log('\n' + '='.repeat(80));
    console.log('Test Summary');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total:  ${passCount + failCount}`);
    console.log('');

    if (failCount === 0) {
      console.log('🎉 All tests passed! Entity catalog is working correctly.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review the catalog implementation.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error running tests:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
