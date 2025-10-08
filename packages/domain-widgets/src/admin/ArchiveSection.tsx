import { Button, DataTable, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';
import { useEffect, useMemo, useState } from 'react';

// Import the proper archive API client and types
// Note: This import path needs to be adjusted based on your actual app structure
// For now, we'll define the interface that the parent should pass
export type EntityType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'service' | 'product' | 'order' | 'report' | 'feedback';

export interface ArchivedEntity {
  id: string;
  entityType: EntityType;
  name: string;
  archivedAt: string;
  archivedBy: string;
  archiveReason?: string;
  deletionScheduled?: string;
}

export interface ArchiveAPI {
  listArchived(entityType?: EntityType): Promise<ArchivedEntity[]>;
  restoreEntity(entityType: EntityType, entityId: string): Promise<any>;
  hardDelete(entityType: EntityType, entityId: string, reason?: string): Promise<any>;
  getRelationships(entityType: EntityType, entityId: string): Promise<any[]>;
}

// Props interface to receive the API client
export interface ArchiveSectionProps {
  archiveAPI?: ArchiveAPI;
  onViewOrderDetails?: (orderId: string, orderType: 'product' | 'service') => void;
}

const ARCHIVE_TABS = [
  { id: 'manager', label: 'Managers', color: '#3b82f6', search: 'archived managers' },
  { id: 'contractor', label: 'Contractors', color: '#10b981', search: 'archived contractors' },
  { id: 'customer', label: 'Customers', color: '#eab308', search: 'archived customers' },
  { id: 'center', label: 'Centers', color: '#f97316', search: 'archived centers' },
  { id: 'crew', label: 'Crew', color: '#ef4444', search: 'archived crew' },
  { id: 'warehouse', label: 'Warehouses', color: '#8b5cf6', search: 'archived warehouses' },
  { id: 'services', label: 'Services', color: '#14b8a6', search: 'archived services', hasDropdown: true },
  { id: 'product', label: 'Products', color: '#d946ef', search: 'archived products' },
  { id: 'orders', label: 'Orders', color: '#6366f1', search: 'archived orders', hasDropdown: true },
  { id: 'reports', label: 'Reports & Feedback', color: '#92400e', search: 'archived reports', hasDropdown: true },
];

const TAB_COLUMN_CONFIG: Record<string, { idLabel: string; nameLabel: string }> = {
  manager: { idLabel: 'MANAGER ID', nameLabel: 'MANAGER NAME' },
  contractor: { idLabel: 'CONTRACTOR ID', nameLabel: 'NAME' },
  customer: { idLabel: 'CUSTOMER ID', nameLabel: 'NAME' },
  center: { idLabel: 'CENTER ID', nameLabel: 'NAME' },
  crew: { idLabel: 'CREW ID', nameLabel: 'CREW NAME' },
  warehouse: { idLabel: 'WAREHOUSE ID', nameLabel: 'NAME' },
  'catalog-services': { idLabel: 'SERVICE ID', nameLabel: 'CATALOG SERVICE' },
  'active-services': { idLabel: 'SERVICE ID', nameLabel: 'ACTIVE SERVICE' },
  product: { idLabel: 'PRODUCT ID', nameLabel: 'PRODUCT NAME' },
  'product-orders': { idLabel: 'ORDER ID', nameLabel: 'PRODUCT ORDER' },
  'service-orders': { idLabel: 'ORDER ID', nameLabel: 'SERVICE ORDER' },
  'reports': { idLabel: 'REPORT ID', nameLabel: 'TITLE' },
  'feedback': { idLabel: 'FEEDBACK ID', nameLabel: 'TITLE' },
};

const BASE_COLUMNS = [
  { key: 'archivedBy', label: 'ARCHIVED BY' },
  { key: 'archivedAt', label: 'ARCHIVED ON' },
  { key: 'deletionScheduled', label: 'SCHEDULED DELETION' },
  { key: 'actions', label: '', width: '80px' },
];

function buildColumns(tabId: string) {
  const config = TAB_COLUMN_CONFIG[tabId as keyof typeof TAB_COLUMN_CONFIG];
  if (!config) return [];

  return [
    { key: 'id', label: config.idLabel, clickable: true },
    { key: 'name', label: config.nameLabel },
    ...BASE_COLUMNS
  ];
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ArchiveSection({ archiveAPI, onViewOrderDetails }: ArchiveSectionProps) {
  console.log('[ArchiveSection] Component rendering with archiveAPI:', !!archiveAPI);
  console.log('[ArchiveSection] archiveAPI methods:', archiveAPI ? Object.getOwnPropertyNames(Object.getPrototypeOf(archiveAPI)) : 'No API');
  console.log('[ArchiveSection] archiveAPI type:', typeof archiveAPI);
  console.log('[ArchiveSection] archiveAPI full object:', archiveAPI);

  const [activeTab, setActiveTab] = useState('manager');
  const [servicesSubTab, setServicesSubTab] = useState<string>('catalog-services');
  const [ordersSubTab, setOrdersSubTab] = useState<string>('product-orders');
  const [reportsSubTab, setReportsSubTab] = useState<string>('reports');
  const [archivedData, setArchivedData] = useState<ArchivedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<ArchivedEntity | null>(null);

  // Fallback to a no-op API if none provided (for dev/testing)
  const api = archiveAPI || {
    listArchived: async () => {
      console.warn('[ArchiveSection] Using fallback no-op API - no archiveAPI prop provided!');
      return [];
    },
    restoreEntity: async () => ({ success: false }),
    hardDelete: async () => ({ success: false }),
    getRelationships: async () => []
  };

  useEffect(() => {
    loadArchivedData();
  }, [activeTab, servicesSubTab, ordersSubTab, reportsSubTab]);

  const loadArchivedData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get effective tab considering sub-tabs
      const effectiveTab = (() => {
        if (activeTab === 'services') return servicesSubTab;
        if (activeTab === 'orders') return ordersSubTab;
        if (activeTab === 'reports') return reportsSubTab;
        return activeTab;
      })();

      console.log('[ArchiveSection] Loading data for tab:', activeTab, 'effective:', effectiveTab);
      console.log('[ArchiveSection] API available:', !!api);

      // Determine entity type and filter
      let entityType: EntityType = activeTab as EntityType;
      let orderTypeFilter: 'product' | 'service' | null = null;

      if (effectiveTab === 'product-orders') {
        entityType = 'order';
        orderTypeFilter = 'product';
      } else if (effectiveTab === 'service-orders') {
        entityType = 'order';
        orderTypeFilter = 'service';
      } else if (effectiveTab === 'catalog-services' || effectiveTab === 'active-services') {
        entityType = 'service';
      } else if (effectiveTab === 'reports' || effectiveTab === 'feedback') {
        // For reports subtab, use the specific entity type
        entityType = effectiveTab as EntityType;
      }

      const data = await api.listArchived(entityType);
      console.log('[ArchiveSection] Data received:', data?.length, 'items');

      // Filter by order type or service type if needed
      let filteredData = data;
      if (orderTypeFilter) {
        filteredData = data.filter((item: any) => {
          return item.orderType === orderTypeFilter;
        });
        console.log('[ArchiveSection] Filtered to', orderTypeFilter, 'orders:', filteredData.length);
      } else if (effectiveTab === 'catalog-services') {
        // Filter for catalog services (srv-001 pattern)
        filteredData = data.filter((item: any) => {
          return item.id && /^srv-\d+$/i.test(item.id);
        });
        console.log('[ArchiveSection] Filtered to catalog services:', filteredData.length);
      } else if (effectiveTab === 'active-services') {
        // Filter for active services (cen-001-srv-001 pattern)
        filteredData = data.filter((item: any) => {
          return item.id && /^[a-z]{3}-\d+-srv-\d+$/i.test(item.id);
        });
        console.log('[ArchiveSection] Filtered to active services:', filteredData.length);
      }

      setArchivedData(filteredData);
    } catch (err) {
      console.error('[ArchiveSection] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load archived data');
      setArchivedData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (entity: ArchivedEntity) => {
    setSelectedEntity(entity);
    setShowActionModal(true);
  };

  const handleModalClose = () => {
    setShowActionModal(false);
    setSelectedEntity(null);
  };

  const handleRestore = async () => {
    if (!selectedEntity) return;

    // Get effective tab
    const effectiveTab = (() => {
      if (activeTab === 'services') return servicesSubTab;
      if (activeTab === 'orders') return ordersSubTab;
      return activeTab;
    })();

    // Determine the actual entityType for API call
    const actualEntityType = (() => {
      if (effectiveTab === 'product-orders' || effectiveTab === 'service-orders') return 'order';
      if (effectiveTab === 'catalog-services' || effectiveTab === 'active-services') return 'service';
      return selectedEntity.entityType;
    })();

    if (!confirm(`Restore ${selectedEntity.entityType} ${selectedEntity.id}? It will be moved to the unassigned bucket.`)) {
      return;
    }

    try {
      await api.restoreEntity(actualEntityType, selectedEntity.id);
      await loadArchivedData(); // Reload the list
      alert(`${selectedEntity.entityType} ${selectedEntity.id} has been restored to the unassigned bucket.`);
      handleModalClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore entity');
    }
  };

  const handleHardDelete = async () => {
    if (!selectedEntity) return;

    // Get effective tab
    const effectiveTab = (() => {
      if (activeTab === 'services') return servicesSubTab;
      if (activeTab === 'orders') return ordersSubTab;
      return activeTab;
    })();

    // Determine the actual entityType for API call
    const actualEntityType = (() => {
      if (effectiveTab === 'product-orders' || effectiveTab === 'service-orders') return 'order';
      if (effectiveTab === 'catalog-services' || effectiveTab === 'active-services') return 'service';
      return selectedEntity.entityType;
    })();

    const confirmMessage = `⚠️ PERMANENT DELETION WARNING ⚠️\n\n` +
      `This will permanently delete ${selectedEntity.entityType} ${selectedEntity.id}.\n` +
      `This action cannot be undone!\n\n` +
      `Type "DELETE" to confirm:`;

    const confirmation = prompt(confirmMessage);
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      await api.hardDelete(actualEntityType, selectedEntity.id, 'Manual permanent deletion');
      await loadArchivedData(); // Reload the list
      alert(`${selectedEntity.entityType} ${selectedEntity.id} has been permanently deleted.`);
      handleModalClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to permanently delete entity');
    }
  };

  const config = useMemo(() => {
    // Get effective tab considering sub-tabs
    const effectiveTab = (() => {
      if (activeTab === 'services') return servicesSubTab;
      if (activeTab === 'orders') return ordersSubTab;
      return activeTab;
    })();

    const columns = buildColumns(effectiveTab);
    const tab = ARCHIVE_TABS.find((item) => item.id === activeTab) ?? ARCHIVE_TABS[0];

    // Transform data for display
    const displayData = archivedData
      .filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          item.id.toLowerCase().includes(search) ||
          item.name.toLowerCase().includes(search) ||
          (item.archiveReason?.toLowerCase().includes(search))
        );
      })
      .map(item => ({
        id: item.id,
        name: item.name,
        archivedBy: item.archivedBy,
        archivedAt: formatDate(item.archivedAt),
        deletionScheduled: formatDate(item.deletionScheduled),
        actions: (
          <button
            onClick={() => handleView(item)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            View
          </button>
        )
      }));

    return {
      columns,
      data: displayData,
      searchPlaceholder: `Search ${tab.search}...`,
      emptyMessage: loading ? 'Loading...' : error ? `Error: ${error}` : 'No archived records found.',
    };
  }, [activeTab, servicesSubTab, ordersSubTab, archivedData, searchTerm, loading, error]);

  return (
    <PageWrapper title="Archive" showHeader={false}>
      <TabContainer variant="pills" spacing="compact">
        {ARCHIVE_TABS.map((tab) => (
          <NavigationTab
            key={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            activeColor={tab.color}
          />
        ))}
      </TabContainer>

      <div style={{ marginTop: 24 }}>
        {/* Sub-tab dropdowns for Services and Orders */}
        {activeTab === 'services' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Button
              variant={servicesSubTab === 'catalog-services' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setServicesSubTab('catalog-services')}
            >
              Catalog Services
            </Button>
            <Button
              variant={servicesSubTab === 'active-services' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setServicesSubTab('active-services')}
            >
              Active Services
            </Button>
          </div>
        )}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Button
              variant={ordersSubTab === 'product-orders' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setOrdersSubTab('product-orders')}
            >
              Product Orders
            </Button>
            <Button
              variant={ordersSubTab === 'service-orders' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setOrdersSubTab('service-orders')}
            >
              Service Orders
            </Button>
          </div>
        )}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Button
              variant={reportsSubTab === 'reports' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setReportsSubTab('reports')}
            >
              Reports
            </Button>
            <Button
              variant={reportsSubTab === 'feedback' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setReportsSubTab('feedback')}
            >
              Feedback
            </Button>
          </div>
        )}

        <div style={{ marginBottom: 16, display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={config.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => {
              console.log('[ArchiveSection] Manual refresh clicked');
              loadArchivedData();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0f172a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Refresh
          </button>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {loading ? 'Loading...' : `${archivedData.length} items`}
          </span>
        </div>

        <DataTable
          columns={config.columns}
          data={config.data}
          emptyMessage={config.emptyMessage}
          showSearch={false}
        />

        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#fef3c7', borderRadius: 8 }}>
          <p style={{ fontSize: 14, color: '#92400e', marginBottom: 8 }}>
            <strong>Archive Information:</strong>
          </p>
          <ul style={{ fontSize: 12, color: '#92400e', marginLeft: 20 }}>
            <li>Archived entities are scheduled for automatic deletion after 30 days</li>
            <li>Restoring an entity moves it to the unassigned bucket</li>
            <li>You'll need to reassign restored entities to their parents and children</li>
            <li>Hard delete is permanent and cannot be undone</li>
          </ul>
        </div>
      </div>

      {/* Archive Action Modal */}
      {showActionModal && selectedEntity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                Archived {selectedEntity.entityType.charAt(0).toUpperCase() + selectedEntity.entityType.slice(1)}
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                ID: {selectedEntity.id}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Name: {selectedEntity.name}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Archived by: {selectedEntity.archivedBy}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Archived on: {formatDate(selectedEntity.archivedAt)}
              </p>
              {selectedEntity.archiveReason && (
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Reason: {selectedEntity.archiveReason}
                </p>
              )}
              {selectedEntity.deletionScheduled && (
                <p style={{ fontSize: '14px', color: '#ef4444', fontWeight: 500 }}>
                  Scheduled for deletion: {formatDate(selectedEntity.deletionScheduled)}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* View Details button for orders */}
              {selectedEntity.entityType === 'order' && onViewOrderDetails && (
                <button
                  onClick={() => {
                    const orderType = (selectedEntity as any).orderType === 'service' ? 'service' : 'product';
                    onViewOrderDetails(selectedEntity.id, orderType);
                    handleModalClose();
                  }}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  📄 View Order Details
                </button>
              )}

              <button
                onClick={handleRestore}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                ✓ Restore to Unassigned
              </button>

              <button
                onClick={async () => {
                  if (selectedEntity) {
                    try {
                      // Get effective tab
                      const effectiveTab = (() => {
                        if (activeTab === 'services') return servicesSubTab;
                        if (activeTab === 'orders') return ordersSubTab;
                        return activeTab;
                      })();

                      // Determine the actual entityType for API call
                      const actualEntityType = (() => {
                        if (effectiveTab === 'product-orders' || effectiveTab === 'service-orders') return 'order';
                        if (effectiveTab === 'catalog-services' || effectiveTab === 'active-services') return 'service';
                        return selectedEntity.entityType;
                      })();

                      const relationships = await api.getRelationships(
                        actualEntityType,
                        selectedEntity.id
                      );
                      console.log('Relationships:', relationships);

                      if (relationships.length > 0) {
                        const parents = relationships.filter((r: any) => {
                          const data = r.relationship_data || {};
                          return data.relationship === 'parent';
                        });
                        const children = relationships.filter((r: any) => {
                          const data = r.relationship_data || {};
                          return data.relationship === 'child';
                        });

                        let message = `Stored Relationships for ${selectedEntity.entityType} ${selectedEntity.id}:\n\n`;

                        if (parents.length > 0) {
                          message += 'Parent Relationships:\n';
                          parents.forEach((r: any) => {
                            const data = r.relationship_data || {};
                            message += `• ${r.parent_type.charAt(0).toUpperCase() + r.parent_type.slice(1)}: ${r.parent_id}`;
                            if (data.name) message += ` (${data.name})`;
                            message += '\n';
                          });
                        }

                        if (children.length > 0) {
                          if (parents.length > 0) message += '\n';
                          message += 'Child Relationships (were unassigned):\n';
                          children.forEach((r: any) => {
                            const data = r.relationship_data || {};
                            message += `• ${r.entity_type.charAt(0).toUpperCase() + r.entity_type.slice(1)}: ${r.entity_id}`;
                            if (data.name) message += ` (${data.name})`;
                            message += '\n';
                          });
                        }

                        // For backward compatibility, show old-style relationships
                        const oldStyle = relationships.filter((r: any) => {
                          const data = r.relationship_data || {};
                          return !data.relationship;
                        });
                        if (oldStyle.length > 0) {
                          if (parents.length > 0 || children.length > 0) message += '\n';
                          message += 'Other Relationships:\n';
                          oldStyle.forEach((r: any) => {
                            message += `• ${r.parent_type}: ${r.parent_id}\n`;
                          });
                        }

                        alert(message);
                      } else {
                        alert('No stored relationships found for this entity.');
                      }
                    } catch (err) {
                      alert('Failed to load relationships');
                    }
                  }
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                🔗 View Relationships
              </button>

              <button
                onClick={handleHardDelete}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                ⚠️ Permanently Delete
              </button>

              <button
                onClick={handleModalClose}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
