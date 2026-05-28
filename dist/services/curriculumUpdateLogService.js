"use strict";
/**
 * Service de logging des mises à jour lors du sync
 * Responsabilités:
 * - Tracer chaque changement appliqué au curriculum d'une école
 * - Supporter l'audit trail complet
 * - Aider au rollback et à la résolution de problèmes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateLog = createUpdateLog;
exports.createUpdateLogsBatch = createUpdateLogsBatch;
exports.getUpdateLogs = getUpdateLogs;
exports.getUpdateSummary = getUpdateSummary;
exports.getEntityUpdateHistory = getEntityUpdateHistory;
exports.getUpdatesByChangeType = getUpdatesByChangeType;
exports.getUpdatesByEntityType = getUpdatesByEntityType;
exports.getCurriculumUpdateHistory = getCurriculumUpdateHistory;
exports.generateChangelogText = generateChangelogText;
exports.cleanupOldLogs = cleanupOldLogs;
exports.exportSyncLogs = exportSyncLogs;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Créer un log de mise à jour
 */
async function createUpdateLog(input) {
    const { curriculumSyncId, changeType, entityType, entityId, oldValue, newValue, appliedBy } = input;
    // Vérifier que le sync existe
    const sync = await prisma_1.prisma.curriculumSync.findUnique({
        where: { id: curriculumSyncId }
    });
    if (!sync) {
        throw new errorHandler_1.AppError('Sync not found', 404);
    }
    const log = await prisma_1.prisma.curriculumUpdateLog.create({
        data: {
            curriculumSyncId,
            changeType,
            entityType,
            entityId,
            oldValue,
            newValue,
            appliedBy: appliedBy || 'system',
            metadata: {
                syncStatus: sync.status,
                appliedAt: new Date().toISOString()
            }
        }
    });
    return log;
}
/**
 * Créer plusieurs logs en batch
 */
async function createUpdateLogsBatch(curriculumSyncId, updates) {
    const sync = await prisma_1.prisma.curriculumSync.findUnique({
        where: { id: curriculumSyncId }
    });
    if (!sync) {
        throw new errorHandler_1.AppError('Sync not found', 404);
    }
    const logs = await Promise.all(updates.map(update => prisma_1.prisma.curriculumUpdateLog.create({
        data: {
            curriculumSyncId,
            ...update,
            appliedBy: update.appliedBy || 'system',
            metadata: {
                batchCreated: true,
                appliedAt: new Date().toISOString()
            }
        }
    })));
    return logs;
}
/**
 * Obtenir tous les logs de mise à jour pour un sync
 */
async function getUpdateLogs(curriculumSyncId, filters) {
    const { changeType, entityType, limit = 100, offset = 0 } = filters || {};
    const where = { curriculumSyncId };
    if (changeType)
        where.changeType = changeType;
    if (entityType)
        where.entityType = entityType;
    const [logs, total] = await Promise.all([
        prisma_1.prisma.curriculumUpdateLog.findMany({
            where,
            orderBy: { appliedAt: 'desc' },
            take: limit,
            skip: offset
        }),
        prisma_1.prisma.curriculumUpdateLog.count({ where })
    ]);
    return { logs, total, limit, offset };
}
/**
 * Obtenir le résumé des changements pour un sync
 */
async function getUpdateSummary(curriculumSyncId) {
    const logs = await prisma_1.prisma.curriculumUpdateLog.findMany({
        where: { curriculumSyncId }
    });
    const summary = {
        total: logs.length,
        byChangeType: {
            add: logs.filter(l => l.changeType === 'ADD').length,
            update: logs.filter(l => l.changeType === 'UPDATE').length,
            delete: logs.filter(l => l.changeType === 'DELETE').length,
            reorder: logs.filter(l => l.changeType === 'REORDER').length
        },
        byEntityType: {},
        details: logs
    };
    // Compter par type d'entité
    logs.forEach(log => {
        summary.byEntityType[log.entityType] = (summary.byEntityType[log.entityType] || 0) + 1;
    });
    return summary;
}
/**
 * Obtenir les logs de mise à jour pour une entité spécifique
 */
async function getEntityUpdateHistory(curriculumSyncId, entityId) {
    return prisma_1.prisma.curriculumUpdateLog.findMany({
        where: {
            curriculumSyncId,
            entityId
        },
        orderBy: { appliedAt: 'asc' }
    });
}
/**
 * Obtenir les logs par type de changement
 */
