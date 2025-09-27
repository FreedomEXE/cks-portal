import type { TreeNode } from '@cks/domain-widgets';
import type {
  CenterRoleScopeResponse,
  CenterScopeCrewMember,
  CenterScopeRelationships,
  CenterScopeService,
  ContractorRoleScopeResponse,
  ContractorScopeCenter,
  ContractorScopeCrewMember,
  ContractorScopeCustomer,
  CrewRoleScopeResponse,
  CrewScopeRelationships,
  CrewScopeService,
  CustomerRoleScopeResponse,
  CustomerScopeCenter,
  CustomerScopeCrewMember,
  CustomerScopeRelationships,
  CustomerScopeService,
  HubRole,
  HubRoleScopeResponse,
  HubScopeNode,
  HubScopeReference,
  ManagerRoleScopeResponse,
  ManagerScopeCenter,
  ManagerScopeCrewMember,
  ManagerScopeCustomer,
  ManagerScopeRelationships,
  ManagerScopeContractor,
  WarehouseRoleScopeResponse,
  WarehouseScopeInventoryItem,
  WarehouseScopeOrder,
} from '../api/hub';

export interface BuildEcosystemTreeOptions {
  rootName?: string | null;
}

export const DEFAULT_ROLE_COLOR_MAP: Record<string, string> = {
  manager: '#e0f2fe',
  Manager: '#e0f2fe',
  contractor: '#dcfce7',
  Contractor: '#dcfce7',
  customer: '#fef9c3',
  Customer: '#fef9c3',
  center: '#ffedd5',
  Center: '#ffedd5',
  'service center': '#ffedd5',
  'Service Center': '#ffedd5',
  crew: '#fee2e2',
  Crew: '#fee2e2',
  'crew member': '#fee2e2',
  'Crew Member': '#fee2e2',
  warehouse: '#ede9fe',
  Warehouse: '#ede9fe',
  service: '#dbeafe',
  Service: '#dbeafe',
  order: '#fbcfe8',
  Order: '#fbcfe8',
  product: '#bbf7d0',
  Product: '#bbf7d0',
  inventory: '#fde68a',
  Inventory: '#fde68a',
  'inventory item': '#fde68a',
  'Inventory Item': '#fde68a',
};

const DEFAULT_ROLE_LABEL: Record<string, string> = {
  manager: 'Manager',
  contractor: 'Contractor',
  customer: 'Customer',
  center: 'Service Center',
  crew: 'Crew Member',
  warehouse: 'Warehouse',
  service: 'Service',
  order: 'Order',
  product: 'Product',
  inventory: 'Inventory Item',
};

function normalizeId(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed.toUpperCase() : null;
}

function ensureId(value: string | null | undefined, fallbackPrefix: string): string {
  const normalized = normalizeId(value);
  if (normalized) {
    return normalized;
  }
  return `${fallbackPrefix.toUpperCase()}-UNKNOWN`;
}

function formatRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return 'Unknown';
  }
  const lower = role.toLowerCase();
  return DEFAULT_ROLE_LABEL[lower] ?? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
}

function formatDisplayName(name: string | null | undefined, fallbackRole: string, fallbackId: string): string {
  if (name && name.trim().length) {
    return name.trim();
  }
  if (fallbackRole && fallbackRole.trim().length) {
    return fallbackRole;
  }
  return fallbackId;
}

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function toTreeNode(node: HubScopeNode, fallbackPrefix: string): TreeNode {
  const id = ensureId(node.id, fallbackPrefix);
  const roleLabel = formatRoleLabel(node.role);
  const roleKey = node.role.toLowerCase();
  const fallbackRoleName = DEFAULT_ROLE_LABEL[roleKey] ?? roleLabel;
  return {
    user: {
      id,
      role: roleLabel,
      name: formatDisplayName(node.name, fallbackRoleName, id),
    },
    type: roleKey,
  };
}

