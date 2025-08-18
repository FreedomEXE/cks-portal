/** CKS DEV: manager mocks for filming (no backend) */
export function mockResponse(data: unknown, status = 200, delayMs = 120) {
  return new Promise<Response>((res) =>
    setTimeout(() => res(new Response(JSON.stringify(data), {
      status, headers: { "Content-Type": "application/json" },
    })), delayMs)
  );
}

export function intercept(url: string): Promise<Response> | null {
  if (!import.meta.env.DEV) return null;

  // Normalize path
  try { const u = new URL(url, window.location.origin); url = u.pathname + (u.search || ""); } catch {}
  try { console.debug('[managerMocks] intercept', url); } catch {}

  // Broad match for /me/profile (handles /api/me/profile, query params, absolute URLs)
  if (url.includes("/me/profile") || url.includes("/api/me/profile") || /\/me\/?profile/.test(url)) {
    try { console.debug('[managerMocks] mock /me/profile (broad match)', url); } catch {}
    return mockResponse({ kind: 'manager', data: {
      manager_id: 'MGR-000',
      name: 'Manager Demo',
      email: 'mgr-000@ckscontracting.ca',
      phone: '555-0100',
      centers: 3, services: 12, jobsOpen: 5, reports: 2,
    }});
  }

  // Broad match for /news
  if (url.includes("/news") || url.includes("/api/news")) {
    try { console.debug('[managerMocks] mock /news', url); } catch {}
    return mockResponse({ items: [
      { id: "n1", title: "Service pricing model updated — review minimums" },
      { id: "n2", title: "Training schedules posted for Q3" },
      { id: "n3", title: "New supply SKUs added to warehouses" },
    ]});
  }
  return null;
}
