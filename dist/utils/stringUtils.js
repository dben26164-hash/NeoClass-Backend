"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
function slugify(value) {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036F]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}
