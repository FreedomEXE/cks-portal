import { useCallback } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const SESSION_KEYS = ['role', 'code'];
const LOCAL_KEYS = ['userLoggedOut'];
const IMPERSONATION_KEYS = ['cks_impersonation_active', 'cks_impersonation_ticket', 'cks_impersonation_return', 'cks_impersonation_attempt'];

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
        SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
        IMPERSONATION_KEYS.forEach((key) => sessionStorage.removeItem(key));
        LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
      } catch {}

      navigate('/login', { replace: true });
    }
  }, [signOut, navigate]);
}

