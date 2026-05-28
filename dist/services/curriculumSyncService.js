"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateSyncToCurriculum = initiateSyncToCurriculum;
exports.updateSyncStatus = updateSyncStatus;
exports.getSyncStatus = getSyncStatus;
exports.getSyncStatusForSchool = getSyncStatusForSchool;
exports.getSchoolCurriculumSyncs = getSchoolCurriculumSyncs;
exports.bulkUpdateSyncStatus = bulkUpdateSyncStatus;
exports.getPendingSyncs = getPendingSyncs;
exports.completeSyncForSchool = completeSyncForSchool;
exports.failSyncForSchool = failSyncForSchool;
exports.getSyncAuditTrail = getSyncAuditTrail;
const prisma_1 = __importDefault(require("../prisma"));
const client_1 = require("@prisma/client");
const curriculumVersionService_1 = __importDefault(require("./curriculumVersionService"));
/**
 * Initialize sync for curriculum to schools
 */
async function initiateSyncToCurriculum(input) {
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: input.curriculumId }
    });
    if (!curriculum.isPublished) {
        throw new Error('Cannot sync unpublished curriculum');
    }
    const version = input.version ||
        (await prisma_1.default.curriculumVersion.findFirst({
            where: { curriculumId: input.curriculumId, status: 'PUBLISHED' },
            orderBy: { version: 'desc' }
        }))?.version;
    if (!version) {
        throw new Error('No published version available for sync');
    }
    // Create or update sync records
    const syncRecords = await Promise.all(input.schoolIds.map(schoolId => prisma_1.default.curriculumSync.upsert({
        where: {
            curriculumId_schoolId: {
                curriculumId: input.curriculumId,
                schoolId
            }
        },
        update: {
            status: client_1.SyncStatus.PENDING,
            version
        },
        create: {
            curriculumId: input.curriculumId,
            schoolId,
            status: client_1.SyncStatus.PENDING,
            version
        }
    })));
    // Log the sync initiation
    await curriculumVersionService_1.default.logCurriculumAction(input.curriculumId, version, 'synced', input.syncedBy, `Sync initiated to ${input.schoolIds.length} school(s)`, { schoolIds: input.schoolIds });
    return syncRecords;
}
/**
 * Update sync status for a school
 */
async function updateSyncStatus(input) {
    const sync = await prisma_1.default.curriculumSync.findUniqueOrThrow({
        where: {
            curriculumId_schoolId: {
                curriculumId: input.curriculumId,
                schoolId: input.schoolId
            }
        }
    });
    return prisma_1.default.curriculumSync.update({
        where: { id: sync.id },
        data: {
            status: input.status,
            syncedAt: input.status === client_1.SyncStatus.SYNCED ? new Date() : sync.syncedAt,
            errorMessage: input.errorMessage,
            metadata: input.metadata
        }
    });
}
/**
 * Get sync status for a curriculum across schools
 */
async function getSyncStatus(curriculumId) {
    const syncs = await prisma_1.default.curriculumSync.findMany({
        where: { curriculumId },
        include: {
            school: { select: { id: true, name: true, code: true } },
            curriculum: { select: { id: true, name: true, level: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });
    const summary = {
        total: syncs.length,
        pending: syncs.filter(s => s.status === client_1.SyncStatus.PENDING).length,
        synced: syncs.filter(s => s.status === client_1.SyncStatus.SYNCED).length,
        failed: syncs.filter(s => s.status === client_1.SyncStatus.FAILED).length,
        partial: syncs.filter(s => s.status === client_1.SyncStatus.PARTIAL).length
    };
    return {
        summary,
        details: syncs
    };
}
/**
 * Get sync status for a specific school
 */
async function getSyncStatusForSchool(curriculumId, schoolId) {
    return prisma_1.default.curriculumSync.findUniqueOrThrow({
        where: {
            curriculumId_schoolId: {
                curriculumId,
                schoolId
            }
        },
        include: {
            school: true,
            curriculum: { include: { subjects: true } }
        }
    });
}
/**
 * Get all syncs for a school
 */
async function getSchoolCurriculumSyncs(schoolId, status) {
    return prisma_1.default.curriculumSync.findMany({
        where: {
            schoolId,
            ...(status && { status })
        },
        include: {
            curriculum: {
                select: {
                    id: true,
                    name: true,
                    level: true,
                    type: true,
                    country: true
                }
            }
        },
        orderBy: { syncedAt: 'desc' }
    });
}
/**
 * Bulk update sync status (e.g., mark all as failed if server error)
 */
async function bulkUpdateSyncStatus(curriculumId, status, errorMessage) {
    return prisma_1.default.curriculumSync.updateMany({
        where: { curriculumId },
        data: {
            status,
            errorMessage
        }
    });
}
/**
 * Get pending syncs (to be processed by a background job)
 */
async function getPendingSyncs(limit = 100) {
    return prisma_1.default.curriculumSync.findMany({
        where: { status: client_1.SyncStatus.PENDING },
        include: {
            curriculum: { select: { id: true, name: true, level: true } },
            school: { select: { id: true, name: true, code: true } }
        },
        orderBy: { createdAt: 'asc' },
        take: limit
    });
}
/**
 * Mark sync as completed
 */
async function completeSyncForSchool(curriculumId, schoolId, syncedBy) {
    return updateSyncStatus({
        curriculumId,
        schoolId,
        status: client_1.SyncStatus.SYNCED,
        metadata: { syncedBy, completedAt: new Date().toISOString() }
    });
}
/**
 * Mark sync as failed
 */
async function failSyncForSchool(curriculumId, schoolId, errorMessage) {
    return updateSyncStatus({
        curriculumId,
        schoolId,
        status: client_1.SyncStatus.FAILED,
        errorMessage
    });
}
/**
 * Get curriculum sync history/audit trail
 */
async function getSyncAuditTrail(curriculumId, schoolId) {
    return prisma_1.default.curriculumPublicationLog.findMany({
        where: {
            curriculumId,
            metadata: { path: ['schoolIds'], array_contains: [schoolId] }
        },
        orderBy: { createdAt: 'desc' }
    });
}
exports.default = {
    initiateSyncToCurriculum,
    updateSyncStatus,
    getSyncStatus,
    getSyncStatusForSchool,
    getSchoolCurriculumSyncs,
    bulkUpdateSyncStatus,
    getPendingSyncs,
    completeSyncForSchool,
    failSyncForSchool,
    getSyncAuditTrail
};
