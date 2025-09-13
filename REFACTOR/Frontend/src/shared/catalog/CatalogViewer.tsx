import React, { useEffect, useMemo, useState } from 'react';
import { useCatalog } from './CatalogContext';

type Item = {
  id: string;
  type: 'service' | 'product';
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  price?: number;
  status?: string;
};

export default function CatalogViewer() {
  const { visible, close, params } = useCatalog();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState(params?.q || '');
  const [cat, setCat] = useState(params?.category || '');
  const [type, setType] = useState<'service' | 'product' | ''>(params?.type || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (params?.q) setQ(params.q); if (params?.category) setCat(params.category); if (params?.type) setType(params.type); }, [params]);

  const qs = useMemo(() => {
    const s = new URLSearchParams();
    if (q) s.set('q', q);
    if (cat) s.set('category', cat);
    if (type) s.set('type', type);
    return s.toString();
  }, [q, cat, type]);

  const fetchItems = async () => {
    try {
      setLoading(true); setError(null);
      const url = '/api/catalog/items' + (qs ? `?${qs}` : '');
      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json();
      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load catalog');
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await fetch('/api/catalog/categories', { credentials: 'include' }); const json = await res.json(); setCategories(Array.isArray(json?.data) ? json.data : []); } catch {}
  };

  useEffect(() => { if (visible) { fetchCategories(); fetchItems(); } }, [visible]);
  useEffect(() => { if (visible) fetchItems(); }, [qs]);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', width: '90vw', maxWidth: 1200, height: '85vh', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>CKS Catalog</div>
          <button onClick={close} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Close</button>
        </div>
        {/* Filters */}
        <div style={{ padding: 12, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }} />
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value as any)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
            <option value="">All Types</option>
            <option value="service">Services</option>
            <option value="product">Products</option>
          </select>
          <button onClick={fetchItems} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Refresh</button>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#fafafa' }}>
          {loading && <div>Loading…</div>}
          {error && <div style={{ color: '#ef4444' }}>{error}</div>}
          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {items.map(it => (
                <div key={`${it.type}-${it.id}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>{it.type}</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{it.name}</div>
                  {it.category && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{it.category}</div>}
                  {it.description && <div style={{ fontSize: 12, color: '#374151' }}>{it.description}</div>}
                </div>
              ))}
              {!items.length && <div style={{ color: '#6b7280' }}>No items match your filters.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

