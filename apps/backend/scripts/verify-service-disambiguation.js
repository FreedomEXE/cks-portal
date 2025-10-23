/**
 * Verify Service Disambiguation Logic
 * Run: node scripts/verify-service-disambiguation.js
 */

const { getEntityByIdPattern } = require('../server/shared/entityCatalog.ts');

console.log('='.repeat(80));
console.log('Service Disambiguation Verification');
console.log('='.repeat(80));
console.log('');

const testCases = [
  { id: 'CEN-010-SRV-001', expected: 'service' },
  { id: 'SRV-123', expected: 'catalogService' },
  { id: 'CRW-001-SO-010', expected: 'order' },
  { id: 'PRD-001', expected: 'product' },
  { id: 'RPT-123', expected: 'report' },
  { id: 'MGR-456', expected: 'manager' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ id, expected }) => {
  try {
    const result = getEntityByIdPattern(id);
    const actual = result.type;

    if (actual === expected) {
      console.log(`✅ PASS: ${id} → ${actual}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${id} → ${actual} (expected: ${expected})`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${id} → ${err.message}`);
    failed++;
  }
});

console.log('');
console.log('='.repeat(80));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(80));

process.exit(failed > 0 ? 1 : 0);
