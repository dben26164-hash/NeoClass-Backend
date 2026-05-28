"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
exports.createUser = createUser;
const prisma_1 = __importDefault(require("../prisma"));
async function getUserByEmail(email) {
    return prisma_1.default.user.findUnique({ where: { email } });
}
async function getUserById(id) {
    return prisma_1.default.user.findUnique({ where: { id } });
}
async function createUser(data) {
    return prisma_1.default.user.create({ data: data });
}
exports.default = { getUserByEmail, getUserById, createUser };
