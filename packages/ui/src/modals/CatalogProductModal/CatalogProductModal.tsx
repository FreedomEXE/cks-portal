import React, { useState, useMemo } from 'react';
import BaseViewModal from '../BaseViewModal';
import ProductCard from '../../cards/ProductCard';
import ProductQuickActions, { type WarehouseInventory, type InventoryChange } from './components/ProductQuickActions';
import ActionBar from '../components/ActionBar/ActionBar';
import ProductDetails from './components/ProductDetails';

export interface CatalogProduct {
  productId: string;
  name: string | null;
  category: string | null;
  status?: string | null;
  description?: string | null;
  unitOfMeasure?: string | null;
  minimumOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  metadata?: any;
}

export interface CatalogProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CatalogProduct | null;
  // Admin-only props
  onSave?: (changes: InventoryChange[]) => Promise<void>;
  onDelete?: () => void;
  // Inventory data (fetched from backend)
  inventoryData?: WarehouseInventory[];
}

const CatalogProductModal: React.FC<CatalogProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  onDelete,
  inventoryData = [],
}) => {
  // Determine if admin view (has admin callbacks)
  const isAdminView = Boolean(onSave || onDelete);

  // Tab state
  const [activeTab, setActiveTab] = useState('details');

  // Build tabs based on role
  const tabs = [{ id: 'details', label: 'Details' }];

  // Early return AFTER all hooks
  if (!isOpen || !product) return null;

  // ProductCard for header
  const card = (
    <ProductCard
      productId={product.productId}
      productName={product.name || 'Unnamed Product'}
      category={product.category || undefined}
      unitOfMeasure={product.unitOfMeasure || undefined}
      status={product.status || 'active'}
      variant="embedded"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  return (
    <BaseViewModal isOpen={isOpen} onClose={onClose} card={card}>
      {/* Embedded header actions */}
      {(onDelete || onSave) && (
        <div style={{ padding: '0 16px' }}>
          <ActionBar
            actions={[
              onSave ? { label: 'Save Changes', onClick: () => onSave?.([]), variant: 'primary' } : null,
              onDelete ? { label: 'Delete', onClick: onDelete, variant: 'danger' } : null,
            ].filter(Boolean) as any}
          />
        </div>
      )}

      {activeTab === 'details' && (
        <ProductDetails
          productId={product.productId}
          productName={product.name || 'Unnamed Product'}
          category={product.category || undefined}
          status={product.status || 'active'}
          description={product.description || undefined}
          unitOfMeasure={product.unitOfMeasure || undefined}
          minimumOrderQuantity={product.minimumOrderQuantity}
          leadTimeDays={product.leadTimeDays}
          metadata={product.metadata}
        />
      )}
      {isAdminView && (
        <div style={{ marginTop: 16 }}>
          <ProductQuickActions
            inventoryData={inventoryData}
            onSave={onSave}
            onDelete={onDelete}
          />
        </div>
      )}
    </BaseViewModal>
  );
};

export default CatalogProductModal;
