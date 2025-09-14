/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Manager Hub - FULLY INDEPENDENT)
 * 
 * Description: Manager-specific news widget with demo fallback data
 * Function: Displays recent news and updates relevant to managers
 * Importance: Medium - Provides contextual news for manager dashboard
 * Connects to: Manager API news endpoints, Manager authentication
 * 
 * Notes: Fully self-contained with Manager-specific styling and data sources.
 *        Uses Manager API endpoints for news fetching with fallbacks.
 *        Blue theme styling to match Manager hub branding.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildManagerApiUrl } from "../utils/managerApi";

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

const demoManagerNews: NewsItem[] = [
  { id: 1, title: "Q3 operational metrics report available", date: "2025-08-10", scope: "company" },
  { id: 2, title: "New crew scheduling protocols implemented", date: "2025-08-05", scope: "company" },
  { id: 3, title: "Manager training workshop - August 15th", date: "2025-08-01", scope: "company" },
];

export default function ManagerNewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask Manager backend for filtered news
        const url = buildManagerApiUrl('/news', { code, limit });
        const r = await fetch(url, { 
          credentials: 'include',
          headers: {
            'x-hub-type': 'manager'
          }
        });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) setItems(demoManagerNews.slice(0, limit));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, limit]);

  return (
    <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #3b82f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="title" style={{ color: '#3b82f6' }}>Manager News & Updates</div>
        <Link to="/news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14, backgroundColor: '#3b82f6', color: 'white' }}>View all</Link>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading manager updates…</div>
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
            <li style={{ color: '#6b7280' }}>No manager updates.</li>
          )}
        </ul>
      )}
      {showUnread && (
        <div style={{ marginTop: 12 }}>
          <Link to="/news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12, backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            {items.length} unread updates
          </Link>
        </div>
      )}
    </div>
  );
}