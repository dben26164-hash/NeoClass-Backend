"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeacher = createTeacher;
exports.getTeacherById = getTeacherById;
const prisma_1 = __importDefault(require("../prisma"));
async function createTeacher(data) {
    return prisma_1.default.teacher.create({ data });
}
async function getTeacherById(id) {
    return prisma_1.default.teacher.findUnique({ where: { id } });
}
exports.default = { createTeacher, getTeacherById };
