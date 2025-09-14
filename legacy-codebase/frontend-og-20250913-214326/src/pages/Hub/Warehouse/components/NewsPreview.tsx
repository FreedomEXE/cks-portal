/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Warehouse Hub)
 * 
 * Description: Warehouse hub news preview component
 * Function: Displays warehouse-specific news and updates
 * Importance: Medium - Communication hub for warehouse operations
 * Connects to: Warehouse API, main warehouse dashboard
 * 
 * Notes: Purple-themed news component for warehouse hub.
 *        Shows logistics updates, safety alerts, and operational news.
 *        Consistent with other hub news components.
 */

import React from 'react';

interface NewsItem {
  id: string | number;
  title: string;
  date?: string;
  priority?: string;
}

interface NewsPreviewProps {
  items: NewsItem[];
  loading?: boolean;
}

export default function WarehouseNewsPreview({ items = [], loading = false }: NewsPreviewProps) {
  if (loading) {
    return (
      <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #8b5cf6' }}>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#8b5cf6' }}>
            📦 Warehouse Updates
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ 
                height: 48, 
                background: '#f3f4f6', 
                borderRadius: 6 
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const defaultItems: NewsItem[] = [
    { id: 1, title: "New inventory management system deployed", date: "2025-08-26", priority: "High" },
    { id: 2, title: "Safety training scheduled for all warehouse staff", date: "2025-08-25", priority: "Medium" },
    { id: 3, title: "Automated sorting equipment maintenance completed", date: "2025-08-24", priority: "Low" }
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <div className="ui-card" style={{ marginTop: 16, borderTop: '3px solid #8b5cf6' }}>
      <div style={{ padding: 16 }}>
        <div style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 12, 
          color: '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          📦 Warehouse Updates
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayItems.slice(0, 3).map((item) => (
            <div 
              key={String(item.id)} 
              style={{ 
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                borderLeft: '3px solid #8b5cf6',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#faf5ff';
                e.currentTarget.style.borderLeftColor = '#7c3aed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderLeftColor = '#8b5cf6';
              }}
            >
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: '#111827',
                marginBottom: 2
              }}>
                {item.title}
              </div>
              {(item.date || item.priority) && (
                <div style={{ 
                  fontSize: 11, 
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {item.date && <span>{item.date}</span>}
                  {item.priority && (
                    <span style={{ 
                      padding: '2px 6px',
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 600,
                      background: item.priority === 'High' ? '#fee2e2' : 
                                 item.priority === 'Medium' ? '#fef3c7' : '#f0fdf4',
                      color: item.priority === 'High' ? '#dc2626' : 
                             item.priority === 'Medium' ? '#d97706' : '#16a34a'
                    }}>
                      {item.priority} Priority
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: 12,
            backgroundColor: '#f3f0ff',
            color: '#8b5cf6',
            border: '1px solid #c4b5fd',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 12,
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onClick={() => alert('Full warehouse news - Coming Soon!')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ede9fe';
            e.currentTarget.style.borderColor = '#a78bfa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f0ff';
            e.currentTarget.style.borderColor = '#c4b5fd';
          }}
        >
          View All Updates
        </button>
      </div>
    </div>
  );
}