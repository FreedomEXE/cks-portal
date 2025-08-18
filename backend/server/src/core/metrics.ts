/**
 * File: core/metrics.ts
 *
 * Descriptio:
 *   Prometheus metrics instrumentation utilities.
 * Functionality:
 *   Registers default metrics; exports histogram and middleware to observe HTTP request durations; exposes handler to serve metrics text.
 * Importance:
 *   Enables performance visibility and alerting integration via Prometheus scraping.
 * Conections:
 *   Mounted in Express app (/metrics) and can be adapted for Fastify plugin usage.
 * Notes:
 *   Extend with custom business metrics (e.g., profile views) as analytics matures.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import client from 'prom-client';

client.collectDefaultMetrics();

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

export function metricsMiddleware(req: any, res: any, next: any) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const diff = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, String(res.statusCode)).observe(diff);
  });
  next();
}

export function metricsHandler(_req: any, res: any) {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
}
