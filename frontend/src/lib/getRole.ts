export function getRole(user: any, headers?: Record<string, string | null | undefined>) {
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') return raw.toLowerCase();
  // Allow header fallback (x-user-role)
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr) return String(hdr).toLowerCase();
  try { console.debug('[getRole debug]', { from: 'getRole', role: null, raw }); } catch {}
  return null;
}

export default getRole;
