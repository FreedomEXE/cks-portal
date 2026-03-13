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
  viewerLabel?: string;
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
  scopeLabel?: string;
  identityLabel?: string;
  headerMeta?: ReactNode;
}

interface ParsedScope {
  type: ScheduleScopeType;
  id: string;
}

type HeaderScopeMode =
  | 'all_ecosystems'
  | 'manager'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew'
  | 'my_schedule'
  | 'center_schedule'
  | 'warehouse';

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

function getHeaderScopeOptions(
  viewerRole?: ScheduleViewerRole,
  hasSelectedRoot = false,
): Array<{ value: HeaderScopeMode; label: string }> {
  switch (viewerRole) {
    case 'admin':
      return hasSelectedRoot ? [
        { value: 'all_ecosystems', label: 'All Ecosystems' },
        { value: 'manager', label: 'Ecosystem' },
        { value: 'contractor', label: 'Contractor' },
        { value: 'customer', label: 'Customer' },
        { value: 'center', label: 'Center' },
        { value: 'crew', label: 'Crew' },
      ] : [
        { value: 'all_ecosystems', label: 'All Ecosystems' },
        { value: 'manager', label: 'Ecosystem' },
      ];
    case 'manager':
      return [
        { value: 'manager', label: 'Ecosystem' },
        { value: 'contractor', label: 'Contractor' },
        { value: 'customer', label: 'Customer' },
        { value: 'center', label: 'Center' },
        { value: 'crew', label: 'Crew' },
      ];
    case 'contractor':
      return [
        { value: 'contractor', label: 'Contractor' },
        { value: 'customer', label: 'Customer' },
        { value: 'center', label: 'Center' },
        { value: 'crew', label: 'Crew' },
      ];
    case 'customer':
      return [
        { value: 'customer', label: 'Customer' },
        { value: 'center', label: 'Center' },
        { value: 'crew', label: 'Crew' },
      ];
    case 'center':
      return [
        { value: 'center', label: 'Center' },
        { value: 'crew', label: 'Crew' },
      ];
    case 'crew':
      return [
        { value: 'my_schedule', label: 'My Schedule' },
        { value: 'center_schedule', label: 'Center Schedule' },
      ];
    case 'warehouse':
      return [{ value: 'warehouse', label: 'Warehouse' }];
    default:
      return [];
  }
}

function getHeaderScopeMode(
  viewerRole: ScheduleViewerRole | undefined,
  effectiveScope: ParsedScope | null,
  defaultRootScope: ParsedScope | null,
): HeaderScopeMode {
  if (viewerRole === 'admin') {
    return effectiveScope?.type ?? 'all_ecosystems';
  }
  if (viewerRole === 'crew') {
    return effectiveScope?.type === 'center' ? 'center_schedule' : 'my_schedule';
  }
  if (viewerRole === 'warehouse') {
    return 'warehouse';
  }
  return (effectiveScope?.type ?? defaultRootScope?.type ?? 'manager') as HeaderScopeMode;
}

function getIdentityFallbackLabel(
  viewerRole: ScheduleViewerRole | undefined,
  viewerLabel?: string | null,
  viewerCode?: string | null,
): string | undefined {
  if (viewerLabel?.trim()) {
    return viewerLabel.trim();
  }
  const normalizedCode = normalizeId(viewerCode);
  if (normalizedCode) {
    if (viewerRole === 'admin') {
      return `Administrator (${normalizedCode})`;
    }
    return normalizedCode;
  }
  if (viewerRole === 'admin') {
    return 'Administrator';
  }
  if (viewerRole === 'warehouse') {
    return 'Warehouse';
  }
  return undefined;
}

function closeMenu(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return;
  }
  target.closest('details')?.removeAttribute('open');
}

