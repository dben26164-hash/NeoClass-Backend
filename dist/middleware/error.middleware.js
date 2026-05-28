"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    if (err && err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, details: err.details });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
}
exports.default = { errorHandler };
