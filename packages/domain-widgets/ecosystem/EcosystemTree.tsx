import React, { useState, useMemo } from 'react';

interface User {
  id: string;
  role: string;
  name: string;
  description?: string;
}

interface TreeNode {
  user: User;
  children?: TreeNode[];
  count?: number;
  type?: string;
}

interface EcosystemTreeProps {
  rootUser: User;
  treeData: TreeNode;
  onNodeClick?: (userId: string) => void;
  expandedNodes?: string[];
  roleColorMap?: Record<string, string>;
}

const EcosystemTree: React.FC<EcosystemTreeProps> = ({
  rootUser,
  treeData,
  onNodeClick,
  expandedNodes: controlledExpanded,
  roleColorMap = {}
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(controlledExpanded || [treeData.user.id])
  );

  const defaultRoleColors: Record<string, string> = {
    manager: '#e0f2fe',      // Light blue (matches Manager hub theme)
    contractor: '#dcfce7',    // Light green (matches Contractor hub theme)
    customer: '#fef3c7',      // Light yellow/amber (matches Customer hub theme)
    center: '#e0f2fe',        // Light cyan (matches Center hub theme)
    crew: '#f3e8ff',          // Light purple (matches Crew hub theme)
    warehouse: '#dcfce7',     // Light green (matches Warehouse hub theme)
    ...roleColorMap
  };

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

  const renderNode = (node: TreeNode, level = 0): React.ReactNode => {
    const isOpen = expanded.has(node.user.id);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const roleColor = defaultRoleColors[node.user.role.toLowerCase()] || '#e5e7eb';

    return (
      <div key={`${node.user.role}-${node.user.id}`} style={{ marginBottom: 4 }}>
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
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (hasChildren) {
              e.currentTarget.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
          }}
          onClick={() => hasChildren && toggle(node.user.id)}
        >
          <span style={{
            width: 16,
            textAlign: 'center' as const,
            color: '#6b7280',
            fontSize: 12
          }}>
            {hasChildren ? (isOpen ? '▼' : '▶') : ''}
          </span>

          <span style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: roleColor,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5
          }}>
            {node.user.role}
          </span>

          <span style={{ fontWeight: 700, color: '#111827' }}>
            {node.user.id}
          </span>

          <span style={{ color: '#6b7280', marginRight: 'auto' }}>
            — {node.user.name || node.user.description}
          </span>

          <div style={{ display: 'flex', gap: 6 }}>
            {node.count !== undefined && node.count > 0 && node.type && (
              <>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {node.count} {node.type}{node.count !== 1 ? 's' : ''}
                </span>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: '#fef3c7',
                  color: '#111827',
                  fontWeight: 600
                }}>
                  {node.count} {node.children?.[0]?.user.role.toLowerCase() || node.type}
                </span>
              </>
            )}
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

  // Count totals for display
  const countByRole = useMemo(() => {
    const counts: Record<string, number> = {};

    const countNodes = (node: TreeNode) => {
      const role = node.user.role.toLowerCase();
      counts[role] = (counts[role] || 0) + 1;
      node.children?.forEach(countNodes);
    };

    countNodes(treeData);
    return counts;
  }, [treeData]);

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

        {/* Ecosystem Tree */}
        <div style={{ padding: 12 }}>
          {renderNode(treeData)}
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
          flexWrap: 'wrap' as const
        }}>
          {Object.entries(defaultRoleColors).map(([role, color]) => {
            const count = countByRole[role];
            if (!count) return null;

            return (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  background: color,
                  borderRadius: 3
                }}></span>
                <span style={{ textTransform: 'capitalize' as const }}>
                  {role === 'crew' ? 'Crew Member' :
                   role === 'center' ? 'Service Center' :
                   role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EcosystemTree;
export type { User, TreeNode, EcosystemTreeProps };