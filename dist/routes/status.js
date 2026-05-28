"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const router = express_1.default.Router();
router.get('/status/:jobId', async (req, res) => {
    const jobId = req.params.jobId;
    const job = await prisma_1.default.importJob.findUnique({
        where: { id: jobId },
        include: { logs: { orderBy: { createdAt: 'asc' } } }
    });
    if (!job) {
        return res.status(404).json({ error: 'Import job not found' });
    }
    res.json({
        job: {
            id: job.id,
            fileName: job.fileName,
            status: job.status,
            progress: job.progress,
            errorCount: job.errorCount,
            summary: job.summary,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        },
        logs: job.logs.map((log) => ({ id: log.id, level: log.level, message: log.message, metadata: log.metadata, createdAt: log.createdAt }))
    });
});
exports.default = router;
