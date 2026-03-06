/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

import { FormEvent, useMemo, useState } from 'react';
import useSWR from 'swr';
import { addTicketComment, fetchTicketComments, type TicketComment } from '../../shared/api/hub';

interface TicketMessagesTabProps {
  ticketId: string;
  viewerRole?: string;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketMessagesTab({ ticketId, viewerRole }: TicketMessagesTabProps) {
  const isAdmin = useMemo(() => (viewerRole || '').toLowerCase() === 'admin', [viewerRole]);
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<TicketComment[]>(
    ticketId ? `support-ticket-comments:${ticketId}` : null,
    () => fetchTicketComments(ticketId, { limit: 100 }),
    { revalidateOnFocus: false },
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await addTicketComment(ticketId, trimmed, isAdmin && isInternal);
      setBody('');
      setIsInternal(false);
      await mutate();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#ffffff',
          maxHeight: 360,
          overflowY: 'auto',
          padding: 12,
          display: 'grid',
          gap: 10,
        }}
      >
        {isLoading && <div style={{ color: '#6b7280', fontSize: 14 }}>Loading messages...</div>}
        {!isLoading && error && (
          <div style={{ color: '#b91c1c', fontSize: 14 }}>
            Failed to load comments
          </div>
        )}
        {!isLoading && !error && (data || []).length === 0 && (
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            No messages yet.
          </div>
        )}

        {(data || []).map((comment) => (
          <div
            key={comment.commentId}
            style={{
              border: `1px solid ${comment.isInternal ? '#fde68a' : '#e5e7eb'}`,
              background: comment.isInternal ? '#fffbeb' : '#f9fafb',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>
                {comment.authorId} ({comment.authorRole})
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {formatDate(comment.createdAt)}
              </div>
            </div>
            {comment.isInternal && (
              <div
                style={{
                  display: 'inline-block',
                  marginBottom: 6,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Internal
              </div>
            )}
            <div style={{ fontSize: 14, color: '#111827', whiteSpace: 'pre-wrap' }}>{comment.body}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a message..."
          rows={4}
          disabled={submitting}
          style={{
            width: '100%',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            padding: 10,
            fontSize: 14,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        {isAdmin && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(event) => setIsInternal(event.target.checked)}
              disabled={submitting}
            />
            Mark as internal note
          </label>
        )}
        <div>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            style={{
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: 8,
              padding: '8px 14px',
              fontWeight: 600,
              cursor: submitting || !body.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !body.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}

