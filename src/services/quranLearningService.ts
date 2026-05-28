import prisma from '../prisma';
import { LessonStatus, QuizType } from '@prisma/client';

export interface CreateQuranTrackInput {
  schoolId: string;
  title: string;
  description?: string;
  code?: string;
  level?: string;
  metadata?: Record<string, any>;
}

export interface CreateQuranLessonInput {
  trackId: string;
  title: string;
  subtitle?: string;
  summary?: string;
  order?: number;
}

export interface CreateQuranResourceInput {
  lessonId: string;
  title: string;
  resourceType?: string;
  url?: string;
  content?: string;
  order?: number;
  metadata?: Record<string, any>;
}

export interface CreateQuranQuizInput {
  lessonId: string;
  title: string;
  description?: string;
  quizType?: QuizType;
  questions: Array<{
    prompt: string;
    questionType?: string;
    options?: any;
    correctAnswer?: any;
    explanation?: string;
    points?: number;
    order?: number;
  }>;
}

export interface CreateQuranMemorizationInput {
  lessonId: string;
  targetAyahs?: any;
  description?: string;
  revisionIntervalDays?: number;
  strengthLevel?: number;
}

export interface UpdateQuranProgressInput {
  studentId: string;
  lessonId: string;
  status: LessonStatus;
  score?: number;
  completedAt?: Date;
  notes?: string;
}

export async function createQuranTrack(input: CreateQuranTrackInput) {
  return prisma.quranTrack.create({
    data: {
      schoolId: input.schoolId,
      title: input.title,
      description: input.description,
      code: input.code,
      level: input.level,
      metadata: input.metadata
    }
  });
}

export async function listQuranTracksForSchool(schoolId: string) {
  return prisma.quranTrack.findMany({
    where: { schoolId },
    include: {
      lessons: {
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getQuranTrackDetails(trackId: string) {
  return prisma.quranTrack.findUniqueOrThrow({
    where: { id: trackId },
    include: {
      school: { select: { id: true, name: true, code: true } },
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          resources: { orderBy: { order: 'asc' } },
          quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
          memorization: true,
          progress: true
        }
      }
    }
  });
}

export async function createQuranLesson(input: CreateQuranLessonInput) {
  return prisma.quranLesson.create({
    data: {
      trackId: input.trackId,
      title: input.title,
      subtitle: input.subtitle,
      summary: input.summary,
      order: input.order ?? 0
    }
  });
}

export async function listQuranLessons(trackId: string) {
  return prisma.quranLesson.findMany({
    where: { trackId },
    include: {
      resources: true,
      quiz: {
        include: { questions: true }
      },
      memorization: true,
      progress: true
    },
    orderBy: { order: 'asc' }
  });
}

export async function createQuranResource(input: CreateQuranResourceInput) {
  return prisma.quranResource.create({
    data: {
      lessonId: input.lessonId,
      title: input.title,
      resourceType: input.resourceType ?? 'text',
      url: input.url,
      content: input.content,
      order: input.order ?? 0,
      metadata: input.metadata
    }
  });
}

export async function createQuranQuiz(input: CreateQuranQuizInput) {
  return prisma.quranQuiz.create({
    data: {
      lesson: {
        connect: { id: input.lessonId }
      },
      title: input.title,
      description: input.description,
      quizType: input.quizType ?? QuizType.FORMATIVE,
      questions: {
        create: input.questions.map(question => ({
          prompt: question.prompt,
          questionType: question.questionType ?? 'multiple_choice',
          options: question.options ?? null,
          correctAnswer: question.correctAnswer ?? null,
          explanation: question.explanation,
          points: question.points ?? 1,
          order: question.order ?? 0
        }))
      }
    },
    include: {
      questions: true
    }
  });
}

export async function createQuranMemorization(input: CreateQuranMemorizationInput) {
  return prisma.quranMemorization.upsert({
    where: { lessonId: input.lessonId },
    update: {
      targetAyahs: input.targetAyahs,
      description: input.description,
      revisionIntervalDays: input.revisionIntervalDays ?? 1,
      strengthLevel: input.strengthLevel ?? 0
    },
    create: {
      lessonId: input.lessonId,
      targetAyahs: input.targetAyahs,
      description: input.description,
      revisionIntervalDays: input.revisionIntervalDays ?? 1,
      strengthLevel: input.strengthLevel ?? 0
    }
  });
}

export async function getQuranProgressForStudent(studentId: string) {
  return prisma.quranProgress.findMany({
    where: { studentId },
    include: {
      lesson: {
        select: { id: true, title: true, trackId: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function updateQuranProgress(input: UpdateQuranProgressInput) {
  return prisma.quranProgress.upsert({
    where: {
      studentId_lessonId: {
        studentId: input.studentId,
        lessonId: input.lessonId
      }
    },
    update: {
      status: input.status,
      score: input.score ?? 0,
      completedAt: input.completedAt,
      notes: input.notes
    },
    create: {
      studentId: input.studentId,
      lessonId: input.lessonId,
      status: input.status,
      score: input.score ?? 0,
      completedAt: input.completedAt,
      notes: input.notes
    }
  });
}
