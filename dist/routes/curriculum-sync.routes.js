"use strict";
/**
 * Routes API pour l'administration du système de synchronisation automatique
 * Endpoints pour: publications, syncs, retries, logs, worker status
 */
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
const publicationService = __importStar(require("../services/curriculumPublicationService"));
const autoSyncService = __importStar(require("../services/curriculumAutoSyncService"));
const retryService = __importStar(require("../services/curriculumSyncRetryService"));
const updateLogService = __importStar(require("../services/curriculumUpdateLogService"));
const syncWorker = __importStar(require("../services/curriculumSyncWorker"));
const curriculum_sync_validations_1 = require("../validations/curriculum-sync.validations");
const router = express_1.default.Router();
// ==================== PUBLICATIONS ====================
/**
 * POST /api/curriculum-sync/publications
 * Créer une nouvelle publication (DRAFT)
 */
router.post('/publications', (0, curriculum_sync_validations_1.validateSchema)(curriculum_sync_validations_1.createPublicationSchema), async (req, res) => {
    try {
        const publication = await publicationService.createPublication(req.validatedData);
        res.status(201).json({
            success: true,
            data: publication,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create publication';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/publications
 * Lister les publications
 */
router.get('/publications', (0, curriculum_sync_validations_1.validateSchema)(curriculum_sync_validations_1.listPublicationsSchema), async (req, res) => {
    try {
        const filters = req.validatedData;
        const result = await publicationService.listPublications(filters);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list publications';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/publications/:id
 * Obtenir les détails d'une publication
 */
router.get('/publications/:id', async (req, res) => {
    try {
        const publication = await publicationService.getPublicationDetails(req.params.id);
        res.json({
            success: true,
            data: publication,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get publication';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/curriculum-sync/publications/:id/submit-review
 * Soumettre une publication pour review
 */
router.post('/publications/:id/submit-review', async (req, res) => {
    try {
        const { submittedBy } = req.body;
        if (!submittedBy) {
            return res.status(400).json({
                success: false,
                error: 'submittedBy is required'
            });
        }
        const publication = await publicationService.submitForReview(req.params.id, submittedBy);
        res.json({
            success: true,
            data: publication,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit for review';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/curriculum-sync/publications/:id/review
 * Approuver ou rejeter une publication
 */
router.post('/publications/:id/review', (0, curriculum_sync_validations_1.validateSchema)(curriculum_sync_validations_1.reviewPublicationSchema), async (req, res) => {
    try {
        const { approved, comments } = req.validatedData;
        const { submittedBy } = req.body; // Also accept submittedBy in body
        const publication = await publicationService.reviewPublication({
            publicationId: req.params.id,
            reviewedBy: submittedBy || req.body.reviewedBy || 'admin',
            approved,
            comments
        });
        res.json({
            success: true,
            data: publication,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to review publication';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/curriculum-sync/publications/:id/publish
 * Publier une publication approuvée
 */
router.post('/publications/:id/publish', (0, curriculum_sync_validations_1.validateSchema)(curriculum_sync_validations_1.publishPublicationSchema), async (req, res) => {
    try {
        const { publishedBy, shouldAutoSync } = req.validatedData;
        const publication = await publicationService.publishPublication(req.params.id, publishedBy, shouldAutoSync);
        res.status(202).json({
            success: true,
            data: publication,
            message: 'Publication published and syncs initiated',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to publish';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
// ==================== SYNCS ====================
/**
 * POST /api/curriculum-sync/sync
 * Initier une synchronisation automatique
 */
router.post('/sync', (0, curriculum_sync_validations_1.validateSchema)(curriculum_sync_validations_1.initiateSyncSchema), async (req, res) => {
    try {
        const result = await autoSyncService.initiateAutoSync(req.validatedData);
        res.status(202).json({
            success: true,
            data: result,
            message: 'Sync initiated',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initiate sync';
        const status = message.includes('not found') ? 404 : message.includes('must be published') ? 400 : 500;
        res.status(status).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/sync/:syncId
 * Obtenir le statut d'une synchronisation
 */
router.get('/sync/:syncId', async (req, res) => {
    try {
        const sync = await autoSyncService.getSyncStatus(req.params.syncId);
        res.json({
            success: true,
            data: sync,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get sync status';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/curriculum/:curriculumId/syncs
 * Lister tous les syncs d'un curriculum
 */
router.get('/curriculum/:curriculumId/syncs', async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;
        const syncs = await autoSyncService.getCurriculumSyncs(req.params.curriculumId, status, Number(limit));
        res.json({
            success: true,
            data: syncs,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list syncs';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/curriculum/:curriculumId/summary
 * Obtenir le statut global d'un curriculum
 */
router.get('/curriculum/:curriculumId/summary', async (req, res) => {
    try {
        const summary = await autoSyncService.getCurriculumSyncSummary(req.params.curriculumId);
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get summary';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/curriculum-sync/curriculum/:curriculumId/reset-failed
 * Réinitialiser les syncs échoués
 */
router.post('/curriculum/:curriculumId/reset-failed', async (req, res) => {
    try {
        const result = await autoSyncService.resetFailedSyncs(req.params.curriculumId);
        res.json({
            success: true,
            data: result,
            message: `${result.count} failed syncs reset to PENDING`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reset failed syncs';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
// ==================== RETRIES ====================
/**
 * GET /api/curriculum-sync/sync/:syncId/retries
 * Lister les tentatives de retry pour un sync
 */
router.get('/sync/:syncId/retries', async (req, res) => {
    try {
        const retries = await retryService.getRetries(req.params.syncId);
        res.json({
            success: true,
            data: retries,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get retries';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/curriculum/:curriculumId/retry-stats
 * Obtenir les statistiques de retry
 */
router.get('/curriculum/:curriculumId/retry-stats', async (req, res) => {
    try {
        const stats = await retryService.getRetryStats(req.params.curriculumId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get retry stats';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
// ==================== UPDATE LOGS ====================
/**
 * GET /api/curriculum-sync/sync/:syncId/updates
 * Lister les logs de mise à jour
 */
router.get('/sync/:syncId/updates', async (req, res) => {
    try {
        const { changeType, entityType, limit = 100, offset = 0 } = req.query;
        const result = await updateLogService.getUpdateLogs(req.params.syncId, {
            changeType: changeType,
            entityType: entityType,
            limit: Number(limit),
            offset: Number(offset)
        });
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get update logs';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/sync/:syncId/updates/summary
 * Résumé des changements
 */
router.get('/sync/:syncId/updates/summary', async (req, res) => {
    try {
        const summary = await updateLogService.getUpdateSummary(req.params.syncId);
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get update summary';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/sync/:syncId/updates/changelog
 * Générer un changelog texte
 */
router.get('/sync/:syncId/updates/changelog', async (req, res) => {
    try {
        const changelog = await updateLogService.generateChangelogText(req.params.syncId);
        res.set('Content-Type', 'text/plain');
        res.send(changelog);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate changelog';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/curriculum-sync/sync/:syncId/updates/export
 * Exporter les logs
 */
router.get('/sync/:syncId/updates/export', async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const exported = await updateLogService.exportSyncLogs(req.params.syncId, format);
        if (format === 'csv') {
            res.set('Content-Type', 'text/csv');
            res.set('Content-Disposition', `attachment; filename="sync-logs.csv"`);
        }
        else {
            res.set('Content-Type', 'application/json');
        }
        res.send(exported);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to export logs';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
// ==================== WORKER STATUS ====================
/**
 * GET /api/curriculum-sync/worker/status
 * Obtenir le statut du worker de sync
 */
router.get('/worker/status', async (req, res) => {
    try {
        const status = await syncWorker.getWorkerStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get worker status';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/curriculum-sync/worker/process-pending
 * Traiter les syncs en attente (pour testing)
 */
router.post('/worker/process-pending', async (req, res) => {
    try {
        const results = await syncWorker.processPendingSyncs();
        res.status(202).json({
            success: true,
            data: {
                processed: results?.length || 0,
                results
            },
            message: 'Processing pending syncs',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process pending syncs';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/curriculum-sync/worker/process-retries
 * Traiter les retries (pour testing)
 */
router.post('/worker/process-retries', async (req, res) => {
    try {
        await syncWorker.processRetries();
        res.status(202).json({
            success: true,
            data: { message: 'Processing retries' },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process retries';
        res.status(500).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
});
// ==================== HEALTH CHECK ====================
/**
 * GET /api/curriculum-sync/health
 * Health check pour le système de sync
 */
router.get('/health', async (req, res) => {
    try {
        const status = await syncWorker.getWorkerStatus();
        res.json({
            success: true,
            data: {
                service: 'Curriculum Auto-Sync',
                status: 'healthy',
                worker: status
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Service unhealthy',
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
