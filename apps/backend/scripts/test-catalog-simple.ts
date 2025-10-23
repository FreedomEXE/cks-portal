/**
 * Simple Entity Catalog Test
 * Run: npx tsx scripts/test-catalog-simple.ts
 */

import {
  ENTITY_CATALOG,
  getEntityDefinition,
  getEntityByIdPattern,
  getAllEntityTypes,
  supportsLifecycleAction,
  validateEntityId,
  getEntityTableMapping,
  getActivityType
} from '../server/shared/entityCatalog';

console.log('='.repeat(80));
console.log('Entity Catalog Quick Test');
console.log('='.repeat(80));
console.log('');

let passCount = 0;
let failCount = 0;

function test(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ ${testName}`);
    passCount++;
  } else {
    console.log(`❌ ${testName}`);
    failCount++;
  }
}

// Test 1: Catalog structure
console.log('\n📋 Catalog Structure');
console.log('-'.repeat(40));
test(Object.keys(ENTITY_CATALOG).length === 12, 'Has 12 entities');
test(ENTITY_CATALOG.order !== undefined, 'Has order entity');
test(ENTITY_CATALOG.unknown !== undefined, 'Has unknown fallback');

// Test 2: ID pattern matching
console.log('\n🔍 ID Pattern Matching');
console.log('-'.repeat(40));
test(getEntityByIdPattern('SO-123').type === 'order', 'SO-123 → order');
test(getEntityByIdPattern('PO-456').type === 'order', 'PO-456 → order');
test(getEntityByIdPattern('RPT-789').type === 'report', 'RPT-789 → report');
test(getEntityByIdPattern('FBK-101').type === 'feedback', 'FBK-101 → feedback');
test(getEntityByIdPattern('SRV-202').type === 'service', 'SRV-202 → service');
test(getEntityByIdPattern('PROD-303').type === 'product', 'PROD-303 → product');
test(getEntityByIdPattern('MGR-404').type === 'manager', 'MGR-404 → manager');
test(getEntityByIdPattern('CEN-010-SO-123').type === 'order', 'Scoped order works');
test(getEntityByIdPattern('INVALID-999').type === 'unknown', 'Invalid → unknown');

// Test 3: Capabilities
console.log('\n⚙️  Capability Checks');
console.log('-'.repeat(40));
test(supportsLifecycleAction('order', 'archive'), 'Order supports archive');
test(supportsLifecycleAction('order', 'tombstone'), 'Order supports tombstone');
test(!supportsLifecycleAction('product', 'history'), 'Product NO history');
test(!supportsLifecycleAction('service', 'detailFetch'), 'Service NO details (yet)');

// Test 4: Helper functions
console.log('\n🔧 Helper Functions');
console.log('-'.repeat(40));
const orderDef = getEntityDefinition('order');
test(orderDef.backendTable === 'orders', 'Order table mapping');
test(orderDef.backendIdColumn === 'order_id', 'Order ID column');

const mapping = getEntityTableMapping('report');
test(mapping.table === 'reports', 'Report table lookup');

const activityType = getActivityType('order', 'archived');
test(activityType === 'order_archived', 'Activity type lookup');

const allTypes = getAllEntityTypes();
test(allTypes.length === 11, 'getAllEntityTypes returns 11');
test(!allTypes.includes('unknown'), 'Unknown excluded from types');

// Test 5: Validation
console.log('\n✅ Validation');
console.log('-'.repeat(40));
const validResult = validateEntityId('SO-123');
test(validResult.valid && validResult.type === 'order', 'Valid ID passes');

const invalidResult = validateEntityId('INVALID-999');
test(!invalidResult.valid && invalidResult.type === 'unknown', 'Invalid ID fails');

const emptyResult = validateEntityId('');
test(!emptyResult.valid && emptyResult.reason === 'Empty ID', 'Empty ID fails');

// Summary
console.log('\n' + '='.repeat(80));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('='.repeat(80));

if (failCount === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed');
  process.exit(1);
}
