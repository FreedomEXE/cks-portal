/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React, { useEffect, useState } from 'react';
import useWarehouseData from './hooks/useWarehouseData';
import { WarehouseApi } from './utils/warehouseApi';
import WarehouseLogoutButton from './components/LogoutButton';

export default function WarehouseHome() {
  const { data: profile, loading: loadingProfile } = useWarehouseData();
  const [kpis, setKpis] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersArchive, setOrdersArchive] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<'dashboard'|'profile'|'inventory'|'orders'|'shipments'|'support'>('dashboard');
  const [profileTab, setProfileTab] = useState<0|1|2>(0);
  // Support tab state (self-contained for Warehouse)
  const [supportTab, setSupportTab] = useState<'compose'|'inbox'|'sent'>('compose');
  const [supportForm, setSupportForm] = useState<{ subject: string; type: 'issue'|'request'|'question'; body: string }>({ subject: '', type: 'issue', body: '' });
  const [supportSending, setSupportSending] = useState(false);
  const [supportNotice, setSupportNotice] = useState<string|null>(null);
  const [supportItems, setSupportItems] = useState<any[]>([
    { id: 'WH-SUP-1001', subject: 'Request additional pallets', type: 'request', date: '2025-08-20', status: 'open' },
    { id: 'WH-SUP-1000', subject: 'Scanner connectivity issues', type: 'issue', date: '2025-08-18', status: 'resolved' },
  ]);
  // Shipments state & filters
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipPendingOneQuery, setShipPendingOneQuery] = useState('');
  const [shipPendingRecQuery, setShipPendingRecQuery] = useState('');
  const [shipArchiveQuery, setShipArchiveQuery] = useState('');
  // Orders filters
  const [ordersPendingQuery, setOrdersPendingQuery] = useState('');
  const [ordersArchiveQuery, setOrdersArchiveQuery] = useState('');
  // Local search filters (limit display to 10)
  const [productQuery, setProductQuery] = useState('');
  const [supplyQuery, setSupplyQuery] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [kpiRes, invRes, ordRes, ordArchRes, actRes, shpRes] = await Promise.all([
          WarehouseApi.getDashboard().then(r=>r.json()).catch(()=>({ data: [] })),
          WarehouseApi.getInventory({ limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] })),
          WarehouseApi.getOrders({ status: 'pending', limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] })),
          WarehouseApi.getOrders({ status: 'shipped', limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] })),
          WarehouseApi.getActivity({ limit: 20 }).then(r=>r.json()).catch(()=>({ data: [] })),
          WarehouseApi.getShipments({ limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] })),
        ]);
        if (!mounted) return;
        setKpis(kpiRes.data || []);
        setInventory(invRes.data || []);
        setOrders(ordRes.data || []);
        setOrdersArchive(ordArchRes.data || []);
        setHistory(actRes.data || []);
        setShipments(shpRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const Card: React.FC<{ children: any; style?: React.CSSProperties }> = ({ children, style }) => (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: 'white', ...style }}>{children}</div>
  );

  // Helpers
  function fmtDate(d?: any): string {
    if (!d) return '—';
    try { return String(d).slice(0,10); } catch { return '—'; }
  }
  function nextScheduled(base: any, interval?: string): string {
    if (!interval) return '—';
    const b = new Date(base || Date.now());
    const lower = interval.toLowerCase();
    if (lower.includes('week')) { b.setDate(b.getDate() + 7); return b.toISOString().slice(0,10); }
    if (lower.includes('month')) { b.setMonth(b.getMonth() + 1); return b.toISOString().slice(0,10); }
    return '—';
  }

  const Tab = ({ id, label }: { id: typeof active; label: string }) => (
    <button
      onClick={() => setActive(id)}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid ' + (active === id ? '#7c3aed' : '#e5e7eb'),
        background: active === id ? '#8b5cf6' : '#ffffff',
        color: active === id ? 'white' : '#111827',
        fontWeight: 600,
        cursor: 'pointer'
      }}
    >{label}</button>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 32 }}>
      {/* Header card (consistent with other hubs) */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '24px 0 12px',
        gap: 12,
        padding: 12,
        borderTop: '4px solid #8b5cf6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            Warehouse Hub
          </h1>
        </div>
        <WarehouseLogoutButton />
      </div>

      {/* Welcome */}
      <div style={{ fontSize: 14, color: '#374151', marginTop: 4, marginBottom: 16 }}>
        {profile ? (
          <>Welcome, {profile.warehouse_name} ({profile.warehouse_id})!</>
        ) : 'Welcome!'}
      </div>

      {/* Tabs (consistent buttons) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard' as typeof active, label: 'Dashboard' },
          { id: 'profile' as typeof active, label: 'My Profile' },
          { id: 'inventory' as typeof active, label: 'Inventory' },
          { id: 'orders' as typeof active, label: 'Orders' },
          { id: 'shipments' as typeof active, label: 'Shipments' },
          { id: 'support' as typeof active, label: 'Support' }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActive(section.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: active === section.id ? '#111827' : 'white',
              color: active === section.id ? 'white' : '#111827',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Profile Section (only on Profile tab) */}
      {active === 'profile' && (
        <section style={{ margin: '16px' }}>
          <Card>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Warehouse Profile</h2>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Warehouse Info','Manager Info','Settings'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(i as 0|1|2)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: profileTab === (i as 0|1|2) ? '#8b5cf6' : 'white',
                    color: profileTab === (i as 0|1|2) ? 'white' : '#111827',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Profile Content */}
            {loadingProfile ? (
              <div>Loading profile…</div>
            ) : !profile ? (
              <div>No profile</div>
            ) : (
              <div className="ui-card" style={{ padding: 0 }}>
                {/* Template notice */}
                {String(profile.warehouse_id || '').toUpperCase() === 'WH-000' && (
                  <div style={{ padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', color: '#374151', fontSize: 13 }}>
                    Template hub: Admin must create a warehouse and fill profile fields. These sections are placeholders.
                  </div>
                )}
                {profileTab === 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, padding: 16 }}>
                    {/* Avatar */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#6b7280',
                        margin: '0 auto 12px'
                      }}>
                        {(String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? 'WH' : (profile.warehouse_name || 'WH')).split(' ').map((n:string)=>n[0]).join('').toUpperCase().substring(0,2)}
                      </div>
                      {String(profile.warehouse_id || '').toUpperCase() !== 'WH-000' && (
                        <button style={{ padding: '6px 12px', fontSize: 12 }}>Update Photo</button>
                      )}
                    </div>

                    {/* Warehouse Details */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            ['Warehouse ID', profile.warehouse_id || '—'],
                            ['Name', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.warehouse_name || '—')],
                            ['Type', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.warehouse_type || '—')],
                            ['Location', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.address || '—')],
                            ['Phone', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.phone || '—')],
                            ['Email', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.email || '—')],
                            ['Date Acquired', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.date_acquired ? String(profile.date_acquired).slice(0,10) : '—')]
                          ].map(([label, value]) => (
                            <tr key={label as string}>
                              <td style={{ padding: '8px 0', fontWeight: 600, width: '34%' }}>{label}</td>
                              <td style={{ padding: '8px 0' }}>{value as string}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {profileTab === 1 && (
                  <div style={{ padding: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[
                          ['Manager ID', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.manager_id || '—')],
                          ['Name', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.manager?.manager_name || '—')],
                          ['Address', '—'],
                          ['Phone', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.manager?.phone || '—')],
                          ['Email', String(profile.warehouse_id || '').toUpperCase() === 'WH-000' ? '—' : (profile.manager?.email || '—')]
                        ].map(([label, value]) => (
                          <tr key={label}>
                            <td style={{ padding: '8px 0', fontWeight: 600, width: '34%' }}>{label}</td>
                            <td style={{ padding: '8px 0' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {profileTab === 2 && (
                  <div style={{ padding: 16 }}>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>
                      {String(profile.warehouse_id || '').toUpperCase() === 'WH-000' 
                        ? 'Template settings placeholder. Admin will set initial values during creation.'
                        : 'Basic settings for the warehouse profile will appear here.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </section>
      )}

      {/* KPIs */}
      {active === 'dashboard' && (
        <section style={{ margin: '16px' }}>
          <Card>
            <h2 style={{ marginTop: 0 }}>Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {kpis.map((k: any) => (
                <div key={k.label} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fafafa' }}>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{k.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Dashboard: Recent Activity (at-a-glance, last 5) */}
      {active === 'dashboard' && (
        <section style={{ margin: '16px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Recent Activity</h2>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Last 5 events</div>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {(history || []).slice(0,5).map((h:any, idx:number) => (
                <div key={idx} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>{String(h.activity_type||'').toUpperCase()}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{h.item_name || h.description || 'Event'}</span>
                  {typeof h.quantity_change === 'number' && (
                    <span style={{ fontSize: 12, color: h.quantity_change > 0 ? '#166534' : '#991b1b' }}>
                      {h.quantity_change > 0 ? `+${h.quantity_change}` : h.quantity_change}
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>{h.activity_timestamp ? String(h.activity_timestamp).slice(0,19).replace('T',' ') : ''}</span>
                </div>
              ))}
              {(!history || history.length === 0) && (
                <div style={{ fontSize: 13, color: '#6b7280' }}>No recent activity.</div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Inventory */}
      {active === 'inventory' && (
        <section style={{ margin: '16px' }}>
          <Card>
            {/* Two-column layout within a single outer card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Products Panel */}
              <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Products</div>
                {/* Search */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    value={productQuery}
                    onChange={(e)=>setProductQuery(e.target.value)}
                    placeholder="Search by Product ID or name"
                    style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
                </div>
                <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Product ID','Name','On Hand','Available','Min','Location','Low?'].map(h => (
                          <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory
                        .filter((it:any)=>it.item_type==='product')
                        .filter((it:any)=>{
                          const q = productQuery.trim().toLowerCase();
                          if (!q) return true;
                          return String(it.item_id||'').toLowerCase().includes(q) || String(it.item_name||'').toLowerCase().includes(q);
                        })
                        .slice(0, 10)
                        .map((it: any) => (
                        <tr key={`${it.item_id}`}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{it.item_id}</td>
                          <td style={{ padding: 10 }}>{it.item_name}</td>
                          <td style={{ padding: 10 }}>{it.quantity_on_hand}</td>
                          <td style={{ padding: 10 }}>{it.quantity_available}</td>
                          <td style={{ padding: 10 }}>{it.min_stock_level ?? 0}</td>
                          <td style={{ padding: 10 }}>{it.location_code || '—'}</td>
                          <td style={{ padding: 10 }}>{it.is_low_stock ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Supplies Panel */}
              <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Supplies</div>
                {/* Search */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    value={supplyQuery}
                    onChange={(e)=>setSupplyQuery(e.target.value)}
                    placeholder="Search by Supply ID or name"
                    style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
                </div>
                <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Supply ID','Name','On Hand','Available','Min','Location','Low?'].map(h => (
                          <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory
                        .filter((it:any)=>it.item_type==='supply')
                        .filter((it:any)=>{
                          const q = supplyQuery.trim().toLowerCase();
                          if (!q) return true;
                          return String(it.item_id||'').toLowerCase().includes(q) || String(it.item_name||'').toLowerCase().includes(q);
                        })
                        .slice(0, 10)
                        .map((it: any) => (
                        <tr key={`${it.item_id}`}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{it.item_id}</td>
                          <td style={{ padding: 10 }}>{it.item_name}</td>
                          <td style={{ padding: 10 }}>{it.quantity_on_hand}</td>
                          <td style={{ padding: 10 }}>{it.quantity_available}</td>
                          <td style={{ padding: 10 }}>{it.min_stock_level ?? 0}</td>
                          <td style={{ padding: 10 }}>{it.location_code || '—'}</td>
                          <td style={{ padding: 10 }}>{it.is_low_stock ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Archive & History: only show in Inventory tab (not Dashboard) */}
            {active === 'inventory' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Archive & History</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={historyQuery}
                      onChange={(e)=>setHistoryQuery(e.target.value)}
                      placeholder="Search history"
                      style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
                    />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(history || [])
                    .filter((h:any)=>{
                      const q = historyQuery.trim().toLowerCase();
                      if (!q) return true;
                      return String(h.item_name||'').toLowerCase().includes(q) || String(h.description||'').toLowerCase().includes(q) || String(h.activity_type||'').toLowerCase().includes(q);
                    })
                    .slice(0, 10)
                    .map((h: any, idx: number) => (
                    <div key={idx} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>{String(h.activity_type || '').toUpperCase()}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{h.item_name || h.description || 'Inventory event'}</span>
                      {typeof h.quantity_change === 'number' && (
                        <span style={{ fontSize: 12, color: h.quantity_change > 0 ? '#166534' : '#991b1b' }}>
                          {h.quantity_change > 0 ? `+${h.quantity_change}` : h.quantity_change}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>{h.activity_timestamp ? String(h.activity_timestamp).slice(0,19).replace('T',' ') : ''}</span>
                    </div>
                  ))}
                  {(!history || history.length === 0) && (
                    <div style={{ fontSize: 13, color: '#6b7280' }}>No archive entries yet.</div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Orders */}
      {active === 'orders' && (
        <section style={{ margin: '16px' }}>
          <Card>
            {/* Two stacked panels: Current and Archive */}
            {/* Current Orders (Pending) */}
            <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Orders</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input value={ordersPendingQuery} onChange={(e)=>setOrdersPendingQuery(e.target.value)} placeholder="Search by order/customer/center" style={{ flex: 1, minWidth: 220, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
              </div>
              <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Order ID','Approved By','Created By','Order Date','Quantity','Destination','',] .map(h => (
                        <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o:any)=>{
                        const q = ordersPendingQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          String(o.order_id||'').toLowerCase().includes(q) ||
                          String(o.customer_id||'').toLowerCase().includes(q) ||
                          String(o.center_id||'').toLowerCase().includes(q)
                        );
                      })
                      .slice(0,10)
                      .map((o:any)=> (
                        <tr key={o.order_id}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{o.order_id}</td>
                          <td style={{ padding: 10 }}>{o.approved_by || '—'}</td>
                          <td style={{ padding: 10 }}>{(o.created_by_role || o.created_by_id) ? `${o.created_by_role || ''} ${o.created_by_id || ''}`.trim() : '—'}</td>
                          <td style={{ padding: 10 }}>{o.order_date ? String(o.order_date).slice(0,10) : '—'}</td>
                          
                          <td style={{ padding: 10 }}>{o.total_qty ?? o.item_count}</td>
                          <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                          <td style={{ padding: 10, display: 'flex', gap: 8 }}>
                            <button
                              onClick={async () => {
                                try {
                                  const r = await WarehouseApi.assignOrder(o.order_id);
                                  if (!r.ok) throw new Error('assign failed');
                                  const rr = await WarehouseApi.getOrders({ status: 'pending', limit: 10 }).then(r=>r.json());
                                  setOrders(rr.data || []);
                                } catch (e) { console.error(e); }
                              }}
                              style={{ padding: '6px 10px', background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 8 }}
                            >Assign</button>
                            <button
                              onClick={async () => {
                                try {
                                  const dest = o.center_id ? `Center ${o.center_id}` : (o.customer_id ? `Customer ${o.customer_id}` : 'Destination');
                                  const r = await WarehouseApi.createShipment({ order_id: o.order_id, carrier: 'CKS Logistics', destination_address: dest });
                                  if (!r.ok) throw new Error('ship failed');
                                  const [ord, inv, shp] = await Promise.all([
                                    WarehouseApi.getOrders({ status: 'pending', limit: 10 }).then(r=>r.json()),
                                    WarehouseApi.getInventory({ limit: 10 }).then(r=>r.json()),
                                    WarehouseApi.getShipments({ limit: 10 }).then(r=>r.json())
                                  ]);
                                  setOrders(ord.data || []);
                                  setInventory(inv.data || []);
                                  setShipments(shp.data || []);
                                } catch (e) { console.error(e); }
                              }}
                              style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8 }}
                            >Create Shipment</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orders Archive (Shipped) */}
            <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Archive</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input value={ordersArchiveQuery} onChange={(e)=>setOrdersArchiveQuery(e.target.value)} placeholder="Search shipped orders" style={{ flex: 1, minWidth: 220, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
              </div>
              <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Order ID','Approved By','Created By','Order Date','Quantity','Destination'] .map(h => (
                        <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ordersArchive
                      .filter((o:any)=>{
                        const q = ordersArchiveQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          String(o.order_id||'').toLowerCase().includes(q) ||
                          String(o.customer_id||'').toLowerCase().includes(q) ||
                          String(o.center_id||'').toLowerCase().includes(q)
                        );
                      })
                      .slice(0,10)
                      .map((o:any)=> (
                        <tr key={o.order_id}>
                          <td style={{ padding: 10, fontWeight: 600 }}>{o.order_id}</td>
                          <td style={{ padding: 10 }}>{o.approved_by || '—'}</td>
                          <td style={{ padding: 10 }}>{(o.created_by_role || o.created_by_id) ? `${o.created_by_role || ''} ${o.created_by_id || ''}`.trim() : '—'}</td>
                          <td style={{ padding: 10 }}>{o.order_date ? String(o.order_date).slice(0,10) : '—'}</td>
                          <td style={{ padding: 10 }}>{o.total_qty ?? o.item_count}</td>
                          <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Shipments */}
      {active === 'shipments' && (
        <section style={{ margin: '16px' }}>
          <Card>
            {/* Top: Shipments split into One-time and Recurring (like Inventory split) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
              {/* One-time */}
              <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>One-time</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input value={shipPendingOneQuery} onChange={(e)=>setShipPendingOneQuery(e.target.value)} placeholder="Search by order/center" style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
                </div>
                <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Order ID','Order Date','Quantity','Destination','Status','Delivery Date',''] .map(h => (
                          <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shipments
                        .filter((s:any)=> String(s.status||'pending') === 'pending')
                        .filter((s:any)=> (s.order_kind !== 'recurring'))
                        .filter((s:any)=>{
                          const q = shipPendingOneQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            String(s.order_id||'').toLowerCase().includes(q) ||
                            String(s.center_id||'').toLowerCase().includes(q)
                          );
                        })
                        .slice(0,10)
                        .map((s:any)=> (
                          <tr key={s.shipment_id}>
                            <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                            <td style={{ padding: 10 }}>{fmtDate(s.shipment_date)}</td>
                            <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                            <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                            <td style={{ padding: 10 }}>pending</td>
                            <td style={{ padding: 10 }}>{'—'}</td>
                            <td style={{ padding: 10, display: 'flex', gap: 6 }}>
                              <button
                                onClick={async ()=>{
                                  const r = await WarehouseApi.deliverShipment(s.shipment_id);
                                  if (!r.ok) return;
                                  const shp = await WarehouseApi.getShipments({ limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] }));
                                  setShipments(shp.data || []);
                                }}
                                style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8 }}
                              >
                                Delivered
                              </button>
                              <button
                                onClick={async ()=>{
                                  const r = await WarehouseApi.cancelShipment(s.shipment_id);
                                  if (!r.ok) return;
                                  const shp = await WarehouseApi.getShipments({ limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] }));
                                  setShipments(shp.data || []);
                                }}
                                style={{ padding: '6px 10px', background: '#e5e7eb', color: '#111827', border: '1px solid #d1d5db', borderRadius: 8 }}
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recurring */}
              <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Recurring</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input value={shipPendingRecQuery} onChange={(e)=>setShipPendingRecQuery(e.target.value)} placeholder="Search by order/center" style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
                </div>
                <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Order ID','Creation Date','Quantity','Destination','Delivery Frequency','Next Delivery','Status',''] .map(h => (
                          <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shipments
                        .filter((s:any)=> String(s.status||'pending') === 'pending')
                        .filter((s:any)=> (s.order_kind === 'recurring'))
                        .filter((s:any)=>{
                          const q = shipPendingRecQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            String(s.order_id||'').toLowerCase().includes(q) ||
                            String(s.center_id||'').toLowerCase().includes(q)
                          );
                        })
                        .slice(0,10)
                        .map((s:any)=> (
                          <tr key={s.shipment_id}>
                            <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                            <td style={{ padding: 10 }}>{fmtDate(s.order_date)}</td>
                            <td style={{ padding: 10 }}>{s.recurrence_interval || '—'}</td>
                            <td style={{ padding: 10 }}>{nextScheduled(s.shipment_date || s.order_date, s.recurrence_interval)}</td>
                            <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                            <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                            <td style={{ padding: 10 }}>pending</td>
                            <td style={{ padding: 10 }}>{'—'}</td>
                            <td style={{ padding: 10, display: 'flex', gap: 6 }}>
                              <button
                                onClick={async ()=>{
                                  const r = await WarehouseApi.deliverShipment(s.shipment_id);
                                  if (!r.ok) return;
                                  const shp = await WarehouseApi.getShipments({ limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] }));
                                  setShipments(shp.data || []);
                                }}
                                style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8 }}
                              >
                                Delivered
                              </button>
                              <button
                                onClick={async ()=>{
                                  const r = await WarehouseApi.cancelShipment(s.shipment_id);
                                  if (!r.ok) return;
                                  const shp = await WarehouseApi.getShipments({ limit: 10 }).then(r=>r.json()).catch(()=>({ data: [] }));
                                  setShipments(shp.data || []);
                                }}
                                style={{ padding: '6px 10px', background: '#e5e7eb', color: '#111827', border: '1px solid #d1d5db', borderRadius: 8 }}
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Archive Panel (Delivered) */}
            <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Archive</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input value={shipArchiveQuery} onChange={(e)=>setShipArchiveQuery(e.target.value)} placeholder="Search delivered shipments" style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
                </div>
                <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Order ID','Order Date','Quantity','Destination','Status','Delivery Date'] .map(h => (
                          <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shipments
                        .filter((s:any)=> String(s.status||'') === 'delivered')
                        .filter((s:any)=>{
                          const q = shipArchiveQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            String(s.order_id||'').toLowerCase().includes(q) ||
                            String(s.center_id||'').toLowerCase().includes(q)
                          );
                        })
                        .slice(0,10)
                        .map((s:any)=> (
                          <tr key={s.shipment_id}>
                            <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                            <td style={{ padding: 10 }}>{fmtDate(s.shipment_date)}</td>
                            <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                            <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                            <td style={{ padding: 10 }}>{String(s.status || '').toLowerCase()}</td>
                            <td style={{ padding: 10 }}>{fmtDate(s.actual_delivery_date)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
            </div>
          </Card>
        </section>
      )}

      {/* Communication Hub on Dashboard */}
      {active === 'dashboard' && (
        <section style={{ margin: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* News & Updates */}
            <Card>
              <div style={{ marginBottom: 16, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 8 }}>
                📰 News & Updates
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { id: 1, title: 'New safety procedures for loading docks', date: '2025-08-20', priority: 'High' },
                  { id: 2, title: 'Inventory counts scheduled for EOM', date: '2025-08-18', priority: 'Medium' },
                  { id: 3, title: 'Scanner firmware update available', date: '2025-08-15', priority: 'Low' }
                ].map(item => (
                  <div key={item.id} style={{ padding: 8, border: '1px solid #f3f4f6', borderRadius: 4, borderLeft: '3px solid #8b5cf6' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{item.date} • {item.priority} Priority</div>
                  </div>
                ))}
              </div>
              <button
                style={{ width: '100%', padding: '8px 16px', fontSize: 12, backgroundColor: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd', borderRadius: 4, cursor: 'pointer', marginTop: 8 }}
                onClick={() => alert('Full News - Coming Soon!')}
              >
                View All News
              </button>
            </Card>

            {/* Mailbox */}
            <Card>
              <div style={{ marginBottom: 16, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 8 }}>
                📬 Mail
                <span style={{ background: '#ef4444', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 12, fontWeight: 600 }}>3</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, borderLeft: '3px solid #8b5cf6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Logistics</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Upcoming shipment scheduling changes</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>30 minutes ago • High Priority</div>
                </div>
                <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, borderLeft: '3px solid #8b5cf6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>From Inventory Control</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Cycle count plan for aisle B</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>2 hours ago • Medium Priority</div>
                </div>
              </div>
              <button
                style={{ width: '100%', padding: '8px 16px', fontSize: 12, backgroundColor: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd', borderRadius: 4, cursor: 'pointer', marginTop: 8 }}
                onClick={() => alert('Full Mailbox - Coming Soon!')}
              >
                View Mailbox
              </button>
            </Card>
          </div>
        </section>
      )}

      {/* SUPPORT SECTION */}
      {active === 'support' && (
        <section style={{ margin: '16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Support</h2>
          {/* Support Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['compose','inbox','sent'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSupportTab(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: supportTab === t ? '#8b5cf6' : 'white',
                  color: supportTab === t ? 'white' : '#111827',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {t === 'compose' ? 'Compose' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Compose Panel */}
          {supportTab === 'compose' && (
            <Card>
              {supportNotice && (
                <div style={{ padding: 8, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 6, marginBottom: 8 }}>{supportNotice}</div>
              )}
              <div style={{ display: 'grid', gap: 8 }}>
                <label>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Subject</div>
                  <input value={supportForm.subject} onChange={(e)=>setSupportForm({ ...supportForm, subject: e.target.value })} placeholder="Short summary" style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </label>
                <label>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Type</div>
                  <select value={supportForm.type} onChange={(e)=>setSupportForm({ ...supportForm, type: e.target.value as any })} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    <option value="issue">Issue</option>
                    <option value="request">Request</option>
                    <option value="question">Question</option>
                  </select>
                </label>
                <label>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Description</div>
                  <textarea rows={5} value={supportForm.body} onChange={(e)=>setSupportForm({ ...supportForm, body: e.target.value })} placeholder="Provide relevant details" style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setSupportForm({ subject: '', type: 'issue', body: '' })} disabled={supportSending} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}>Clear</button>
                  <button
                    onClick={async () => {
                      if (!supportForm.subject || !supportForm.body) return;
                      setSupportSending(true);
                      try {
                        const id = `WH-SUP-${(Date.now().toString().slice(-4))}`;
                        setSupportItems([{ id, subject: supportForm.subject, type: supportForm.type, date: new Date().toISOString().slice(0,10), status: 'open' }, ...supportItems]);
                        setSupportNotice('Support request submitted.');
                        setSupportTab('inbox');
                        setSupportForm({ subject: '', type: 'issue', body: '' });
                      } finally {
                        setSupportSending(false);
                      }
                    }}
                    disabled={supportSending}
                    style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 600 }}
                  >
                    {supportSending ? 'Sending…' : 'Submit'}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Inbox/Sent Panels */}
          {supportTab !== 'compose' && (
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{supportTab === 'inbox' ? 'Inbox' : 'Sent'}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {supportItems.map((m) => (
                  <div key={m.id} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.subject}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{m.id} • {m.type} • {m.date}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: m.status === 'open' ? '#ede9fe' : '#dcfce7', color: m.status === 'open' ? '#6d28d9' : '#166534' }}>{m.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ color: '#6b7280', fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
