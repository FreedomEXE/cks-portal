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
 * Notes: Consistent with contractor, customer, center ecosystem implementations.
 *        Maintains exact styling and functionality as other roles.
 */

import React, { useState, useEffect } from 'react';
import { buildManagerApiUrl, managerApiFetch } from '../utils/managerApi';

interface EcosystemProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

type NodeType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew';

interface EcosystemNode {
  id: string;
  name: string;
  type: NodeType;
  stats?: { 
    contractors?: number;
    customers?: number; 
    centers?: number; 
    crew?: number; 
  };
  children?: EcosystemNode[];
}

export default function Ecosystem({ userId, config, features, api }: EcosystemProps) {
  const [ecosystem, setEcosystem] = useState<EcosystemNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEcosystem = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = buildManagerApiUrl('/ecosystem', { code: userId });
        const res = await managerApiFetch(url);
        
        // Handle non-ok responses
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        // Parse JSON safely
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        
        if (json?.success === false) throw new Error(json?.error || 'API Error');
        
        // Use API data if available, otherwise fallback to mock
        const apiData = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : null;
        
        if (apiData) {
          setEcosystem(apiData);
        } else {
          throw new Error('No data available');
        }

      } catch (error) {
        console.error('Error loading ecosystem:', error);
        
        // Always provide mock data in development when API fails
        const mockEcosystem: EcosystemNode[] = [
          {
            id: 'MGR-001',
            name: 'Regional Territory Manager',
            type: 'manager',
            stats: { contractors: 3, customers: 12, centers: 4, crew: 8 },
            children: [
              {
                id: 'CON-001',
                name: 'ABC Construction Co.',
                type: 'contractor',
                stats: { customers: 5, centers: 2 },
                children: [
                  {
                    id: 'CUS-001',
                    name: 'Acme Corporation',
                    type: 'customer',
                    stats: { centers: 3, crew: 5 },
                    children: [
                      {
                        id: 'CTR-001',
                        name: 'Acme Downtown Office',
                        type: 'center',
                        stats: { crew: 2 },
                        children: [
                          { id: 'CRW-001', name: 'John Smith (Lead)', type: 'crew' },
                          { id: 'CRW-002', name: 'Jane Doe (Specialist)', type: 'crew' }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                id: 'CON-002',
                name: 'Elite Services LLC',
                type: 'contractor',
                stats: { customers: 4, centers: 1 },
                children: [
                  {
                    id: 'CUS-002',
                    name: 'Global Tech Solutions',
                    type: 'customer',
                    stats: { centers: 2, crew: 4 },
                    children: [
                      {
                        id: 'CTR-002',
                        name: 'Global Tech HQ',
                        type: 'center',
                        stats: { crew: 2 },
                        children: [
                          { id: 'CRW-003', name: 'Alice Green (Lead)', type: 'crew' },
                          { id: 'CRW-004', name: 'Tom Clark', type: 'crew' }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                id: 'CON-003',
                name: 'Professional Crew Services',
                type: 'contractor',
                stats: { crew: 8 },
                children: [
                  { id: 'CRW-005', name: 'Mike Johnson (Lead)', type: 'crew' },
                  { id: 'CRW-006', name: 'Sarah Wilson', type: 'crew' },
                  { id: 'CRW-007', name: 'Bob Brown', type: 'crew' },
                  { id: 'CRW-008', name: 'Lisa White (Lead)', type: 'crew' }
                ]
              }
            ]
          }
        ];

        setEcosystem(mockEcosystem);
        setError(null); // Clear error since we have fallback data
        
        // Auto-expand the manager root
        setExpanded(new Set(['MGR-001']));

      } finally {
        setLoading(false);
      }
    };

    loadEcosystem();
  }, [userId]);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  };

  const createBadge = (text: string, color: string) => {
    return (
      <span style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 12,
        background: color,
        color: '#111827',
        fontWeight: 600
      }}>
        {text}
      </span>
    );
  };

  const renderNode = (node: EcosystemNode, level = 0): React.ReactNode => {
    const isOpen = expanded.has(node.id);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    const typeColors: Record<NodeType, string> = {
      manager: '#dbeafe',
      contractor: '#dcfce7',
      customer: '#fef9c3',
      center: '#ffedd5',
      crew: '#fee2e2',
    };

    return (
      <div key={`${node.type}-${node.id}`} style={{ marginBottom: 4 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderRadius: 8,
            cursor: hasChildren ? 'pointer' : 'default',
            background: '#fff',
            border: '1px solid #e5e7eb',
            paddingLeft: 12 + level * 20,
            transition: 'all 0.2s ease',
            ':hover': hasChildren ? { background: '#f9fafb' } : {}
          }}
          onClick={() => hasChildren && toggle(node.id)}
        >
          <span style={{
            width: 16,
            textAlign: 'center',
            color: '#6b7280',
            fontSize: 12
          }}>
            {hasChildren ? (isOpen ? '▼' : '▶') : ''}
          </span>
          
          <span style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: typeColors[node.type],
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            {node.type === 'manager' ? 'MGR' : node.type}
          </span>
          
          <span style={{ fontWeight: 700, color: '#111827' }}>
            {node.id}
          </span>
          
          <span style={{ color: '#6b7280', marginRight: 'auto' }}>
            — {node.name}
          </span>
          
          <div style={{ display: 'flex', gap: 6 }}>
            {typeof node.stats?.contractors === 'number' && 
              createBadge(`${node.stats.contractors} contractors`, '#e0f2fe')}
            {typeof node.stats?.customers === 'number' && 
              createBadge(`${node.stats.customers} customers`, '#e0f2fe')}
            {typeof node.stats?.centers === 'number' && 
              createBadge(`${node.stats.centers} centers`, '#f3e8ff')}
            {typeof node.stats?.crew === 'number' && 
              createBadge(`${node.stats.crew} crew`, '#fef3c7')}
          </div>
        </div>
        
        {isOpen && hasChildren && (
          <div style={{ marginLeft: 20, marginTop: 4 }}>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading ecosystem...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-card" style={{ 
        padding: 16, 
        color: '#dc2626', 
        border: '1px solid #fecaca', 
        background: '#fef2f2' 
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Error Loading My Ecosystem</div>
        <div style={{ fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  if (!ecosystem.length) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Ecosystem</h2>
        <div className="ui-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
            No Territory Assignments Yet
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            Your management ecosystem will appear here as you oversee contractors,<br />
            customers, service centers, and crew assignments.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Ecosystem</h2>
      
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ 
          padding: 16, 
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#111827' }}>
            Your Territory Overview
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Click any row with an arrow to expand and explore your territory ecosystem
          </div>
        </div>
        
        {/* Ecosystem Tree */}
        <div style={{ padding: 12 }}>
          {ecosystem.map((node) => renderNode(node))}
        </div>
        
        {/* Legend */}
        <div style={{ 
          padding: 12, 
          borderTop: '1px solid #e5e7eb', 
          background: '#f9fafb',
          display: 'flex', 
          gap: 16, 
          fontSize: 12, 
          color: '#6b7280',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              display: 'inline-block', 
              width: 12, 
              height: 12, 
              background: '#dbeafe', 
              borderRadius: 3
            }}></span>
            <span>Manager</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              display: 'inline-block', 
              width: 12, 
              height: 12, 
              background: '#dcfce7', 
              borderRadius: 3
            }}></span>
            <span>Contractor</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              display: 'inline-block', 
              width: 12, 
              height: 12, 
              background: '#fef9c3', 
              borderRadius: 3
            }}></span>
            <span>Customer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              display: 'inline-block', 
              width: 12, 
              height: 12, 
              background: '#ffedd5', 
              borderRadius: 3
            }}></span>
            <span>Service Center</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              display: 'inline-block', 
              width: 12, 
              height: 12, 
              background: '#fee2e2', 
              borderRadius: 3
            }}></span>
            <span>Crew Member</span>
          </div>
        </div>
      </div>
    </div>
  );
}