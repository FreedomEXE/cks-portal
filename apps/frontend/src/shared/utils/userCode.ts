export function resolvedUserCode(cksCode: string | null | undefined, fallback: string | null | undefined): string | null {
  const code = typeof cksCode === 'string' ? cksCode.trim().toUpperCase() : null;
  const fb = typeof fallback === 'string' ? fallback.trim().toUpperCase() : null;
  return code && code.length ? code : fb;
}

