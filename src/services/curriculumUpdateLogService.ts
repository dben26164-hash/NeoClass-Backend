/**
 * Service de logging des mises à jour lors du sync
 * Responsabilités:
 * - Tracer chaque changement appliqué au curriculum d'une école
 * - Supporter l'audit trail complet
 * - Aider au rollback et à la résolution de problèmes
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

interface CreateUpdateLogInput {
  curriculumSyncId: string;
  changeType: 'ADD' | 'UPDATE' | 'DELETE' | 'REORDER';
  entityType: string;  // SUBJECT, CHAPTER, LESSON, EXERCISE, QUIZ, etc.
  entityId: string;
  oldValue?: any;
  newValue?: any;
  appliedBy?: string;
}

/**
 * Créer un log de mise à jour
 */
export async function createUpdateLog(input: CreateUpdateLogInput) {
  const { curriculumSyncId, changeType, entityType, entityId, oldValue, newValue, appliedBy } = input;

  // Vérifier que le sync existe
  const sync = await prisma.curriculumSync.findUnique({
    where: { id: curriculumSyncId }
  });

  if (!sync) {
    throw new AppError('Sync not found', 404);
  }

  const log = await prisma.curriculumUpdateLog.create({
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
export async function createUpdateLogsBatch(
  curriculumSyncId: string,
  updates: Omit<CreateUpdateLogInput, 'curriculumSyncId'>[]
) {
  const sync = await prisma.curriculumSync.findUnique({
    where: { id: curriculumSyncId }
  });

  if (!sync) {
    throw new AppError('Sync not found', 404);
  }

  const logs = await Promise.all(
    updates.map(update =>
      prisma.curriculumUpdateLog.create({
        data: {
          curriculumSyncId,
          ...update,
          appliedBy: update.appliedBy || 'system',
          metadata: {
            batchCreated: true,
            appliedAt: new Date().toISOString()
          }
        }
      })
    )
  );

  return logs;
}

/**
 * Obtenir tous les logs de mise à jour pour un sync
 */
export async function getUpdateLogs(
  curriculumSyncId: string,
  filters?: {
    changeType?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
  }
) {
  const { changeType, entityType, limit = 100, offset = 0 } = filters || {};

  const where: any = { curriculumSyncId };
  if (changeType) where.changeType = changeType;
  if (entityType) where.entityType = entityType;

  const [logs, total] = await Promise.all([
    prisma.curriculumUpdateLog.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.curriculumUpdateLog.count({ where })
  ]);

  return { logs, total, limit, offset };
}

/**
 * Obtenir le résumé des changements pour un sync
 */
export async function getUpdateSummary(curriculumSyncId: string) {
  const logs = await prisma.curriculumUpdateLog.findMany({
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
    byEntityType: {} as Record<string, number>,
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
export async function getEntityUpdateHistory(
  curriculumSyncId: string,
  entityId: string
) {
  return prisma.curriculumUpdateLog.findMany({
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
export async function getUpdatesByChangeType(
  curriculumSyncId: string,
  changeType: 'ADD' | 'UPDATE' | 'DELETE' | 'REORDER'
) {
  return prisma.curriculumUpdateLog.findMany({
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
export async function getUpdatesByEntityType(
  curriculumSyncId: string,
  entityType: string
) {
  return prisma.curriculumUpdateLog.findMany({
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
export async function getCurriculumUpdateHistory(
  curriculumId: string,
  limit: number = 500
) {
  const syncs = await prisma.curriculumSync.findMany({
    where: { curriculumId },
    select: { id: true }
  });

  const syncIds = syncs.map(s => s.id);

  return prisma.curriculumUpdateLog.findMany({
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
export async function generateChangelogText(curriculumSyncId: string): Promise<string> {
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
export async function cleanupOldLogs(daysOld: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.curriculumUpdateLog.deleteMany({
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
export async function exportSyncLogs(
  curriculumSyncId: string,
  format: 'json' | 'csv' = 'json'
) {
  const logs = await prisma.curriculumUpdateLog.findMany({
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

  throw new AppError('Unsupported format', 400);
}
