import { useCallback } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { clearImpersonation } from '@cks/auth';

const SESSION_KEYS = ['role', 'code', 'impersonate', 'impersonate:firstName', 'impersonate:displayName'];
const LOCAL_KEYS = ['userLoggedOut'];

export function useLogout() {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error during sign out', err);
    } finally {
      try {
        clearImpersonation();
        SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
        LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
      } catch {}

      navigate('/login', { replace: true });
    }
  }, [signOut, navigate]);
}