function referenceToTreeNode(reference: HubScopeReference | null, fallbackPrefix: string, fallbackRole?: HubRole | string): TreeNode | null {
  if (!reference) {
    return null;
  }
  const role = reference.role ?? fallbackRole ?? fallbackPrefix.toLowerCase();
  const id = ensureId(reference.id, fallbackPrefix);
  const roleLabel = formatRoleLabel(role);
  const roleKey = typeof role === 'string' ? role.toLowerCase() : '';
  const fallbackName = (roleKey ? DEFAULT_ROLE_LABEL[roleKey] : undefined) ?? roleLabel;
  return {
    user: {
      id,
      role: roleLabel,
      name: formatDisplayName(reference.name, fallbackName, id),
    },
    type: roleKey,
  };
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => a.user.name.localeCompare(b.user.name));
}

function attachChildren(node: TreeNode, children: TreeNode[]): TreeNode {
  if (!children.length) {
    return node;
  }
  return {
    ...node,
    children,
  };
}

function groupCentersByCustomer<T extends { customerId: string | null }>(centers: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  centers.forEach((center) => {
    const customerId = normalizeId(center.customerId);
    if (!customerId) {
      return;
    }
    const existing = map.get(customerId);
    if (existing) {
      existing.push(center);
    } else {
      map.set(customerId, [center]);
    }
  });
  return map;
}

function groupCrewByCenter<T extends { assignedCenter: string | null }>(crew: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  crew.forEach((member) => {
    const centerId = normalizeId(member.assignedCenter);
    if (!centerId) {
      return;
    }
    const existing = map.get(centerId);
    if (existing) {
      existing.push(member);
    } else {
      map.set(centerId, [member]);
    }
  });
  return map;
}

function buildManagerChildren(scope: ManagerRoleScopeResponse): TreeNode[] {
  const relationships = scope.relationships as ManagerScopeRelationships;
  const contractors = toArray(relationships.contractors);
  const customers = toArray(relationships.customers);
  const centers = toArray(relationships.centers);
  const crew = toArray(relationships.crew);

  const contractorNodes = sortNodes(contractors.map((contractor: ManagerScopeContractor) => toTreeNode(contractor, 'CONTRACTOR')));

  const centersByCustomer = groupCentersByCustomer(centers);
  const crewByCenter = groupCrewByCenter(crew);

  const customerNodes = customers.map((customer: ManagerScopeCustomer) => {
    const customerId = normalizeId(customer.id);
    const centerNodes = sortNodes(
      (customerId ? centersByCustomer.get(customerId) ?? [] : []).map((center: ManagerScopeCenter) => {
        const centerId = normalizeId(center.id);
        const crewNodes = sortNodes(
          (centerId ? crewByCenter.get(centerId) ?? [] : []).map((member: ManagerScopeCrewMember) => toTreeNode(member, 'CREW')),
        );
        return attachChildren(toTreeNode(center, 'CENTER'), crewNodes);
      }),
    );
    return attachChildren(toTreeNode(customer, 'CUSTOMER'), centerNodes);
  });

  const sortedCustomers = sortNodes(customerNodes);

  const knownCustomerIds = new Set(
    customers
      .map((customer: ManagerScopeCustomer) => normalizeId(customer.id))
      .filter((value): value is string => Boolean(value)),
  );

  const orphanCenters = centers.filter((center: ManagerScopeCenter) => {
    const customerId = normalizeId(center.customerId);
    return !customerId || !knownCustomerIds.has(customerId);
  });

  const orphanCenterNodes = sortNodes(
    orphanCenters.map((center: ManagerScopeCenter) => {
      const centerId = normalizeId(center.id);
      const crewNodes = sortNodes(
        (centerId ? crewByCenter.get(centerId) ?? [] : []).map((member: ManagerScopeCrewMember) => toTreeNode(member, 'CREW')),
      );
      return attachChildren(toTreeNode(center, 'CENTER'), crewNodes);
    }),
  );

  return [...contractorNodes, ...sortedCustomers, ...orphanCenterNodes];
}

