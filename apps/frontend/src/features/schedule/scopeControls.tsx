/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: scopeControls.tsx
 *
 * Description:
 * Role-aware Schedule scope controls that mirror the existing Ecosystem
 * hierarchy while syncing the selected scope into URL search params.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HubRole, HubRoleScopeResponse } from '../../shared/api/hub';
import { buildEcosystemTree } from '../../shared/utils/ecosystem';

type ScheduleScopeType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
type ScheduleViewerRole = HubRole | 'admin';

interface ScheduleTreeNode {
  user: {
    id: string;
    role: string;
    name: string;
  };
  type?: string;
  children?: ScheduleTreeNode[];
}

interface ScopeNode {
  id: string;
  type: ScheduleScopeType;
  label: string;
  parentId: string | null;
}

interface ScopeOption {
  id: string;
  label: string;
}

interface SelectorConfig {
  type: ScheduleScopeType;
  label: string;
  placeholder: string;
  value: string;
  options: ScopeOption[];
}

export interface AdminScheduleManagerOption {
  id: string;
  label: string;
  isTest?: boolean;
}

export interface UseScheduleScopeControlsInput {
  viewerRole?: ScheduleViewerRole;
  viewerCode?: string | null;
  scopeData?: HubRoleScopeResponse | null;
  adminScopeTree?: ScheduleTreeNode | null;
  adminManagerOptions?: AdminScheduleManagerOption[];
  selectedAdminManagerId?: string | null;
  onSelectedAdminManagerIdChange?: (managerId: string | null) => void;
  showTestEcosystems?: boolean;
  onShowTestEcosystemsChange?: (value: boolean) => void;
  extraActions?: ReactNode;
}

export interface UseScheduleScopeControlsResult {
  scopeType?: ScheduleScopeType;
  scopeId?: string;
  scopeIds?: string[];
  scopeTree?: ScheduleTreeNode | null;
  testMode?: 'include' | 'exclude' | 'only';
  headerActions?: ReactNode;
}

interface ParsedScope {
  type: ScheduleScopeType;
  id: string;
}

const TYPE_LABELS: Record<ScheduleScopeType, string> = {
  manager: 'Ecosystem',
  contractor: 'Contractor',
  customer: 'Customer',
  center: 'Center',
  crew: 'Crew',
  warehouse: 'Warehouse',
};

function normalizeId(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed.toUpperCase() : null;
}

function normalizeScopeType(value?: string | null): ScheduleScopeType | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'service center') {
    return 'center';
  }
  if (normalized === 'crew member') {
    return 'crew';
  }
  if (normalized === 'manager' || normalized === 'contractor' || normalized === 'customer' || normalized === 'center' || normalized === 'crew' || normalized === 'warehouse') {
    return normalized;
  }
  return null;
}

function parseScopeParam(value: string | null): ParsedScope | null {
  if (!value) {
    return null;
  }
  const [type, id] = value.split(':', 2);
  const normalizedType = normalizeScopeType(type);
  const normalizedId = normalizeId(id);
  if (!normalizedType || !normalizedId) {
    return null;
  }
  return { type: normalizedType, id: normalizedId };
}

function formatNodeLabel(node: ScheduleTreeNode): string {
  const name = node.user.name?.trim();
  const id = normalizeId(node.user.id) ?? 'UNKNOWN';
  if (name && normalizeId(name) !== id) {
    return `${name} (${id})`;
  }
  return id;
}

function flattenTree(root: ScheduleTreeNode | null | undefined): ScopeNode[] {
  if (!root) {
    return [];
  }
  const nodes: ScopeNode[] = [];
  const visit = (node: ScheduleTreeNode, parentId: string | null) => {
    const type = normalizeScopeType(node.type ?? node.user.role);
    const id = normalizeId(node.user.id);
    if (!type || !id) {
      return;
    }
    nodes.push({
      id,
      type,
      label: formatNodeLabel(node),
      parentId,
    });
    const children = Array.isArray(node.children) ? node.children : [];
    children.forEach((child: ScheduleTreeNode) => visit(child, id));
  };
  visit(root, null);
  return nodes;
}

