/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Customer Hub - FULLY INDEPENDENT)
 * 
 * Description: Customer-specific news widget with demo fallback data
 * Function: Displays recent news and updates relevant to customers
 * Importance: Medium - Provides contextual news for customer dashboard
 * Connects to: Customer API news endpoints, Customer authentication
 * 
 * Notes: Fully self-contained with Customer-specific styling and data sources.
 *        Uses Customer API endpoints for news fetching with fallbacks.
 *        Yellow theme styling to match Customer hub branding.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildCustomerApiUrl } from "../utils/customerApi";

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

const demoCustomerNews: NewsItem[] = [
  { id: 1, title: "Center maintenance schedules updated", date: "2025-08-10", scope: "company" },
  { id: 2, title: "New service request portal available", date: "2025-08-05", scope: "company" },
  { id: 3, title: "Customer feedback survey results", date: "2025-08-01", scope: "company" },
];

export default function CustomerNewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask Customer backend for filtered news
        const url = buildCustomerApiUrl('/news', { code, limit });
        const r = await fetch(url, { 
          credentials: 'include',
          headers: {
            'x-hub-type': 'customer'
          }
        });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) setItems(demoCustomerNews.slice(0, limit));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, limit]);

  return (
    <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #eab308' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="title" style={{ color: '#eab308' }}>Customer News & Updates</div>
        <Link to="/news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14, backgroundColor: '#eab308', color: 'white' }}>View all</Link>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading customer updates…</div>
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
            <li style={{ color: '#6b7280' }}>No customer updates.</li>
          )}
        </ul>
      )}
      {showUnread && (
        <div style={{ marginTop: 12 }}>
          <Link to="/news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12, backgroundColor: '#fefce8', color: '#eab308' }}>
            {items.length} unread updates
          </Link>
        </div>
      )}
    </div>
  );
}