function buildContractorChildren(scope: ContractorRoleScopeResponse): TreeNode[] {
  const { manager, customers, centers, crew } = scope.relationships;

  const centersByCustomer = groupCentersByCustomer(centers as ContractorScopeCenter[]);
  const crewByCenter = groupCrewByCenter(crew as ContractorScopeCrewMember[]);

  const managerNode = referenceToTreeNode(manager, 'MANAGER');

  const customerNodes = (customers as ContractorScopeCustomer[]).map((customer) => {
    const customerId = normalizeId(customer.id);
    const centerNodes = sortNodes(
      (customerId ? centersByCustomer.get(customerId) ?? [] : []).map((center) => {
        const centerId = normalizeId(center.id);
        const crewNodes = sortNodes(
          (centerId ? crewByCenter.get(centerId) ?? [] : []).map((member) => toTreeNode(member, 'CREW')),
        );
        return attachChildren(toTreeNode(center, 'CENTER'), crewNodes);
      }),
    );
    return attachChildren(toTreeNode(customer, 'CUSTOMER'), centerNodes);
  });

  const sortedCustomers = sortNodes(customerNodes);

  const centersWithCustomer = new Set(
    (customers as ContractorScopeCustomer[])
      .map((customer) => normalizeId(customer.id))
      .filter((value): value is string => Boolean(value)),
  );

  const orphanCenters = (centers as ContractorScopeCenter[]).filter((center) => {
    const customerId = normalizeId(center.customerId);
    return !customerId || !centersWithCustomer.has(customerId);
  });

  const orphanCenterNodes = sortNodes(
    orphanCenters.map((center) => {
      const centerId = normalizeId(center.id);
      const crewNodes = sortNodes(
        (centerId ? crewByCenter.get(centerId) ?? [] : []).map((member) => toTreeNode(member, 'CREW')),
      );
      return attachChildren(toTreeNode(center, 'CENTER'), crewNodes);
    }),
  );

  const crewWithoutCenterNodes = sortNodes(
    (crew as ContractorScopeCrewMember[])
      .filter((member) => !normalizeId(member.assignedCenter))
      .map((member) => toTreeNode(member, 'CREW')),
  );

  const children: TreeNode[] = [];
  if (managerNode) {
    children.push(managerNode);
  }
  children.push(...sortedCustomers, ...orphanCenterNodes, ...crewWithoutCenterNodes);
  return children;
}

function buildCustomerChildren(scope: CustomerRoleScopeResponse): TreeNode[] {
  const { manager, contractor, centers, crew, services } = scope.relationships as CustomerScopeRelationships;

  const centersById = new Map<string, CustomerScopeCenter>();
  centers.forEach((center) => {
    const centerId = normalizeId(center.id);
    if (centerId) {
      centersById.set(centerId, center);
    }
  });

  const crewByCenter = groupCrewByCenter(crew);

  const managerNode = referenceToTreeNode(manager, 'MANAGER');
  const contractorNode = referenceToTreeNode(contractor, 'CONTRACTOR');

  const centerNodes = sortNodes(
    centers.map((center) => {
      const centerId = normalizeId(center.id);
      const crewNodes = sortNodes(
        (centerId ? crewByCenter.get(centerId) ?? [] : []).map((member) => toTreeNode(member, 'CREW')),
      );
      return attachChildren(toTreeNode(center, 'CENTER'), crewNodes);
    }),
  );

  const crewWithoutCenterNodes = sortNodes(
    (crew as CustomerScopeCrewMember[])
      .filter((member) => !normalizeId(member.assignedCenter))
      .map((member) => toTreeNode(member, 'CREW')),
  );

  const serviceNodes = sortNodes((services as CustomerScopeService[]).map((service) => toTreeNode(service, 'SERVICE')));

  const children: TreeNode[] = [];
  if (managerNode) {
    children.push(managerNode);
  }
  if (contractorNode) {
    children.push(contractorNode);
  }
  children.push(...centerNodes, ...crewWithoutCenterNodes, ...serviceNodes);
  return children;
}

