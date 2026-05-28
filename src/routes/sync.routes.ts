import express from 'express';
import type { Request, Response } from 'express-serve-static-core';
import * as syncService from '../services/sync.service';

const router = express.Router();

router.post('/:id', async (req: Request, res: Response) => {
  try {
    const curriculumId = req.params.id;
    const schoolIds = Array.isArray(req.body.schoolIds) ? req.body.schoolIds.map(String) : [];
    const syncedBy = String(req.body.syncedBy || 'system');

    if (!schoolIds.length) {
      return res.status(400).json({ error: 'schoolIds must be a non-empty array' });
    }

    const syncRecords = await syncService.initiateCurriculumSync(curriculumId, schoolIds, syncedBy);
    return res.status(202).json({ data: syncRecords });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to initiate sync' });
  }
});

router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const curriculumId = req.params.id;
    const items = await syncService.getSyncStatus(curriculumId);
    return res.json({ data: items });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch sync status' });
  }
});

export default router;