function InlineHeaderValue({
  value,
  selectedValue,
  options,
  onSelect,
  tone = 'secondary',
  hint,
}: {
  value: string;
  selectedValue?: string;
  options?: ScopeOption[];
  onSelect?: (value: string) => void;
  tone?: 'primary' | 'secondary';
  hint?: string;
}) {
  const triggerClasses = tone === 'primary'
    ? 'rounded-2xl px-3 py-1.5 text-lg font-black text-slate-700 transition hover:bg-slate-100 hover:text-slate-900'
    : 'rounded-2xl px-3 py-1.5 text-base font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800';
  const panelWidth = tone === 'primary' ? 'w-[18rem] max-w-[90vw]' : 'w-[22rem] max-w-[90vw]';
  const selectableOptions = options ?? [];

  if (!onSelect || selectableOptions.length <= 1) {
    return (
      <div title={hint} className={triggerClasses}>
        {value}
      </div>
    );
  }

  return (
    <details className="group relative">
      <summary title={hint} className={`list-none cursor-pointer ${triggerClasses}`}>
        <span>{value}</span>
      </summary>
      <div className={`absolute left-1/2 top-[calc(100%+8px)] z-20 ${panelWidth} -translate-x-1/2 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)]`}>
        <div className="max-h-[320px] overflow-y-auto pr-1">
        {selectableOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={(event) => {
              onSelect(option.id);
              closeMenu(event.currentTarget);
            }}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              option.id === selectedValue
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        ))}
        </div>
      </div>
    </details>
  );
}

