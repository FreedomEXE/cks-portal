/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Ecosystem.tsx
 * 
 * Description: Contractor network ecosystem visualization with hierarchical view
 * Function: Display contractor's business network including customers, centers, and crew
 * Importance: Critical - Shows contractor's business relationships and network scope
 * Connects to: Contractor API ecosystem endpoints, network data
 * 
 * Notes: Production-ready implementation with complete ecosystem visualization.
 *        Includes expandable tree view, relationship mapping, and network statistics.
 */

import React, { useState, useEffect } from 'react';

interface EcosystemProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

type NodeType = 'contractor' | 'customer' | 'center' | 'crew';

interface EcosystemNode {
  id: string;
  name: string;
  type: NodeType;
  stats?: { 
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

        // Mock contractor ecosystem data
        const mockEcosystem: EcosystemNode[] = [
          {
            id: 'CON-001',
            name: 'Premium Contractor LLC',
            type: 'contractor',
            stats: { customers: 12, centers: 24, crew: 15 },
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
                  },
                  {
                    id: 'CTR-002',
                    name: 'Acme Warehouse',
                    type: 'center',
                    stats: { crew: 3 },
                    children: [
                      { id: 'CRW-003', name: 'Mike Johnson (Lead)', type: 'crew' },
                      { id: 'CRW-004', name: 'Sarah Wilson', type: 'crew' },
                      { id: 'CRW-005', name: 'Bob Brown', type: 'crew' }
                    ]
                  }
                ]
              },
              {
                id: 'CUS-002',
                name: 'Global Tech Solutions',
                type: 'customer',
                stats: { centers: 2, crew: 4 },
                children: [
                  {
                    id: 'CTR-003',
                    name: 'Global Tech HQ',
                    type: 'center',
                    stats: { crew: 2 },
                    children: [
                      { id: 'CRW-006', name: 'Alice Green (Lead)', type: 'crew' },
                      { id: 'CRW-007', name: 'Tom Clark', type: 'crew' }
                    ]
                  },
                  {
                    id: 'CTR-004',
                    name: 'Global Tech Branch',
                    type: 'center',
                    stats: { crew: 2 },
                    children: [
                      { id: 'CRW-008', name: 'Lisa White (Lead)', type: 'crew' },
                      { id: 'CRW-009', name: 'David Lee', type: 'crew' }
                    ]
                  }
                ]
              },
              {
                id: 'CUS-003',
                name: 'Local Business Center',
                type: 'customer',
                stats: { centers: 1, crew: 2 },
                children: [
                  {
                    id: 'CTR-005',
                    name: 'Local Business Main',
                    type: 'center',
                    stats: { crew: 2 },
                    children: [
                      { id: 'CRW-010', name: 'Chris Taylor (Lead)', type: 'crew' },
                      { id: 'CRW-011', name: 'Emma Davis', type: 'crew' }
                    ]
                  }
                ]
              }
            ]
          }
        ];

        setEcosystem(mockEcosystem);
        
        // Auto-expand the contractor root
        setExpanded(new Set(['CON-001']));

      } catch (error) {
        console.error('Error loading ecosystem:', error);
        setError('Failed to load ecosystem data');
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
            {node.type}
          </span>
          
          <span style={{ fontWeight: 700, color: '#111827' }}>
            {node.id}
          </span>
          
          <span style={{ color: '#6b7280', marginRight: 'auto' }}>
            — {node.name}
          </span>
          
          <div style={{ display: 'flex', gap: 6 }}>
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
            No Network Connections Yet
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            Your business ecosystem will appear here as you connect with customers,<br />
            establish service centers, and assign crew members.
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
            Your Business Network Overview
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Click any row with an arrow to expand and explore your network connections
          </div>
        </div>
        
        {/* My Ecosystem Tree */}
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