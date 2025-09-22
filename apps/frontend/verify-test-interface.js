#!/usr/bin/env node

/**
 * Verification script for test interface structure
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const TEST_INTERFACE_DIR = path.join(BASE_DIR, 'src', 'test-interface');

console.log('🧪 CKS Test Interface Structure Verification\n');

// Files to check
const filesToCheck = [
  'src/test-interface/index.html',
  'src/test-interface/index.tsx',
  'src/test-interface/HubTester.tsx',
  'src/test-interface/README.md',
  'src/test-interface/hub/RoleHub.tsx',
  'src/test-interface/hub/roleConfigLoader.ts',
  'src/test-interface/catalog/CatalogContext.tsx',
  'src/test-interface/catalog/CatalogViewer.tsx',
  'src/shared/components/TestComponent.tsx',
  'vite.config.test.ts',
  'tsconfig.json',
  'tsconfig.node.json'
];

// Role files to check
const roles = ['admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];
roles.forEach(role => {
  filesToCheck.push(`src/test-interface/roles/${role}/index.ts`);
  filesToCheck.push(`src/test-interface/roles/${role}/config.v1.json`);
});

let allFilesExist = true;
let missingFiles = [];

console.log('📁 Checking file structure...');
filesToCheck.forEach(filePath => {
  const fullPath = path.join(BASE_DIR, filePath);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';

  console.log(`${status} ${filePath}`);

  if (!exists) {
    allFilesExist = false;
    missingFiles.push(filePath);
  }
});

console.log('\n📦 Checking package.json configuration...');
try {
  const packageJsonPath = path.join(BASE_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const hasTestScript = packageJson.scripts && packageJson.scripts['test:interface'];
  console.log(`${hasTestScript ? '✅' : '❌'} test:interface script`);

  const hasReactDeps = packageJson.dependencies && packageJson.dependencies['react'];
  console.log(`${hasReactDeps ? '✅' : '❌'} React dependencies`);

  if (hasTestScript) {
    console.log(`   Script: ${packageJson.scripts['test:interface']}`);
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

console.log('\n🎯 Role configurations...');
roles.forEach(role => {
  const configPath = path.join(BASE_DIR, 'src', 'test-interface', 'roles', role, 'config.v1.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`✅ ${role}: ${config.tabs ? config.tabs.length : 0} tabs, ${config.permissions ? config.permissions.length : 0} permissions`);
    } catch (error) {
      console.log(`❌ ${role}: Invalid JSON config`);
    }
  } else {
    console.log(`❌ ${role}: Config missing`);
  }
});

console.log('\n🚀 Summary:');
if (allFilesExist) {
  console.log('✅ All files exist! Test interface is ready.');
  console.log('\n🏃 To start the test interface:');
  console.log('   npm run test:interface');
  console.log('\n🌐 The interface will open at:');
  console.log('   http://localhost:3005');
} else {
  console.log('❌ Some files are missing:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n📝 Documentation:');
console.log('   See src/test-interface/README.md for detailed usage instructions');
