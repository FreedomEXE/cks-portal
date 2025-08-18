/**
 * File: InboxView.tsx
 *
 * Description:
 *   Simple card wrapper for inbox-like content blocks.
 *
 * Functionality:
 *   Wraps children in a UI card container.
 *
 * Importance:
 *   Provides consistent visual styling for in-page notices.
 *
 * Connections:
 *   Used by Admin hub subpages.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';

export default function InboxView({ children }: { children?: React.ReactNode }) {
  return <div className="ui-card">{children}</div>;
}
