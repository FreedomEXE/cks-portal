/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Ecosystem.tsx
 * 
 * Description: Manager ecosystem visualization with hierarchical tree view
 * Function: Display and navigate manager's contractors, customers, centers, and crew
 * Importance: Critical - Provides operational overview of manager's territory
 * Connects to: Manager API ecosystem endpoints, EcosystemView component
 * 
 * Notes: Extracted from legacy EcosystemView component.
 *        Maintains exact styling and expandable tree functionality.
 *        Includes stats display and proper TypeScript types.
 */

import React, { useEffect, useState } from 'react';
import { EcosystemNode } from '../types/manager';

interface EcosystemProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

export default function Ecosystem({ userId, config, features, api }: EcosystemProps) {
  const [ecosystem, setEcosystem] = useState<EcosystemNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const res = await fetch(`${baseApi}/manager/ecosystem?code=${encodeURIComponent(userId)}`, { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || json?.success === false) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setEcosystem(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load ecosystem');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  }

  function badge(text: string, color: string) {
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 6px',
        fontSize: 10,
        fontWeight: 600,
        borderRadius: 12,
        background: color,
        color: 'white',
        marginLeft: 8,
        textTransform: 'uppercase'
      }}>
        {text}
      </span>
    );
  }

  function renderNode(node: EcosystemNode, depth: number = 0): React.ReactNode {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const indentSize = depth * 20;

    return (
      <div key={node.id} style={{ marginBottom: 4 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            marginLeft: indentSize,
            background: depth === 0 ? '#f8fafc' : 'transparent',
            borderRadius: 6,
            border: depth === 0 ? '1px solid #e2e8f0' : 'none',
            cursor: hasChildren ? 'pointer' : 'default'
          }}
          onClick={hasChildren ? () => toggle(node.id) : undefined}
        >
          {hasChildren && (
            <span style={{ marginRight: 8, fontSize: 12, color: '#6b7280' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span style={{ marginRight: 20 }} />}
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: depth === 0 ? 600 : 500 }}>
              {node.name}
            </span>
            
            {node.type === 'manager' && badge('MGR', '#3b82f6')}
            {node.type === 'contractor' && badge('CON', '#10b981')}
            {node.type === 'customer' && badge('CUS', '#f59e0b')}
            {node.type === 'center' && badge('CEN', '#8b5cf6')}
            {node.type === 'crew' && badge('CRW', '#ef4444')}

            {node.stats && (
              <div style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>
                {node.stats.customers && <span>👥 {node.stats.customers} customers</span>}
                {node.stats.centers && <span style={{ marginLeft: 8 }}>🏢 {node.stats.centers} centers</span>}
                {node.stats.crew && <span style={{ marginLeft: 8 }}>👷 {node.stats.crew} crew</span>}
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Ecosystem</h2>
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            Loading ecosystem...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Ecosystem</h2>
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ textAlign: 'center', padding: 40, color: '#dc2626', background: '#fef2f2', borderRadius: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Failed to Load Ecosystem</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Ecosystem</h2>
      
      <div className="ui-card" style={{ padding: 16 }}>
        {ecosystem.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌐</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Ecosystem Data</div>
            <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              Your ecosystem relationships will appear here once configured.<br />
              This includes contractors, customers, centers, and crew assignments.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
              Click on items with arrows to expand and explore your territory ecosystem.
            </div>
            <div>
              {ecosystem.map(node => renderNode(node))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