function buildCenterChildren(scope: CenterRoleScopeResponse): TreeNode[] {
  const { manager, contractor, customer, crew, services } = scope.relationships as CenterScopeRelationships;

  const managerNode = referenceToTreeNode(manager, 'MANAGER');
  const contractorNode = referenceToTreeNode(contractor, 'CONTRACTOR');
  const customerNode = referenceToTreeNode(customer, 'CUSTOMER');

  const crewNodes = sortNodes((crew as CenterScopeCrewMember[]).map((member) => toTreeNode(member, 'CREW')));
  const serviceNodes = sortNodes((services as CenterScopeService[]).map((service) => toTreeNode(service, 'SERVICE')));

  const children: TreeNode[] = [];
  if (managerNode) {
    children.push(managerNode);
  }
  if (contractorNode) {
    children.push(contractorNode);
  }
  if (customerNode) {
    children.push(customerNode);
  }
  children.push(...crewNodes, ...serviceNodes);
  return children;
}

function buildCrewChildren(scope: CrewRoleScopeResponse): TreeNode[] {
  const { manager, contractor, customer, center, services } = scope.relationships as CrewScopeRelationships;

  const managerNode = referenceToTreeNode(manager, 'MANAGER');
  const contractorNode = referenceToTreeNode(contractor, 'CONTRACTOR');
  const customerNode = referenceToTreeNode(customer, 'CUSTOMER');
  const centerNode = referenceToTreeNode(center, 'CENTER');

  const serviceNodes = sortNodes((services as CrewScopeService[]).map((service) => toTreeNode(service, 'SERVICE')));

  const children: TreeNode[] = [];
  if (centerNode) {
    children.push(centerNode);
  }
  if (managerNode) {
    children.push(managerNode);
  }
  if (contractorNode) {
    children.push(contractorNode);
  }
  if (customerNode) {
    children.push(customerNode);
  }
  children.push(...serviceNodes);
  return children;
}

function buildWarehouseChildren(scope: WarehouseRoleScopeResponse): TreeNode[] {
  const { manager, orders, inventory } = scope.relationships;

  const managerNode = referenceToTreeNode(manager, 'MANAGER');

  const orderNodes = sortNodes((orders as WarehouseScopeOrder[]).map((order) => toTreeNode(order, 'ORDER')));
  const inventoryNodes = sortNodes((inventory as WarehouseScopeInventoryItem[]).map((item) => toTreeNode(item, 'PRODUCT')));

  const children: TreeNode[] = [];
  if (managerNode) {
    children.push(managerNode);
  }
  children.push(...orderNodes, ...inventoryNodes);
  return children;
}

function buildChildren(scope: HubRoleScopeResponse): TreeNode[] {
  switch (scope.role) {
    case 'manager':
      return buildManagerChildren(scope as ManagerRoleScopeResponse);
    case 'contractor':
      return buildContractorChildren(scope as ContractorRoleScopeResponse);
    case 'customer':
      return buildCustomerChildren(scope as CustomerRoleScopeResponse);
    case 'center':
      return buildCenterChildren(scope as CenterRoleScopeResponse);
    case 'crew':
      return buildCrewChildren(scope as CrewRoleScopeResponse);
    case 'warehouse':
      return buildWarehouseChildren(scope as WarehouseRoleScopeResponse);
    default:
      return [];
  }
}

export function buildEcosystemTree(scope: HubRoleScopeResponse, options?: BuildEcosystemTreeOptions): TreeNode {
  const roleLabel = formatRoleLabel(scope.role);
  const rootId = ensureId(scope.cksCode, scope.role);
  const rootNameInput = options?.rootName;
  const rootName = rootNameInput && rootNameInput.trim().length
    ? rootNameInput.trim()
    : formatDisplayName(null, roleLabel, rootId);

  const children = buildChildren(scope);

  const root: TreeNode = {
    user: {
      id: rootId,
      role: roleLabel,
      name: rootName,
    },
    type: scope.role,
  };

  if (scope.role === 'crew') {
    const centerChild = children.find((child) => (child.type ?? child.user.role).toLowerCase() === 'center');
    if (centerChild) {
      const otherChildren = children.filter((child) => child !== centerChild);
      const crewNode: TreeNode = {
        user: root.user,
        type: 'crew',
      };
      if (otherChildren.length) {
        crewNode.children = otherChildren;
      }
      const centerChildren = centerChild.children ? [...centerChild.children] : [];
      centerChildren.unshift(crewNode);
      return {
        ...centerChild,
        children: centerChildren,
      };
    }
  }

  if (children.length) {
    root.children = children;
  }

  return root;
}






