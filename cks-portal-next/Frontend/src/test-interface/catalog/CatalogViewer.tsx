/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: CatalogViewer.tsx
 *
 * Description:
 * Test catalog viewer for component testing
 *
 * Responsibilities:
 * - Display registered components in catalog
 * - Enable individual component testing
 * - Provide component isolation environment
 *
 * Role in system:
 * - Used by test interface for component catalog viewing
 *
 * Notes:
 * Test implementation for component catalog viewer
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';
import { useCatalog } from './CatalogContext';

export default function CatalogViewer() {
  const { components } = useCatalog();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showIsolated, setShowIsolated] = useState(false);

  const componentNames = Object.keys(components);

  if (componentNames.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        background: '#1e293b',
        margin: '1rem',
        borderRadius: '0.5rem',
        border: '2px dashed #64748b',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#f1f5f9', margin: '0 0 1rem 0' }}>
          📦 Component Catalog
        </h3>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          No components registered yet. Components will appear here as they're developed.
        </p>
      </div>
    );
  }

  const SelectedComponent = selectedComponent ? components[selectedComponent] : null;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Component List */}
      <div style={{
        width: '300px',
        background: '#1e293b',
        borderRight: '1px solid #475569',
        overflow: 'auto'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #475569' }}>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
            📦 Component Catalog
          </h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>
            {componentNames.length} components registered
          </p>
        </div>

        <div style={{ padding: '0.5rem' }}>
          {componentNames.map(name => (
            <button
              key={name}
              onClick={() => setSelectedComponent(name)}
              style={{
                width: '100%',
                padding: '0.75rem',
                margin: '0.25rem 0',
                border: 'none',
                borderRadius: '0.375rem',
                background: selectedComponent === name ? '#3b82f6' : '#334155',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem'
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Component Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedComponent ? (
          <>
            {/* Preview Header */}
            <div style={{
              background: '#334155',
              padding: '1rem',
              borderBottom: '1px solid #475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '1rem' }}>
                {selectedComponent}
              </h3>
              <button
                onClick={() => setShowIsolated(!showIsolated)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #64748b',
                  borderRadius: '0.375rem',
                  background: showIsolated ? '#059669' : '#1e293b',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {showIsolated ? 'Exit Isolation' : 'Isolate Component'}
              </button>
            </div>

            {/* Preview Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              background: showIsolated ? '#0f172a' : '#1e293b',
              padding: showIsolated ? 0 : '1rem'
            }}>
              {SelectedComponent && (
                <div style={{
                  ...(showIsolated ? {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
                    background: '#0f172a'
                  } : {})
                }}>
                  <SelectedComponent />
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8'
          }}>
            Select a component to preview
          </div>
        )}
      </div>
    </div>
  );
}