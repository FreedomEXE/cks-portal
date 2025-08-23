/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Crew Hub - FULLY INDEPENDENT)
 * 
 * Description: Crew-specific news widget with demo fallback data
 * Function: Displays recent news and updates relevant to crew members
 * Importance: Medium - Provides contextual news for crew dashboard
 * Connects to: Crew API news endpoints, Crew authentication
 * 
 * Notes: Fully self-contained with Crew-specific styling and data sources.
 *        Uses Crew API endpoints for news fetching with fallbacks.
 *        Red theme styling to match Crew hub branding.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildCrewApiUrl } from "../utils/crewApi";

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

const demoCrewNews: NewsItem[] = [
  { id: 1, title: "Safety training reminder - complete by Friday", date: "2025-08-10", scope: "company" },
  { id: 2, title: "New time tracking system goes live Monday", date: "2025-08-05", scope: "company" },
  { id: 3, title: "Employee appreciation event next week", date: "2025-08-01", scope: "company" },
];

export default function CrewNewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask Crew backend for filtered news
        const url = buildCrewApiUrl('/news', { code, limit });
        const r = await fetch(url, { 
          credentials: 'include',
          headers: {
            'x-hub-type': 'crew'
          }
        });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        if (!cancelled) setItems(arr as NewsItem[]);
      } catch {
        if (!cancelled) setItems(demoCrewNews.slice(0, limit));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, limit]);

  return (
    <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #ef4444' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="title" style={{ color: '#ef4444' }}>Crew News & Updates</div>
        <Link to="/news" className="ui-button" style={{ padding: '10px 16px', fontSize: 14, backgroundColor: '#ef4444', color: 'white' }}>View all</Link>
      </div>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading crew updates…</div>
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
            <li style={{ color: '#6b7280' }}>No crew updates.</li>
          )}
        </ul>
      )}
      {showUnread && (
        <div style={{ marginTop: 12 }}>
          <Link to="/news" className="ui-button" style={{ padding: '6px 10px', fontSize: 12, backgroundColor: '#fef2f2', color: '#ef4444' }}>
            {items.length} unread updates
          </Link>
        </div>
      )}
    </div>
  );
}