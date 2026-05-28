"use strict";
/**
 * Service de synchronisation automatique
 * Responsabilités:
 * - Gérer les syncs automatiques vers les écoles
 * - Orchestrer les retries
 * - Tracker le statut des syncs
 * - Logs complètes des updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateAutoSync = initiateAutoSync;
exports.getSyncStatus = getSyncStatus;
exports.updateSyncStatus = updateSyncStatus;
exports.completeSyncForSchool = completeSyncForSchool;
exports.getPendingRetries = getPendingRetries;
exports.getCurriculumSyncs = getCurriculumSyncs;
exports.getSchoolSyncs = getSchoolSyncs;
exports.getCurriculumSyncSummary = getCurriculumSyncSummary;
exports.resetFailedSyncs = resetFailedSyncs;
exports.getSyncHistory = getSyncHistory;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Initier une synchronisation automatique vers plusieurs écoles
 */
async function initiateAutoSync(input) {
    const { curriculumId, schoolIds, initiatedBy, maxConcurrent = 5 } = input;
    // Vérifier que le curriculum existe et est publié
    const curriculum = await prisma_1.prisma.curriculum.findUnique({
        where: { id: curriculumId },
        include: {
            syncSchedules: true,
            versions: true
        }
    });
    if (!curriculum) {
        throw new errorHandler_1.AppError('Curriculum not found', 404);
    }
    if (!curriculum.isPublished) {
        throw new errorHandler_1.AppError('Curriculum must be published before sync', 400);
    }
    const syncs = [];
    for (const schoolId of schoolIds) {
        try {
            // Vérifier que l'école existe
            const school = await prisma_1.prisma.school.findUnique({ where: { id: schoolId } });
            if (!school) {
                console.warn(`School ${schoolId} not found`);
                continue;
            }
            // Créer ou réinitialiser le sync
            const sync = await prisma_1.prisma.curriculumSync.upsert({
                where: { curriculumId_schoolId: { curriculumId, schoolId } },
                create: {
                    curriculumId,
                    schoolId,
                    status: client_1.SyncStatus.PENDING,
                    attemptCount: 0,
                    maxAttempts: 5,
                    nextRetryAt: new Date()
                },
                update: {
                    status: client_1.SyncStatus.PENDING,
                    attemptCount: 0,
                    nextRetryAt: new Date(),
                    errorMessage: null
                },
                include: { curriculum: true, school: true }
            });
            syncs.push(sync);
        }
        catch (error) {
            console.error(`Failed to create sync for school ${schoolId}:`, error);
        }
    }
    // Logger l'action
    await prisma_1.prisma.curriculumPublicationLog.create({
        data: {
            curriculumId,
            version: curriculum.versions?.length > 0 ? curriculum.versions[0].version : 1,
            action: 'auto_sync_initiated',
            publishedBy: initiatedBy,
            description: `Auto-sync initiated to ${syncs.length} schools`,
            metadata: {
                schoolIds,
                syncCount: syncs.length,
                maxConcurrent
            }
        }
    });
    return {
        totalScheduled: syncs.length,
        syncs,
        maxConcurrent,
        estimatedTime: `${Math.ceil(syncs.length / maxConcurrent) * 5} minutes`
    };
}
/**
 * Obtenir le statut actuel d'une synchronisation
 */
async function getSyncStatus(curriculumSyncId) {
    const sync = await prisma_1.prisma.curriculumSync.findUnique({
        where: { id: curriculumSyncId },
        include: {
            curriculum: true,
            school: true,
            retries: { orderBy: { attempt: 'desc' }, take: 5 },
            updateLogs: { orderBy: { appliedAt: 'desc' }, take: 10 }
        }
    });
    if (!sync) {
        throw new errorHandler_1.AppError('Sync not found', 404);
    }
    return sync;
}
/**
 * Mettre à jour le statut d'une synchronisation
 */
async function updateSyncStatus(input) {
    const { curriculumSyncId, status, error, errorStack, changes } = input;
    const sync = await prisma_1.prisma.curriculumSync.findUnique({
        where: { id: curriculumSyncId }
    });
    if (!sync) {
        throw new errorHandler_1.AppError('Sync not found', 404);
    }
    const updated = await prisma_1.prisma.curriculumSync.update({
        where: { id: curriculumSyncId },
        data: {
            status,
            errorMessage: error || null,
            syncedAt: status === client_1.SyncStatus.SYNCED ? new Date() : sync.syncedAt,
            lastAttemptAt: new Date(),
            metadata: {
                ...sync.metadata,
                lastStatus: sync.status,
                changes,
                lastUpdateAt: new Date().toISOString()
            }
        },
        include: {
            curriculum: true,
            school: true,
            retries: { orderBy: { attempt: 'desc' }, take: 3 }
        }
    });
    // Logger si erreur
    if (status === client_1.SyncStatus.FAILED && error) {
        await prisma_1.prisma.curriculumPublicationLog.create({
            data: {
                curriculumId: sync.curriculumId,
                version: sync.version || 1,
                action: 'sync_failed',
                publishedBy: 'system',
                description: `Sync failed for school ${sync.schoolId}: ${error}`,
                metadata: {
                    curriculumSyncId,
                    schoolId: sync.schoolId,
                    error,
                    errorStack
                }
            }
        });
    }
    return updated;
}
/**
 * Marquer une synchronisation comme réussie
 */
