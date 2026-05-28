import express from 'express';
import prisma from '../prisma';

const router = express.Router();

router.get('/status/:jobId', async (req: any, res: any) => {
  const jobId = req.params.jobId;
  const job = await prisma.importJob.findUnique({
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

export default router;
