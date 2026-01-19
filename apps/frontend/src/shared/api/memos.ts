import { apiFetch } from './client';

export type MemoParticipant = {
  id: string;
  role: 'crew' | 'manager';
  name: string | null;
};

export type MemoThread = {
  threadId: string;
  threadType: string;
  lastMessageAt: string | null;
  lastMessage: string | null;
  participant: MemoParticipant;
  participants?: MemoParticipant[];
  ecosystemManagerId?: string | null;
};

export type MemoMessage = {
  messageId: string;
  senderId: string;
  senderRole: 'crew' | 'manager';
  body: string;
  createdAt: string;
};

export type MemoEcosystem = {
  id: string;
  name: string | null;
};

type MemoThreadsResponse = {
  data: MemoThread[];
};

type MemoMessagesResponse = {
  data: MemoMessage[];
};

type MemoThreadCreateResponse = {
  data: {
    threadId: string;
  };
};

type MemoMessageCreateResponse = {
  data: {
    messageId: string;
    createdAt: string;
  };
};

export async function fetchMemoThreads(getToken?: () => Promise<string | null>) {
  const response = await apiFetch<MemoThreadsResponse>('/memos/threads', { getToken });
  return response.data ?? [];
}

export async function fetchMemoMessages(
  threadId: string,
  options: { limit?: number; before?: string } = {},
  getToken?: () => Promise<string | null>
) {
  const params = new URLSearchParams();
  if (options.limit) {
    params.set('limit', String(options.limit));
  }
  if (options.before) {
    params.set('before', options.before);
  }
  const query = params.toString();
  const path = query ? `/memos/threads/${encodeURIComponent(threadId)}/messages?${query}` : `/memos/threads/${encodeURIComponent(threadId)}/messages`;
  const response = await apiFetch<MemoMessagesResponse>(path, { getToken });
  return response.data ?? [];
}

export async function createMemoThread(
  payload: { targetId: string; targetRole: 'crew' | 'manager' },
  getToken?: () => Promise<string | null>
) {
  const response = await apiFetch<MemoThreadCreateResponse>('/memos/threads', {
    method: 'POST',
    body: JSON.stringify(payload),
    getToken,
  });
  return response.data;
}

export async function sendMemoMessage(
  payload: { threadId: string; body: string },
  getToken?: () => Promise<string | null>
) {
  const response = await apiFetch<MemoMessageCreateResponse>('/memos/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
    getToken,
  });
  return response.data;
}

export async function fetchAdminMemoEcosystems(getToken?: () => Promise<string | null>) {
  const response = await apiFetch<{ data: MemoEcosystem[] }>('/admin/memos/ecosystems', { getToken });
  return response.data ?? [];
}

export async function fetchAdminMemoThreads(
  managerId: string,
  getToken?: () => Promise<string | null>
) {
  const response = await apiFetch<{ data: MemoThread[] }>(
    `/admin/memos/threads?managerId=${encodeURIComponent(managerId)}`,
    { getToken }
  );
  return response.data ?? [];
}

export async function fetchAdminMemoMessages(
  threadId: string,
  options: { limit?: number; before?: string } = {},
  getToken?: () => Promise<string | null>
) {
  const params = new URLSearchParams();
  if (options.limit) {
    params.set('limit', String(options.limit));
  }
  if (options.before) {
    params.set('before', options.before);
  }
  const query = params.toString();
  const path = query
    ? `/admin/memos/threads/${encodeURIComponent(threadId)}/messages?${query}`
    : `/admin/memos/threads/${encodeURIComponent(threadId)}/messages`;
  const response = await apiFetch<{ data: MemoMessage[] }>(path, { getToken });
  return response.data ?? [];
}
