import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useCksAuth } from '@cks/auth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import {
  createNews,
  dismissNews,
  fetchNewsEcosystems,
  useNewsFeed,
  type NewsCreatePayload,
  type NewsEcosystem,
} from '../shared/api/news';
import './News.css';

const ROLE_OPTIONS = ['manager', 'crew', 'contractor', 'customer', 'center', 'warehouse', 'admin'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function News() {
  const navigate = useNavigate();
  const { role, code } = useCksAuth();
  const { getToken } = useClerkAuth();
  const normalizedRole = (role ?? '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrator';
  const isManager = normalizedRole === 'manager';

  const { data: items = [], mutate, isLoading } = useNewsFeed();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scopeType, setScopeType] = useState<'global' | 'ecosystem' | 'user'>(
    isAdmin ? 'global' : 'ecosystem'
  );
  const [scopeId, setScopeId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ecosystems, setEcosystems] = useState<NewsEcosystem[]>([]);
  const [ecosystemsLoading, setEcosystemsLoading] = useState(false);
  const [ecosystemsError, setEcosystemsError] = useState<string | null>(null);

  const canCreate = isAdmin || isManager;
  const viewerId = code ?? '';

  const scopeLabel = useMemo(() => {
    if (scopeType === 'global') {
      return 'All ecosystems';
    }
    if (scopeType === 'ecosystem') {
      return isManager ? `Ecosystem (${viewerId})` : 'Ecosystem ID';
    }
    return 'User ID';
  }, [isManager, scopeType, viewerId]);

  useEffect(() => {
    if (!canCreate || scopeType !== 'ecosystem') {
      return;
    }

    const loadEcosystems = async () => {
      setEcosystemsLoading(true);
      setEcosystemsError(null);
      try {
        const data = await fetchNewsEcosystems(getToken);
        setEcosystems(data);
        if (isAdmin && data.length > 0 && !scopeId) {
          setScopeId(data[0].id);
        }
      } catch (error) {
        setEcosystemsError('Unable to load ecosystems.');
      } finally {
        setEcosystemsLoading(false);
      }
    };

    void loadEcosystems();
  }, [canCreate, getToken, isAdmin, scopeId, scopeType]);

  const toggleRole = useCallback((value: string) => {
    setSelectedRoles((prev) =>
      prev.includes(value) ? prev.filter((role) => role !== value) : [...prev, value]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    if (!title.trim() || !body.trim()) {
      setFormError('Title and body are required.');
      return;
    }

    if (!isAdmin && scopeType === 'global') {
      setFormError('Managers can only post ecosystem or user updates.');
      return;
    }

    if (scopeType === 'user' && !scopeId.trim()) {
      setFormError('User ID is required for personalized updates.');
      return;
    }

    if (scopeType === 'ecosystem' && isAdmin && !scopeId.trim()) {
      setFormError('Ecosystem ID is required for ecosystem updates.');
      return;
    }

    const payload: NewsCreatePayload = {
      title: title.trim(),
      body: body.trim(),
      scopeType,
      scopeId: scopeType === 'global' ? undefined : scopeId.trim() || undefined,
      targetRoles: selectedRoles.length ? selectedRoles : undefined,
    };

    setSubmitting(true);
    try {
      await createNews(payload, getToken);
      setTitle('');
      setBody('');
      if (scopeType !== 'ecosystem' || isAdmin) {
        setScopeId('');
      }
      setSelectedRoles([]);
      await mutate();
    } catch (error) {
      setFormError('Failed to publish update. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [body, getToken, isAdmin, isManager, mutate, scopeId, scopeType, selectedRoles, title]);

  const handleDismiss = useCallback(
    async (id: string) => {
      await dismissNews(id, getToken);
      await mutate();
    },
    [getToken, mutate]
  );

  return (
    <div className="news-page">
      <div className="news-header">
        <div>
          <h2 className="news-title">News &amp; Updates</h2>
          <p className="news-subtitle">
            Product updates, onboarding tips, and ecosystem announcements.
          </p>
        </div>
        <button className="news-button news-button--ghost" onClick={() => navigate('/hub')}>
          Back to Hub
        </button>
      </div>

      {canCreate ? (
        <section className="ui-card news-panel news-create">
          <div className="news-panelHeader">Publish an update</div>
          <div className="news-form">
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Message
              <textarea
                rows={4}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>
            <label>
              Scope
              <select
                value={scopeType}
                onChange={(event) => setScopeType(event.target.value as 'global' | 'ecosystem' | 'user')}
              >
                {isAdmin ? <option value="global">Global</option> : null}
                <option value="ecosystem">Ecosystem</option>
                <option value="user">User</option>
              </select>
            </label>
            {scopeType !== 'global' ? (
              <label>
                {scopeLabel}
                {scopeType === 'ecosystem' && isAdmin ? (
                  <select value={scopeId} onChange={(event) => setScopeId(event.target.value)}>
                    {ecosystems.map((ecosystem) => (
                      <option key={ecosystem.id} value={ecosystem.id}>
                        {ecosystem.name ? `${ecosystem.name} (${ecosystem.id})` : ecosystem.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={isManager && scopeType === 'ecosystem' ? viewerId : scopeId}
                    onChange={(event) => setScopeId(event.target.value)}
                    disabled={isManager && scopeType === 'ecosystem'}
                    placeholder={scopeType === 'user' ? 'CKS ID (e.g., CEN-001)' : 'MGR-001'}
                  />
                )}
              </label>
            ) : null}
            {scopeType === 'ecosystem' && isAdmin ? (
              <>
                {ecosystemsLoading ? <p className="news-muted">Loading ecosystems...</p> : null}
                {ecosystemsError ? <p className="news-error">{ecosystemsError}</p> : null}
              </>
            ) : null}
            <div className="news-roles">
              <p>Show to roles (optional)</p>
              <div className="news-rolesGrid">
                {ROLE_OPTIONS.filter((value) => (isAdmin ? true : value !== 'admin')).map((value) => (
                  <label key={value} className="news-roleItem">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(value)}
                      onChange={() => toggleRole(value)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </div>
            {formError ? <p className="news-error">{formError}</p> : null}
            <button
              className="news-button news-button--primary"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? 'Publishing...' : 'Publish Update'}
            </button>
          </div>
        </section>
      ) : null}

      <section className="ui-card news-panel">
        <div className="news-panelHeader">Latest updates</div>
        {isLoading ? (
          <p className="news-muted">Loading updates...</p>
        ) : items.length === 0 ? (
          <p className="news-muted">No news to display yet.</p>
        ) : (
          <div className="news-list">
            {items.map((item) => (
              <article key={item.id} className="news-item">
                <div className="news-itemHeader">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="news-meta">
                      {formatDate(item.createdAt)} · {item.scopeType}
                    </p>
                  </div>
                  <button
                    className="news-button news-button--ghost"
                    onClick={() => void handleDismiss(item.id)}
                  >
                    Dismiss
                  </button>
                </div>
                <p className="news-body">{item.summary ?? item.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
