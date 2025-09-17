export interface User {
  id: string;
  role: string;
  name: string;
  description?: string;
}

export interface TreeNode {
  user: User;
  children?: TreeNode[];
  count?: number;
  type?: string;
}

export interface EcosystemTreeProps {
  rootUser: User;
  treeData: TreeNode;
  onNodeClick?: (userId: string) => void;
  expandedNodes?: string[];
  roleColorMap?: Record<string, string>;
}