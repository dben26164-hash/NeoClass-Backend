/**
 * Service de synchronisation automatique
 * Responsabilités:
 * - Gérer les syncs automatiques vers les écoles
 * - Orchestrer les retries
 * - Tracker le statut des syncs
 * - Logs complètes des updates
 */

import { prisma } from '../lib/prisma';
import { SyncStatus, SyncRetryStrategy } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface InitiateSyncInput {
  curriculumId: string;
  schoolIds: string[];
  initiatedBy: string;
  maxConcurrent?: number;
}

interface UpdateSyncStatusInput {
  curriculumSyncId: string;
  status: SyncStatus;
  error?: string;
  errorStack?: string;
  changes?: any;
}

/**
 * Initier une synchronisation automatique vers plusieurs écoles
 */
export async function initiateAutoSync(input: InitiateSyncInput) {
  const { curriculumId, schoolIds, initiatedBy, maxConcurrent = 5 } = input;

  // Vérifier que le curriculum existe et est publié
  const curriculum = await prisma.curriculum.findUnique({
    where: { id: curriculumId },
    include: {
      syncSchedules: true,
      versions: true
    }
  });

  if (!curriculum) {
    throw new AppError('Curriculum not found', 404);
  }

  if (!curriculum.isPublished) {
    throw new AppError('Curriculum must be published before sync', 400);
  }

  const syncs = [];
  
  for (const schoolId of schoolIds) {
    try {
      // Vérifier que l'école existe
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) {
        console.warn(`School ${schoolId} not found`);
        continue;
      }

      // Créer ou réinitialiser le sync
      const sync = await prisma.curriculumSync.upsert({
        where: { curriculumId_schoolId: { curriculumId, schoolId } },
        create: {
          curriculumId,
          schoolId,
          status: SyncStatus.PENDING,
          attemptCount: 0,
          maxAttempts: 5,
          nextRetryAt: new Date()
        },
        update: {
          status: SyncStatus.PENDING,
          attemptCount: 0,
          nextRetryAt: new Date(),
          errorMessage: null
        },
        include: { curriculum: true, school: true }
      });

      syncs.push(sync);
    } catch (error) {
      console.error(`Failed to create sync for school ${schoolId}:`, error);
    }
  }

  // Logger l'action
  await prisma.curriculumPublicationLog.create({
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
export async function getSyncStatus(curriculumSyncId: string) {
  const sync = await prisma.curriculumSync.findUnique({
    where: { id: curriculumSyncId },
    include: {
      curriculum: true,
      school: true,
      retries: { orderBy: { attempt: 'desc' }, take: 5 },
      updateLogs: { orderBy: { appliedAt: 'desc' }, take: 10 }
    }
  });

  if (!sync) {
    throw new AppError('Sync not found', 404);
  }

  return sync;
}

/**
 * Mettre à jour le statut d'une synchronisation
 */
export async function updateSyncStatus(input: UpdateSyncStatusInput) {
  const { curriculumSyncId, status, error, errorStack, changes } = input;

  const sync = await prisma.curriculumSync.findUnique({
    where: { id: curriculumSyncId }
  });

  if (!sync) {
    throw new AppError('Sync not found', 404);
  }

  const updated = await prisma.curriculumSync.update({
    where: { id: curriculumSyncId },
    data: {
      status,
      errorMessage: error || null,
      syncedAt: status === SyncStatus.SYNCED ? new Date() : sync.syncedAt,
      lastAttemptAt: new Date(),
      metadata: {
        ...(sync.metadata as any),
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
  if (status === SyncStatus.FAILED && error) {
    await prisma.curriculumPublicationLog.create({
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
export async function completeSyncForSchool(
  curriculumId: string,
  schoolId: string,
  completedBy: string
) {
  const sync = await prisma.curriculumSync.findUnique({
    where: { curriculumId_schoolId: { curriculumId, schoolId } }
  });

  if (!sync) {
    throw new AppError('Sync not found', 404);
  }

  const updated = await updateSyncStatus({
    curriculumSyncId: sync.id,
    status: SyncStatus.SYNCED,
    changes: { completedBy, completedAt: new Date().toISOString() }
  });

  // Logger
  await prisma.curriculumPublicationLog.create({
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
export async function getPendingRetries(limit: number = 100) {
  const now = new Date();

  return prisma.curriculumSync.findMany({
    where: {
      AND: [
        { status: { in: [SyncStatus.PENDING, SyncStatus.FAILED] } },
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
export async function getCurriculumSyncs(
  curriculumId: string,
  status?: SyncStatus,
  limit: number = 100
) {
  return prisma.curriculumSync.findMany({
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
export async function getSchoolSyncs(schoolId: string, limit: number = 50) {
  return prisma.curriculumSync.findMany({
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
export async function getCurriculumSyncSummary(curriculumId: string) {
  const syncs = await prisma.curriculumSync.findMany({
    where: { curriculumId },
    select: { status: true }
  });

  const summary = {
    total: syncs.length,
    pending: syncs.filter(s => s.status === SyncStatus.PENDING).length,
    syncing: syncs.filter(s => s.status === SyncStatus.SYNCING).length,
    synced: syncs.filter(s => s.status === SyncStatus.SYNCED).length,
    failed: syncs.filter(s => s.status === SyncStatus.FAILED).length,
    partial: syncs.filter(s => s.status === SyncStatus.PARTIAL).length,
    successRate: syncs.length > 0 ? (syncs.filter(s => s.status === SyncStatus.SYNCED).length / syncs.length) * 100 : 0
  };

  return summary;
}

/**
 * Réinitialiser les syncs échoués d'un curriculum
 */
export async function resetFailedSyncs(curriculumId: string) {
  const result = await prisma.curriculumSync.updateMany({
    where: {
      curriculumId,
      status: SyncStatus.FAILED
    },
    data: {
      status: SyncStatus.PENDING,
      attemptCount: 0,
      nextRetryAt: new Date(),
      errorMessage: null
    }
  });

  // Logger
  await prisma.curriculumPublicationLog.create({
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
export async function getSyncHistory(curriculumSyncId: string) {
  const sync = await prisma.curriculumSync.findUnique({
    where: { id: curriculumSyncId },
    include: {
      curriculum: true,
      school: true,
      retries: { orderBy: { attempt: 'asc' } },
      updateLogs: { orderBy: { appliedAt: 'asc' } }
    }
  });

  if (!sync) {
    throw new AppError('Sync not found', 404);
  }

  // Récupérer aussi les logs de publication
  const logs = await prisma.curriculumPublicationLog.findMany({
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
