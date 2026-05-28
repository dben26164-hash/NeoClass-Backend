/**
 * Service de gestion des retries de synchronisation
 * Responsabilités:
 * - Calculer les délais de retry
 * - Gérer les strategies de retry (EXPONENTIAL, LINEAR, IMMEDIATE)
 * - Logger les tentatives
 * - Eviter les boucles infinies
 */

import { prisma } from '../lib/prisma';
import { SyncRetryStrategy } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface CreateRetryInput {
  curriculumSyncId: string;
  attempt: number;
  strategy: SyncRetryStrategy;
  error: string;
  errorStack?: string;
}

/**
 * Calculer le délai de la prochaine tentative basé sur la stratégie
 */
export function calculateRetryDelay(attempt: number, strategy: SyncRetryStrategy): number {
  const baseDelaySeconds = 60; // 1 minute

  switch (strategy) {
    case SyncRetryStrategy.EXPONENTIAL:
      // 1min, 2min, 4min, 8min, 16min, 32min...
      return baseDelaySeconds * Math.pow(2, attempt - 1);
    
    case SyncRetryStrategy.LINEAR:
      // 1min, 2min, 3min, 4min, 5min...
      return baseDelaySeconds * attempt;
    
    case SyncRetryStrategy.IMMEDIATE:
      // Retry immédiatement (seulement 30 secondes)
      return 30;
    
    default:
      return baseDelaySeconds;
  }
}

/**
 * Créer un enregistrement de retry
 */
export async function createRetry(input: CreateRetryInput) {
  const { curriculumSyncId, attempt, strategy, error, errorStack } = input;

  // Vérifier que le sync existe
  const sync = await prisma.curriculumSync.findUnique({
    where: { id: curriculumSyncId }
  });

  if (!sync) {
    throw new AppError('Sync not found', 404);
  }

  // Vérifier qu'on n'a pas dépassé le maximum de tentatives
  if (attempt > sync.maxAttempts) {
    throw new AppError(`Max retry attempts (${sync.maxAttempts}) exceeded`, 400);
  }

  // Calculer le délai de retry
  const delaySeconds = calculateRetryDelay(attempt, strategy);
  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

  // Créer l'enregistrement de retry
  const retry = await prisma.curriculumSyncRetry.create({
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
  await prisma.curriculumSync.update({
    where: { id: curriculumSyncId },
    data: {
      attemptCount: attempt,
      nextRetryAt,
      errorMessage: error,
      metadata: {
        ...(sync.metadata as any),
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
export async function markRetryAsSuccess(retryId: string) {
  const retry = await prisma.curriculumSyncRetry.update({
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
export async function getRetries(curriculumSyncId: string, limit: number = 50) {
  return prisma.curriculumSyncRetry.findMany({
    where: { curriculumSyncId },
    orderBy: { attempt: 'desc' },
    take: limit
  });
}

/**
 * Obtenir les retries en attente (pour le worker)
 */
export async function getPendingRetries(limit: number = 100) {
  const now = new Date();

  return prisma.curriculumSyncRetry.findMany({
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
export async function getRetryStatus(retryId: string) {
  const retry = await prisma.curriculumSyncRetry.findUnique({
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
    throw new AppError('Retry not found', 404);
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
export async function resetRetries(curriculumSyncId: string) {
  const result = await prisma.curriculumSyncRetry.deleteMany({
    where: { curriculumSyncId }
  });

  // Aussi réinitialiser le sync lui-même
  await prisma.curriculumSync.update({
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
export async function getRetryStats(curriculumId: string) {
  const syncs = await prisma.curriculumSync.findMany({
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
    averageRetriesPerSync: 0 as number
  };

  stats.averageRetriesPerSync = stats.syncsWithRetries > 0 
    ? Math.round(stats.totalRetryAttempts / stats.syncsWithRetries * 100) / 100 
    : 0;

  return stats;
}

/**
 * Nettoyer les vieux retries (après 30 jours)
 */
export async function cleanupOldRetries(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.curriculumSyncRetry.deleteMany({
    where: {
      AND: [
        { success: true },  // Ne supprimer que les réussis
        { createdAt: { lt: cutoffDate } }
      ]
    }
  });

  return {
    deletedCount: result.count,
    cutoffDate
  };
}