async function completeSyncForSchool(curriculumId, schoolId, completedBy) {
    const sync = await prisma_1.prisma.curriculumSync.findUnique({
        where: { curriculumId_schoolId: { curriculumId, schoolId } }
    });
    if (!sync) {
        throw new errorHandler_1.AppError('Sync not found', 404);
    }
    const updated = await updateSyncStatus({
        curriculumSyncId: sync.id,
        status: client_1.SyncStatus.SYNCED,
        changes: { completedBy, completedAt: new Date().toISOString() }
    });
    // Logger
    await prisma_1.prisma.curriculumPublicationLog.create({
        data: {
            curriculumId,
            version: sync.version || 1,
            action: 'sync_completed',
            publishedBy: completedBy,
            description: `Sync completed for school ${schoolId}`,
            metadata: { schoolId, syncId: sync.id }
        }
    });
    return updated;
}
/**
 * Obtenir les syncs en attente de retry
 * Utilisé par le worker de background
 */
async function getPendingRetries(limit = 100) {
    const now = new Date();
    return prisma_1.prisma.curriculumSync.findMany({
        where: {
            AND: [
                { status: { in: [client_1.SyncStatus.PENDING, client_1.SyncStatus.FAILED] } },
                { nextRetryAt: { lte: now } },
                { attemptCount: { lt: 5 } }
            ]
        },
        include: {
            curriculum: true,
            school: true,
            retries: { orderBy: { attempt: 'desc' }, take: 1 }
        },
        orderBy: { nextRetryAt: 'asc' },
        take: limit
    });
}
/**
 * Obtenir tous les syncs pour un curriculum
 */
async function getCurriculumSyncs(curriculumId, status, limit = 100) {
    return prisma_1.prisma.curriculumSync.findMany({
        where: {
            curriculumId,
            ...(status && { status })
        },
        include: {
            school: true,
            retries: { take: 1, orderBy: { attempt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}
/**
 * Obtenir les syncs pour une école
 */
async function getSchoolSyncs(schoolId, limit = 50) {
    return prisma_1.prisma.curriculumSync.findMany({
        where: { schoolId },
        include: {
            curriculum: true,
            retries: { take: 2, orderBy: { attempt: 'desc' } }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
    });
}
/**
 * Obtenir le statut global d'un curriculum
 * Agrégation des statuts de tous les syncs
 */
async function getCurriculumSyncSummary(curriculumId) {
    const syncs = await prisma_1.prisma.curriculumSync.findMany({
        where: { curriculumId },
        select: { status: true }
    });
    const summary = {
        total: syncs.length,
        pending: syncs.filter(s => s.status === client_1.SyncStatus.PENDING).length,
        syncing: syncs.filter(s => s.status === client_1.SyncStatus.SYNCING).length,
        synced: syncs.filter(s => s.status === client_1.SyncStatus.SYNCED).length,
        failed: syncs.filter(s => s.status === client_1.SyncStatus.FAILED).length,
        partial: syncs.filter(s => s.status === client_1.SyncStatus.PARTIAL).length,
        successRate: syncs.length > 0 ? (syncs.filter(s => s.status === client_1.SyncStatus.SYNCED).length / syncs.length) * 100 : 0
    };
    return summary;
}
/**
 * Réinitialiser les syncs échoués d'un curriculum
 */
async function resetFailedSyncs(curriculumId) {
    const result = await prisma_1.prisma.curriculumSync.updateMany({
        where: {
            curriculumId,
            status: client_1.SyncStatus.FAILED
        },
        data: {
            status: client_1.SyncStatus.PENDING,
            attemptCount: 0,
            nextRetryAt: new Date(),
            errorMessage: null
        }
    });
    // Logger
    await prisma_1.prisma.curriculumPublicationLog.create({
        data: {
            curriculumId,
            version: 1,
            action: 'failed_syncs_reset',
            publishedBy: 'system',
            description: `${result.count} failed syncs reset to PENDING`,
            metadata: { count: result.count }
        }
    });
    return result;
}
/**
 * Obtenir l'historique complet d'un sync
 */
async function getSyncHistory(curriculumSyncId) {
    const sync = await prisma_1.prisma.curriculumSync.findUnique({
        where: { id: curriculumSyncId },
        include: {
            curriculum: true,
            school: true,
            retries: { orderBy: { attempt: 'asc' } },
            updateLogs: { orderBy: { appliedAt: 'asc' } }
        }
    });
    if (!sync) {
        throw new errorHandler_1.AppError('Sync not found', 404);
    }
    // Récupérer aussi les logs de publication
    const logs = await prisma_1.prisma.curriculumPublicationLog.findMany({
        where: {
            curriculumId: sync.curriculumId,
            action: { in: ['sync_completed', 'sync_failed', 'auto_sync_initiated'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    return {
        sync,
        retries: sync.retries,
        updateLogs: sync.updateLogs,
        publicationLogs: logs
    };
}
