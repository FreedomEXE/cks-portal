import { apiFetch } from './client';

export interface CertifiedService {
  serviceId: string;
  name: string;
  category: string | null;
  status: string;
  updatedAt: string | null;
  certifiedAt: string | null;
  renewalDate: string | null;
}

export interface CertifiedServicesResponse {
  data: CertifiedService[];
}

export async function getCertifiedServices(
  userId: string,
  role: 'manager' | 'contractor' | 'crew' | 'warehouse',
  limit?: number
): Promise<CertifiedServicesResponse> {
  const params = new URLSearchParams();
  params.set('userId', userId);
  params.set('role', role);
  if (limit) {
    params.set('limit', limit.toString());
  }

  return apiFetch<CertifiedServicesResponse>(`/certified-services?${params.toString()}`);
}
