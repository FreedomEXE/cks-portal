/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Catalog (Global, read-only)
 * Unified list of all services and products, visible to all roles.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

type CatalogItem = {
  id: string;
  type: 'service' | 'product';
  name: string;
  description: string;
  category: string;
  unit?: string | null;
  price_cents?: number | null;
  active: boolean;
};

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

export default function CatalogPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [type, setType] = useState<'all' | 'service' | 'product'>('all');
  const [cart, setCart] = useState<{ id: string; type: 'service' | 'product'; name: string; qty: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  // Initialize filters from URL query on first render
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q') || '';
    const cParam = params.get('category') || '';
    const tParam = (params.get('type') || '').toLowerCase();
    if (qParam) setQ(qParam);
    if (cParam) setCategory(cParam);
    if (tParam === 'service' || tParam === 'product') setType(tParam as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams();
        if (q) qs.set('q', q);
        if (category) qs.set('category', category);
        const url = `${API_BASE}/catalog/items${qs.size ? `?${qs.toString()}` : ''}`;
        const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
        const json = await res.json();
        const data: CatalogItem[] = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) setItems(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, category]);

  // Keep URL in sync when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (type !== 'all') params.set('type', type);
    const search = params.toString();
    // Avoid pushing duplicates
    const current = location.search.replace(/^\?/, '');
    if (current !== search) {
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
    }
  }, [q, category, type, location.pathname, location.search, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/catalog/categories`, { credentials: 'include' });
        const json = await res.json();
        const cats: string[] = Array.isArray(json?.data) ? json.data : [];
        setCategories(cats);
      } catch {
        // ignore
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (type === 'all') return items;
    return items.filter(i => i.type === type);
  }, [items, type]);

  function addToCart(it: CatalogItem) {
    setCart(prev => {
      const idx = prev.findIndex(p => p.id === it.id && p.type === it.type);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { id: it.id, type: it.type, name: it.name, qty: 1 }];
    });
  }

  function updateQty(id: string, type: 'service' | 'product', qty: number) {
    setCart(prev => prev.map(p => (p.id === id && p.type === type ? { ...p, qty: Math.max(1, qty || 1) } : p)));
  }

  function removeFromCart(id: string, type: 'service' | 'product') {
    setCart(prev => prev.filter(p => !(p.id === id && p.type === type)));
  }

  async function submitRequest() {
    try {
      if (cart.length === 0) return alert('Add at least one item.');
      setSubmitting(true);
      const centerId = sessionStorage.getItem('center:lastCode') || '';
      const customerId = sessionStorage.getItem('customer:lastCode') || '';

      let url = '';
      let body: any = { items: cart.map(c => ({ type: c.type, id: c.id, qty: c.qty })) };
      if (centerId) {
        url = `${API_BASE}/center/requests`;
        body.center_id = centerId;
      } else if (customerId) {
        url = `${API_BASE}/customer/requests`;
        body.customer_id = customerId;
      } else {
        alert('Could not determine ordering context (center/customer). Go to your hub first.');
        return;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Request failed');
      }
      setCart([]);
      setBanner(`Request submitted: ${json.data?.order_id || ''}`);
      setTimeout(()=> setBanner(null), 3500);
    } catch (e: any) {
      alert(e?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px' }}>
      {banner && (
        <div className="card" style={{ padding: 10, marginBottom: 8, borderLeft: '4px solid #10b981', background: '#ecfdf5', color: '#065f46', fontSize: 13 }}>
          {banner}
        </div>
      )}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: 12, borderTop: '4px solid #111827' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>CKS Catalog</h1>
        <Link to={-1 as any} style={{ fontSize: 14, color: '#2563eb' }}>Back</Link>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name/description" style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 240 }} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value as any)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
            <option value="all">All Types</option>
            <option value="service">Services</option>
            <option value="product">Products</option>
          </select>
        </div>
      </div>

      {loading && <div className="card" style={{ padding: 16 }}>Loading catalog…</div>}
      {error && <div className="card" style={{ padding: 16, color: '#b91c1c' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map(item => (
          <div key={`${item.type}:${item.id}`} className="card" style={{ padding: 12, borderTop: `4px solid ${item.type === 'service' ? '#10b981' : '#2563eb'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{item.name}</div>
              <div style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: item.type === 'service' ? '#ecfdf5' : '#eff6ff', color: item.type === 'service' ? '#065f46' : '#1e40af' }}>
                {item.type}
              </div>
            </div>
            {item.category && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{item.category}</div>}
            <div style={{ fontSize: 14, color: '#374151', minHeight: 44 }}>{item.description || '—'}</div>
            {/* No pricing shown for MVP (quotes happen off-portal) */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => addToCart(item)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#111827', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Add to Request
              </button>
              {/* Allow contractors to add services to My Services when context=contractor */}
              {item.type === 'service' && new URLSearchParams(location.search).get('context') === 'contractor' && (
                <button
                  onClick={async () => {
                    try {
                      const code = sessionStorage.getItem('contractor:lastCode') || '';
                      if (!code) { alert('Open Contractor Hub first to set context.'); return; }
                      const res = await fetch(`${API_BASE}/contractor/my-services/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ code, service_id: item.id })
                      });
                      const js = await res.json();
                      if (!res.ok || !js?.success) throw new Error(js?.error || 'Failed to add');
                      alert('Added to My Services');
                    } catch (e: any) {
                      alert(e?.message || 'Failed to add');
                    }
                  }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Add to My Services
                </button>
              )}
            </div>
            {!item.active && <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>inactive</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Request Items</div>
          <button disabled={submitting || cart.length === 0} onClick={submitRequest} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: cart.length ? '#111827' : '#6b7280', color: 'white', fontSize: 12, fontWeight: 700, cursor: cart.length ? 'pointer' : 'not-allowed' }}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
        {cart.length === 0 ? (
          <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>No items added yet.</div>
        ) : (
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {cart.map(ci => (
              <div key={`${ci.type}:${ci.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                <div style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: ci.type === 'service' ? '#ecfdf5' : '#eff6ff', color: ci.type === 'service' ? '#065f46' : '#1e40af' }}>{ci.type}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{ci.name}</div>
                <input type="number" min={1} value={ci.qty} onChange={e => updateQty(ci.id, ci.type, parseInt(e.target.value, 10))} style={{ width: 64, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
                <button onClick={() => removeFromCart(ci.id, ci.type)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', color: '#b91c1c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
