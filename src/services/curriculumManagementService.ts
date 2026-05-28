import prisma from '../prisma';
import { CurriculumType } from '@prisma/client';
import curriculumVersionService from './curriculumVersionService';
import curriculumSyncService from './curriculumSyncService';

export interface CreateCurriculumInput {
  schoolId: string;
  name: string;
  level: string;
  code: string;
  country: string;
  gradeLevelId?: string;
  cycle?: string;
  description?: string;
  type: CurriculumType;
  metadata?: Record<string, any>;
}

export interface UpdateCurriculumInput {
  id: string;
  name?: string;
  level?: string;
  description?: string;
  metadata?: Record<string, any>;
  gradeLevelId?: string;
}

/**
 * Create a new curriculum
 */
export async function createCurriculum(input: CreateCurriculumInput) {
  return prisma.curriculum.create({
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
export async function updateCurriculum(input: UpdateCurriculumInput) {
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
    where: { id: input.id }
  });

  if (curriculum.isPublished && curriculum.publishedAt) {
    throw new Error('Cannot edit published curriculum. Create a new version instead.');
  }

  return prisma.curriculum.update({
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
export async function getCurriculumFull(curriculumId: string) {
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
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
export async function listCurriculumsByType(type: CurriculumType, schoolId?: string) {
  return prisma.curriculum.findMany({
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
export async function getPublishedCurriculums(country?: string, type?: CurriculumType) {
  return prisma.curriculum.findMany({
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
export async function publishCurriculum(
  curriculumId: string,
  publishedBy: string,
  description?: string
) {
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
    where: { id: curriculumId }
  });

  // Create a new version
  const version = await curriculumVersionService.createDraftVersion({
    curriculumId,
    description: description || `Published version of ${curriculum.name}`,
    metadata: { source: 'curriculum_publish' }
  });

  // Publish it
  return curriculumVersionService.publishVersion(
    {
      curriculumId,
      version: version.version,
      publishedBy
    }
  );
}

/**
 * Sync curriculum to schools
 */
export async function syncCurriculumToSchools(
  curriculumId: string,
  schoolIds: string[],
  syncedBy: string
) {
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
    where: { id: curriculumId }
  });

  if (!curriculum.isPublished) {
    throw new Error('Only published curriculums can be synced');
  }

  return curriculumSyncService.initiateSyncToCurriculum({
    curriculumId,
    schoolIds,
    syncedBy
  });
}

/**
 * Get all curriculums for a school
 */
export async function getSchoolCurriculums(schoolId: string, includeDeleted = false) {
  return prisma.curriculum.findMany({
    where: {
      schoolId,
      ...(! includeDeleted && { deletedAt: null })
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
export async function getCurriculumStats(curriculumId: string) {
  const curriculum = await prisma.curriculum.findUniqueOrThrow({
    where: { id: curriculumId }
  });

  const [subjects, chapters, lessons, quizzes, exercises] = await Promise.all([
    prisma.curriculumSubject.count({ where: { curriculumId } }),
    prisma.curriculumChapter.count({
      where: { subject: { curriculumId } }
    }),
    prisma.curriculumLesson.count({
      where: { chapter: { subject: { curriculumId } } }
    }),
    prisma.quiz.count({
      where: {
        lesson: { chapter: { subject: { curriculumId } } }
      }
    }),
    prisma.exercise.count({
      where: {
        lesson: { chapter: { subject: { curriculumId } } }
      }
    })
  ]);

  const syncs = await prisma.curriculumSync.findMany({
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
export async function duplicateCurriculum(
  curriculumId: string,
  newName: string,
  schoolId: string
) {
  const source = await getCurriculumFull(curriculumId);

  const copy = await prisma.curriculum.create({
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
        ...((source.metadata as Record<string, any>) || {}),
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

export default {
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
