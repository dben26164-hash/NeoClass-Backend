import express, { Request, Response } from 'express';
import curriculumManagementService from '../services/curriculumManagementService';
import curriculumVersionService from '../services/curriculumVersionService';
import curriculumSyncService from '../services/curriculumSyncService';

const router = express.Router();

// ============ CURRICULUM MANAGEMENT ============

/**
 * GET /api/curricula
 * List curriculas for a school
 */
router.get('/', async (req: any, res: any) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) {
      return res.status(400).json({ error: 'schoolId required' });
    }

    const curriculums = await curriculumManagementService.getSchoolCurriculums(schoolId);
    res.json({ data: curriculums, count: curriculums.length });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list curriculums' });
  }
});

/**
 * POST /api/curricula
 * Create new curriculum
 */
router.post('/', async (req: any, res: any) => {
  try {
    const { schoolId, name, level, code, country, type, description, gradeLevelId } = req.body;

    if (!schoolId || !name || !level || !code || !country || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const curriculum = await curriculumManagementService.createCurriculum({
      schoolId,
      name,
      level,
      code,
      country,
      type,
      description,
      gradeLevelId
    });

    res.status(201).json({ data: curriculum });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create curriculum' });
  }
});

/**
 * GET /api/curricula/:id
 * Get curriculum with full content
 */
router.get('/:id', async (req: any, res: any) => {
  try {
    const curriculum = await curriculumManagementService.getCurriculumFull(req.params.id);
    res.json({ data: curriculum });
  } catch (error) {
    res.status(404).json({ error: 'Curriculum not found' });
  }
});

/**
 * PATCH /api/curricula/:id
 * Update curriculum
 */
router.patch('/:id', async (req: any, res: any) => {
  try {
    const curriculum = await curriculumManagementService.updateCurriculum({
      id: req.params.id,
      ...req.body
    });
    res.json({ data: curriculum });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update curriculum' });
  }
});

/**
 * GET /api/curricula/:id/stats
 * Get curriculum statistics
 */
router.get('/:id/stats', async (req: any, res: any) => {
  try {
    const stats = await curriculumManagementService.getCurriculumStats(req.params.id);
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============ VERSIONING ============

/**
 * GET /api/curricula/:id/versions
 * Get version history
 */
router.get('/:id/versions', async (req: any, res: any) => {
  try {
    const versions = await curriculumVersionService.getVersionHistory(req.params.id);
    res.json({ data: versions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

/**
 * POST /api/curricula/:id/versions
 * Create new draft version
 */
router.post('/:id/versions', async (req: any, res: any) => {
  try {
    const { name, description, changelog } = req.body;
    const version = await curriculumVersionService.createDraftVersion({
      curriculumId: req.params.id,
      name,
      description,
      changelog
    });
    res.status(201).json({ data: version });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create version' });
  }
});

/**
 * GET /api/curricula/:id/versions/:version
 * Get specific version details
 */
router.get('/:id/versions/:version', async (req: any, res: any) => {
  try {
    const details = await curriculumVersionService.getVersionDetails(req.params.id, parseInt(req.params.version));
    res.json({ data: details });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch version details' });
  }
});

/**
 * POST /api/curricula/:id/publish
 * Publish curriculum
 */
router.post('/:id/publish', async (req: any, res: any) => {
  try {
    const { publishedBy, description } = req.body;
    if (!publishedBy) {
      return res.status(400).json({ error: 'publishedBy required' });
    }

    const published = await curriculumManagementService.publishCurriculum(
      req.params.id,
      publishedBy,
      description
    );
    res.json({ data: published });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to publish' });
  }
});

/**
 * GET /api/curricula/:id/changelog
 * Get action log
 */
router.get('/:id/changelog', async (req: any, res: any) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const log = await curriculumVersionService.getCurriculumActionLog(req.params.id, limit);
    res.json({ data: log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch changelog' });
  }
});

// ============ SYNCHRONIZATION ============

/**
 * POST /api/curricula/:id/sync
 * Initiate sync to schools
 */
router.post('/:id/sync', async (req: any, res: any) => {
  try {
    const { schoolIds, syncedBy } = req.body;
    if (!schoolIds || !Array.isArray(schoolIds) || !syncedBy) {
      return res.status(400).json({ error: 'schoolIds (array) and syncedBy required' });
    }

    const syncs = await curriculumManagementService.syncCurriculumToSchools(
      req.params.id,
      schoolIds,
      syncedBy
    );
    res.status(202).json({ data: syncs, message: 'Sync initiated' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to initiate sync' });
  }
});

/**
 * GET /api/curricula/:id/sync/status
 * Get sync status across schools
 */
router.get('/:id/sync/status', async (req: any, res: any) => {
  try {
    const status = await curriculumSyncService.getSyncStatus(req.params.id);
    res.json({ data: status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

/**
 * GET /api/curricula/:id/sync/school/:schoolId
 * Get sync status for specific school
 */
router.get('/:id/sync/school/:schoolId', async (req: any, res: any) => {
  try {
    const sync = await curriculumSyncService.getSyncStatusForSchool(req.params.id, req.params.schoolId);
    res.json({ data: sync });
  } catch (error) {
    res.status(404).json({ error: 'Sync record not found' });
  }
});

/**
 * PATCH /api/curricula/:id/sync/school/:schoolId
 * Update sync status
 */
router.patch('/:id/sync/school/:schoolId', async (req: any, res: any) => {
  try {
    const { status, errorMessage } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status required' });
    }

    const updated = await curriculumSyncService.updateSyncStatus({
      curriculumId: req.params.id,
      schoolId: req.params.schoolId,
      status,
      errorMessage
    });
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sync status' });
  }
});

/**
 * GET /api/schools/:schoolId/curricula
 * Get all curriculas synced to school
 */
router.get('/school/:schoolId/all', async (req: any, res: any) => {
  try {
    const syncs = await curriculumSyncService.getSchoolCurriculumSyncs(req.params.schoolId);
    res.json({ data: syncs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school curriculas' });
  }
});

/**
 * GET /api/published-curriculas
 * Get published curriculums (public endpoint)
 */
router.get('/published/list', async (req: any, res: any) => {
  try {
    const { country, type } = req.query;
    const curriculums = await curriculumManagementService.getPublishedCurriculums(country, type);
    res.json({ data: curriculums });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch published curriculums' });
  }
});

/**
 * POST /api/curricula/:id/duplicate
 * Duplicate curriculum
 */
router.post('/:id/duplicate', async (req: any, res: any) => {
  try {
    const { newName, schoolId } = req.body;
    if (!newName || !schoolId) {
      return res.status(400).json({ error: 'newName and schoolId required' });
    }

    const copy = await curriculumManagementService.duplicateCurriculum(
      req.params.id,
      newName,
      schoolId
    );
    res.status(201).json({ data: copy });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to duplicate' });
  }
});

/**
 * DELETE /api/curricula/:id
 * Soft delete curriculum
 */
router.delete('/:id', async (req: any, res: any) => {
  try {
    await curriculumVersionService.softDeleteCurriculum(req.params.id);
    res.json({ message: 'Curriculum deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete curriculum' });
  }
});

export default router;
