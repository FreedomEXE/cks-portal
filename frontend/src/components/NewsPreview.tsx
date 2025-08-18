import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildUrl } from "../lib/apiBase";

type NewsItem = { id: string | number; title: string; date?: string; scope?: string; center_id?: string };

const demo: NewsItem[] = [
  { id: 1, title: "Service pricing model updated — review minimums", date: "2025-08-10", scope: "company" },
  { id: 2, title: "Training schedules posted for Q3", date: "2025-08-05", scope: "company" },
  { id: 3, title: "New supply SKUs added to warehouses", date: "2025-08-01", scope: "company" },
];

export default function NewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask backend for filtered news. Backend can resolve crew->centers and return company-wide + relevant center news.
        const url = buildUrl('/news', { code, limit });
        const r = await fetch(url, { credentials: 'include' });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) setItems(demo.slice(0, limit));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, limit]);

  return (
    <div className="ui-card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="title">News & Updates</div>
        <Link to="/news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14 }}>View all</Link>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading…</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {items.map((n) => (
            <li key={String(n.id)}>
              <Link to="/news" style={{ textDecoration: 'none', color: '#111827' }}>
                • {n.title}
              </Link>
            </li>
          ))}
          {items.length === 0 && (
            <li style={{ color: '#6b7280' }}>No updates.</li>
          )}
        </ul>
      )}
      {showUnread && (
        <div style={{ marginTop: 12 }}>
          <Link to="/news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12 }}>
            {items.length} unread updates
          </Link>
        </div>
      )}
    </div>
  );
}
