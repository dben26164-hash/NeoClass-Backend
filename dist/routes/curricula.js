"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const curriculumManagementService_1 = __importDefault(require("../services/curriculumManagementService"));
const curriculumVersionService_1 = __importDefault(require("../services/curriculumVersionService"));
const curriculumSyncService_1 = __importDefault(require("../services/curriculumSyncService"));
const router = express_1.default.Router();
// ============ CURRICULUM MANAGEMENT ============
/**
 * GET /api/curricula
 * List curriculas for a school
 */
router.get('/', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) {
            return res.status(400).json({ error: 'schoolId required' });
        }
        const curriculums = await curriculumManagementService_1.default.getSchoolCurriculums(schoolId);
        res.json({ data: curriculums, count: curriculums.length });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list curriculums' });
    }
});
/**
 * POST /api/curricula
 * Create new curriculum
 */
router.post('/', async (req, res) => {
    try {
        const { schoolId, name, level, code, country, type, description, gradeLevelId } = req.body;
        if (!schoolId || !name || !level || !code || !country || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const curriculum = await curriculumManagementService_1.default.createCurriculum({
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
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create curriculum' });
    }
});
/**
 * GET /api/curricula/:id
 * Get curriculum with full content
 */
router.get('/:id', async (req, res) => {
    try {
        const curriculum = await curriculumManagementService_1.default.getCurriculumFull(req.params.id);
        res.json({ data: curriculum });
    }
    catch (error) {
        res.status(404).json({ error: 'Curriculum not found' });
    }
});
/**
 * PATCH /api/curricula/:id
 * Update curriculum
 */
router.patch('/:id', async (req, res) => {
    try {
        const curriculum = await curriculumManagementService_1.default.updateCurriculum({
            id: req.params.id,
            ...req.body
        });
        res.json({ data: curriculum });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update curriculum' });
    }
});
/**
 * GET /api/curricula/:id/stats
 * Get curriculum statistics
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const stats = await curriculumManagementService_1.default.getCurriculumStats(req.params.id);
        res.json({ data: stats });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
// ============ VERSIONING ============
/**
 * GET /api/curricula/:id/versions
 * Get version history
 */
router.get('/:id/versions', async (req, res) => {
    try {
        const versions = await curriculumVersionService_1.default.getVersionHistory(req.params.id);
        res.json({ data: versions });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
});
/**
 * POST /api/curricula/:id/versions
 * Create new draft version
 */
router.post('/:id/versions', async (req, res) => {
    try {
        const { name, description, changelog } = req.body;
        const version = await curriculumVersionService_1.default.createDraftVersion({
            curriculumId: req.params.id,
            name,
            description,
            changelog
        });
        res.status(201).json({ data: version });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create version' });
    }
});
/**
 * GET /api/curricula/:id/versions/:version
 * Get specific version details
 */
router.get('/:id/versions/:version', async (req, res) => {
    try {
        const details = await curriculumVersionService_1.default.getVersionDetails(req.params.id, parseInt(req.params.version));
        res.json({ data: details });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch version details' });
    }
});
/**
 * POST /api/curricula/:id/publish
 * Publish curriculum
 */
router.post('/:id/publish', async (req, res) => {
    try {
        const { publishedBy, description } = req.body;
        if (!publishedBy) {
            return res.status(400).json({ error: 'publishedBy required' });
        }
        const published = await curriculumManagementService_1.default.publishCurriculum(req.params.id, publishedBy, description);
        res.json({ data: published });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to publish' });
    }
});
/**
 * GET /api/curricula/:id/changelog
 * Get action log
 */
router.get('/:id/changelog', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const log = await curriculumVersionService_1.default.getCurriculumActionLog(req.params.id, limit);
        res.json({ data: log });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch changelog' });
    }
});
// ============ SYNCHRONIZATION ============
/**
 * POST /api/curricula/:id/sync
 * Initiate sync to schools
 */
router.post('/:id/sync', async (req, res) => {
    try {
        const { schoolIds, syncedBy } = req.body;
        if (!schoolIds || !Array.isArray(schoolIds) || !syncedBy) {
            return res.status(400).json({ error: 'schoolIds (array) and syncedBy required' });
        }
        const syncs = await curriculumManagementService_1.default.syncCurriculumToSchools(req.params.id, schoolIds, syncedBy);
        res.status(202).json({ data: syncs, message: 'Sync initiated' });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to initiate sync' });
    }
});
/**
 * GET /api/curricula/:id/sync/status
 * Get sync status across schools
 */
router.get('/:id/sync/status', async (req, res) => {
    try {
        const status = await curriculumSyncService_1.default.getSyncStatus(req.params.id);
        res.json({ data: status });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch sync status' });
    }
});
/**
 * GET /api/curricula/:id/sync/school/:schoolId
 * Get sync status for specific school
 */
router.get('/:id/sync/school/:schoolId', async (req, res) => {
    try {
        const sync = await curriculumSyncService_1.default.getSyncStatusForSchool(req.params.id, req.params.schoolId);
        res.json({ data: sync });
    }
    catch (error) {
        res.status(404).json({ error: 'Sync record not found' });
    }
});
/**
 * PATCH /api/curricula/:id/sync/school/:schoolId
 * Update sync status
 */
router.patch('/:id/sync/school/:schoolId', async (req, res) => {
    try {
        const { status, errorMessage } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'status required' });
        }
        const updated = await curriculumSyncService_1.default.updateSyncStatus({
            curriculumId: req.params.id,
            schoolId: req.params.schoolId,
            status,
            errorMessage
        });
        res.json({ data: updated });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update sync status' });
    }
});
/**
 * GET /api/schools/:schoolId/curricula
 * Get all curriculas synced to school
 */
router.get('/school/:schoolId/all', async (req, res) => {
    try {
        const syncs = await curriculumSyncService_1.default.getSchoolCurriculumSyncs(req.params.schoolId);
        res.json({ data: syncs });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch school curriculas' });
    }
});
/**
 * GET /api/published-curriculas
 * Get published curriculums (public endpoint)
 */
router.get('/published/list', async (req, res) => {
    try {
        const { country, type } = req.query;
        const curriculums = await curriculumManagementService_1.default.getPublishedCurriculums(country, type);
        res.json({ data: curriculums });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch published curriculums' });
    }
});
/**
 * POST /api/curricula/:id/duplicate
 * Duplicate curriculum
 */
router.post('/:id/duplicate', async (req, res) => {
    try {
        const { newName, schoolId } = req.body;
        if (!newName || !schoolId) {
            return res.status(400).json({ error: 'newName and schoolId required' });
        }
        const copy = await curriculumManagementService_1.default.duplicateCurriculum(req.params.id, newName, schoolId);
        res.status(201).json({ data: copy });
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to duplicate' });
    }
});
/**
 * DELETE /api/curricula/:id
 * Soft delete curriculum
 */
router.delete('/:id', async (req, res) => {
    try {
        await curriculumVersionService_1.default.softDeleteCurriculum(req.params.id);
        res.json({ message: 'Curriculum deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete curriculum' });
    }
});
exports.default = router;