function buildTreeFromScope(scopeData?: HubRoleScopeResponse | null): ScheduleTreeNode | null {
  if (!scopeData) {
    return null;
  }
  return buildEcosystemTree(scopeData, { rootName: scopeData.cksCode });
}

function getSelectorOrder(viewerRole?: ScheduleViewerRole): ScheduleScopeType[] {
  switch (viewerRole) {
    case 'admin':
      return ['manager', 'contractor', 'customer', 'center', 'crew'];
    case 'manager':
      return ['contractor', 'customer', 'center', 'crew'];
    case 'contractor':
      return ['customer', 'center', 'crew'];
    case 'customer':
      return ['center', 'crew'];
    case 'center':
      return ['crew'];
    case 'crew':
      return ['center'];
    case 'warehouse':
      return [];
    default:
      return [];
  }
}

function getDefaultRootScope(viewerRole?: ScheduleViewerRole, viewerCode?: string | null, selectedAdminManagerId?: string | null): ParsedScope | null {
  if (viewerRole === 'admin') {
    const managerId = normalizeId(selectedAdminManagerId);
    return managerId ? { type: 'manager', id: managerId } : null;
  }
  const normalizedCode = normalizeId(viewerCode);
  if (!viewerRole || !normalizedCode || viewerRole === 'warehouse') {
    return viewerRole === 'warehouse' && normalizedCode
      ? { type: 'warehouse', id: normalizedCode }
      : null;
  }
  return { type: viewerRole, id: normalizedCode };
}

function buildNodeMap(nodes: ScopeNode[]): Map<string, ScopeNode> {
  return new Map(nodes.map((node) => [`${node.type}:${node.id}`, node]));
}

function getNodePath(node: ScopeNode | null, nodesByKey: Map<string, ScopeNode>): ScopeNode[] {
  if (!node) {
    return [];
  }
  const path: ScopeNode[] = [];
  let current: ScopeNode | undefined | null = node;
  while (current) {
    path.unshift(current);
    current = current.parentId ? Array.from(nodesByKey.values()).find((candidate) => candidate.id === current?.parentId) ?? null : null;
  }
  return path;
}

function getAncestorIds(node: ScopeNode, nodesByKey: Map<string, ScopeNode>): Set<string> {
  const path = getNodePath(node, nodesByKey);
  return new Set(path.map((entry) => entry.id));
}

