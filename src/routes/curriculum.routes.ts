import express from 'express';
import type { Request, Response } from 'express-serve-static-core';
import * as curriculumService from '../services/curriculum.service';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }
    const curriculums = await curriculumService.listCurriculums(schoolId);
    return res.json({ data: curriculums });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list curricula' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { schoolId, name, level, code, country, type, description, gradeLevelId } = req.body;
    if (!schoolId || !name || !level || !code || !country || !type) {
      return res.status(400).json({ error: 'Missing required curriculum fields' });
    }
    const curriculum = await curriculumService.createCurriculum({
      schoolId,
      name,
      level,
      code,
      country,
      type,
      description,
      gradeLevelId
    });
    return res.status(201).json({ data: curriculum });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create curriculum' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const curriculum = await curriculumService.getCurriculumById(req.params.id);
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }
    return res.json({ data: curriculum });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch curriculum' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const curriculum = await curriculumService.updateCurriculum(req.params.id, req.body);
    return res.json({ data: curriculum });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update curriculum' });
  }
});

export default router;
