import React from 'react';
import styles from './ProductModal.module.css';
import { ModalRoot } from '../ModalRoot';

// Base product info (PRD-001)
export interface ProductInfo {
  productId: string;
  name: string;
  description: string | null;
  category: string | null;
  unitOfMeasure: string | null;
  minimumOrderQuantity: number | null;
  leadTimeDays: number | null;
  status: string;
  metadata?: any;
}

// Inventory data (optional, for warehouse inventory view)
export interface InventoryData {
  warehouseId: string;
  warehouseName: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number | null;
  location: string | null;
}

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductInfo | null;
  inventoryData?: InventoryData | null;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  inventoryData,
}) => {
  if (!isOpen || !product) return null;

  const formatStatus = (value?: string | null) => {
    if (!value) return '—';
    const pretty = value.replace(/_/g, ' ').replace(/-/g, ' ');
    return pretty
      .split(' ')
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(' ');
  };

  const getStatusColor = (status?: string | null) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'active' || normalized === 'available') {
      return { bg: '#dcfce7', fg: '#166534' };
    } else if (normalized === 'discontinued' || normalized === 'archived') {
      return { bg: '#fee2e2', fg: '#991b1b' };
    } else if (normalized === 'out_of_stock' || normalized === 'out-of-stock' || normalized === 'low_stock' || normalized === 'low-stock') {
      return { bg: '#fef3c7', fg: '#92400e' };
    }
    return { bg: '#f3f4f6', fg: '#111827' };
  };

  const statusColors = getStatusColor(product.status);

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Product Details</h2>
            <p className={styles.orderId}>{product.productId}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ padding: '8px 16px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: statusColors.bg,
              color: statusColors.fg,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {formatStatus(product.status)}
          </span>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Product Information */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Product Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Product ID</label>
                <p className={styles.value} style={{ color: '#2563eb', fontWeight: 500 }}>{product.productId}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Product Name</label>
                <p className={styles.value}>{product.name}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <p className={styles.value}>{product.category || '—'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Unit of Measure</label>
                <p className={styles.value}>{product.unitOfMeasure || 'EA'}</p>
              </div>
            </div>
          </section>

          {/* Description */}
          {product.description && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p className={styles.notes}>{product.description}</p>
            </section>
          )}

          {/* Ordering Details */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ordering Details</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Minimum Order Quantity</label>
                <p className={styles.value}>
                  {product.minimumOrderQuantity !== null && product.minimumOrderQuantity !== undefined
                    ? `${product.minimumOrderQuantity} ${product.unitOfMeasure || 'EA'}`
                    : '—'}
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Lead Time</label>
                <p className={styles.value}>
                  {product.leadTimeDays !== null && product.leadTimeDays !== undefined
                    ? `${product.leadTimeDays} day${product.leadTimeDays === 1 ? '' : 's'}`
                    : '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Inventory Details (if provided) */}
          {inventoryData && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Inventory Status</h3>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Warehouse</label>
                  <p className={styles.value}>{inventoryData.warehouseName || inventoryData.warehouseId}</p>
                </div>
                {inventoryData.location && (
                  <div className={styles.field}>
                    <label className={styles.label}>Location</label>
                    <p className={styles.value}>{inventoryData.location}</p>
                  </div>
                )}
                <div className={styles.field}>
                  <label className={styles.label}>On Hand</label>
                  <p className={styles.value} style={{ fontWeight: 600 }}>
                    {inventoryData.quantityOnHand} {product.unitOfMeasure || 'EA'}
                  </p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Available</label>
                  <p className={styles.value} style={{ color: '#16a34a', fontWeight: 600 }}>
                    {inventoryData.quantityAvailable} {product.unitOfMeasure || 'EA'}
                  </p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Reserved</label>
                  <p className={styles.value} style={{ color: '#dc2626' }}>
                    {inventoryData.quantityReserved} {product.unitOfMeasure || 'EA'}
                  </p>
                </div>
                {inventoryData.reorderPoint !== null && (
                  <div className={styles.field}>
                    <label className={styles.label}>Reorder Point</label>
                    <p className={styles.value}>
                      {inventoryData.reorderPoint} {product.unitOfMeasure || 'EA'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Metadata (if any additional specs) */}
          {product.metadata && Object.keys(product.metadata).length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Specifications</h3>
              <div className={styles.grid}>
                {Object.entries(product.metadata).map(([key, value]) => (
                  <div key={key} className={styles.field}>
                    <label className={styles.label}>{key.replace(/_/g, ' ').toUpperCase()}</label>
                    <p className={styles.value}>{String(value) || '—'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.closeButtonSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </ModalRoot>
  );
};

export default ProductModal;