export function useScheduleScopeControls({
  viewerRole,
  viewerCode,
  viewerLabel,
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

  const scopeOptions = useMemo(
    () => getHeaderScopeOptions(viewerRole, Boolean(effectiveScope?.id)),
    [effectiveScope?.id, viewerRole],
  );
  const activeScopeMode = useMemo(
    () => getHeaderScopeMode(viewerRole, effectiveScope, defaultRootScope),
    [defaultRootScope, effectiveScope, viewerRole],
  );

  const resolveFirstOptionId = useCallback((type: ScheduleScopeType): string | null => {
    if (viewerRole === 'admin' && type === 'manager') {
      return normalizeId(selectedAdminManagerId) ?? normalizeId(adminManagerOptions[0]?.id);
    }

    if (selectedIdsByType.get(type)) {
      return selectedIdsByType.get(type) ?? null;
    }

    if (defaultRootScope?.type === type) {
      return defaultRootScope.id;
    }

    const selector = selectorConfigs.find((config) => config.type === type);
    return selector?.options[0]?.id ?? null;
  }, [adminManagerOptions, defaultRootScope, selectedAdminManagerId, selectedIdsByType, selectorConfigs, viewerRole]);

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

  const scopeLabel = useMemo(() => {
    switch (activeScopeMode) {
      case 'all_ecosystems':
        return 'All Ecosystems';
      case 'my_schedule':
        return 'My Schedule';
      case 'center_schedule':
        return 'Center Schedule';
      case 'manager':
        return 'Ecosystem';
      case 'contractor':
        return 'Contractor';
      case 'customer':
        return 'Customer';
      case 'center':
        return 'Center';
      case 'crew':
        return 'Crew';
      case 'warehouse':
        return 'Warehouse';
      default:
        return undefined;
    }
  }, [activeScopeMode]);

  const identityLabel = useMemo(() => {
    if (activeScopeMode === 'all_ecosystems') {
      return getIdentityFallbackLabel(viewerRole, viewerLabel, viewerCode);
    }

    if (activeScopeMode === 'my_schedule' || activeScopeMode === 'warehouse') {
      return getIdentityFallbackLabel(viewerRole, viewerLabel, viewerCode);
    }

    if (activeScopeMode === 'manager' && viewerRole === 'admin') {
      const selectedManager = adminManagerOptions.find((option) => normalizeId(option.id) === normalizeId(selectedAdminManagerId));
      return selectedManager?.label ?? getIdentityFallbackLabel(viewerRole, viewerLabel, viewerCode);
    }

    if (defaultRootScope && effectiveScope?.type === defaultRootScope.type && effectiveScope.id === defaultRootScope.id) {
      return getIdentityFallbackLabel(viewerRole, viewerLabel, viewerCode) ?? selectedNode?.label;
    }

    return selectedNode?.label ?? getIdentityFallbackLabel(viewerRole, viewerLabel, viewerCode);
  }, [
    activeScopeMode,
    adminManagerOptions,
    defaultRootScope,
    effectiveScope,
    selectedAdminManagerId,
    selectedNode,
    viewerCode,
    viewerLabel,
    viewerRole,
  ]);

  const identitySelector = useMemo(() => {
    if (activeScopeMode === 'all_ecosystems' || activeScopeMode === 'my_schedule' || activeScopeMode === 'warehouse') {
      return null;
    }

    if (viewerRole === 'admin' && activeScopeMode === 'manager') {
      return {
        value: normalizeId(selectedAdminManagerId) ?? '',
        options: adminManagerOptions.map((option) => ({ id: option.id, label: option.label })),
        onChange: (value: string) => handleSelectorChange('manager', value),
      };
    }

    if (activeScopeMode === 'center_schedule') {
      const centerSelector = selectorConfigs.find((config) => config.type === 'center');
      return centerSelector
        ? {
            value: centerSelector.value,
            options: centerSelector.options,
            onChange: (value: string) => handleSelectorChange('center', value),
          }
        : null;
    }

    const mappedType = activeScopeMode as ScheduleScopeType;
    const selector = selectorConfigs.find((config) => config.type === mappedType);
    return selector
      ? {
          value: selector.value,
          options: selector.options,
          onChange: (value: string) => handleSelectorChange(mappedType, value),
        }
      : null;
  }, [activeScopeMode, adminManagerOptions, handleSelectorChange, selectedAdminManagerId, selectorConfigs, viewerRole]);

  const handleScopeModeChange = useCallback((value: string) => {
    const mode = value as HeaderScopeMode;

    if (mode === 'all_ecosystems') {
      onSelectedAdminManagerIdChange?.(null);
      updateScope(null);
      return;
    }

    if (mode === 'my_schedule' || mode === 'warehouse') {
      updateScope(defaultRootScope);
      return;
    }

    if (mode === 'center_schedule') {
      const centerId = resolveFirstOptionId('center');
      if (centerId) {
        updateScope({ type: 'center', id: centerId });
      }
      return;
    }

    const nextType = mode as ScheduleScopeType;
    const nextId = resolveFirstOptionId(nextType);

    if (viewerRole === 'admin' && nextType === 'manager') {
      onSelectedAdminManagerIdChange?.(nextId);
    }

    if (nextId) {
      updateScope({ type: nextType, id: nextId });
    }
  }, [defaultRootScope, onSelectedAdminManagerIdChange, resolveFirstOptionId, updateScope, viewerRole]);

  const headerMeta = useMemo(() => {
    const hasControls = scopeOptions.length > 0 || Boolean(identityLabel) || Boolean(onShowTestEcosystemsChange) || Boolean(extraActions);

    if (!hasControls) {
      return undefined;
    }

    const scopeMenuOptions = scopeOptions.map((option) => ({ id: option.value, label: option.label }));
    const identityMenuOptions = identitySelector?.options ?? [];

    return (
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <InlineHeaderValue
            value={scopeLabel ?? 'Current Scope'}
            selectedValue={activeScopeMode}
            options={scopeMenuOptions}
            onSelect={handleScopeModeChange}
            tone="primary"
            hint="Click to change scope"
          />

          {identityLabel ? (
            <InlineHeaderValue
              value={identityLabel}
              selectedValue={identitySelector?.value}
              options={identityMenuOptions}
              onSelect={identitySelector ? identitySelector.onChange : undefined}
              tone="secondary"
              hint="Click to change identity"
            />
          ) : null}
          {typeof showTestEcosystems === 'boolean' && onShowTestEcosystemsChange ? (
            <button
              type="button"
              title="Click to toggle test ecosystems"
              onClick={() => onShowTestEcosystemsChange(!showTestEcosystems)}
              className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-sm transition-colors ${
                showTestEcosystems
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {showTestEcosystems ? 'Hide test' : 'Show test'}
            </button>
          ) : null}
          {extraActions}
        </div>
      </div>
    );
  }, [
    activeScopeMode,
    extraActions,
    handleScopeModeChange,
    identityLabel,
    identitySelector,
    onShowTestEcosystemsChange,
    scopeOptions,
    showTestEcosystems,
  ]);

  const resolvedTestMode = viewerRole === 'admin'
    ? (selectedAdminManagerId && selectedAdminManagerId.includes('-TEST') ? 'only' : 'exclude')
    : undefined;

  return {
    scopeType: effectiveScope?.type,
    scopeId: effectiveScope?.id,
    scopeIds,
    scopeTree,
    testMode: resolvedTestMode,
    scopeLabel,
    identityLabel,
    headerMeta,
  };
}
