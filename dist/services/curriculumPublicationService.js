"use strict";
/**
 * Service de gestion des publications de curriculum master
 * Responsabilités:
 * - Créer et gérer les publications
 * - Workflow: DRAFT → REVIEWING → APPROVED → PUBLISHED
 * - Historique complet des publications
 * - Déclencher les syncs automatiques
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublication = createPublication;
exports.submitForReview = submitForReview;
exports.reviewPublication = reviewPublication;
exports.publishPublication = publishPublication;
exports.listPublications = listPublications;
exports.getPublicationDetails = getPublicationDetails;
exports.getPublicationHistory = getPublicationHistory;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Créer une nouvelle publication (DRAFT)
 */
async function createPublication(input) {
    const { curriculumId, versionId, title, description, changesSummary, publishedBy, targetSchools } = input;
    // Vérifier que le curriculum existe et est de type NATIONAL ou QURANIC
    const curriculum = await prisma_1.prisma.curriculum.findUnique({
        where: { id: curriculumId },
        include: { versions: { where: { id: versionId } } }
    });
    if (!curriculum) {
        throw new errorHandler_1.AppError('Curriculum not found', 404);
    }
    if (curriculum.versions.length === 0) {
        throw new errorHandler_1.AppError('Version not found', 404);
    }
    // Seuls les curriculums NATIONAL et QURANIC peuvent être publiés au niveau master
    if (curriculum.type !== client_1.CurriculumType.NATIONAL && curriculum.type !== client_1.CurriculumType.QURANIC) {
        throw new errorHandler_1.AppError('Only NATIONAL and QURANIC curriculums can be published as master', 400);
    }
    // Vérifier qu'il n'existe pas déjà une publication pour cette version
    const existingPub = await prisma_1.prisma.curriculumPublication.findUnique({
        where: {
            curriculumId_versionId: { curriculumId, versionId }
        }
    });
    if (existingPub) {
        throw new errorHandler_1.AppError('Publication already exists for this version', 409);
    }
    // Créer la publication en DRAFT
    const publication = await prisma_1.prisma.curriculumPublication.create({
        data: {
            curriculumId,
            versionId,
            status: client_1.PublicationStatus.DRAFT,
            title,
            description,
            changesSummary,
            publishedBy,
            metadata: {
                targetSchools: targetSchools || null, // null = toutes les écoles
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
    await prisma_1.prisma.curriculumPublicationLog.create({
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
async function submitForReview(publicationId, submittedBy) {
    const publication = await prisma_1.prisma.curriculumPublication.findUnique({
        where: { id: publicationId }
    });
    if (!publication) {
        throw new errorHandler_1.AppError('Publication not found', 404);
    }
    if (publication.status !== client_1.PublicationStatus.DRAFT) {
        throw new errorHandler_1.AppError(`Cannot submit for review. Current status: ${publication.status}`, 400);
    }
    const updated = await prisma_1.prisma.curriculumPublication.update({
        where: { id: publicationId },
        data: {
            status: client_1.PublicationStatus.REVIEWING,
            metadata: {
                ...publication.metadata,
                submittedBy,
                submittedAt: new Date().toISOString()
            }
        },
        include: { curriculum: true, version: true }
    });
    // Logger
    await prisma_1.prisma.curriculumPublicationLog.create({
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
async function reviewPublication(input) {
    const { publicationId, reviewedBy, approved, comments } = input;
    const publication = await prisma_1.prisma.curriculumPublication.findUnique({
        where: { id: publicationId },
        include: { version: true }
    });
    if (!publication) {
        throw new errorHandler_1.AppError('Publication not found', 404);
    }
    if (publication.status !== client_1.PublicationStatus.REVIEWING) {
        throw new errorHandler_1.AppError(`Cannot review. Current status: ${publication.status}`, 400);
    }
    const newStatus = approved ? client_1.PublicationStatus.APPROVED : client_1.PublicationStatus.REJECTED;
    const updated = await prisma_1.prisma.curriculumPublication.update({
        where: { id: publicationId },
        data: {
            status: newStatus,
            reviewedBy,
            reviewedAt: new Date(),
            reviewComments: comments,
            metadata: {
                ...publication.metadata,
                reviewedBy,
                reviewedAt: new Date().toISOString(),
                approved
            }
        },
        include: { curriculum: true, version: true }
    });
    // Logger
    await prisma_1.prisma.curriculumPublicationLog.create({
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
async function publishPublication(publicationId, publishedBy, shouldAutoSync = true) {
    const publication = await prisma_1.prisma.curriculumPublication.findUnique({
        where: { id: publicationId },
        include: {
            curriculum: { include: { syncs: true } },
            version: true
        }
    });
    if (!publication) {
        throw new errorHandler_1.AppError('Publication not found', 404);
    }
    if (publication.status !== client_1.PublicationStatus.APPROVED) {
        throw new errorHandler_1.AppError(`Cannot publish. Current status: ${publication.status}`, 400);
    }
    const updated = await prisma_1.prisma.curriculumPublication.update({
        where: { id: publicationId },
        data: {
            status: client_1.PublicationStatus.PUBLISHED,
            publishedBy,
            publishedAt: new Date(),
            metadata: {
                ...publication.metadata,
                publishedBy,
                publishedAt: new Date().toISOString()
            }
        },
        include: { curriculum: true, version: true }
    });
    // Logger
    await prisma_1.prisma.curriculumPublicationLog.create({
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
        const targetSchools = publication.metadata?.targetSchools;
        // Si targetSchools est null, syncer vers toutes les écoles
        let syncTargets = [];
        if (!targetSchools) {
            const allSchools = await prisma_1.prisma.school.findMany({ select: { id: true } });
            syncTargets = allSchools.map(s => s.id);
        }
        else {
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
async function initiateAutoSync(curriculumId, schoolIds, initiatedBy) {
    for (const schoolId of schoolIds) {
        const existingSync = await prisma_1.prisma.curriculumSync.findUnique({
            where: { curriculumId_schoolId: { curriculumId, schoolId } }
        });
        if (existingSync) {
            // Réinitialiser pour re-sync
            await prisma_1.prisma.curriculumSync.update({
                where: { curriculumId_schoolId: { curriculumId, schoolId } },
                data: {
                    status: 'PENDING',
                    attemptCount: 0,
                    nextRetryAt: new Date(),
                    errorMessage: null
                }
            });
        }
        else {
            // Créer nouveau sync
            await prisma_1.prisma.curriculumSync.create({
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
async function listPublications(filters) {
    const { curriculumId, status, limit = 50, offset = 0 } = filters || {};
    const where = {};
    if (curriculumId)
        where.curriculumId = curriculumId;
    if (status)
        where.status = status;
    const [publications, total] = await Promise.all([
        prisma_1.prisma.curriculumPublication.findMany({
            where,
            include: { curriculum: true, version: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        }),
        prisma_1.prisma.curriculumPublication.count({ where })
    ]);
    return { publications, total, limit, offset };
}
/**
 * Obtenir les détails d'une publication
 */
async function getPublicationDetails(publicationId) {
    const publication = await prisma_1.prisma.curriculumPublication.findUnique({
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
        throw new errorHandler_1.AppError('Publication not found', 404);
    }
    return publication;
}
/**
 * Obtenir l'historique des publications d'un curriculum
 */
async function getPublicationHistory(curriculumId, limit = 50) {
    return prisma_1.prisma.curriculumPublication.findMany({
        where: { curriculumId },
        include: { version: true },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}
