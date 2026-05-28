"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorizeRoles = authorizeRoles;
const authService_1 = __importDefault(require("../services/authService"));
async function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice('Bearer '.length);
    const payload = authService_1.default.verifyToken(token);
    if (!payload || !payload.sub)
        return res.status(401).json({ error: 'Invalid token' });
    // attach user id to request
    req.userId = payload.sub;
    const user = await authService_1.default.getUserById(payload.sub);
    req.user = user;
    next();
}
function authorizeRoles(allowed) {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!allowed.includes(user.role))
            return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}
exports.default = { authenticate, authorizeRoles };