function getUniqueOptions(nodes: ScopeNode[]): ScopeOption[] {
  const deduped = new Map<string, ScopeOption>();
  nodes.forEach((node) => {
    if (!deduped.has(node.id)) {
      deduped.set(node.id, { id: node.id, label: node.label });
    }
  });
  return Array.from(deduped.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function collectDescendantIds(node: ScopeNode | null, nodes: ScopeNode[]): string[] {
  if (!node) {
    return [];
  }
  const ids = new Set<string>([node.id]);
  const queue = [node.id];
  while (queue.length > 0) {
    const parentId = queue.shift();
    nodes.forEach((candidate) => {
      if (candidate.parentId === parentId && !ids.has(candidate.id)) {
        ids.add(candidate.id);
        queue.push(candidate.id);
      }
    });
  }
  return Array.from(ids);
}

function getPlaceholder(viewerRole: ScheduleViewerRole | undefined, type: ScheduleScopeType): string {
  if (viewerRole === 'admin' && type === 'manager') {
    return 'All ecosystems';
  }
  if (viewerRole === 'crew' && type === 'center') {
    return 'My schedule';
  }
  switch (type) {
    case 'contractor':
      return viewerRole === 'manager' ? 'Entire ecosystem' : 'All contractors';
    case 'customer':
      return viewerRole === 'contractor' ? 'Entire contractor scope' : 'All customers';
    case 'center':
      return viewerRole === 'customer' ? 'Entire customer scope' : 'All centers';
    case 'crew':
      return viewerRole === 'center' ? 'Entire center scope' : 'All crew';
    default:
      return `All ${TYPE_LABELS[type].toLowerCase()}s`;
  }
}

export function useScheduleScopeControls({
  viewerRole,
  viewerCode,
  scopeData,
  adminScopeTree,
  adminManagerOptions = [],
  selectedAdminManagerId,
  onSelectedAdminManagerIdChange,
  showTestEcosystems,
  onShowTestEcosystemsChange,
  extraActions,
}: UseScheduleScopeControlsInput): UseScheduleScopeControlsResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const scopeTree = useMemo(
    () => (viewerRole === 'admin' ? adminScopeTree ?? null : buildTreeFromScope(scopeData)),
    [adminScopeTree, scopeData, viewerRole],
  );
  const nodes = useMemo(() => flattenTree(scopeTree), [scopeTree]);
  const nodesByKey = useMemo(() => buildNodeMap(nodes), [nodes]);
  const selectorOrder = useMemo(() => getSelectorOrder(viewerRole), [viewerRole]);
  const parsedScope = useMemo(() => parseScopeParam(searchParams.get('scope')), [searchParams]);
  const defaultRootScope = useMemo(
    () => getDefaultRootScope(viewerRole, viewerCode, selectedAdminManagerId),
    [selectedAdminManagerId, viewerCode, viewerRole],
  );

  const effectiveScope = useMemo<ParsedScope | null>(() => {
    if (viewerRole === 'admin' && !selectedAdminManagerId) {
      return null;
    }
    if (!parsedScope) {
      return defaultRootScope;
    }
    if (viewerRole === 'admin') {
      const managerId = normalizeId(selectedAdminManagerId);
      if (!managerId) {
        return null;
      }
      if (parsedScope.type === 'manager' && parsedScope.id === managerId) {
        return parsedScope;
      }
      const candidate = nodesByKey.get(`${parsedScope.type}:${parsedScope.id}`);
      if (!candidate) {
        return defaultRootScope;
      }
      const ancestorIds = getAncestorIds(candidate, nodesByKey);
      return ancestorIds.has(managerId) ? parsedScope : defaultRootScope;
    }
    if (defaultRootScope && parsedScope.type === defaultRootScope.type && parsedScope.id === defaultRootScope.id) {
      return parsedScope;
    }
    const candidate = nodesByKey.get(`${parsedScope.type}:${parsedScope.id}`);
    if (!candidate) {
      return defaultRootScope;
    }
    if (!defaultRootScope) {
      return parsedScope;
    }
    const ancestorIds = getAncestorIds(candidate, nodesByKey);
    return ancestorIds.has(defaultRootScope.id) || candidate.id === defaultRootScope.id ? parsedScope : defaultRootScope;
  }, [defaultRootScope, nodesByKey, parsedScope, selectedAdminManagerId, viewerRole]);

  useEffect(() => {
    const desiredScope = effectiveScope ? `${effectiveScope.type}:${effectiveScope.id}` : null;
    const next = new URLSearchParams(searchParams);
    if (desiredScope) {
      next.set('scope', desiredScope);
    } else {
      next.delete('scope');
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [effectiveScope, searchParams, setSearchParams]);

  const selectedNode = useMemo(() => {
    if (!effectiveScope) {
      return null;
    }
    return nodesByKey.get(`${effectiveScope.type}:${effectiveScope.id}`) ?? null;
  }, [effectiveScope, nodesByKey]);
  const scopeIds = useMemo(() => {
    if (selectedNode) {
      return collectDescendantIds(selectedNode, nodes);
    }
    if (effectiveScope?.id) {
      return [effectiveScope.id];
    }
    return undefined;
  }, [effectiveScope, nodes, selectedNode]);

  const selectedPath = useMemo(() => getNodePath(selectedNode, nodesByKey), [nodesByKey, selectedNode]);
  const selectedIdsByType = useMemo(() => {
    const entries = new Map<ScheduleScopeType, string>();
    selectedPath.forEach((node) => {
      entries.set(node.type, node.id);
    });
    if (viewerRole === 'admin') {
      const managerId = normalizeId(selectedAdminManagerId);
      if (managerId) {
        entries.set('manager', managerId);
      }
    }
    return entries;
  }, [selectedAdminManagerId, selectedPath, viewerRole]);

  const updateScope = useCallback((nextScope: ParsedScope | null) => {
    const next = new URLSearchParams(searchParams);
    if (nextScope) {
      next.set('scope', `${nextScope.type}:${nextScope.id}`);
    } else {
      next.delete('scope');
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const selectorConfigs = useMemo<SelectorConfig[]>(() => {
    if (!viewerRole) {
      return [];
    }
    return selectorOrder.flatMap((type, index) => {
      if (viewerRole === 'admin' && type === 'manager') {
        return [{
          type,
          label: TYPE_LABELS[type],
          placeholder: getPlaceholder(viewerRole, type),
          value: normalizeId(selectedAdminManagerId) ?? '',
          options: adminManagerOptions.map((option) => ({
            id: option.id,
            label: option.label,
          })),
        }];
      }

      const previousTypes = selectorOrder.slice(0, index);
      const constraints = previousTypes
        .map((previousType) => ({ type: previousType, id: selectedIdsByType.get(previousType) ?? null }))
        .filter((entry): entry is { type: ScheduleScopeType; id: string } => Boolean(entry.id));

      const options = getUniqueOptions(
        nodes.filter((node) => {
          if (node.type !== type) {
            return false;
          }
          if (constraints.length === 0) {
            return true;
          }
          const ancestorIds = getAncestorIds(node, nodesByKey);
          return constraints.every((constraint) => ancestorIds.has(constraint.id));
        }),
      );

      if (options.length === 0) {
        return [];
      }

      return [{
        type,
        label: TYPE_LABELS[type],
        placeholder: getPlaceholder(viewerRole, type),
        value: selectedIdsByType.get(type) ?? '',
        options,
      }];
    });
  }, [adminManagerOptions, nodes, nodesByKey, selectedAdminManagerId, selectedIdsByType, selectorOrder, viewerRole]);

  const handleSelectorChange = useCallback((type: ScheduleScopeType, value: string) => {
    const normalizedValue = normalizeId(value);
    if (viewerRole === 'admin' && type === 'manager') {
      onSelectedAdminManagerIdChange?.(normalizedValue);
      updateScope(normalizedValue ? { type: 'manager', id: normalizedValue } : null);
      return;
    }

    if (normalizedValue) {
      updateScope({ type, id: normalizedValue });
      return;
    }

    const currentIndex = selectorOrder.indexOf(type);
    const previousTypes = selectorOrder.slice(0, currentIndex);
    for (let index = previousTypes.length - 1; index >= 0; index -= 1) {
      const previousType = previousTypes[index];
      const previousId = selectedIdsByType.get(previousType);
      if (previousId) {
        updateScope({ type: previousType, id: previousId });
        return;
      }
    }

    updateScope(defaultRootScope);
  }, [defaultRootScope, onSelectedAdminManagerIdChange, selectedIdsByType, selectorOrder, updateScope, viewerRole]);

  const headerActions = useMemo(() => {
    const hasScopeControls = selectorConfigs.length > 0 || Boolean(extraActions) || Boolean(onShowTestEcosystemsChange);
    if (!hasScopeControls) {
      return undefined;
    }
    return (
      <div className="flex flex-wrap items-center gap-2">
        {typeof showTestEcosystems === 'boolean' && onShowTestEcosystemsChange ? (
          <button
            type="button"
            onClick={() => onShowTestEcosystemsChange(!showTestEcosystems)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${
              showTestEcosystems
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {showTestEcosystems ? 'Hide test' : 'Show test'}
          </button>
        ) : null}
        {selectorConfigs.map((selector) => (
          <div key={selector.type} className="flex items-center gap-2">
            <label htmlFor={`schedule-scope-${selector.type}`} className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              {selector.label}
            </label>
            <select
              id={`schedule-scope-${selector.type}`}
              value={selector.value}
              onChange={(event) => handleSelectorChange(selector.type, event.target.value)}
              className="min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="">{selector.placeholder}</option>
              {selector.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {extraActions}
      </div>
    );
  }, [extraActions, handleSelectorChange, onShowTestEcosystemsChange, selectorConfigs, showTestEcosystems]);

  const resolvedTestMode = viewerRole === 'admin'
    ? (selectedAdminManagerId && selectedAdminManagerId.includes('-TEST') ? 'only' : 'exclude')
    : undefined;

  return {
    scopeType: effectiveScope?.type,
    scopeId: effectiveScope?.id,
    scopeIds,
    scopeTree,
    testMode: resolvedTestMode,
    headerActions,
  };
}
