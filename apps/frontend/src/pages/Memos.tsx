import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useCksAuth } from '@cks/auth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import {
  createMemoThread,
  fetchAdminMemoEcosystems,
  fetchAdminMemoMessages,
  fetchAdminMemoThreads,
  fetchMemoMessages,
  fetchMemoThreads,
  sendMemoMessage,
  type MemoEcosystem,
  type MemoMessage,
  type MemoThread,
} from '../shared/api/memos';
import './Memos.css';

type MemoRole = 'crew' | 'manager';

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'No messages yet';
  }
  const date = new Date(value);
  return date.toLocaleString();
}

function getParticipantLabel(thread: MemoThread) {
  const name = thread.participant.name?.trim();
  if (name) {
    return `${name} (${thread.participant.id})`;
  }
  return thread.participant.id;
}

export default function Memos() {
  const navigate = useNavigate();
  const { role, code } = useCksAuth();
  const { getToken } = useClerkAuth();
  const normalizedRole = (role ?? '').toLowerCase();
  const viewerId = (code ?? '').trim();

  const isMemoRole = normalizedRole === 'crew' || normalizedRole === 'manager';
  const isAdminRole = normalizedRole === 'admin' || normalizedRole === 'administrator';
  const memoRole = (normalizedRole as MemoRole) || 'crew';

  const [threads, setThreads] = useState<MemoThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  const [selectedThread, setSelectedThread] = useState<MemoThread | null>(null);
  const [messages, setMessages] = useState<MemoMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [composerText, setComposerText] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerSending, setComposerSending] = useState(false);

  const [isNewMemoOpen, setIsNewMemoOpen] = useState(false);
  const [newTargetRole, setNewTargetRole] = useState<MemoRole>(
    memoRole === 'manager' ? 'crew' : 'manager'
  );
  const [newTargetId, setNewTargetId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newMemoError, setNewMemoError] = useState<string | null>(null);
  const [newMemoSending, setNewMemoSending] = useState(false);

  const [ecosystems, setEcosystems] = useState<MemoEcosystem[]>([]);
  const [selectedEcosystemId, setSelectedEcosystemId] = useState<string>('');
  const [ecosystemsLoading, setEcosystemsLoading] = useState(false);
  const [ecosystemsError, setEcosystemsError] = useState<string | null>(null);

  const reloadThreads = useCallback(async () => {
    if (!isMemoRole && !isAdminRole) {
      return;
    }
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const data = isAdminRole
        ? await fetchAdminMemoThreads(selectedEcosystemId, getToken)
        : await fetchMemoThreads(getToken);
      setThreads(data);
      if (data.length > 0 && !selectedThread) {
        setSelectedThread(data[0]);
      }
    } catch (error) {
      setThreadsError('Unable to load memos.');
    } finally {
      setThreadsLoading(false);
    }
  }, [getToken, isMemoRole, isAdminRole, selectedEcosystemId, selectedThread]);

  const reloadMessages = useCallback(async (threadId: string) => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const data = isAdminRole
        ? await fetchAdminMemoMessages(threadId, { limit: 75 }, getToken)
        : await fetchMemoMessages(threadId, { limit: 75 }, getToken);
      setMessages(data.slice().reverse());
    } catch (error) {
      setMessagesError('Unable to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  }, [getToken, isAdminRole]);

  useEffect(() => {
    if (isAdminRole) {
      return;
    }
    void reloadThreads();
  }, [isAdminRole, reloadThreads]);

  useEffect(() => {
    if (!isAdminRole) {
      return;
    }
    const loadEcosystems = async () => {
      setEcosystemsLoading(true);
      setEcosystemsError(null);
      try {
        const data = await fetchAdminMemoEcosystems(getToken);
        setEcosystems(data);
        if (!selectedEcosystemId && data.length > 0) {
          setSelectedEcosystemId(data[0].id);
        }
      } catch (error) {
        setEcosystemsError('Unable to load ecosystems.');
      } finally {
        setEcosystemsLoading(false);
      }
    };
    void loadEcosystems();
  }, [getToken, isAdminRole, selectedEcosystemId]);

  useEffect(() => {
    if (!isAdminRole || !selectedEcosystemId) {
      return;
    }
    void reloadThreads();
  }, [isAdminRole, reloadThreads, selectedEcosystemId]);

  useEffect(() => {
    if (selectedThread?.threadId) {
      void reloadMessages(selectedThread.threadId);
    } else {
      setMessages([]);
    }
  }, [selectedThread, reloadMessages]);

  const activeHeader = useMemo(() => {
    if (!selectedThread) {
      return 'Select a memo to view messages.';
    }
    if (isAdminRole && selectedThread.participants?.length) {
      const labels = selectedThread.participants.map((participant) => {
        const name = participant.name?.trim();
        return name ? `${name} (${participant.id})` : participant.id;
      });
      return labels.join(' · ');
    }
    return getParticipantLabel(selectedThread);
  }, [isAdminRole, selectedThread]);

  const threadPreviewLabel = useCallback(
    (thread: MemoThread) => {
      if (isAdminRole && thread.participants?.length) {
        return thread.participants
          .map((participant) => {
            const name = participant.name?.trim();
            return name ? `${name} (${participant.id})` : participant.id;
          })
          .join(' · ');
      }
      return getParticipantLabel(thread);
    },
    [isAdminRole]
  );

  const handleSendMessage = useCallback(async () => {
    if (!selectedThread) {
      return;
    }
    const body = composerText.trim();
    if (!body) {
      setComposerError('Please enter a message.');
      return;
    }
    setComposerSending(true);
    setComposerError(null);
    try {
      await sendMemoMessage({ threadId: selectedThread.threadId, body }, getToken);
      setComposerText('');
      await reloadMessages(selectedThread.threadId);
      await reloadThreads();
    } catch (error) {
      setComposerError('Failed to send memo.');
    } finally {
      setComposerSending(false);
    }
  }, [composerText, getToken, reloadMessages, reloadThreads, selectedThread]);

  const handleCreateMemo = useCallback(async () => {
    const targetId = newTargetId.trim();
    const message = newMessage.trim();
    if (!targetId) {
      setNewMemoError('Enter a CKS ID to start a memo.');
      return;
    }
    if (!message) {
      setNewMemoError('Enter a message to start the memo.');
      return;
    }
    setNewMemoSending(true);
    setNewMemoError(null);
    try {
      const result = await createMemoThread({ targetId, targetRole: newTargetRole }, getToken);
      await sendMemoMessage({ threadId: result.threadId, body: message }, getToken);
      setIsNewMemoOpen(false);
      setNewTargetId('');
      setNewMessage('');
      await reloadThreads();
      const freshThreads = await fetchMemoThreads(getToken);
      const createdThread = freshThreads.find((thread) => thread.threadId === result.threadId) || null;
      setThreads(freshThreads);
      setSelectedThread(createdThread ?? null);
    } catch (error) {
      setNewMemoError('Failed to start memo. Please double-check the CKS ID.');
    } finally {
      setNewMemoSending(false);
    }
  }, [getToken, newMessage, newTargetId, newTargetRole, reloadThreads]);

  if (!isMemoRole && !isAdminRole) {
    return (
      <div className="memos-page">
        <div className="ui-card memos-panel">
          <h2 className="memos-title">Memos</h2>
          <p className="memos-muted">Memos are currently available for crew and managers only.</p>
          <button className="memos-button memos-button--ghost" onClick={() => navigate('/hub')}>
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="memos-page">
      <div className="memos-header">
        <div>
          <h2 className="memos-title">Memos</h2>
          <p className="memos-subtitle">
            {isAdminRole
              ? 'Read-only view of crew and manager memos by ecosystem.'
              : 'Private threads between crew members and their manager.'}
          </p>
        </div>
        <button className="memos-button memos-button--ghost" onClick={() => navigate('/hub')}>
          Back to Hub
        </button>
      </div>

      <div className="memos-layout">
        <div className="memos-panel ui-card memos-threadList">
          <div className="memos-panelHeader">
            <span>Threads</span>
            {!isAdminRole ? (
              <button
                className="memos-button memos-button--primary"
                onClick={() => setIsNewMemoOpen((open) => !open)}
              >
                {isNewMemoOpen ? 'Cancel' : 'New Memo'}
              </button>
            ) : null}
          </div>

          {isAdminRole ? (
            <div className="memos-adminFilter">
              <label className="memos-label">
                Ecosystem
                <select
                  value={selectedEcosystemId}
                  onChange={(event) => {
                    setSelectedEcosystemId(event.target.value);
                    setSelectedThread(null);
                  }}
                >
                  {ecosystems.map((ecosystem) => (
                    <option key={ecosystem.id} value={ecosystem.id}>
                      {ecosystem.name ? `${ecosystem.name} (${ecosystem.id})` : ecosystem.id}
                    </option>
                  ))}
                </select>
              </label>
              {ecosystemsLoading ? <p className="memos-muted">Loading ecosystems...</p> : null}
              {ecosystemsError ? <p className="memos-error">{ecosystemsError}</p> : null}
            </div>
          ) : isNewMemoOpen ? (
            <div className="memos-new">
              {memoRole === 'crew' ? (
                <label className="memos-label">
                  Send to
                  <select
                    value={newTargetRole}
                    onChange={(event) => setNewTargetRole(event.target.value as MemoRole)}
                  >
                    <option value="manager">Manager</option>
                    <option value="crew">Crew</option>
                  </select>
                </label>
              ) : (
                <label className="memos-label">
                  Send to
                  <select value="crew" disabled>
                    <option value="crew">Crew</option>
                  </select>
                </label>
              )}

              <label className="memos-label">
                {newTargetRole === 'manager' ? 'Manager ID' : 'Crew ID'}
                <input
                  value={newTargetId}
                  onChange={(event) => setNewTargetId(event.target.value)}
                  placeholder={newTargetRole === 'manager' ? 'MGR-001' : 'CRW-001'}
                />
              </label>

              <label className="memos-label">
                Message
                <textarea
                  rows={3}
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Write a memo to start this thread."
                />
              </label>

              {newMemoError ? <p className="memos-error">{newMemoError}</p> : null}

              <button
                className="memos-button memos-button--primary memos-button--full"
                onClick={() => void handleCreateMemo()}
                disabled={newMemoSending}
              >
                {newMemoSending ? 'Sending...' : 'Send Memo'}
              </button>
            </div>
          ) : null}

          {threadsLoading ? (
            <p className="memos-muted">Loading threads...</p>
          ) : threadsError ? (
            <p className="memos-error">{threadsError}</p>
          ) : threads.length === 0 ? (
            <p className="memos-muted">
              {isAdminRole ? 'No memos for this ecosystem yet.' : 'No memos yet. Start a new thread.'}
            </p>
          ) : (
            <div className="memos-threads">
              {threads.map((thread) => (
                <button
                  key={thread.threadId}
                  className={`memos-threadItem${thread.threadId === selectedThread?.threadId ? ' is-active' : ''}`}
                  onClick={() => setSelectedThread(thread)}
                >
                  <div className="memos-threadTitle">{threadPreviewLabel(thread)}</div>
                  <div className="memos-threadMeta">
                    <span>{thread.lastMessage ?? 'No messages yet'}</span>
                    <span>{formatTimestamp(thread.lastMessageAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="memos-panel ui-card memos-conversation">
          <div className="memos-panelHeader">
            <div>
              <div className="memos-threadTitle">{activeHeader}</div>
              {selectedThread ? (
                <div className="memos-muted">{formatTimestamp(selectedThread.lastMessageAt)}</div>
              ) : null}
            </div>
          </div>

          {messagesLoading ? (
            <p className="memos-muted">Loading messages...</p>
          ) : messagesError ? (
            <p className="memos-error">{messagesError}</p>
          ) : selectedThread ? (
            <div className="memos-messages">
              {messages.length === 0 ? (
                <p className="memos-muted">No messages yet. Send the first memo.</p>
              ) : (
                messages.map((message) => {
                  const isSelf = viewerId && message.senderId.toUpperCase() === viewerId.toUpperCase();
                  const otherLabel = selectedThread ? getParticipantLabel(selectedThread) : message.senderId;
                  return (
                    <div key={message.messageId} className={`memos-message${isSelf ? ' is-self' : ''}`}>
                      <div className="memos-messageMeta">
                        <span>{isSelf ? `You (${viewerId})` : otherLabel}</span>
                        <span>{formatTimestamp(message.createdAt)}</span>
                      </div>
                      <div className="memos-messageBody">{message.body}</div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <p className="memos-muted">Select a memo to view messages.</p>
          )}

          {selectedThread && !isAdminRole ? (
            <div className="memos-composer">
              <textarea
                rows={3}
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
                placeholder="Type your memo..."
              />
              {composerError ? <p className="memos-error">{composerError}</p> : null}
              <button
                className="memos-button memos-button--primary memos-button--full"
                onClick={() => void handleSendMessage()}
                disabled={composerSending}
              >
                {composerSending ? 'Sending...' : 'Send Memo'}
              </button>
            </div>
          ) : isAdminRole ? (
            <p className="memos-muted">Admin view is read-only.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
