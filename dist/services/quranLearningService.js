"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuranTrack = createQuranTrack;
exports.listQuranTracksForSchool = listQuranTracksForSchool;
exports.getQuranTrackDetails = getQuranTrackDetails;
exports.createQuranLesson = createQuranLesson;
exports.listQuranLessons = listQuranLessons;
exports.createQuranResource = createQuranResource;
exports.createQuranQuiz = createQuranQuiz;
exports.createQuranMemorization = createQuranMemorization;
exports.getQuranProgressForStudent = getQuranProgressForStudent;
exports.updateQuranProgress = updateQuranProgress;
const prisma_1 = __importDefault(require("../prisma"));
const client_1 = require("@prisma/client");
async function createQuranTrack(input) {
    return prisma_1.default.quranTrack.create({
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
async function listQuranTracksForSchool(schoolId) {
    return prisma_1.default.quranTrack.findMany({
        where: { schoolId },
        include: {
            lessons: {
                select: { id: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}
async function getQuranTrackDetails(trackId) {
    return prisma_1.default.quranTrack.findUniqueOrThrow({
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
async function createQuranLesson(input) {
    return prisma_1.default.quranLesson.create({
        data: {
            trackId: input.trackId,
            title: input.title,
            subtitle: input.subtitle,
            summary: input.summary,
            order: input.order ?? 0
        }
    });
}
async function listQuranLessons(trackId) {
    return prisma_1.default.quranLesson.findMany({
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
async function createQuranResource(input) {
    return prisma_1.default.quranResource.create({
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
async function createQuranQuiz(input) {
    return prisma_1.default.quranQuiz.create({
        data: {
            lesson: {
                connect: { id: input.lessonId }
            },
            title: input.title,
            description: input.description,
            quizType: input.quizType ?? client_1.QuizType.FORMATIVE,
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
async function createQuranMemorization(input) {
    return prisma_1.default.quranMemorization.upsert({
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
async function getQuranProgressForStudent(studentId) {
    return prisma_1.default.quranProgress.findMany({
        where: { studentId },
        include: {
            lesson: {
                select: { id: true, title: true, trackId: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });
}
async function updateQuranProgress(input) {
    return prisma_1.default.quranProgress.upsert({
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
