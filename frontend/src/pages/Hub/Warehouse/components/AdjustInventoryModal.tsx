/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React, { useState } from 'react';
import { WarehouseApi } from '../utils/warehouseApi';

interface Props {
  open: boolean;
  onClose: () => void;
  item: { item_id: string; item_name?: string } | null;
  onAdjusted?: () => void;
}

export default function AdjustInventoryModal({ open, onClose, item, onAdjusted }: Props) {
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState<string>('Manual adjustment');
  const [submitting, setSubmitting] = useState(false);
  const disabled = submitting || !item;

  if (!open) return null;

  const submit = async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      const r = await WarehouseApi.adjustInventory(item.item_id, qty, reason);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      onAdjusted?.();
      onClose();
      setQty(0);
      setReason('Manual adjustment');
    } catch (e) {
      console.error('adjust failed', e);
      // keep modal open for retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'white', borderRadius: 12, width: 420, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
        <h3 style={{ marginTop: 0 }}>Adjust Inventory</h3>
        <div style={{ color: '#6b7280', marginBottom: 8 }}>{item?.item_name ?? item?.item_id}</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Quantity Change</div>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
              placeholder="e.g. 5 or -3"
            />
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Reason</div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}>Cancel</button>
          <button onClick={submit} disabled={disabled} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 600 }}>{submitting ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

