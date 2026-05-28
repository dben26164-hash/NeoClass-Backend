"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
class AppError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message, details: err.details });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
}
exports.default = { AppError, errorHandler };
