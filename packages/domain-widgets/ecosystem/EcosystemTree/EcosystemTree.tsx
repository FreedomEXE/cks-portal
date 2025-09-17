import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';

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

const defaultRoleColors: Record<string, string> = {
  manager: '#ef4444',
  contractor: '#3b82f6',
  customer: '#f59e0b',
  center: '#06b6d4',
  crew: '#8b5cf6',
  warehouse: '#10b981'
};

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  onNodeClick?: (userId: string) => void;
  roleColors: Record<string, string>;
}> = ({ node, level, expanded, onToggle, onNodeClick, roleColors }) => {
  const hasChildren = node.children && node.children.length > 0;
  const roleColor = roleColors[node.user.role.toLowerCase()] || '#6b7280';

  return (
    <div>
      <div
        className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer transition-colors"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => onNodeClick?.(node.user.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="mr-2 p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6 mr-2" />}

        <span
          className="px-2 py-0.5 rounded text-xs font-semibold text-white mr-3 uppercase"
          style={{ backgroundColor: roleColor }}
        >
          {node.user.role}
        </span>

        <span className="font-medium text-gray-900 mr-2">{node.user.id}</span>
        <span className="text-gray-500">—</span>
        <span className="ml-2 text-gray-700">
          {node.user.name || node.user.description}
        </span>

        {node.count !== undefined && node.count > 0 && (
          <div className="ml-auto flex items-center gap-4">
            {node.type && (
              <span className="text-sm text-gray-500">
                {node.count} {node.type}{node.count !== 1 ? 's' : ''}
              </span>
            )}
            <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-medium text-gray-700">
              {node.count} {node.children?.[0]?.user.role.toLowerCase() || 'item'}{node.count !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const EcosystemTree: React.FC<EcosystemTreeProps> = ({
  rootUser,
  treeData,
  onNodeClick,
  expandedNodes: controlledExpanded,
  roleColorMap = {}
}) => {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    new Set(controlledExpanded || [rootUser.id])
  );

  const expandedSet = controlledExpanded
    ? new Set(controlledExpanded)
    : internalExpanded;

  const roleColors = { ...defaultRoleColors, ...roleColorMap };

  const toggleNode = (nodeId: string) => {
    if (!controlledExpanded) {
      const newExpanded = new Set(internalExpanded);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      setInternalExpanded(newExpanded);
    }
  };

  const renderTree = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedSet.has(node.user.id);

    return (
      <div key={node.user.id}>
        <TreeNodeComponent
          node={node}
          level={level}
          expanded={isExpanded}
          onToggle={() => toggleNode(node.user.id)}
          onNodeClick={onNodeClick}
          roleColors={roleColors}
        />
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTree(child, level + 1))}
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Ecosystem</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your Business Network Overview
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Click any row with an arrow to expand and explore your network connections
        </p>
      </div>

      <div className="p-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {renderTree(treeData)}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            {Object.entries(roleColors).map(([role, color]) => {
              const count = countByRole[role];
              if (!count) return null;

              return (
                <div key={role} className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm capitalize text-gray-600">
                    {role}
                  </span>
                  {count > 0 && (
                    <span className="text-sm text-gray-400">
                      ({count})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-4 flex gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              Total: {Object.values(countByRole).reduce((a, b) => a + b, 0)} users
            </span>
          </div>
          {Object.entries(countByRole).map(([role, count]) => (
            count > 0 && (
              <div key={role}>
                <span className="capitalize">{role}s: {count}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcosystemTree;