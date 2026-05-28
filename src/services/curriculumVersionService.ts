import prisma from '../prisma';
import { VersionStatus } from '@prisma/client';

export interface CreateVersionInput {
  curriculumId: string;
  name?: string;
  description?: string;
  changelog?: string;
  metadata?: Record<string, any>;
}

export interface PublishVersionInput {
  curriculumId: string;
  version: number;
  publishedBy: string;
}

/**
 * Create a new draft version of a curriculum
 */
export async function createDraftVersion(input: CreateVersionInput) {
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
    where: { id: input.curriculumId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
  });

  const nextVersion = (curriculum.versions[0]?.version || 0) + 1;

  return prisma.curriculumVersion.create({
    data: {
      curriculumId: input.curriculumId,
      version: nextVersion,
      status: VersionStatus.DRAFT,
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
export async function publishVersion(input: PublishVersionInput) {
  const version = await prisma.curriculumVersion.findUniqueOrThrow({
    where: {
      curriculumId_version: {
        curriculumId: input.curriculumId,
        version: input.version
      }
    }
  });

  // Archive all other versions
  await prisma.curriculumVersion.updateMany({
    where: {
      curriculumId: input.curriculumId,
      version: { not: input.version }
    },
    data: { status: VersionStatus.ARCHIVED }
  });

  // Publish this version
  const published = await prisma.curriculumVersion.update({
    where: { id: version.id },
    data: {
      status: VersionStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedBy: input.publishedBy
    }
  });

  // Update curriculum
  await prisma.curriculum.update({
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
export async function getVersionHistory(curriculumId: string) {
  return prisma.curriculumVersion.findMany({
    where: { curriculumId },
    orderBy: { version: 'desc' },
    include: { curriculum: { select: { name: true, level: true } } }
  });
}

/**
 * Get specific curriculum version details
 */
export async function getVersionDetails(curriculumId: string, version: number) {
  const versionRecord = await prisma.curriculumVersion.findUniqueOrThrow({
    where: {
      curriculumId_version: {
        curriculumId,
        version
      }
    }
  });

  // Get curriculum content for this version
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
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
    syncStatus: await prisma.curriculumSync.findMany({
      where: { curriculumId, version },
      select: { schoolId: true, status: true, syncedAt: true, errorMessage: true }
    })
  };
}

/**
 * Log curriculum publication/sync actions
 */
export async function logCurriculumAction(
  curriculumId: string,
  version: number,
  action: string,
  publishedBy: string,
  description?: string,
  metadata?: Record<string, any>
) {
  return prisma.curriculumPublicationLog.create({
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
export async function getCurriculumActionLog(curriculumId: string, limit = 50) {
  return prisma.curriculumPublicationLog.findMany({
    where: { curriculumId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Archive a curriculum version
 */
export async function archiveVersion(curriculumId: string, version: number) {
  return prisma.curriculumVersion.update({
    where: {
      curriculumId_version: {
        curriculumId,
        version
      }
    },
    data: { status: VersionStatus.ARCHIVED }
  });
}

/**
 * Soft delete a curriculum
 */
export async function softDeleteCurriculum(curriculumId: string) {
  return prisma.curriculum.update({
    where: { id: curriculumId },
    data: { deletedAt: new Date() }
  });
}

/**
 * Restore a soft deleted curriculum
 */
export async function restoreCurriculum(curriculumId: string) {
  return prisma.curriculum.update({
    where: { id: curriculumId },
    data: { deletedAt: null }
  });
}

export default {
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
