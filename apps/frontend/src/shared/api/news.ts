import useSWR from 'swr';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiFetch, type ApiResponse } from './client';

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  summary: string | null;
  scopeType: string;
  scopeId: string | null;
  targetRoles: string[] | null;
  createdByRole: string;
  createdById: string;
  createdAt: string;
  startsAt: string | null;
  expiresAt: string | null;
};

export type NewsCreatePayload = {
  title: string;
  body: string;
  summary?: string;
  scopeType: 'global' | 'ecosystem' | 'user';
  scopeId?: string;
  targetRoles?: string[];
  startsAt?: string;
  expiresAt?: string;
};

export function useNewsFeed() {
  const { getToken } = useClerkAuth();
  return useSWR('/news', (path) =>
    apiFetch<ApiResponse<NewsItem[]>>(path, { getToken }).then((res) => res.data ?? []),
  );
}

export async function createNews(payload: NewsCreatePayload, getToken?: () => Promise<string | null>) {
  const response = await apiFetch<ApiResponse<{ id: string }>>('/news', {
    method: 'POST',
    body: JSON.stringify(payload),
    getToken,
  });
  return response.data;
}

export async function dismissNews(id: string, getToken?: () => Promise<string | null>) {
  const response = await apiFetch<{ success: boolean }>(`/news/${encodeURIComponent(id)}/dismiss`, {
    method: 'POST',
    getToken,
  });
  return response;
}
