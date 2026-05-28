import prisma from '../prisma';
import { SyncStatus } from '@prisma/client';
import curriculumVersionService from './curriculumVersionService';

export interface SyncToCurriculumInput {
  curriculumId: string;
  schoolIds: string[];
  version?: number;
  syncedBy: string;
}

export interface UpdateSyncStatusInput {
  curriculumId: string;
  schoolId: string;
  status: SyncStatus;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Initialize sync for curriculum to schools
 */
export async function initiateSyncToCurriculum(input: SyncToCurriculumInput) {
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
    where: { id: input.curriculumId }
  });

  if (!curriculum.isPublished) {
    throw new Error('Cannot sync unpublished curriculum');
  }

  const version =
    input.version ||
    (
      await prisma.curriculumVersion.findFirst({
        where: { curriculumId: input.curriculumId, status: 'PUBLISHED' },
        orderBy: { version: 'desc' }
      })
    )?.version;

  if (!version) {
    throw new Error('No published version available for sync');
  }

  // Create or update sync records
  const syncRecords = await Promise.all(
    input.schoolIds.map(schoolId =>
      prisma.curriculumSync.upsert({
        where: {
          curriculumId_schoolId: {
            curriculumId: input.curriculumId,
            schoolId
          }
        },
        update: {
          status: SyncStatus.PENDING,
          version
        },
        create: {
          curriculumId: input.curriculumId,
          schoolId,
          status: SyncStatus.PENDING,
          version
        }
      })
    )
  );

  // Log the sync initiation
  await curriculumVersionService.logCurriculumAction(
    input.curriculumId,
    version,
    'synced',
    input.syncedBy,
    `Sync initiated to ${input.schoolIds.length} school(s)`,
    { schoolIds: input.schoolIds }
  );

  return syncRecords;
}

/**
 * Update sync status for a school
 */
export async function updateSyncStatus(input: UpdateSyncStatusInput) {
  const sync = await prisma.curriculumSync.findUniqueOrThrow({
    where: {
      curriculumId_schoolId: {
        curriculumId: input.curriculumId,
        schoolId: input.schoolId
      }
    }
  });

  return prisma.curriculumSync.update({
    where: { id: sync.id },
    data: {
      status: input.status,
      syncedAt: input.status === SyncStatus.SYNCED ? new Date() : sync.syncedAt,
      errorMessage: input.errorMessage,
      metadata: input.metadata
    }
  });
}

/**
 * Get sync status for a curriculum across schools
 */
export async function getSyncStatus(curriculumId: string) {
  const syncs = await prisma.curriculumSync.findMany({
    where: { curriculumId },
    include: {
      school: { select: { id: true, name: true, code: true } },
      curriculum: { select: { id: true, name: true, level: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const summary = {
    total: syncs.length,
    pending: syncs.filter(s => s.status === SyncStatus.PENDING).length,
    synced: syncs.filter(s => s.status === SyncStatus.SYNCED).length,
    failed: syncs.filter(s => s.status === SyncStatus.FAILED).length,
    partial: syncs.filter(s => s.status === SyncStatus.PARTIAL).length
  };

  return {
    summary,
    details: syncs
  };
}

/**
 * Get sync status for a specific school
 */
export async function getSyncStatusForSchool(curriculumId: string, schoolId: string) {
  return prisma.curriculumSync.findUniqueOrThrow({
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
export async function getSchoolCurriculumSyncs(schoolId: string, status?: SyncStatus) {
  return prisma.curriculumSync.findMany({
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
export async function bulkUpdateSyncStatus(
  curriculumId: string,
  status: SyncStatus,
  errorMessage?: string
) {
  return prisma.curriculumSync.updateMany({
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
export async function getPendingSyncs(limit = 100) {
  return prisma.curriculumSync.findMany({
    where: { status: SyncStatus.PENDING },
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
export async function completeSyncForSchool(
  curriculumId: string,
  schoolId: string,
  syncedBy?: string
) {
  return updateSyncStatus({
    curriculumId,
    schoolId,
    status: SyncStatus.SYNCED,
    metadata: { syncedBy, completedAt: new Date().toISOString() }
  });
}

/**
 * Mark sync as failed
 */
export async function failSyncForSchool(
  curriculumId: string,
  schoolId: string,
  errorMessage: string
) {
  return updateSyncStatus({
    curriculumId,
    schoolId,
    status: SyncStatus.FAILED,
    errorMessage
  });
}

/**
 * Get curriculum sync history/audit trail
 */
export async function getSyncAuditTrail(curriculumId: string, schoolId: string) {
  return prisma.curriculumPublicationLog.findMany({
    where: {
      curriculumId,
      metadata: { path: ['schoolIds'], array_contains: [schoolId] }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export default {
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
