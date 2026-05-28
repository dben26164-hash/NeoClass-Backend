"use strict";
/**
 * Service de gestion des retries de synchronisation
 * Responsabilités:
 * - Calculer les délais de retry
 * - Gérer les strategies de retry (EXPONENTIAL, LINEAR, IMMEDIATE)
 * - Logger les tentatives
 * - Eviter les boucles infinies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRetryDelay = calculateRetryDelay;
exports.createRetry = createRetry;
exports.markRetryAsSuccess = markRetryAsSuccess;
exports.getRetries = getRetries;
exports.getPendingRetries = getPendingRetries;
exports.getRetryStatus = getRetryStatus;
exports.resetRetries = resetRetries;
exports.getRetryStats = getRetryStats;
exports.cleanupOldRetries = cleanupOldRetries;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Calculer le délai de la prochaine tentative basé sur la stratégie
 */
function calculateRetryDelay(attempt, strategy) {
    const baseDelaySeconds = 60; // 1 minute
    switch (strategy) {
        case client_1.SyncRetryStrategy.EXPONENTIAL:
            // 1min, 2min, 4min, 8min, 16min, 32min...
            return baseDelaySeconds * Math.pow(2, attempt - 1);
        case client_1.SyncRetryStrategy.LINEAR:
            // 1min, 2min, 3min, 4min, 5min...
            return baseDelaySeconds * attempt;
        case client_1.SyncRetryStrategy.IMMEDIATE:
            // Retry immédiatement (seulement 30 secondes)
            return 30;
        default:
            return baseDelaySeconds;
    }
}
/**
 * Créer un enregistrement de retry
 */
async function createRetry(input) {
    const { curriculumSyncId, attempt, strategy, error, errorStack } = input;
    // Vérifier que le sync existe
    const sync = await prisma_1.prisma.curriculumSync.findUnique({
        where: { id: curriculumSyncId }
    });
    if (!sync) {
        throw new errorHandler_1.AppError('Sync not found', 404);
    }
    // Vérifier qu'on n'a pas dépassé le maximum de tentatives
    if (attempt > sync.maxAttempts) {
        throw new errorHandler_1.AppError(`Max retry attempts (${sync.maxAttempts}) exceeded`, 400);
    }
    // Calculer le délai de retry
    const delaySeconds = calculateRetryDelay(attempt, strategy);
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
    // Créer l'enregistrement de retry
    const retry = await prisma_1.prisma.curriculumSyncRetry.create({
        data: {
            curriculumSyncId,
            attempt,
            strategy,
            error,
            errorStack,
            scheduledFor: nextRetryAt,
            success: false
        }
    });
    // Mettre à jour le sync avec les info de retry
    await prisma_1.prisma.curriculumSync.update({
        where: { id: curriculumSyncId },
        data: {
            attemptCount: attempt,
            nextRetryAt,
            errorMessage: error,
            metadata: {
                ...sync.metadata,
                lastRetryAt: new Date().toISOString(),
                nextRetryAt: nextRetryAt.toISOString(),
                totalAttempts: attempt
            }
        }
    });
    return {
        retry,
        nextRetryAt,
        delaySeconds,
        remainingAttempts: sync.maxAttempts - attempt
    };
}
/**
 * Marquer une tentative comme réussie
 */
async function markRetryAsSuccess(retryId) {
    const retry = await prisma_1.prisma.curriculumSyncRetry.update({
        where: { id: retryId },
        data: {
            success: true,
            executedAt: new Date()
        }
    });
    return retry;
}
/**
 * Obtenir les retries pour un sync
 */
async function getRetries(curriculumSyncId, limit = 50) {
    return prisma_1.prisma.curriculumSyncRetry.findMany({
        where: { curriculumSyncId },
        orderBy: { attempt: 'desc' },
        take: limit
    });
}
/**
 * Obtenir les retries en attente (pour le worker)
 */
async function getPendingRetries(limit = 100) {
    const now = new Date();
    return prisma_1.prisma.curriculumSyncRetry.findMany({
        where: {
            AND: [
                { success: false },
                { scheduledFor: { lte: now } }
            ]
        },
        include: {
            curriculumSync: {
                include: {
                    curriculum: true,
                    school: true
                }
            }
        },
        orderBy: { scheduledFor: 'asc' },
        take: limit
    });
}
/**
 * Obtenir le statut d'une tentative de retry
 */
async function getRetryStatus(retryId) {
    const retry = await prisma_1.prisma.curriculumSyncRetry.findUnique({
        where: { id: retryId },
        include: {
            curriculumSync: {
                include: {
                    curriculum: true,
                    school: true
                }
            }
        }
    });
    if (!retry) {
        throw new errorHandler_1.AppError('Retry not found', 404);
    }
    return {
        retry,
        isReadyForRetry: retry.scheduledFor <= new Date(),
        timeSinceScheduled: Date.now() - retry.scheduledFor.getTime(),
        status: retry.success ? 'completed' : 'pending'
    };
}
/**
 * Réinitialiser les retries pour un sync (après modification)
 */
async function resetRetries(curriculumSyncId) {
    const result = await prisma_1.prisma.curriculumSyncRetry.deleteMany({
        where: { curriculumSyncId }
    });
    // Aussi réinitialiser le sync lui-même
    await prisma_1.prisma.curriculumSync.update({
        where: { id: curriculumSyncId },
        data: {
            attemptCount: 0,
            nextRetryAt: new Date(),
            errorMessage: null
        }
    });
    return result;
}
/**
 * Obtenir les statistiques de retry pour un curriculum
 */
async function getRetryStats(curriculumId) {
    const syncs = await prisma_1.prisma.curriculumSync.findMany({
        where: { curriculumId },
        include: {
            retries: true
        }
    });
    const stats = {
        totalSyncs: syncs.length,
        syncsWithRetries: syncs.filter(s => s.retries.length > 0).length,
        totalRetryAttempts: syncs.reduce((sum, s) => sum + s.retries.length, 0),
        successfulRetries: syncs.reduce((sum, s) => sum + s.retries.filter(r => r.success).length, 0),
        failedRetries: syncs.reduce((sum, s) => sum + s.retries.filter(r => !r.success && s.attemptCount >= s.maxAttempts).length, 0),
        averageRetriesPerSync: 0
    };
    stats.averageRetriesPerSync = stats.syncsWithRetries > 0
        ? Math.round(stats.totalRetryAttempts / stats.syncsWithRetries * 100) / 100
        : 0;
    return stats;
}
/**
 * Nettoyer les vieux retries (après 30 jours)
 */
async function cleanupOldRetries(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma_1.prisma.curriculumSyncRetry.deleteMany({
        where: {
            AND: [
                { success: true }, // Ne supprimer que les réussis
                { createdAt: { lt: cutoffDate } }
            ]
        }
    });
    return {
        deletedCount: result.count,
        cutoffDate
    };
}
