"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateCurriculumSync = initiateCurriculumSync;
exports.getSyncStatus = getSyncStatus;
const prisma_1 = __importDefault(require("../prisma"));
async function initiateCurriculumSync(curriculumId, schoolIds, syncedBy) {
    const curriculum = await prisma_1.default.curriculum.findUnique({ where: { id: curriculumId } });
    if (!curriculum) {
        throw new Error('Curriculum not found');
    }
    const uniqueSchoolIds = Array.from(new Set(schoolIds));
    const results = [];
    for (const schoolId of uniqueSchoolIds) {
        const school = await prisma_1.default.school.findUnique({ where: { id: schoolId } });
        if (!school) {
            throw new Error(`School not found: ${schoolId}`);
        }
        const sync = await prisma_1.default.curriculumSync.upsert({
            where: {
                curriculumId_schoolId: {
                    curriculumId,
                    schoolId
                }
            },
            update: {
                status: 'PENDING',
                syncedBy,
                syncedAt: null,
                errorMessage: null,
                attemptCount: 0,
                nextRetryAt: null
            },
            create: {
                curriculumId,
                schoolId,
                status: 'PENDING',
                syncedBy,
                metadata: { initiatedBy: syncedBy, timestamp: new Date().toISOString() }
            }
        });
        results.push(sync);
    }
    return results;
}
async function getSyncStatus(curriculumId) {
    return prisma_1.default.curriculumSync.findMany({
        where: { curriculumId },
        orderBy: { createdAt: 'desc' }
    });
}