async function getUpdatesByChangeType(curriculumSyncId, changeType) {
    return prisma_1.prisma.curriculumUpdateLog.findMany({
        where: {
            curriculumSyncId,
            changeType
        },
        orderBy: { appliedAt: 'desc' }
    });
}
/**
 * Obtenir les logs par type d'entité
 */
async function getUpdatesByEntityType(curriculumSyncId, entityType) {
    return prisma_1.prisma.curriculumUpdateLog.findMany({
        where: {
            curriculumSyncId,
            entityType
        },
        orderBy: { appliedAt: 'desc' }
    });
}
/**
 * Obtenir les logs de tous les syncs d'un curriculum
 */
async function getCurriculumUpdateHistory(curriculumId, limit = 500) {
    const syncs = await prisma_1.prisma.curriculumSync.findMany({
        where: { curriculumId },
        select: { id: true }
    });
    const syncIds = syncs.map(s => s.id);
    return prisma_1.prisma.curriculumUpdateLog.findMany({
        where: {
            curriculumSyncId: { in: syncIds }
        },
        orderBy: { appliedAt: 'desc' },
        take: limit,
        include: {
            curriculumSync: {
                select: {
                    schoolId: true,
                    status: true
                }
            }
        }
    });
}
/**
 * Générer un changelog en format texte
 */
async function generateChangelogText(curriculumSyncId) {
    const summary = await getUpdateSummary(curriculumSyncId);
    const logs = summary.details;
    let changelog = `Changelog for Sync ${curriculumSyncId.substring(0, 8)}...\n`;
    changelog += `Total Changes: ${summary.total}\n\n`;
    // Par type de changement
    changelog += `By Change Type:\n`;
    changelog += `  - ADD: ${summary.byChangeType.add}\n`;
    changelog += `  - UPDATE: ${summary.byChangeType.update}\n`;
    changelog += `  - DELETE: ${summary.byChangeType.delete}\n`;
    changelog += `  - REORDER: ${summary.byChangeType.reorder}\n\n`;
    // Par type d'entité
    changelog += `By Entity Type:\n`;
    Object.entries(summary.byEntityType).forEach(([type, count]) => {
        changelog += `  - ${type}: ${count}\n`;
    });
    // Détails des changements
    changelog += `\nDetailed Changes:\n`;
    logs.slice(0, 20).forEach(log => {
        changelog += `  [${log.changeType}] ${log.entityType} (${log.entityId})\n`;
        if (log.oldValue && log.newValue) {
            changelog += `    From: ${JSON.stringify(log.oldValue).substring(0, 50)}...\n`;
            changelog += `    To: ${JSON.stringify(log.newValue).substring(0, 50)}...\n`;
        }
    });
    if (logs.length > 20) {
        changelog += `  ... and ${logs.length - 20} more changes\n`;
    }
    return changelog;
}
/**
 * Nettoyer les vieux logs (après 90 jours)
 */
async function cleanupOldLogs(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma_1.prisma.curriculumUpdateLog.deleteMany({
        where: {
            appliedAt: { lt: cutoffDate }
        }
    });
    return {
        deletedCount: result.count,
        cutoffDate
    };
}
/**
 * Exporter tous les logs d'un sync en JSON
 */
async function exportSyncLogs(curriculumSyncId, format = 'json') {
    const logs = await prisma_1.prisma.curriculumUpdateLog.findMany({
        where: { curriculumSyncId },
        orderBy: { appliedAt: 'asc' }
    });
    if (format === 'json') {
        return JSON.stringify(logs, null, 2);
    }
    // CSV format
    if (format === 'csv') {
        let csv = 'appliedAt,changeType,entityType,entityId,oldValue,newValue,appliedBy\n';
        logs.forEach(log => {
            csv += `"${log.appliedAt.toISOString()}","${log.changeType}","${log.entityType}","${log.entityId}"`;
            csv += `,"${JSON.stringify(log.oldValue || '')}","${JSON.stringify(log.newValue || '')}"`;
            csv += `,"${log.appliedBy}"\n`;
        });
        return csv;
    }
    throw new errorHandler_1.AppError('Unsupported format', 400);
}
