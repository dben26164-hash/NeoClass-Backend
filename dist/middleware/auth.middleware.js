"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorizeRoles = authorizeRoles;
const authService = __importStar(require("../services/auth.service"));
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    const payload = authService.verifyToken(token);
    if (!payload || !payload.sub) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const user = await authService.getUserById(payload.sub);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
}
function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.role) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
