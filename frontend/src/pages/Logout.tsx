import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export default function Logout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    let done = false;
    async function run() {
      try {
        if (typeof signOut === 'function') {
          await signOut({ redirectUrl: '/login' });
          done = true;
          return;
        }
      } catch {}
      try {
        // Dev fallback: clear any local storage hints and go to /login
        localStorage.removeItem('me:lastRole');
        localStorage.removeItem('me:lastCode');
        localStorage.removeItem('dev:signedOut');
      } catch {}
      if (!done) navigate('/login', { replace: true });
    }
    run();
  }, [navigate, signOut]);

  return (
    <div style={{ padding: 24 }}>Signing out…</div>
  );
}
