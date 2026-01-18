import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useClerk, useSignIn } from '@clerk/clerk-react';

const IMPERSONATION_TICKET_KEY = 'cks_impersonation_ticket';
const IMPERSONATION_ACTIVE_KEY = 'cks_impersonation_active';
const IMPERSONATION_ATTEMPT_KEY = 'cks_impersonation_attempt';

export default function Impersonate(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const [message, setMessage] = useState('Preparing impersonation...');
  const [showReturn, setShowReturn] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasRun.current) {
      return;
    }

    try {
      sessionStorage.removeItem(IMPERSONATION_TICKET_KEY);
      sessionStorage.removeItem(IMPERSONATION_ACTIVE_KEY);
    } catch {}

    const ticketFromQuery = searchParams.get('ticket');
    if (ticketFromQuery) {
      sessionStorage.setItem(IMPERSONATION_TICKET_KEY, ticketFromQuery);
    }

    const ticket = ticketFromQuery || sessionStorage.getItem(IMPERSONATION_TICKET_KEY);
    if (!ticket) {
      setMessage('No impersonation ticket found.');
      setShowReturn(true);
      return;
    }

    if (sessionStorage.getItem(IMPERSONATION_ATTEMPT_KEY) === ticket) {
      setMessage('Impersonation token already used. Please return to admin and try again.');
      setShowReturn(true);
      return;
    }

    if (isSignedIn) {
      hasRun.current = true;
      setMessage('Signing out to continue impersonation...');
      signOut({ redirectUrl: `/impersonate?ticket=${encodeURIComponent(ticket)}` });
      return;
    }

    hasRun.current = true;
    setMessage('Signing in as target user...');

    sessionStorage.setItem(IMPERSONATION_ATTEMPT_KEY, ticket);
    signIn
      .create({ strategy: 'ticket', ticket })
      .then(async (result) => {
        if (result?.status !== 'complete') {
          setMessage('Impersonation requires additional verification.');
          setShowReturn(true);
          return;
        }
        sessionStorage.removeItem(IMPERSONATION_TICKET_KEY);
        sessionStorage.removeItem(IMPERSONATION_ATTEMPT_KEY);
        sessionStorage.setItem(IMPERSONATION_ACTIVE_KEY, 'true');
        setShowReturn(false);
        await setActive({ session: result.createdSessionId });
        navigate('/hub', { replace: true });
      })
      .catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : String(error);
        if (detail.toLowerCase().includes('token has already been used')) {
          sessionStorage.removeItem(IMPERSONATION_TICKET_KEY);
          sessionStorage.removeItem(IMPERSONATION_ACTIVE_KEY);
          sessionStorage.removeItem(IMPERSONATION_ATTEMPT_KEY);
          setMessage('Impersonation token already used. Please return to admin and try again.');
          setShowReturn(true);
          return;
        }
        setMessage(`Impersonation failed: ${detail}`);
        setShowReturn(true);
      });
  }, [isLoaded, isSignedIn, navigate, searchParams, setActive, signIn, signOut]);

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2 style={{ margin: 0, marginBottom: 8 }}>Impersonation</h2>
      <p style={{ margin: 0, color: '#4b5563' }}>{message}</p>
      {showReturn ? (
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem(IMPERSONATION_TICKET_KEY);
              sessionStorage.removeItem(IMPERSONATION_ACTIVE_KEY);
              sessionStorage.removeItem(IMPERSONATION_ATTEMPT_KEY);
            } catch {}
            navigate('/login', { replace: true });
          }}
          style={{
            marginTop: 16,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#111827',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Return to Admin
        </button>
      ) : null}
    </div>
  );
}
