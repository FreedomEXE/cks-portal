import React, { useState, useEffect } from 'react';
import styles from './ProductQuickActions.module.css';

export interface WarehouseInventory {
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  minStockLevel?: number | null;
  location?: string | null;
}

export interface InventoryChange {
  warehouseId: string;
  quantityChange: number;
}

export interface ProductQuickActionsProps {
  inventoryData?: WarehouseInventory[];
  onSave?: (changes: InventoryChange[]) => Promise<void>;
  onDelete?: () => void;
}

const ProductQuickActions: React.FC<ProductQuickActionsProps> = ({
  inventoryData = [],
  onSave,
  onDelete,
}) => {
  // Track pending quantity adjustments per warehouse
  const [pendingAdjustments, setPendingAdjustments] = useState<Map<string, number>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  // Reset when inventoryData changes
  useEffect(() => {
    setPendingAdjustments(new Map());
    setHasChanges(false);
    setSelectedWarehouse('all');
  }, [inventoryData]);

  // Filter inventory based on selected warehouse
  const filteredInventory = selectedWarehouse === 'all'
    ? inventoryData
    : inventoryData.filter(inv => inv.warehouseId === selectedWarehouse);

  const handleAdjustmentChange = (warehouseId: string, adjustment: number) => {
    setPendingAdjustments(prev => {
      const newMap = new Map(prev);
      const currentAdjustment = newMap.get(warehouseId) || 0;
      const newAdjustment = currentAdjustment + adjustment;

      if (newAdjustment === 0) {
        newMap.delete(warehouseId);
      } else {
        newMap.set(warehouseId, newAdjustment);
      }

      return newMap;
    });
    setHasChanges(true);
  };

  const handleDirectInput = (warehouseId: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      setPendingAdjustments(prev => {
        const newMap = new Map(prev);
        newMap.delete(warehouseId);
        return newMap;
      });
    } else {
      setPendingAdjustments(prev => {
        const newMap = new Map(prev);
        newMap.set(warehouseId, parsed);
        return newMap;
      });
    }
    setHasChanges(true);
  };

  const calculateNewQuantity = (currentQty: number, warehouseId: string): number => {
    const adjustment = pendingAdjustments.get(warehouseId) || 0;
    return currentQty + adjustment;
  };

  const handleSave = async () => {
    if (!onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      const changes: InventoryChange[] = Array.from(pendingAdjustments.entries()).map(
        ([warehouseId, quantityChange]) => ({
          warehouseId,
          quantityChange,
        })
      );

      await onSave(changes);
      setPendingAdjustments(new Map());
      setHasChanges(false);
    } catch (error) {
      console.error('[ProductQuickActions] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStockStatus = (current: number, min?: number | null): string => {
    if (!min) return '';
    if (current < min) return 'Low Stock';
    return '';
  };

  const getStockStatusColor = (current: number, min?: number | null): string => {
    if (!min) return '';
    if (current < min) return '#ef4444';
    return '';
  };

  return (
    <div className={styles.container}>
      {/* Inventory Management */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>INVENTORY MANAGEMENT</h4>

        {/* Warehouse Filter */}
        {inventoryData.length > 0 && (
          <div className={styles.filterRow}>
            <label htmlFor="warehouse-filter" className={styles.filterLabel}>
              Filter by Warehouse:
            </label>
            <select
              id="warehouse-filter"
              className={styles.filterSelect}
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="all">All Warehouses ({inventoryData.length})</option>
              {inventoryData.map((inv) => (
                <option key={inv.warehouseId} value={inv.warehouseId}>
                  {inv.warehouseName} ({inv.warehouseId})
                </option>
              ))}
            </select>
          </div>
        )}

        {inventoryData.length === 0 ? (
          <div className={styles.emptyState}>
            No warehouse inventory records found for this product.
          </div>
        ) : (
          <div className={styles.inventoryTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>Warehouse</div>
              <div className={styles.headerCell}>Current Qty</div>
              <div className={styles.headerCell}>Adjust</div>
              <div className={styles.headerCell}>New Qty</div>
            </div>

            {filteredInventory.map((inv) => {
              const adjustment = pendingAdjustments.get(inv.warehouseId) || 0;
              const newQty = calculateNewQuantity(inv.quantityOnHand, inv.warehouseId);
              const stockStatus = getStockStatus(inv.quantityOnHand, inv.minStockLevel);
              const statusColor = getStockStatusColor(inv.quantityOnHand, inv.minStockLevel);

              return (
                <div key={inv.warehouseId} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <div className={styles.warehouseInfo}>
                      <span className={styles.warehouseName}>{inv.warehouseName}</span>
                      <span className={styles.warehouseId}>{inv.warehouseId}</span>
                      {inv.location && (
                        <span className={styles.location}>Location: {inv.location}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.tableCell}>
                    <div className={styles.quantityDisplay}>
                      <span className={styles.quantity}>{inv.quantityOnHand}</span>
                      {stockStatus && (
                        <span className={styles.stockStatus} style={{ color: statusColor }}>
                          {stockStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.tableCell}>
                    <div className={styles.adjustmentControls}>
                      <button
                        className={styles.adjustButton}
                        onClick={() => handleAdjustmentChange(inv.warehouseId, -10)}
                        title="Decrease by 10"
                      >
                        --
                      </button>
                      <button
                        className={styles.adjustButton}
                        onClick={() => handleAdjustmentChange(inv.warehouseId, -1)}
                        title="Decrease by 1"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className={styles.adjustInput}
                        value={adjustment === 0 ? '' : adjustment}
                        onChange={(e) => handleDirectInput(inv.warehouseId, e.target.value)}
                        placeholder="0"
                      />
                      <button
                        className={styles.adjustButton}
                        onClick={() => handleAdjustmentChange(inv.warehouseId, 1)}
                        title="Increase by 1"
                      >
                        +
                      </button>
                      <button
                        className={styles.adjustButton}
                        onClick={() => handleAdjustmentChange(inv.warehouseId, 10)}
                        title="Increase by 10"
                      >
                        ++
                      </button>
                    </div>
                  </div>

                  <div className={styles.tableCell}>
                    <span
                      className={styles.newQuantity}
                      style={{ color: adjustment !== 0 ? '#10b981' : '#111827' }}
                    >
                      {newQty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      {(onSave || onDelete) && (
        <div className={styles.actionsSection}>
          <h4 className={styles.sectionTitle}>ACTIONS</h4>
          <div className={styles.actions}>
            <div className={styles.leftActions}>
              {onDelete && (
                <button
                  className={`${styles.actionButton} ${styles.actionDelete}`}
                  onClick={onDelete}
                >
                  Delete
                </button>
              )}
            </div>
            <div className={styles.rightActions}>
              {onSave && (
                <button
                  className={`${styles.actionButton} ${styles.actionSave}`}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductQuickActions;
