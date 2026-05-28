"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.getUserById = getUserById;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma_1 = __importDefault(require("../prisma"));
const client_1 = require("@prisma/client");
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
async function registerUser(input) {
    const existing = await prisma_1.default.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw new Error('Email already registered');
    }
    let school = await prisma_1.default.school.findUnique({ where: { id: input.schoolId } });
    if (!school) {
        school = await prisma_1.default.school.create({ data: { id: input.schoolId, name: `School ${input.schoolId}` } });
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const role = validateRole(input.role);
    const user = await prisma_1.default.user.create({
        data: {
            schoolId: school.id,
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            role
        }
    });
    const { passwordHash: _, ...safeUser } = user;
    const token = signToken(user.id);
    return { user: safeUser, token };
}
async function loginUser(email, password) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
    }
    const validPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!validPassword) {
        throw new Error('Invalid credentials');
    }
    const { passwordHash: _, ...safeUser } = user;
    const token = signToken(user.id);
    return { user: safeUser, token };
}
function signToken(userId) {
    return (0, jsonwebtoken_1.sign)({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    try {
        return (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
async function getUserById(id) {
    return prisma_1.default.user.findUnique({ where: { id } });
}
function validateRole(role) {
    if (!role)
        return client_1.UserRole.STUDENT;
    const normalized = role.toUpperCase();
    if (normalized === 'SCHOOL_ADMIN') {
        return normalized;
    }
    if (Object.values(client_1.UserRole).includes(normalized)) {
        return normalized;
    }
    return client_1.UserRole.STUDENT;
}
