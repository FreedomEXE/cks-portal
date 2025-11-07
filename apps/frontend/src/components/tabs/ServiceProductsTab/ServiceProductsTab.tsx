import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceProductsTab({ serviceId }: { serviceId: string }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Products</h3>
      <p style={{ color: '#6b7280', marginBottom: 12 }}>
        Order products for this service. You will be directed to the catalog. The order will be linked to this service automatically.
      </p>
      <button
        onClick={() => navigate(`/catalog?mode=products&serviceId=${encodeURIComponent(serviceId)}`)}
        style={{ padding: '8px 12px', borderRadius: 6, background: '#111827', color: '#fff', border: '1px solid #111827' }}
      >
        Order Products for {serviceId}
      </button>
    </div>
  );
}

