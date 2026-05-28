"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCurriculums = listCurriculums;
exports.getCurriculumById = getCurriculumById;
exports.createCurriculum = createCurriculum;
exports.updateCurriculum = updateCurriculum;
const prisma_1 = __importDefault(require("../prisma"));
async function listCurriculums(schoolId) {
    return prisma_1.default.curriculum.findMany({
        where: {
            schoolId,
            deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
    });
}
async function getCurriculumById(id) {
    return prisma_1.default.curriculum.findUnique({
        where: { id },
        include: {
            versions: true,
            subjects: true
        }
    });
}
async function createCurriculum(data) {
    return prisma_1.default.curriculum.create({
        data: {
            schoolId: data.schoolId,
            name: data.name,
            level: data.level,
            code: data.code,
            country: data.country,
            type: data.type,
            description: data.description,
            gradeLevelId: data.gradeLevelId
        }
    });
}
async function updateCurriculum(id, updates) {
    return prisma_1.default.curriculum.update({
        where: { id },
        data: updates
    });
}
