"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const logger_1 = require("./logger");
class AppError extends Error {
    constructor(message, status = 500, expose = false) {
        super(message);
        this.status = status;
        this.expose = expose;
    }
}
exports.AppError = AppError;
function notFound(_req, res) {
    res.status(404).json({ error: 'Not Found' });
}
function errorHandler(err, _req, res, _next) {
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    if (status >= 500)
        logger_1.logger.error({ err }, 'Unhandled error');
    res.status(status).json({ error: err.expose ? err.message : status >= 500 ? 'Internal Server Error' : err.message });
}
