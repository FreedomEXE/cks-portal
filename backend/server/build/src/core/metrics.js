"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequestDuration = void 0;
exports.metricsMiddleware = metricsMiddleware;
exports.metricsHandler = metricsHandler;
const prom_client_1 = __importDefault(require("prom-client"));
prom_client_1.default.collectDefaultMetrics();
exports.httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});
function metricsMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const diff = Number(process.hrtime.bigint() - start) / 1e9;
        exports.httpRequestDuration.labels(req.method, req.route?.path || req.path, String(res.statusCode)).observe(diff);
    });
    next();
}
function metricsHandler(_req, res) {
    res.set('Content-Type', prom_client_1.default.register.contentType);
    res.end(prom_client_1.default.register.metrics());
}
