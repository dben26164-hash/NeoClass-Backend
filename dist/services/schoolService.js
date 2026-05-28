"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchool = createSchool;
exports.getSchoolById = getSchoolById;
const prisma_1 = __importDefault(require("../prisma"));
async function createSchool(data) {
    return prisma_1.default.school.create({ data });
}
async function getSchoolById(id) {
    return prisma_1.default.school.findUnique({ where: { id } });
}
exports.default = { createSchool, getSchoolById };
