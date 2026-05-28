/**
 * Service de gestion des publications de curriculum master
 * Responsabilités:
 * - Créer et gérer les publications
 * - Workflow: DRAFT → REVIEWING → APPROVED → PUBLISHED
 * - Historique complet des publications
 * - Déclencher les syncs automatiques
 */

import { prisma } from '../lib/prisma';
import { PublicationStatus, CurriculumType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface CreatePublicationInput {
  curriculumId: string;
  versionId: string;
  title: string;
  description?: string;
  changesSummary?: string;
  publishedBy: string;  // Super Admin user ID
  targetSchools?: string[];  // null = all schools
}

interface ReviewPublicationInput {
  publicationId: string;
  reviewedBy: string;
  approved: boolean;
  comments?: string;
}

/**
 * Créer une nouvelle publication (DRAFT)
 */
export async function createPublication(input: CreatePublicationInput) {
  const { curriculumId, versionId, title, description, changesSummary, publishedBy, targetSchools } = input;

  // Vérifier que le curriculum existe et est de type NATIONAL ou QURANIC
  const curriculum = await prisma.curriculum.findUnique({
    where: { id: curriculumId },
    include: { versions: { where: { id: versionId } } }
  });

  if (!curriculum) {
    throw new AppError('Curriculum not found', 404);
  }

  if (curriculum.versions.length === 0) {
    throw new AppError('Version not found', 404);
  }

  // Seuls les curriculums NATIONAL et QURANIC peuvent être publiés au niveau master
  if (curriculum.type !== CurriculumType.NATIONAL && curriculum.type !== CurriculumType.QURANIC) {
    throw new AppError('Only NATIONAL and QURANIC curriculums can be published as master', 400);
  }

  // Vérifier qu'il n'existe pas déjà une publication pour cette version
  const existingPub = await prisma.curriculumPublication.findUnique({
    where: {
      curriculumId_versionId: { curriculumId, versionId }
    }
  });

  if (existingPub) {
    throw new AppError('Publication already exists for this version', 409);
  }

  // Créer la publication en DRAFT
  const publication = await prisma.curriculumPublication.create({
    data: {
      curriculumId,
      versionId,
      status: PublicationStatus.DRAFT,
      title,
      description,
      changesSummary,
      publishedBy,
      metadata: {
        targetSchools: targetSchools || null,  // null = toutes les écoles
        createdBy: publishedBy,
        createdAt: new Date().toISOString()
      }
    },
    include: {
      curriculum: true,
      version: true
    }
  });

  // Logger l'action
  await prisma.curriculumPublicationLog.create({
    data: {
      curriculumId,
      version: curriculum.versions[0].version,
      action: 'publication_created',
      publishedBy,
      description: `Publication créée en DRAFT: "${title}"`,
      metadata: { publicationId: publication.id }
    }
  });

  return publication;
}

/**
 * Soumettre une publication pour review
 */
export async function submitForReview(publicationId: string, submittedBy: string) {
  const publication = await prisma.curriculumPublication.findUnique({
    where: { id: publicationId }
  });

  if (!publication) {
    throw new AppError('Publication not found', 404);
  }

  if (publication.status !== PublicationStatus.DRAFT) {
    throw new AppError(`Cannot submit for review. Current status: ${publication.status}`, 400);
  }

  const updated = await prisma.curriculumPublication.update({
    where: { id: publicationId },
    data: {
      status: PublicationStatus.REVIEWING,
      metadata: {
        ...(publication.metadata as any),
        submittedBy,
        submittedAt: new Date().toISOString()
      }
    },
    include: { curriculum: true, version: true }
  });

  // Logger
  await prisma.curriculumPublicationLog.create({
    data: {
      curriculumId: publication.curriculumId,
      version: updated.version?.version ?? 0,
      action: 'publication_submitted_for_review',
      publishedBy: submittedBy,
      description: `Publication soumise pour review`,
      metadata: { publicationId }
    }
  });

  return updated;
}

/**
 * Approuver ou rejeter une publication
 */
export async function reviewPublication(input: ReviewPublicationInput) {
  const { publicationId, reviewedBy, approved, comments } = input;

  const publication = await prisma.curriculumPublication.findUnique({
    where: { id: publicationId },
    include: { version: true }
  });

  if (!publication) {
    throw new AppError('Publication not found', 404);
  }

  if (publication.status !== PublicationStatus.REVIEWING) {
    throw new AppError(`Cannot review. Current status: ${publication.status}`, 400);
  }

  const newStatus = approved ? PublicationStatus.APPROVED : PublicationStatus.REJECTED;

  const updated = await prisma.curriculumPublication.update({
    where: { id: publicationId },
    data: {
      status: newStatus,
      reviewedBy,
      reviewedAt: new Date(),
      reviewComments: comments,
      metadata: {
        ...(publication.metadata as any),
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        approved
      }
    },
    include: { curriculum: true, version: true }
  });

  // Logger
  await prisma.curriculumPublicationLog.create({
    data: {
      curriculumId: publication.curriculumId,
      version: publication.version?.version ?? 0,
      action: approved ? 'publication_approved' : 'publication_rejected',
      publishedBy: reviewedBy,
      description: approved ? 'Publication approuvée' : `Publication rejetée: ${comments}`,
      metadata: { publicationId, approved }
    }
  });

  return updated;
}

/**
 * Publier une publication approuvée
 * Cela déclenche automatiquement les syncs
 */
export async function publishPublication(
  publicationId: string,
  publishedBy: string,
  shouldAutoSync: boolean = true
) {
  const publication = await prisma.curriculumPublication.findUnique({
    where: { id: publicationId },
    include: {
      curriculum: { include: { syncs: true } },
      version: true
    }
  });

  if (!publication) {
    throw new AppError('Publication not found', 404);
  }

  if (publication.status !== PublicationStatus.APPROVED) {
    throw new AppError(`Cannot publish. Current status: ${publication.status}`, 400);
  }

  const updated = await prisma.curriculumPublication.update({
    where: { id: publicationId },
    data: {
      status: PublicationStatus.PUBLISHED,
      publishedBy,
      publishedAt: new Date(),
      metadata: {
        ...(publication.metadata as any),
        publishedBy,
        publishedAt: new Date().toISOString()
      }
    },
    include: { curriculum: true, version: true }
  });

  // Logger
  await prisma.curriculumPublicationLog.create({
    data: {
      curriculumId: publication.curriculumId,
      version: publication.version?.version ?? 0,
      action: 'publication_published',
      publishedBy,
      description: `Publication publiée - Syncs déclenchés automatiquement`,
      metadata: { publicationId, autoSync: shouldAutoSync }
    }
  });

  // Déclencher les syncs automatiques si configuré
  if (shouldAutoSync) {
    const targetSchools = (publication.metadata as any)?.targetSchools;
    
    // Si targetSchools est null, syncer vers toutes les écoles
    let syncTargets = [];
    if (!targetSchools) {
      const allSchools = await prisma.school.findMany({ select: { id: true } });
      syncTargets = allSchools.map(s => s.id);
    } else {
      syncTargets = targetSchools;
    }

    // Créer les syncs
    await initiateAutoSync(publication.curriculum.id, syncTargets, publishedBy);
  }

  return updated;
}

/**
 * Initier les syncs automatiques après publication
 * @internal
 */
async function initiateAutoSync(curriculumId: string, schoolIds: string[], initiatedBy: string) {
  for (const schoolId of schoolIds) {
    const existingSync = await prisma.curriculumSync.findUnique({
      where: { curriculumId_schoolId: { curriculumId, schoolId } }
    });

    if (existingSync) {
      // Réinitialiser pour re-sync
      await prisma.curriculumSync.update({
        where: { curriculumId_schoolId: { curriculumId, schoolId } },
        data: {
          status: 'PENDING',
          attemptCount: 0,
          nextRetryAt: new Date(),
          errorMessage: null
        }
      });
    } else {
      // Créer nouveau sync
      await prisma.curriculumSync.create({
        data: {
          curriculumId,
          schoolId,
          status: 'PENDING'
        }
      });
    }
  }
}

/**
 * Lister les publications avec filtres
 */
export async function listPublications(
  filters?: {
    curriculumId?: string;
    status?: PublicationStatus;
    limit?: number;
    offset?: number;
  }
) {
  const { curriculumId, status, limit = 50, offset = 0 } = filters || {};

  const where: any = {};
  if (curriculumId) where.curriculumId = curriculumId;
  if (status) where.status = status;

  const [publications, total] = await Promise.all([
    prisma.curriculumPublication.findMany({
      where,
      include: { curriculum: true, version: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.curriculumPublication.count({ where })
  ]);

  return { publications, total, limit, offset };
}

/**
 * Obtenir les détails d'une publication
 */
export async function getPublicationDetails(publicationId: string) {
  const publication = await prisma.curriculumPublication.findUnique({
    where: { id: publicationId },
    include: {
      curriculum: {
        include: {
          syncs: {
            where: {
              // Vérifier si c'est un sync pour cette publication
            }
          }
        }
      },
      version: true
    }
  });

  if (!publication) {
    throw new AppError('Publication not found', 404);
  }

  return publication;
}

/**
 * Obtenir l'historique des publications d'un curriculum
 */
export async function getPublicationHistory(curriculumId: string, limit: number = 50) {
  return prisma.curriculumPublication.findMany({
    where: { curriculumId },
    include: { version: true },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
