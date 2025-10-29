/**
 * ModalProvider - Simplified Universal Modal Management
 *
 * New architecture using ModalGateway for all entity types.
 * Eliminates need for entity-specific logic in the provider.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@cks/auth';
import { useEffect } from 'react';
import ModalGateway from '../components/ModalGateway';
import type { EntityType, UserRole, OpenEntityModalOptions } from '../types/entities';
import { parseEntityId, isValidId } from '../shared/utils/parseEntityId';
import { apiFetch } from '../shared/api/client';

export interface ModalContextValue {
  /**
   * Open modal by ID only - type detected automatically
   * This is the ID-first architecture entrypoint
   *
   * @param id - The entity ID (e.g., "CON-010-FBK-001")
   * @param options - Optional modal configuration
   * @example modals.openById('CON-010-FBK-001')
   */
  openById: (id: string, options?: OpenEntityModalOptions) => void;

  /** Open any entity modal (internal - use openById instead) */
  openEntityModal: (
    entityType: EntityType,
    entityId: string,
    options?: OpenEntityModalOptions
  ) => void;

  /** Close current modal */
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  // Get current auth state (reactive to changes)
  const { code, role: authRole } = useAuth();
  const currentUserId = code || '';

  // Normalize external auth roles to our internal union
  const normalizeRole = (r?: string): UserRole => {
    const raw = (r || '').toLowerCase();
    const map: Record<string, UserRole> = {
      administrator: 'admin',
      admin: 'admin',
      mgr: 'manager',
      manager: 'manager',
      contractor: 'contractor',
      crew: 'crew',
      customer: 'customer',
      center: 'center',
      warehouse: 'warehouse',
      war: 'warehouse',
      whs: 'warehouse',
    };
    return map[raw] || (raw as UserRole) || 'crew';
  };

  const role = normalizeRole(authRole);

  console.log('[ModalProvider] Current auth state:', { code, authRole, resolvedRole: role });

  // Single state for current modal
  const [currentModal, setCurrentModal] = useState<{
    entityType: EntityType;
    entityId: string;
    options?: OpenEntityModalOptions;
  } | null>(null);

  // Generic open function
  const openEntityModal = useCallback(
    async (entityType: EntityType, entityId: string, options?: OpenEntityModalOptions) => {
      // Entity types that need prefetching (profiles and products)
      const userEntityTypes: EntityType[] = ['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];
      const needsFetch = userEntityTypes.includes(entityType) || entityType === 'product';

      if (needsFetch) {
        // Determine endpoint per entity type
        const endpoint = entityType === 'product'
          ? `/catalog/products/${entityId}/details`
          : `/profile/${entityType}/${entityId}`;

        console.log(`[ModalProvider] Fetching ${entityType} data from: ${endpoint}`);

        try {
          const response = await apiFetch<{
            data: any;
            state?: 'active' | 'archived' | 'deleted';
            deletedAt?: string;
            deletedBy?: string;
            archivedAt?: string;
            archivedBy?: string;
          }>(endpoint);

          console.log(`[ModalProvider] Fetched ${entityType} data:`, response);

          // Pass fetched data via options with lifecycle metadata
          // CRITICAL: Caller state ALWAYS wins (e.g., from Archive context)
          const enrichedOptions = {
            ...options,
            data: response.data,
            // Priority 1: Caller-provided state (from Archive, etc.) - NEVER OVERRIDE
            ...( options?.state
              ? { state: options.state }
              // Priority 2: Backend explicit state
              : response.state
                ? { state: response.state }
                // Priority 3: Derive from data.status (catalog entities)
                : response.data?.status
                  ? { state: response.data.status === 'inactive' || response.data.status === 'archived' ? 'archived' : 'active' }
                  : {}
            ),
            archivedAt: response.archivedAt || options?.archivedAt,
            archivedBy: response.archivedBy || options?.archivedBy,
            deletedAt: response.deletedAt || options?.deletedAt,
            deletedBy: response.deletedBy || options?.deletedBy,
          } as any;

          setCurrentModal({ entityType, entityId, options: enrichedOptions });
          return;
        } catch (error) {
          console.error(`[ModalProvider] Failed to fetch ${entityType} ${entityId}:`, error);
          // Continue with modal open - ModalGateway will show error state
        }
      }

      // For non-fetching entities, just open with provided options
      setCurrentModal({ entityType, entityId, options });
    },
    []
  );

  // ID-first open function - automatic type detection
  const openById = useCallback(
    async (id: string, options?: OpenEntityModalOptions) => {
      // Validate ID format
      if (!isValidId(id)) {
        console.error(`[ModalProvider] Invalid ID format: "${id}"`);
        return;
      }

      // Parse ID to determine type
      const { type, subtype } = parseEntityId(id);
      console.log(`[ModalProvider] Parsed ID "${id}":`, { type, subtype });

      // Handle unknown types
      if (type === 'unknown') {
        console.error(`[ModalProvider] Unknown entity type for ID: "${id}"`);
        return;
      }

      // For orders, always use 'order' type (subtype is just metadata: product/service)
      // For reports, use subtype ('feedback' vs 'report')
      // For users, fetch from backend and use subtype (manager/contractor/etc.)
      // Everything else uses type
      let entityType: EntityType;
      let enrichedOptions = options;

      if (type === 'user' && subtype) {
        // User entities: fetch fresh from database
        entityType = subtype as EntityType;

        console.log(`[ModalProvider] Fetching ${entityType} profile for ID: ${id}`);

        try {
          const response = await apiFetch<{
            data: any;
            state: 'active' | 'archived' | 'deleted';
            deletedAt?: string;
            deletedBy?: string;
            archivedAt?: string;
            archivedBy?: string;
          }>(
            `/profile/${entityType}/${id}`
          );

          console.log(`[ModalProvider] Fetched ${entityType} data:`, response);

          // Pass fetched data via options with lifecycle metadata
          // CRITICAL: Caller state ALWAYS wins (e.g., from Archive context)
          enrichedOptions = {
            ...options,
            data: response.data,
            // Priority 1: Caller-provided state (from Archive, etc.) - NEVER OVERRIDE
            ...( options?.state
              ? { state: options.state }
              // Priority 2: Backend explicit state
              : response.state
                ? { state: response.state }
                // Priority 3: Derive from data.status (catalog entities)
                : response.data?.status
                  ? { state: response.data.status === 'inactive' || response.data.status === 'archived' ? 'archived' : 'active' }
                  : {}
            ),
            archivedAt: response.archivedAt || options?.archivedAt,
            archivedBy: response.archivedBy || options?.archivedBy,
            deletedAt: response.deletedAt || options?.deletedAt,
            deletedBy: response.deletedBy || options?.deletedBy,
          } as any;
        } catch (error) {
          console.error(`[ModalProvider] Failed to fetch ${entityType} ${id}:`, error);
          // Continue with modal open - ModalGateway will show error state
        }
      } else if (type === 'catalogService') {
        // Catalog Service entities: fetch from catalog endpoint
        entityType = 'catalogService' as EntityType;

        console.log(`[ModalProvider] Fetching catalogService for ID: ${id}`);

        try {
          const response = await apiFetch<{
            data: any;
          }>(
            `/catalog/services/${id}/details`
          );

          console.log(`[ModalProvider] Fetched catalogService data:`, response);
          console.log(`[ModalProvider] catalogService data keys:`, Object.keys(response.data || {}));
          console.log(`[ModalProvider] Admin lists present:`, {
            hasPeopleManagers: !!response.data?.peopleManagers,
            hasPeopleContractors: !!response.data?.peopleContractors,
            hasPeopleCrew: !!response.data?.peopleCrew,
            hasPeopleWarehouses: !!response.data?.peopleWarehouses,
            hasCertifiedManagers: !!response.data?.certifiedManagers,
            managersCount: response.data?.peopleManagers?.length,
            certifiedManagersCount: response.data?.certifiedManagers?.length,
          });

          // Pass fetched data via options (derive state from status)
          // Backend returns status: 'active' | 'inactive'
          // Map inactive → archived for lifecycle consistency
          // Preserve caller state if backend doesn't return explicit state
          enrichedOptions = {
            ...options,
            data: response.data,
            // Only override state if backend explicitly returns it
            ...(response.data?.state && { state: response.data.state }),
            // Fallback: derive from data.status if no explicit state
            ...(!response.data?.state && !options?.state && response.data?.status && {
              state: response.data.status === 'inactive' || response.data.status === 'archived' ? 'archived' : 'active'
            }),
            // Prefer top-level lifecycle metadata if provided by endpoint, else look under data
            archivedAt: (response as any).archivedAt ?? (response as any).data?.archivedAt,
            archivedBy: (response as any).archivedBy ?? (response as any).data?.archivedBy,
            deletedAt: (response as any).deletedAt ?? (response as any).data?.deletedAt,
            deletedBy: (response as any).deletedBy ?? (response as any).data?.deletedBy,
          } as any;
        } catch (error) {
          console.error(`[ModalProvider] Failed to fetch catalogService ${id}:`, error);

          // Soft fallback: attempt to locate from catalog list API so modal can still open
          try {
            const listResp = await apiFetch<{
              data: { items: any[] };
            }>(`/catalog/items?type=service&q=${encodeURIComponent(id)}`);

            const match = (listResp?.data?.items || []).find((it: any) =>
              (it?.code || '').toUpperCase() === id.toUpperCase()
            );

            if (match) {
              const fallbackData = {
                serviceId: match.code,
                name: match.name,
                category: match.category || (Array.isArray(match.tags) ? match.tags[0] : null),
                description: match.description,
                tags: match.tags || [],
                status: 'active',
                metadata: match.metadata || {},
                imageUrl: match.imageUrl || null,
                price: match.price || null,
                durationMinutes: match.service?.durationMinutes ?? null,
                serviceWindow: match.service?.serviceWindow ?? null,
                attributes: match.service?.attributes ?? null,
                crewRequired: match.crewRequired ?? null,
                managedBy: match.managedBy || 'manager',
              };

              enrichedOptions = {
                ...options,
                data: fallbackData,
                state: 'active',
              } as any;

              console.warn('[ModalProvider] Using catalog items fallback for catalogService', id);
            }
          } catch (fallbackErr) {
            console.error('[ModalProvider] Fallback catalog items lookup failed', fallbackErr);
          }
        }
      } else if (type === 'product') {
        // Product catalog items: fetch from catalog list + admin inventory (if admin)
        entityType = 'product' as EntityType;

        console.log(`[ModalProvider] Fetching product for ID: ${id}`);

        try {
          // Fetch from catalog list
          const listResp = await apiFetch<{
            data: { items: any[] };
          }>(`/catalog/items?type=product&q=${encodeURIComponent(id)}`);

          const match = (listResp?.data?.items || []).find((it: any) => (it?.code || '').toUpperCase() === id.toUpperCase());

          if (match) {
            const data: any = {
              productId: match.code,
              name: match.name,
              category: match.category || null,
              description: match.description || null,
              unitOfMeasure: match.unitOfMeasure || null,
              price: match.price || null,
              metadata: match.metadata || null,
              status: 'active',
            };

            // If admin, fetch inventory
            try {
              const inv = await apiFetch<{ success: boolean; data: any[] }>(`/admin/catalog/products/${encodeURIComponent(id)}/inventory`);
              if (inv?.success && Array.isArray(inv.data)) {
                data.inventoryData = inv.data;
              }
            } catch (invErr) {
              console.warn('[ModalProvider] Inventory fetch failed (non-fatal)', invErr);
            }

            // Preserve caller state; default to 'active' only if none provided
            enrichedOptions = {
              ...options,
              data,
              ...(options?.state ? {} : { state: 'active' }),
            } as any;
          }
        } catch (error) {
          console.error(`[ModalProvider] Failed to fetch product ${id}:`, error);
        }
      } else {
        entityType = (type === 'order' ? type : (subtype || type)) as EntityType;
      }

      console.log(`[ModalProvider] Opening ${entityType} modal for ID: ${id}`);

      // Delegate to openEntityModal
      openEntityModal(entityType, id, enrichedOptions);
    },
    [openEntityModal]
  );

  // Close function
  const closeModal = useCallback(() => {
    setCurrentModal(null);
    // Call onClosed callback if provided
    if (currentModal?.options?.onClosed) {
      currentModal.options.onClosed();
    }
  }, [currentModal]);

  const value: ModalContextValue = {
    openById,
    openEntityModal,
    closeModal,
  };

  // Allow content inside adapters to request closing the modal without wiring changes
  useEffect(() => {
    const handler = () => closeModal();
    window.addEventListener('cks:modal:close', handler as EventListener);
    return () => window.removeEventListener('cks:modal:close', handler as EventListener);
  }, [closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* Single ModalGateway handles ALL entity types */}
      <ModalGateway
        isOpen={!!currentModal}
        onClose={closeModal}
        entityType={currentModal?.entityType || null}
        entityId={currentModal?.entityId || null}
        role={role}
        currentUserId={currentUserId}
        options={currentModal?.options}
      />
    </ModalContext.Provider>
  );
}

/**
 * Hook to access modal functions
 */
export function useModals(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return context;
}
