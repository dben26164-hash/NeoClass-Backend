"use strict";
/**
 * Types TypeScript pour le système de synchronisation automatique
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryError = exports.PublicationError = exports.SyncError = void 0;
// ==================== ERROR TYPES ====================
class SyncError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'SyncError';
    }
}
exports.SyncError = SyncError;
class PublicationError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'PublicationError';
    }
}
exports.PublicationError = PublicationError;
class RetryError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'RetryError';
    }
}
exports.RetryError = RetryError;
