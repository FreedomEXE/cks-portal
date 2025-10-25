/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: TimelineTab.tsx
 *
 * Description:
 * Timeline tab showing user's activity history
 *
 * Responsibilities:
 * - Display user's lifecycle events and activity history
 * - Integrate with universal HistoryTab component
 *
 * Role in system:
 * - Timeline view within ProfileInfoCard
 *
 * Notes:
 * Uses HistoryTab component from @cks/ui to display activity timeline
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';
import { HistoryTab } from '@cks/ui';

export interface TimelineTabProps {
  /** User role determines entity type for history API */
  role: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

  /** Profile data containing user's ID */
  profileData: any;

  /** Primary color for styling (unused but kept for consistency) */
  primaryColor?: string;
}

/**
 * Extract user ID from profile data based on role
 */
function getUserId(role: string, profileData: any): string | null {
  if (!profileData) return null;

  const idField = `${role}Id`;
  return profileData[idField] || null;
}

export function TimelineTab({ role, profileData }: TimelineTabProps) {
  const userId = getUserId(role, profileData);

  if (!userId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        Unable to load timeline - user ID not found
      </div>
    );
  }

  return (
    <HistoryTab
      entityType={role}
      entityId={userId}
      limit={50}
    />
  );
}

export default TimelineTab;
