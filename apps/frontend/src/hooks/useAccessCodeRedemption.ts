import { useCallback, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '@cks/auth';
import { redeemAccessCode } from '../shared/api/access';

export function useAccessCodeRedemption() {
  const { getToken } = useClerkAuth();
  const { refresh } = useAuth();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeem = useCallback(
    async (code: string) => {
      setIsRedeeming(true);
      setError(null);
      try {
        await redeemAccessCode({ code }, { getToken });
        await refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to redeem access code';
        setError(message);
        throw err;
      } finally {
        setIsRedeeming(false);
      }
    },
    [getToken, refresh],
  );

  return {
    redeem,
    isRedeeming,
    error,
  };
}
