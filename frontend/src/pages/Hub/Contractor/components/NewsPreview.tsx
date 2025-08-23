/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Contractor Hub - FULLY INDEPENDENT)
 * 
 * Description: Contractor-specific news widget with demo fallback data
 * Function: Displays recent news and updates relevant to contractors
 * Importance: Medium - Provides contextual news for contractor dashboard
 * Connects to: Contractor API news endpoints, Contractor authentication
 * 
 * Notes: Fully self-contained with Contractor-specific styling and data sources.
 *        Uses Contractor API endpoints for news fetching with fallbacks.
 *        Green theme styling to match Contractor hub branding.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildContractorApiUrl } from "../utils/contractorApi";

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

const demoContractorNews: NewsItem[] = [
  { id: 1, title: "New billing structure effective September 1st", date: "2025-08-10", scope: "company" },
  { id: 2, title: "Customer satisfaction scores Q2 available", date: "2025-08-05", scope: "company" },
  { id: 3, title: "Premium service tiers expanded", date: "2025-08-01", scope: "company" },
];

export default function ContractorNewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask Contractor backend for filtered news
        const url = buildContractorApiUrl('/news', { code, limit });
        const r = await fetch(url, { 
          credentials: 'include',
          headers: {
            'x-hub-type': 'contractor'
          }
        });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) setItems(demoContractorNews.slice(0, limit));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, limit]);

  return (
    <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #10b981' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="title" style={{ color: '#10b981' }}>Business News & Updates</div>
        <Link to="/news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14, backgroundColor: '#10b981', color: 'white' }}>View all</Link>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading business updates…</div>
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
            <li style={{ color: '#6b7280' }}>No business updates.</li>
          )}
        </ul>
      )}
      {showUnread && (
        <div style={{ marginTop: 12 }}>
          <Link to="/news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12, backgroundColor: '#ecfdf5', color: '#10b981' }}>
            {items.length} unread updates
          </Link>
        </div>
      )}
    </div>
  );
}