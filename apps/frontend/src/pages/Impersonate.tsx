import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useClerk, useSignIn } from '@clerk/clerk-react';

const IMPERSONATION_TICKET_KEY = 'cks_impersonation_ticket';

export default function Impersonate(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const [message, setMessage] = useState('Preparing impersonation...');
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasRun.current) {
      return;
    }

    const ticketFromQuery = searchParams.get('ticket');
    if (ticketFromQuery) {
      sessionStorage.setItem(IMPERSONATION_TICKET_KEY, ticketFromQuery);
    }

    const ticket = ticketFromQuery || sessionStorage.getItem(IMPERSONATION_TICKET_KEY);
    if (!ticket) {
      setMessage('No impersonation ticket found.');
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

    signIn
      .create({ strategy: 'ticket', ticket })
      .then(async (result) => {
        if (result?.status !== 'complete') {
          setMessage('Impersonation requires additional verification.');
          return;
        }
        sessionStorage.removeItem(IMPERSONATION_TICKET_KEY);
        await setActive({ session: result.createdSessionId });
        navigate('/hub', { replace: true });
      })
      .catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : String(error);
        setMessage(`Impersonation failed: ${detail}`);
      });
  }, [isLoaded, isSignedIn, navigate, searchParams, setActive, signIn, signOut]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: 0, marginBottom: 8 }}>Impersonation</h2>
      <p style={{ margin: 0, color: '#4b5563' }}>{message}</p>
    </div>
  );
}
