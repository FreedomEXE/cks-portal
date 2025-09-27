/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: EcosystemTree.tsx
 *
 * Description:
 * Tree component for displaying hierarchical user relationships
 * Based on the original Ecosystem.tsx implementation
 *
 * Responsibilities:
 * - Display hierarchical tree structure
 * - Handle expand/collapse interactions
 * - Support role-based color coding
 * - Manage node selection
 *
 * Role in system:
 * - Used in role hubs to visualize ecosystem hierarchy
 *
 * Notes:
 * Business logic component for ecosystem visualization
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';

export interface TreeNode {
  user: {
    id: string;
    role: string;
    name: string;
  };
  count?: number;
  type?: string;
  children?: TreeNode[];
}

interface EcosystemTreeProps {
  rootUser: {
    id: string;
    role: string;
    name: string;
  };
  treeData: TreeNode;
  onNodeClick?: (userId: string) => void;
  expandedNodes?: string[];
  roleColorMap?: Record<string, string>;
  title?: string;
  subtitle?: string;
  description?: string;
  currentUserId?: string;  // ID of the logged-in user to highlight
}

const EcosystemTree: React.FC<EcosystemTreeProps> = ({
  rootUser,
  treeData,
  onNodeClick,
  expandedNodes = [],
  roleColorMap = {},
  title = 'Ecosystem',
  subtitle = 'Your Business Network Overview',
  description = 'Click any row with an arrow to expand and explore your network connections',
  currentUserId
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(expandedNodes));

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  };

  const getRoleKey = (node: TreeNode) => (node.type ?? node.user.role).toLowerCase();

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

  // Function to count all descendants of a specific type
  const countDescendants = (node: TreeNode, targetRole: string): number => {
    const normalizedTarget = targetRole.toLowerCase();
    let count = 0;
    if (getRoleKey(node) === normalizedTarget) {
      count = 1;
    }
    if (node.children) {
      node.children.forEach(child => {
        count += countDescendants(child, normalizedTarget);
      });
    }
    return count;
  };

  // Function to count direct children of a specific type
  const countDirectChildren = (node: TreeNode, targetRole: string): number => {
    if (!node.children) return 0;
    const normalizedTarget = targetRole.toLowerCase();
    return node.children.filter(child =>
      getRoleKey(child) === normalizedTarget
    ).length;
  };

  const renderNode = (node: TreeNode, level = 0): React.ReactNode => {
    const isOpen = expanded.has(node.user.id);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isCurrentUser = currentUserId && node.user.id === currentUserId;

    // Type colors matching the original ecosystem component
    const typeColors: Record<string, string> = {
      contractor: '#dcfce7',
      customer: '#fef9c3',
      center: '#ffedd5',
      crew: '#fee2e2',
      manager: '#e0f2fe',
      warehouse: '#ede9fe'
    };

    const roleKey = getRoleKey(node);
    const roleColor = roleColorMap[roleKey] || typeColors[roleKey] || '#f3f4f6';

    // Role-specific highlight colors (matching hub themes)
    const highlightColors: Record<string, { bg: string; border: string }> = {
      manager: { bg: '#dbeafe', border: '#3b82f6' },     // Blue theme
      contractor: { bg: '#d1fae5', border: '#10b981' },  // Green theme
      customer: { bg: '#fed7aa', border: '#f59e0b' },    // Amber/Orange theme
      center: { bg: '#fed7aa', border: '#f97316' },      // Orange theme
      crew: { bg: '#fee2e2', border: '#ef4444' },        // Red theme
      warehouse: { bg: '#e9d5ff', border: '#8b5cf6' }    // Purple theme
    };

    const highlightStyle = highlightColors[roleKey] || { bg: '#dbeafe', border: '#3b82f6' };

    // Calculate counts based on role
    const role = roleKey;
    const badges = [];

    if (role === 'manager') {
      // Manager shows: contractors, customers, centers, crew
      const contractorCount = countDirectChildren(node, 'contractor');
      const customerCount = countDescendants(node, 'customer');
      const centerCount = countDescendants(node, 'center');
      const crewCount = countDescendants(node, 'crew');

      if (contractorCount > 0) badges.push(createBadge(`${contractorCount} contractors`, '#dcfce7'));
      if (customerCount > 0) badges.push(createBadge(`${customerCount} customers`, '#e0f2fe'));
      if (centerCount > 0) badges.push(createBadge(`${centerCount} centers`, '#f3e8ff'));
      if (crewCount > 0) badges.push(createBadge(`${crewCount} crew`, '#fef3c7'));
    } else if (role === 'contractor') {
      // Contractor shows: customers, centers, crew
      const customerCount = countDirectChildren(node, 'customer');
      const centerCount = countDescendants(node, 'center');
      const crewCount = countDescendants(node, 'crew');

      if (customerCount > 0) badges.push(createBadge(`${customerCount} customers`, '#e0f2fe'));
      if (centerCount > 0) badges.push(createBadge(`${centerCount} centers`, '#f3e8ff'));
      if (crewCount > 0) badges.push(createBadge(`${crewCount} crew`, '#fef3c7'));
    } else if (role === 'customer') {
      // Customer shows: centers, crew
      const centerCount = countDirectChildren(node, 'center');
      const crewCount = countDescendants(node, 'crew');

      if (centerCount > 0) badges.push(createBadge(`${centerCount} centers`, '#f3e8ff'));
      if (crewCount > 0) badges.push(createBadge(`${crewCount} crew`, '#fef3c7'));
    } else if (role === 'center') {
      // Center shows: crew
      const crewCount = countDirectChildren(node, 'crew');

      if (crewCount > 0) badges.push(createBadge(`${crewCount} crew`, '#fef3c7'));
    }

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
            background: isCurrentUser ? highlightStyle.bg : '#fff',
            border: isCurrentUser ? `2px solid ${highlightStyle.border}` : '1px solid #e5e7eb',
            paddingLeft: 12 + level * 20,
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onClick={() => hasChildren && toggle(node.user.id)}
          onMouseEnter={(e) => {
            if (!isCurrentUser) {
              e.currentTarget.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrentUser) {
              e.currentTarget.style.background = '#fff';
            }
          }}
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
            background: roleColor,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#111827'
          }}>
            {node.user.role}
          </span>

          <span style={{ fontWeight: 700, color: '#111827' }}>
            {node.user.id}
          </span>

          <span style={{ color: '#6b7280', marginRight: 'auto' }}>
            — {node.user.name}
          </span>

          <div style={{ display: 'flex', gap: 6 }}>
            {badges}
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

  return (
    <div>
      <div style={{
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        background: '#fff'
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#111827' }}>
            {subtitle}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {description}
          </div>
        </div>

        {/* Tree */}
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
};

export default EcosystemTree;