/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Admin Hub - FULLY INDEPENDENT)
 * 
 * Description: Admin-specific news widget with demo fallback data
 * Function: Displays recent news and updates relevant to system administrators
 * Importance: Medium - Provides contextual news for admin dashboard
 * Connects to: Admin API news endpoints, Admin authentication
 * 
 * Notes: Fully self-contained with Admin-specific styling and data sources.
 *        Uses Admin API endpoints for news fetching with fallbacks.
 *        Black theme styling to match Admin hub branding.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildAdminApiUrl } from "../utils/adminApi";

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

const demoAdminNews: NewsItem[] = [
  { id: 1, title: "System maintenance scheduled for Saturday", date: "2025-08-10", scope: "system" },
  { id: 2, title: "New user onboarding process deployed", date: "2025-08-05", scope: "system" },
  { id: 3, title: "Database backup verification completed", date: "2025-08-01", scope: "system" },
];

export default function AdminNewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask Admin backend for filtered news
        const url = buildAdminApiUrl('/news', { code, limit });
        const r = await fetch(url, { 
          credentials: 'include',
          headers: {
            'x-hub-type': 'admin',
            'x-system-admin': 'true'
          }
        });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) setItems(demoAdminNews.slice(0, limit));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, limit]);

  return (
    <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #000000' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="title" style={{ color: '#000000' }}>System News & Updates</div>
        <Link to="/news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14, backgroundColor: '#000000', color: 'white' }}>View all</Link>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading system updates…</div>
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
            <li style={{ color: '#6b7280' }}>No system updates.</li>
          )}
        </ul>
      )}
      {showUnread && (
        <div style={{ marginTop: 12 }}>
          <Link to="/news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12, backgroundColor: '#f9fafb', color: '#000000' }}>
            {items.length} unread updates
          </Link>
        </div>
      )}
    </div>
  );
}