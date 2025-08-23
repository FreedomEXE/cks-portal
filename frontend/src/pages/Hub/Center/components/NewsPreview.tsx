/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Center Hub - FULLY INDEPENDENT)
 * 
 * Description: Center-specific news widget with demo fallback data
 * Function: Displays recent news and updates relevant to centers
 * Importance: Medium - Provides contextual news for center dashboard
 * Connects to: Center API news endpoints, Center authentication
 * 
 * Notes: Fully self-contained with Center-specific styling and data sources.
 *        Uses Center API endpoints for news fetching with fallbacks.
 *        Orange theme styling to match Center hub branding.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildCenterApiUrl } from "../utils/centerApi";

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

const demoCenterNews: NewsItem[] = [
  { id: 1, title: "Crew scheduling updates for your facility", date: "2025-08-10", scope: "center" },
  { id: 2, title: "New equipment maintenance protocols", date: "2025-08-05", scope: "company" },
  { id: 3, title: "Center performance metrics Q2", date: "2025-08-01", scope: "company" },
];

export default function CenterNewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask Center backend for filtered news
        const url = buildCenterApiUrl('/news', { code, limit });
        const r = await fetch(url, { 
          credentials: 'include',
          headers: {
            'x-hub-type': 'center'
          }
        });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) setItems(demoCenterNews.slice(0, limit));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, limit]);

  return (
    <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #f97316' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="title" style={{ color: '#f97316' }}>Center News & Updates</div>
        <Link to="/news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14, backgroundColor: '#f97316', color: 'white' }}>View all</Link>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading center updates…</div>
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
            <li style={{ color: '#6b7280' }}>No center updates.</li>
          )}
        </ul>
      )}
      {showUnread && (
        <div style={{ marginTop: 12 }}>
          <Link to="/news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12, backgroundColor: '#fff7ed', color: '#f97316' }}>
            {items.length} unread updates
          </Link>
        </div>
      )}
    </div>
  );
}