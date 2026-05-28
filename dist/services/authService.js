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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.getUserById = getUserById;
const prisma_1 = __importDefault(require("../prisma"));
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt = __importStar(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
async function registerUser({ schoolId, email, password, firstName, lastName, role }) {
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing)
        throw new Error('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: {
            schoolId,
            email,
            passwordHash,
            firstName,
            lastName,
            role: role ?? undefined
        }
    });
    const token = signToken(user.id);
    return { user, token };
}
async function loginUser(email, password) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
        throw new Error('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
        throw new Error('Invalid credentials');
    const token = signToken(user.id);
    return { user, token };
}
function signToken(userId) {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (e) {
        return null;
    }
}
async function getUserById(id) {
    return prisma_1.default.user.findUnique({ where: { id } });
}
exports.default = { registerUser, loginUser, signToken, verifyToken, getUserById };
