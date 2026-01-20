import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { ProductQuickActions } from '@cks/ui';
import { updateCatalogProduct, updateInventory, getProductInventory } from '../../shared/api/admin';

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
  const [draftName, setDraftName] = useState(name ?? '');
  const [draftDescription, setDraftDescription] = useState(description ?? '');
  const [draftImageUrl, setDraftImageUrl] = useState(imageUrl ?? '');
  const [savingDetails, setSavingDetails] = useState(false);

  const [warehouseId, setWarehouseId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [savingInventory, setSavingInventory] = useState(false);

  useEffect(() => {
    setDraftName(name ?? '');
    setDraftDescription(description ?? '');
    setDraftImageUrl(imageUrl ?? '');
  }, [name, description, imageUrl]);

  const hasDetailChanges = useMemo(() => {
    return (draftName ?? '') !== (name ?? '') ||
      (draftDescription ?? '') !== (description ?? '') ||
      (draftImageUrl ?? '') !== (imageUrl ?? '');
  }, [draftName, draftDescription, draftImageUrl, name, description, imageUrl]);

  const saveDetails = async () => {
    if (!hasDetailChanges) return;
    setSavingDetails(true);
    try {
      await updateCatalogProduct(
        productId,
        {
          name: draftName.trim() || undefined,
          description: draftDescription.trim() || undefined,
          imageUrl: draftImageUrl.trim() || undefined,
        },
        { getToken },
      );
      window.dispatchEvent(new CustomEvent('cks:modal:refresh'));
      toast.success('Product updated');
    } catch (err: any) {
      console.error('[ProductManagementTab] Update failed', err);
      toast.error(err?.message || 'Failed to update product');
    } finally {
      setSavingDetails(false);
    }
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

  const saveInventoryChanges = async (changes: Array<{ warehouseId: string; quantityChange: number }>) => {
    if (!changes.length) return;
    setSavingInventory(true);
    try {
      for (const change of changes) {
        await updateInventory({
          warehouseId: change.warehouseId,
          itemId: productId,
          quantityChange: change.quantityChange,
          reason: 'Admin adjustment via product management',
        }, { getToken });
      }
      await refreshInventory();
      toast.success('Inventory updated');
    } catch (err: any) {
      console.error('[ProductManagementTab] Inventory update failed', err);
      toast.error(err?.message || 'Failed to update inventory');
    } finally {
      setSavingInventory(false);
    }
  };

  const addWarehouseInventory = async () => {
    const trimmedWarehouse = warehouseId.trim().toUpperCase();
    const parsed = Number.parseInt(quantityChange, 10);
    if (!trimmedWarehouse) {
      toast.error('Enter a warehouse ID');
      return;
    }
    if (Number.isNaN(parsed)) {
      toast.error('Enter a quantity change');
      return;
    }
    setSavingInventory(true);
    try {
      await updateInventory({
        warehouseId: trimmedWarehouse,
        itemId: productId,
        quantityChange: parsed,
        reason: 'Admin adjustment via product management',
      }, { getToken });
      setWarehouseId('');
      setQuantityChange('');
      await refreshInventory();
      toast.success('Inventory updated');
    } catch (err: any) {
      console.error('[ProductManagementTab] Inventory add failed', err);
      toast.error(err?.message || 'Failed to update inventory');
    } finally {
      setSavingInventory(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Product Details</div>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={saveDetails}
            disabled={!hasDetailChanges || savingDetails}
            style={{
              borderRadius: 8,
              border: 'none',
              background: savingDetails ? '#cbd5f5' : '#4f46e5',
              color: '#fff',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: savingDetails ? 'not-allowed' : 'pointer',
            }}
          >
            {savingDetails ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Add Inventory for Warehouse</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
          <input
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            placeholder="Warehouse ID (e.g. WHS-001)"
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
          />
          <input
            value={quantityChange}
            onChange={(event) => setQuantityChange(event.target.value)}
            placeholder="Quantity change (+/-)"
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
          />
          <button
            type="button"
            onClick={addWarehouseInventory}
            disabled={savingInventory}
            style={{
              borderRadius: 8,
              border: 'none',
              background: savingInventory ? '#cbd5f5' : '#0f172a',
              color: '#fff',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: savingInventory ? 'not-allowed' : 'pointer',
            }}
          >
            {savingInventory ? 'Saving...' : 'Add'}
          </button>
        </div>
      </div>

      <ProductQuickActions
        inventoryData={inventoryData}
        onSave={saveInventoryChanges}
        adminActions={[]}
      />
    </div>
  );
}
