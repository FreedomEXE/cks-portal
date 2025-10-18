import useSWR from 'swr';
import { getCertifiedServices, type CertifiedService } from '../shared/api/services';

export function useCertifiedServices(
  userId: string | null | undefined,
  role: 'manager' | 'contractor' | 'crew' | 'warehouse',
  limit?: number
) {
  const key = userId ? `/certified-services?userId=${userId}&role=${role}&limit=${limit || 250}` : null;

  const fetcher = () => {
    if (!userId) return Promise.resolve({ data: [] });
    return getCertifiedServices(userId, role, limit);
  };

  const { data, error, isLoading, mutate } = useSWR<{ data: CertifiedService[] }>(key, fetcher);

  return {
    data: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
