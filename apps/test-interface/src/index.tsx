/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: index.tsx
 *
 * Description:
 * Test interface entry point for the CKS portal next
 *
 * Responsibilities:
 * - Initialize React app for testing
 * - Mount HubTester component
 * - Provide test environment setup
 *
 * Role in system:
 * - Entry point for test interface on port 3005
 * - Enables testing of role hubs and components in isolation
 *
 * Notes:
 * Based on the legacy test-hub-roles.tsx but adapted for new modular structure
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React from 'react'
import ReactDOM from 'react-dom/client'
import TestInterface from './TestInterface'
import './index.css'

// Global test environment setup
declare global {
  interface Window {
    __CKS_TEST_ENV__: boolean;
    __CKS_TEST_VERSION__: string;
  }
}

// Mark this as test environment
window.__CKS_TEST_ENV__ = true;
window.__CKS_TEST_VERSION__ = '2.0.0-next';

// Enhanced error handling for test environment
window.addEventListener('error', (event) => {
  console.group('🚨 Test Interface Error');
  console.error('Error:', event.error);
  console.error('Message:', event.message);
  console.error('Source:', event.filename);
  console.error('Line:', event.lineno, 'Column:', event.colno);
  console.groupEnd();
});

window.addEventListener('unhandledrejection', (event) => {
  console.group('🚨 Test Interface Promise Rejection');
  console.error('Reason:', event.reason);
  console.groupEnd();
});

// Initialize React app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <TestInterface />
  </React.StrictMode>
)
