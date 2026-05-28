"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDraftVersion = createDraftVersion;
exports.publishVersion = publishVersion;
exports.getVersionHistory = getVersionHistory;
exports.getVersionDetails = getVersionDetails;
exports.logCurriculumAction = logCurriculumAction;
exports.getCurriculumActionLog = getCurriculumActionLog;
exports.archiveVersion = archiveVersion;
exports.softDeleteCurriculum = softDeleteCurriculum;
exports.restoreCurriculum = restoreCurriculum;
const prisma_1 = __importDefault(require("../prisma"));
const client_1 = require("@prisma/client");
/**
 * Create a new draft version of a curriculum
 */
async function createDraftVersion(input) {
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: input.curriculumId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
    });
    const nextVersion = (curriculum.versions[0]?.version || 0) + 1;
    return prisma_1.default.curriculumVersion.create({
        data: {
            curriculumId: input.curriculumId,
            version: nextVersion,
            status: client_1.VersionStatus.DRAFT,
            name: input.name || `Version ${nextVersion}`,
            description: input.description,
            changelog: input.changelog,
            metadata: input.metadata
        }
    });
}
/**
 * Publish a curriculum version
 */
async function publishVersion(input) {
    const version = await prisma_1.default.curriculumVersion.findUniqueOrThrow({
        where: {
            curriculumId_version: {
                curriculumId: input.curriculumId,
                version: input.version
            }
        }
    });
    // Archive all other versions
    await prisma_1.default.curriculumVersion.updateMany({
        where: {
            curriculumId: input.curriculumId,
            version: { not: input.version }
        },
        data: { status: client_1.VersionStatus.ARCHIVED }
    });
    // Publish this version
    const published = await prisma_1.default.curriculumVersion.update({
        where: { id: version.id },
        data: {
            status: client_1.VersionStatus.PUBLISHED,
            publishedAt: new Date(),
            publishedBy: input.publishedBy
        }
    });
    // Update curriculum
    await prisma_1.default.curriculum.update({
        where: { id: input.curriculumId },
        data: {
            isPublished: true,
            publishedAt: new Date(),
            versions: { connect: { id: version.id } }
        }
    });
    // Log the publication
    await logCurriculumAction(input.curriculumId, input.version, 'published', input.publishedBy);
    return published;
}
/**
 * Get curriculum version history
 */
async function getVersionHistory(curriculumId) {
    return prisma_1.default.curriculumVersion.findMany({
        where: { curriculumId },
        orderBy: { version: 'desc' },
        include: { curriculum: { select: { name: true, level: true } } }
    });
}
/**
 * Get specific curriculum version details
 */
async function getVersionDetails(curriculumId, version) {
    const versionRecord = await prisma_1.default.curriculumVersion.findUniqueOrThrow({
        where: {
            curriculumId_version: {
                curriculumId,
                version
            }
        }
    });
    // Get curriculum content for this version
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: curriculumId },
        include: {
            subjects: {
                include: {
                    chapters: {
                        include: {
                            lessons: {
                                include: {
                                    learningObjectives: true,
                                    lessonContents: true,
                                    exercises: true,
                                    quizzes: { include: { questions: true } }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    return {
        version: versionRecord,
        curriculum,
        syncStatus: await prisma_1.default.curriculumSync.findMany({
            where: { curriculumId, version },
            select: { schoolId: true, status: true, syncedAt: true, errorMessage: true }
        })
    };
}
/**
 * Log curriculum publication/sync actions
 */
async function logCurriculumAction(curriculumId, version, action, publishedBy, description, metadata) {
    return prisma_1.default.curriculumPublicationLog.create({
        data: {
            curriculumId,
            version,
            action,
            publishedBy,
            description,
            metadata
        }
    });
}
/**
 * Get curriculum action log
 */
async function getCurriculumActionLog(curriculumId, limit = 50) {
    return prisma_1.default.curriculumPublicationLog.findMany({
        where: { curriculumId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}
/**
 * Archive a curriculum version
 */
async function archiveVersion(curriculumId, version) {
    return prisma_1.default.curriculumVersion.update({
        where: {
            curriculumId_version: {
                curriculumId,
                version
            }
        },
        data: { status: client_1.VersionStatus.ARCHIVED }
    });
}
/**
 * Soft delete a curriculum
 */
async function softDeleteCurriculum(curriculumId) {
    return prisma_1.default.curriculum.update({
        where: { id: curriculumId },
        data: { deletedAt: new Date() }
    });
}
/**
 * Restore a soft deleted curriculum
 */
async function restoreCurriculum(curriculumId) {
    return prisma_1.default.curriculum.update({
        where: { id: curriculumId },
        data: { deletedAt: null }
    });
}
exports.default = {
    createDraftVersion,
    publishVersion,
    getVersionHistory,
    getVersionDetails,
    logCurriculumAction,
    getCurriculumActionLog,
    archiveVersion,
    softDeleteCurriculum,
    restoreCurriculum
};
