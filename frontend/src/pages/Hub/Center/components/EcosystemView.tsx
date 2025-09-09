/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React, { useEffect, useState } from 'react';

type NodeType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew';

type EcosystemNode = {
  id: string;
  name: string;
  type: NodeType;
  stats?: { customers?: number; centers?: number; crew?: number };
  children?: EcosystemNode[];
};

export default function CenterEcosystemView({ code }: { code: string }) {
  const [ecosystem, setEcosystem] = useState<EcosystemNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const res = await fetch(`${baseApi}/center/ecosystem?code=${encodeURIComponent(code)}`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success === false) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setEcosystem(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
      } catch (e: any) {
        // Gracefully show empty state if API not implemented yet
        if (!cancelled) {
          setEcosystem([]);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  }

  function badge(text: string, color: string) {
    return (
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: color, color: '#111827', fontWeight: 600 }}>{text}</span>
    );
  }

  function renderNode(node: EcosystemNode, level = 0) {
    const isOpen = expanded.has(node.id);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    const typeColor: Record<NodeType, string> = {
      manager: '#dbeafe',
      contractor: '#dcfce7',
      customer: '#fef9c3',
      center: '#ffedd5',
      crew: '#fee2e2',
    };

    return (
      <div key={`${node.type}-${node.id}`} style={{ marginBottom: 4 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8,
            cursor: hasChildren ? 'pointer' : 'default', background: '#fff', border: '1px solid #e5e7eb',
            paddingLeft: 10 + level * 16,
          }}
          onClick={() => hasChildren && toggle(node.id)}
        >
          <span style={{ width: 14, textAlign: 'center', color: '#6b7280' }}>{hasChildren ? (isOpen ? '▼' : '▶') : ''}</span>
          <span style={{ padding: '2px 6px', borderRadius: 6, background: typeColor[node.type], fontSize: 12, fontWeight: 700 }}>{node.type.toUpperCase()}</span>
          <span style={{ fontWeight: 700 }}>{node.id}</span>
          <span style={{ color: '#6b7280' }}>— {node.name}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {typeof node.stats?.customers === 'number' && badge(`${node.stats.customers} customers`, '#f1f5f9')}
            {typeof node.stats?.centers === 'number' && badge(`${node.stats.centers} centers`, '#f1f5f9')}
            {typeof node.stats?.crew === 'number' && badge(`${node.stats.crew} crew`, '#f1f5f9')}
          </span>
        </div>
        {isOpen && hasChildren && (
          <div style={{ marginLeft: 18 }}>{node.children!.map(child => renderNode(child, level + 1))}</div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading ecosystem…</div>
      </div>
    );
  }
  if (!!error) {
    return (
      <div className="ui-card" style={{ padding: 16, color: '#b91c1c', border: '1px solid #fecaca', background: '#fff1f2' }}>
        Failed to load ecosystem: {error}
      </div>
    );
  }
  if (!ecosystem.length) {
    return (
      <div className="ui-card" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🧩</div>
        <div style={{ fontWeight: 600 }}>No network connections yet</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Your ecosystem will appear as connections are made.</div>
      </div>
    );
  }

  return (
    <div className="ui-card" style={{ padding: 0 }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 700 }}>Your Network Overview</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Click a row to expand</div>
      </div>
      <div style={{ padding: 8 }}>
        {ecosystem.map((n) => renderNode(n))}
      </div>
      <div style={{ padding: 10, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#dcfce7', borderRadius: 2, marginRight: 6 }}></span>Contractor</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fef9c3', borderRadius: 2, marginRight: 6 }}></span>Customer</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ffedd5', borderRadius: 2, marginRight: 6 }}></span>Center</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fee2e2', borderRadius: 2, marginRight: 6 }}></span>Crew</span>
      </div>
    </div>
  );
}

