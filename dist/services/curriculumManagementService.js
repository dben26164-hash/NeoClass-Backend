"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCurriculum = createCurriculum;
exports.updateCurriculum = updateCurriculum;
exports.getCurriculumFull = getCurriculumFull;
exports.listCurriculumsByType = listCurriculumsByType;
exports.getPublishedCurriculums = getPublishedCurriculums;
exports.publishCurriculum = publishCurriculum;
exports.syncCurriculumToSchools = syncCurriculumToSchools;
exports.getSchoolCurriculums = getSchoolCurriculums;
exports.getCurriculumStats = getCurriculumStats;
exports.duplicateCurriculum = duplicateCurriculum;
const prisma_1 = __importDefault(require("../prisma"));
const curriculumVersionService_1 = __importDefault(require("./curriculumVersionService"));
const curriculumSyncService_1 = __importDefault(require("./curriculumSyncService"));
/**
 * Create a new curriculum
 */
async function createCurriculum(input) {
    return prisma_1.default.curriculum.create({
        data: {
            schoolId: input.schoolId,
            name: input.name,
            level: input.level,
            code: input.code,
            country: input.country,
            gradeLevelId: input.gradeLevelId,
            cycle: input.cycle,
            description: input.description,
            type: input.type,
            metadata: input.metadata,
            isPublished: false
        }
    });
}
/**
 * Update curriculum (only unpublished ones can be edited)
 */
async function updateCurriculum(input) {
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: input.id }
    });
    if (curriculum.isPublished && curriculum.publishedAt) {
        throw new Error('Cannot edit published curriculum. Create a new version instead.');
    }
    return prisma_1.default.curriculum.update({
        where: { id: input.id },
        data: {
            name: input.name,
            level: input.level,
            description: input.description,
            metadata: input.metadata,
            gradeLevelId: input.gradeLevelId
        }
    });
}
/**
 * Get curriculum with all its content
 */
async function getCurriculumFull(curriculumId) {
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: curriculumId, deletedAt: null },
        include: {
            school: { select: { id: true, name: true, code: true } },
            gradeLevel: { select: { id: true, name: true, order: true } },
            subjects: {
                include: {
                    chapters: {
                        include: {
                            lessons: {
                                include: {
                                    learningObjectives: true,
                                    lessonContents: true,
                                    exercises: true,
                                    flashcards: true,
                                    aiContents: true,
                                    quizzes: {
                                        include: { questions: true, attempts: true }
                                    },
                                    dependencies: true,
                                    dependents: true
                                }
                            }
                        }
                    }
                }
            },
            versions: { orderBy: { version: 'desc' } },
            syncs: { include: { school: { select: { name: true, code: true } } } }
        }
    });
    return curriculum;
}
/**
 * List curriculums by type
 */
async function listCurriculumsByType(type, schoolId) {
    return prisma_1.default.curriculum.findMany({
        where: {
            type,
            ...(schoolId && { schoolId }),
            deletedAt: null
        },
        include: {
            school: { select: { name: true } },
            gradeLevel: { select: { name: true } },
            versions: { orderBy: { version: 'desc' }, take: 1 }
        },
        orderBy: { createdAt: 'desc' }
    });
}
/**
 * Get published curriculums (for student access)
 */
async function getPublishedCurriculums(country, type) {
    return prisma_1.default.curriculum.findMany({
        where: {
            isPublished: true,
            deletedAt: null,
            ...(country && { country }),
            ...(type && { type })
        },
        include: {
            gradeLevel: { select: { name: true, order: true } },
            school: { select: { id: true, name: true } },
            subjects: { select: { id: true, name: true, code: true } }
        },
        orderBy: [{ gradeLevel: { order: 'asc' } }, { level: 'asc' }]
    });
}
/**
 * Publish curriculum (creates version and publishes it)
 */
async function publishCurriculum(curriculumId, publishedBy, description) {
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: curriculumId }
    });
    // Create a new version
    const version = await curriculumVersionService_1.default.createDraftVersion({
        curriculumId,
        description: description || `Published version of ${curriculum.name}`,
        metadata: { source: 'curriculum_publish' }
    });
    // Publish it
    return curriculumVersionService_1.default.publishVersion({
        curriculumId,
        version: version.version,
        publishedBy
    });
}
/**
 * Sync curriculum to schools
 */
async function syncCurriculumToSchools(curriculumId, schoolIds, syncedBy) {
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: curriculumId }
    });
    if (!curriculum.isPublished) {
        throw new Error('Only published curriculums can be synced');
    }
    return curriculumSyncService_1.default.initiateSyncToCurriculum({
        curriculumId,
        schoolIds,
        syncedBy
    });
}
/**
 * Get all curriculums for a school
 */
