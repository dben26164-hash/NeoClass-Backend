"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quranService = __importStar(require("../services/quranLearningService"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const validLessonStatuses = new Set(Object.values(client_1.LessonStatus));
const validQuizTypes = new Set(Object.values(client_1.QuizType));
function parseInteger(value) {
    return Number.isFinite(Number(value)) ? Number(value) : undefined;
}
function validateRequiredBodyFields(body, fields) {
    return fields.every(field => body && body[field] !== undefined && body[field] !== null && body[field] !== '');
}
router.get('/', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId || typeof schoolId !== 'string') {
            return res.status(400).json({ error: 'schoolId is required' });
        }
        const tracks = await quranService.listQuranTracksForSchool(schoolId);
        res.json({ data: tracks, count: tracks.length });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch Quran tracks' });
    }
});
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (!validateRequiredBodyFields(body, ['schoolId', 'title'])) {
            return res.status(400).json({ error: 'schoolId and title are required' });
        }
        const track = await quranService.createQuranTrack({
            schoolId: body.schoolId,
            title: body.title,
            description: body.description,
            code: body.code,
            level: body.level,
            metadata: body.metadata
        });
        res.status(201).json({ data: track });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create Quran track' });
    }
});
router.get('/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;
        const track = await quranService.getQuranTrackDetails(trackId);
        res.json({ data: track });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch track details';
        res.status(message.toLowerCase().includes('not found') ? 404 : 500).json({ error: message });
    }
});
router.get('/:trackId/lessons', async (req, res) => {
    try {
        const { trackId } = req.params;
        const lessons = await quranService.listQuranLessons(trackId);
        res.json({ data: lessons, count: lessons.length });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch lessons' });
    }
});
router.post('/:trackId/lessons', async (req, res) => {
    try {
        const body = req.body;
        if (!validateRequiredBodyFields(body, ['title'])) {
            return res.status(400).json({ error: 'Lesson title is required' });
        }
        const { trackId } = req.params;
        const lesson = await quranService.createQuranLesson({
            trackId,
            title: body.title,
            subtitle: body.subtitle,
            summary: body.summary,
            order: parseInteger(body.order)
        });
        res.status(201).json({ data: lesson });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create lesson' });
    }
});
router.post('/lessons/:lessonId/resources', async (req, res) => {
    try {
        const body = req.body;
        if (!validateRequiredBodyFields(body, ['title'])) {
            return res.status(400).json({ error: 'Resource title is required' });
        }
        const { lessonId } = req.params;
        const resource = await quranService.createQuranResource({
            lessonId,
            title: body.title,
            resourceType: body.resourceType,
            url: body.url,
            content: body.content,
            order: parseInteger(body.order),
            metadata: body.metadata
        });
        res.status(201).json({ data: resource });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create resource' });
    }
});
router.post('/lessons/:lessonId/quiz', async (req, res) => {
    try {
        const body = req.body;
        if (!validateRequiredBodyFields(body, ['title', 'questions'])) {
            return res.status(400).json({ error: 'Quiz title and questions are required' });
        }
        if (!Array.isArray(body.questions) || body.questions.length === 0) {
            return res.status(400).json({ error: 'questions must be a non-empty array' });
        }
        const quizType = typeof body.quizType === 'string' && validQuizTypes.has(body.quizType) ? body.quizType : client_1.QuizType.FORMATIVE;
        const { lessonId } = req.params;
        const quiz = await quranService.createQuranQuiz({
            lessonId,
            title: body.title,
            description: body.description,
            quizType,
            questions: body.questions.map((question) => ({
                prompt: question.prompt,
                questionType: question.questionType,
                options: question.options,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                points: parseInteger(question.points) ?? undefined,
                order: parseInteger(question.order) ?? undefined
            }))
        });
        res.status(201).json({ data: quiz });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create quiz';
        res.status(message.toLowerCase().includes('not found') ? 404 : 500).json({ error: message });
    }
});
router.post('/lessons/:lessonId/memorization', async (req, res) => {
    try {
        const body = req.body;
        const { lessonId } = req.params;
        const memorization = await quranService.createQuranMemorization({
            lessonId,
            targetAyahs: body.targetAyahs,
            description: body.description,
            revisionIntervalDays: parseInteger(body.revisionIntervalDays),
            strengthLevel: parseInteger(body.strengthLevel)
        });
        res.status(201).json({ data: memorization });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create memorization guide' });
    }
});
router.get('/progress', async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId || typeof studentId !== 'string') {
            return res.status(400).json({ error: 'studentId is required' });
        }
        const progress = await quranService.getQuranProgressForStudent(studentId);
        res.json({ data: progress, count: progress.length });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch progress' });
    }
});
router.post('/progress', async (req, res) => {
    try {
        const body = req.body;
        if (!validateRequiredBodyFields(body, ['studentId', 'lessonId', 'status'])) {
            return res.status(400).json({ error: 'studentId, lessonId and status are required' });
        }
        if (typeof body.status !== 'string' || !validLessonStatuses.has(body.status)) {
            return res.status(400).json({ error: 'status must be one of LOCKED, UNLOCKED or COMPLETED' });
        }
        const progress = await quranService.updateQuranProgress({
            studentId: body.studentId,
            lessonId: body.lessonId,
            status: body.status,
            score: parseInteger(body.score) ?? 0,
            completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
            notes: body.notes
        });
        res.json({ data: progress });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update progress' });
    }
});
exports.default = router;
