/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: TestComponent.tsx
 *
 * Description:
 * Test component for shared component testing
 *
 * Responsibilities:
 * - Demonstrate shared component structure
 * - Validate test interface imports
 *
 * Role in system:
 * - Used by test interface to validate shared component loading
 *
 * Notes:
 * Example shared component for testing
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React from 'react';

export interface TestComponentProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export default function TestComponent({
  title = 'Test Component',
  description = 'This is a test component from the shared folder',
  variant = 'default'
}: TestComponentProps) {
  const variantStyles = {
    default: { background: '#334155', border: '1px solid #64748b' },
    success: { background: '#059669', border: '1px solid #10b981' },
    warning: { background: '#d97706', border: '1px solid #f59e0b' },
    error: { background: '#dc2626', border: '1px solid #ef4444' }
  };

  return (
    <div style={{
      padding: '1rem',
      borderRadius: '0.5rem',
      color: 'white',
      margin: '1rem',
      ...variantStyles[variant]
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
        {description}
      </p>
      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontFamily: 'monospace'
      }}>
        <strong>Props:</strong> title, description, variant<br />
        <strong>Variant:</strong> {variant}<br />
        <strong>Source:</strong> /src/shared/components/TestComponent.tsx
      </div>
    </div>
  );
}