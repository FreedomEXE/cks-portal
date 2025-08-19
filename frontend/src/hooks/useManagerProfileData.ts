import useMeProfile from './useMeProfile';

type ManagerData = { manager_id?: string; code?: string; name?: string } | null;

export default function useManagerProfileData() {
  const { loading, error, kind, data, refetch } = useMeProfile() as any;

  // Normalize to minimal manager shape
  const isManager = (kind || '').toLowerCase() === 'manager';
  const managerData: ManagerData = isManager ? {
    manager_id: data?.manager_id || data?.id || data?.code || undefined,
    code: data?.code || data?.manager_id || undefined,
    name: data?.name || data?.manager_name || undefined,
  } : null;

  return { loading, error, kind, data: managerData, refetch } as const;
}
