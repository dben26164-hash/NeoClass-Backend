"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStudent = createStudent;
exports.getStudentById = getStudentById;
const prisma_1 = __importDefault(require("../prisma"));
async function createStudent(data) {
    return prisma_1.default.student.create({ data: data });
}
async function getStudentById(id) {
    return prisma_1.default.student.findUnique({ where: { id } });
}
exports.default = { createStudent, getStudentById };