async function getSchoolCurriculums(schoolId, includeDeleted = false) {
    return prisma_1.default.curriculum.findMany({
        where: {
            schoolId,
            ...(!includeDeleted && { deletedAt: null })
        },
        include: {
            gradeLevel: { select: { name: true } },
            subjects: { select: { id: true, name: true, _count: { select: { chapters: true } } } },
            versions: { orderBy: { version: 'desc' }, take: 1 },
            syncs: { select: { status: true, syncedAt: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}
/**
 * Get curriculum statistics
 */
async function getCurriculumStats(curriculumId) {
    const curriculum = await prisma_1.default.curriculum.findUniqueOrThrow({
        where: { id: curriculumId }
    });
    const [subjects, chapters, lessons, quizzes, exercises] = await Promise.all([
        prisma_1.default.curriculumSubject.count({ where: { curriculumId } }),
        prisma_1.default.curriculumChapter.count({
            where: { subject: { curriculumId } }
        }),
        prisma_1.default.curriculumLesson.count({
            where: { chapter: { subject: { curriculumId } } }
        }),
        prisma_1.default.quiz.count({
            where: {
                lesson: { chapter: { subject: { curriculumId } } }
            }
        }),
        prisma_1.default.exercise.count({
            where: {
                lesson: { chapter: { subject: { curriculumId } } }
            }
        })
    ]);
    const syncs = await prisma_1.default.curriculumSync.findMany({
        where: { curriculumId },
        select: { status: true }
    });
    return {
        curriculum: {
            id: curriculum.id,
            name: curriculum.name,
            type: curriculum.type,
            isPublished: curriculum.isPublished,
            publishedAt: curriculum.publishedAt
        },
        content: {
            subjects,
            chapters,
            lessons,
            quizzes,
            exercises
        },
        sync: {
            totalSchools: syncs.length,
            syncedSchools: syncs.filter(s => s.status === 'SYNCED').length,
            failedSchools: syncs.filter(s => s.status === 'FAILED').length,
            pendingSchools: syncs.filter(s => s.status === 'PENDING').length
        }
    };
}
/**
 * Duplicate curriculum (with new version)
 */
async function duplicateCurriculum(curriculumId, newName, schoolId) {
    const source = await getCurriculumFull(curriculumId);
    const copy = await prisma_1.default.curriculum.create({
        data: {
            schoolId,
            name: newName,
            code: `${source.code}_COPY_${Date.now()}`,
            level: source.level,
            country: source.country,
            cycle: source.cycle,
            description: source.description,
            type: source.type,
            metadata: {
                ...(source.metadata || {}),
                copiedFrom: curriculumId
            },
            subjects: {
                create: source.subjects.map(subject => ({
                    name: subject.name,
                    code: subject.code,
                    chapters: {
                        create: subject.chapters.map(chapter => ({
                            title: chapter.title,
                            description: chapter.description,
                            order: chapter.order,
                            lessons: {
                                create: chapter.lessons.map(lesson => ({
                                    title: lesson.title,
                                    content: lesson.content,
                                    order: lesson.order,
                                    learningObjectives: {
                                        create: lesson.learningObjectives.map(obj => ({
                                            description: obj.description,
                                            order: obj.order
                                        }))
                                    },
                                    lessonContents: {
                                        create: lesson.lessonContents.map(content => ({
                                            contentType: content.contentType,
                                            title: content.title,
                                            body: content.body,
                                            order: content.order
                                        }))
                                    },
                                    exercises: {
                                        create: lesson.exercises.map(exercise => ({
                                            title: exercise.title,
                                            instructions: exercise.instructions,
                                            difficulty: exercise.difficulty,
                                            answerKey: exercise.answerKey,
                                            example: exercise.example,
                                            order: exercise.order
                                        }))
                                    },
                                    flashcards: {
                                        create: lesson.flashcards.map(card => ({
                                            question: card.question,
                                            answer: card.answer
                                        }))
                                    }
                                }))
                            }
                        }))
                    }
                }))
            }
        },
        include: { subjects: true }
    });
    return copy;
}
exports.default = {
    createCurriculum,
    updateCurriculum,
    getCurriculumFull,
    listCurriculumsByType,
    getPublishedCurriculums,
    publishCurriculum,
    syncCurriculumToSchools,
    getSchoolCurriculums,
    getCurriculumStats,
    duplicateCurriculum
};
