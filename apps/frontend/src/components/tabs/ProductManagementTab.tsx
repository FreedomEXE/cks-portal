import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { useWarehouses } from '../../shared/api/directory';
import { getProductInventory, updateCatalogProduct, updateInventory } from '../../shared/api/admin';

type InventoryRow = {
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  minStockLevel: number | null;
  location: string | null;
};

interface ProductManagementTabProps {
  productId: string;
  name?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  inventoryData?: InventoryRow[];
  onInventoryRefresh?: (data: InventoryRow[]) => void;
}

export default function ProductManagementTab({
  productId,
  name,
  description,
  imageUrl,
  inventoryData = [],
  onInventoryRefresh,
}: ProductManagementTabProps) {
  const { getToken } = useAuth();
  const { data: warehouses = [] } = useWarehouses();

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(true);

  const [draftName, setDraftName] = useState(name ?? '');
  const [draftDescription, setDraftDescription] = useState(description ?? '');
  const [draftImageUrl, setDraftImageUrl] = useState(imageUrl ?? '');

  const [pendingAdjustments, setPendingAdjustments] = useState<Map<string, number>>(new Map());
  const [addWarehouseIds, setAddWarehouseIds] = useState<string[]>([]);
  const [addQuantityChange, setAddQuantityChange] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftName(name ?? '');
    setDraftDescription(description ?? '');
    setDraftImageUrl(imageUrl ?? '');
  }, [name, description, imageUrl]);

  const baseInventoryMap = useMemo(() => {
    const map = new Map<string, InventoryRow>();
    inventoryData.forEach((row) => {
      map.set(row.warehouseId, row);
    });
    return map;
  }, [inventoryData]);

  const allWarehouseIds = useMemo(() => {
    const ids = new Set<string>();
    inventoryData.forEach((row) => ids.add(row.warehouseId));
    pendingAdjustments.forEach((_, id) => ids.add(id));
    return Array.from(ids);
  }, [inventoryData, pendingAdjustments]);

  const mergedInventoryRows = useMemo(() => {
    return allWarehouseIds.map((warehouseId) => {
      const base = baseInventoryMap.get(warehouseId);
      const warehouseMeta = warehouses.find((w) => w.id === warehouseId);
      return {
        warehouseId,
        warehouseName: base?.warehouseName || warehouseMeta?.name || warehouseId,
        quantityOnHand: base?.quantityOnHand ?? 0,
        minStockLevel: base?.minStockLevel ?? null,
        location: base?.location ?? null,
      };
    });
  }, [allWarehouseIds, baseInventoryMap, warehouses]);

  const hasDetailChanges = useMemo(() => {
    return (draftName ?? '') !== (name ?? '') ||
      (draftDescription ?? '') !== (description ?? '') ||
      (draftImageUrl ?? '') !== (imageUrl ?? '');
  }, [draftName, draftDescription, draftImageUrl, name, description, imageUrl]);

  const hasInventoryChanges = pendingAdjustments.size > 0;
  const hasChanges = hasDetailChanges || hasInventoryChanges;

  const setAdjustment = (warehouseId: string, delta: number) => {
    setPendingAdjustments((prev) => {
      const next = new Map(prev);
      if (delta === 0) {
        next.delete(warehouseId);
      } else {
        next.set(warehouseId, delta);
      }
      return next;
    });
  };

  const updateAdjustment = (warehouseId: string, change: number) => {
    setPendingAdjustments((prev) => {
      const next = new Map(prev);
      const current = next.get(warehouseId) || 0;
      const updated = current + change;
      if (updated === 0) {
        next.delete(warehouseId);
      } else {
        next.set(warehouseId, updated);
      }
      return next;
    });
  };

  const handleDirectInput = (warehouseId: string, value: string) => {
    if (!value) {
      setAdjustment(warehouseId, 0);
      return;
    }
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    setAdjustment(warehouseId, parsed);
  };

  const handleAddWarehouseAdjustment = () => {
    const selectedIds = addWarehouseIds.map((id) => id.trim().toUpperCase()).filter(Boolean);
    const parsed = Number.parseInt(addQuantityChange, 10);
    if (selectedIds.length === 0) {
      toast.error('Select at least one warehouse');
      return;
    }
    if (Number.isNaN(parsed) || parsed === 0) {
      toast.error('Enter a quantity change');
      return;
    }
    selectedIds.forEach((id) => updateAdjustment(id, parsed));
    setAddWarehouseIds([]);
    setAddQuantityChange('');
  };

  const refreshInventory = async () => {
    if (!onInventoryRefresh) return;
    try {
      const result = await getProductInventory(productId, { getToken });
      if (result?.success && Array.isArray(result.data)) {
        onInventoryRefresh(result.data as InventoryRow[]);
      }
    } catch (e) {
      console.warn('[ProductManagementTab] Failed to refresh inventory', e);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      if (hasDetailChanges) {
        await updateCatalogProduct(
          productId,
          {
            name: draftName.trim() || undefined,
            description: draftDescription.trim() || undefined,
            imageUrl: draftImageUrl.trim() || undefined,
          },
          { getToken },
        );
      }

      if (hasInventoryChanges) {
        for (const [warehouseId, quantityChange] of pendingAdjustments.entries()) {
          await updateInventory(
            {
              warehouseId,
              itemId: productId,
              quantityChange,
              reason: 'Admin adjustment via product management',
            },
            { getToken },
          );
        }
      }

      setPendingAdjustments(new Map());
      await refreshInventory();
      window.dispatchEvent(new CustomEvent('cks:modal:refresh'));
      toast.success('Changes saved');
    } catch (err: any) {
      console.error('[ProductManagementTab] Save failed', err);
      toast.error(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 12 }}>
      <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          <span>Product Details</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>{detailsOpen ? 'Hide' : 'Show'}</span>
        </button>
        {detailsOpen && (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Name</span>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Description</span>
              <textarea
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                rows={4}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Image URL</span>
              <input
                value={draftImageUrl}
                onChange={(event) => setDraftImageUrl(event.target.value)}
                placeholder="https://..."
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
              />
            </label>
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <button
          type="button"
          onClick={() => setInventoryOpen((v) => !v)}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          <span>Inventory Management</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>{inventoryOpen ? 'Hide' : 'Show'}</span>
        </button>
        {inventoryOpen && (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
              <select
                multiple
                value={addWarehouseIds}
                onChange={(event) => {
                  const selections = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                  setAddWarehouseIds(selections);
                }}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, minHeight: 44 }}
              >
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name || warehouse.id} ({warehouse.id})
                  </option>
                ))}
              </select>
              <input
                value={addQuantityChange}
                onChange={(event) => setAddQuantityChange(event.target.value)}
                placeholder="Quantity change (+/-)"
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
              />
              <button
                type="button"
                onClick={handleAddWarehouseAdjustment}
                style={{
                  borderRadius: 8,
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>

            {mergedInventoryRows.length === 0 ? (
              <div style={{ padding: '16px 0', color: '#94a3b8' }}>No inventory records yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mergedInventoryRows.map((row) => {
                  const delta = pendingAdjustments.get(row.warehouseId) || 0;
                  const newQty = row.quantityOnHand + delta;
                  return (
                    <div
                      key={row.warehouseId}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '12px 14px',
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 0.6fr 1fr',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.warehouseName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{row.warehouseId}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Current</div>
                        <div style={{ fontWeight: 600 }}>{row.quantityOnHand}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Adjust</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => updateAdjustment(row.warehouseId, -1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              cursor: 'pointer',
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={delta === 0 ? '' : delta}
                            onChange={(event) => handleDirectInput(row.warehouseId, event.target.value)}
                            placeholder="0"
                            style={{
                              width: 80,
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              padding: '8px 10px',
                              fontSize: 14,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateAdjustment(row.warehouseId, 1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              cursor: 'pointer',
                            }}
                          >
                            +
                          </button>
                          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                            New: <strong style={{ color: '#0f172a' }}>{newQty}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          style={{
            borderRadius: 10,
            border: 'none',
            background: saving ? '#cbd5f5' : '#4f46e5',
            color: '#fff',
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
