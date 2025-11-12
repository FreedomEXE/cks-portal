import React from 'react';

export interface ReportHeaderExtrasProps {
  type?: 'report' | 'feedback';
  acknowledgments?: Array<{
    userId?: string;
    timestamp?: string;
    acknowledgedAt?: string;
    date?: string;
  }>;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolution?: {
    notes?: string;
    actionTaken?: string;
  } | null;
  resolution_notes?: string | null;
  currentUserId?: string | null;
}

const ROLE_NAMES: Record<string, string> = {
  CUS: 'Customer',
  CEN: 'Center',
  CON: 'Contractor',
  CRW: 'Crew',
  MGR: 'Manager',
  WHS: 'Warehouse',
  ADM: 'Administrator',
};

const getRoleName = (userId: string | undefined | null): string => {
  if (!userId) return 'User';
  const prefix = userId.split('-')[0]?.toUpperCase();
  return ROLE_NAMES[prefix] || 'User';
};

const formatTimestamp = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#1d3c83',
  fontSize: '13px',
  border: '1px solid #c7d2fe',
};

const sectionStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 220,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '12px 16px',
  background: '#ffffff',
  boxShadow: '0 4px 8px rgba(15, 23, 42, 0.05)',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '13px',
  color: '#4b5563',
  marginBottom: 6,
};

const textStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#111827',
  marginBottom: 4,
};

const mutedStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
};

const containerStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

export function ReportHeaderExtras({
  acknowledgments = [],
  resolvedBy,
  resolvedAt,
  resolution,
  resolution_notes,
  currentUserId,
}: ReportHeaderExtrasProps) {
  const hasAcknowledgments = acknowledgments.length > 0;
  const effectiveResolution =
    resolvedBy || resolvedAt || resolution?.actionTaken || resolution?.notes || resolution_notes;

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <div style={labelStyle}>
          Acknowledgments {hasAcknowledgments ? `(${acknowledgments.length})` : '(None)'}
        </div>
        {hasAcknowledgments ? (
          <div style={listStyle}>
            {acknowledgments.map((ack, index) => {
              const formattedDate =
                formatTimestamp(ack.timestamp ?? ack.acknowledgedAt ?? ack.date ?? null);
              const isCurrent = currentUserId && ack.userId === currentUserId;
              return (
                <span key={`${ack.userId ?? 'unk'}-${index}`} style={pillStyle}>
                  <span>
                    {getRoleName(ack.userId)} ({ack.userId || 'unknown'})
                    {isCurrent ? ' - you' : ''}
                  </span>
                  {formattedDate && (
                    <span style={{ ...mutedStyle, marginLeft: 8 }}>{formattedDate}</span>
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          <p style={mutedStyle}>No acknowledgments yet</p>
        )}
      </div>

      {effectiveResolution && (
        <div style={sectionStyle}>
          <div style={labelStyle}>Resolution Status</div>
          {resolvedBy && (
            <p style={textStyle}>
              Resolved by {getRoleName(resolvedBy)} ({resolvedBy})
              {resolvedAt && ` on ${formatTimestamp(resolvedAt)}`}
            </p>
          )}
          {resolution?.actionTaken && (
            <p style={textStyle}>{resolution.actionTaken}</p>
          )}
          {(resolution_notes || resolution?.notes) && (
            <p style={{ ...textStyle, marginBottom: 0 }}>
              {resolution_notes || resolution?.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportHeaderExtras;
