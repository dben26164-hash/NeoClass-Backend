/**
 * Routes API pour l'administration du système de synchronisation automatique
 * Endpoints pour: publications, syncs, retries, logs, worker status
 */

import express from 'express';
import * as publicationService from '../services/curriculumPublicationService';
import * as autoSyncService from '../services/curriculumAutoSyncService';
import * as retryService from '../services/curriculumSyncRetryService';
import * as updateLogService from '../services/curriculumUpdateLogService';
import * as syncWorker from '../services/curriculumSyncWorker';
import {
  validateSchema,
  createPublicationSchema,
  reviewPublicationSchema,
  publishPublicationSchema,
  listPublicationsSchema,
  initiateSyncSchema,
  updateSyncStatusSchema,
  listSyncsSchema,
  resetFailedSyncsSchema,
  listUpdateLogsSchema,
  createUpdateLogSchema,
  exportLogsSchema
} from '../validations/curriculum-sync.validations';
import { ApiResponse, PaginatedResponse } from '../types/curriculum-sync.types';

const router = express.Router();

// ==================== PUBLICATIONS ====================

/**
 * POST /api/curriculum-sync/publications
 * Créer une nouvelle publication (DRAFT)
 */
router.post(
  '/publications',
  validateSchema(createPublicationSchema),
  async (req: any, res: any) => {
    try {
      const publication = await publicationService.createPublication((req as any).validatedData);
      res.status(201).json({
        success: true,
        data: publication,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create publication';
      const status = message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/curriculum-sync/publications
 * Lister les publications
 */
router.get(
  '/publications',
  validateSchema(listPublicationsSchema),
  async (req: any, res: any) => {
    try {
      const filters = (req as any).validatedData;
      const result = await publicationService.listPublications(filters);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list publications';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/curriculum-sync/publications/:id
 * Obtenir les détails d'une publication
 */
router.get('/publications/:id', async (req: any, res: any) => {
  try {
    const publication = await publicationService.getPublicationDetails((req as any).params.id);
    res.json({
      success: true,
      data: publication,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.post('/publications/:id/submit-review', async (req: any, res: any) => {
  try {
    const { submittedBy } = (req as any).body;
    if (!submittedBy) {
      return res.status(400).json({
        success: false,
        error: 'submittedBy is required'
      });
    }
    const publication = await publicationService.submitForReview((req as any).params.id, submittedBy);
    res.json({
      success: true,
      data: publication,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.post(
  '/publications/:id/review',
  validateSchema(reviewPublicationSchema),
  async (req: any, res: any) => {
    try {
      const { approved, comments } = (req as any).validatedData;
      const { submittedBy } = (req as any).body;  // Also accept submittedBy in body
      
      const publication = await publicationService.reviewPublication({
        publicationId: (req as any).params.id,
        reviewedBy: submittedBy || (req as any).body.reviewedBy || 'admin',
        approved,
        comments
      });
      res.json({
        success: true,
        data: publication,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to review publication';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/curriculum-sync/publications/:id/publish
 * Publier une publication approuvée
 */
router.post(
  '/publications/:id/publish',
  validateSchema(publishPublicationSchema),
  async (req: any, res: any) => {
    try {
      const { publishedBy, shouldAutoSync } = (req as any).validatedData;
      const publication = await publicationService.publishPublication(
        (req as any).params.id,
        publishedBy,
        shouldAutoSync
      );
      res.status(202).json({  // 202 Accepted (async operation)
        success: true,
        data: publication,
        message: 'Publication published and syncs initiated',
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ==================== SYNCS ====================

/**
 * POST /api/curriculum-sync/sync
 * Initier une synchronisation automatique
 */
router.post(
  '/sync',
  validateSchema(initiateSyncSchema),
  async (req: any, res: any) => {
    try {
      const result = await autoSyncService.initiateAutoSync((req as any).validatedData);
      res.status(202).json({  // 202 Accepted
        success: true,
        data: result,
        message: 'Sync initiated',
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate sync';
      const status = message.includes('not found') ? 404 : message.includes('must be published') ? 400 : 500;
      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/curriculum-sync/sync/:syncId
 * Obtenir le statut d'une synchronisation
 */
router.get('/sync/:syncId', async (req: any, res: any) => {
  try {
    const sync = await autoSyncService.getSyncStatus((req as any).params.syncId);
    res.json({
      success: true,
      data: sync,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.get('/curriculum/:curriculumId/syncs', async (req: any, res: any) => {
  try {
    const { status, limit = 100 } = (req as any).query;
    const syncs = await autoSyncService.getCurriculumSyncs(
      (req as any).params.curriculumId,
      status as any,
      Number(limit)
    );
    res.json({
      success: true,
      data: syncs,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.get('/curriculum/:curriculumId/summary', async (req: any, res: any) => {
  try {
    const summary = await autoSyncService.getCurriculumSyncSummary((req as any).params.curriculumId);
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.post('/curriculum/:curriculumId/reset-failed', async (req: any, res: any) => {
  try {
    const result = await autoSyncService.resetFailedSyncs((req as any).params.curriculumId);
    res.json({
      success: true,
      data: result,
      message: `${result.count} failed syncs reset to PENDING`,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.get('/sync/:syncId/retries', async (req: any, res: any) => {
  try {
    const retries = await retryService.getRetries((req as any).params.syncId);
    res.json({
      success: true,
      data: retries,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.get('/curriculum/:curriculumId/retry-stats', async (req: any, res: any) => {
  try {
    const stats = await retryService.getRetryStats((req as any).params.curriculumId);
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.get(
  '/sync/:syncId/updates',
  async (req: any, res: any) => {
    try {
      const { changeType, entityType, limit = 100, offset = 0 } = (req as any).query;
      const result = await updateLogService.getUpdateLogs((req as any).params.syncId, {
        changeType: changeType as string,
        entityType: entityType as string,
        limit: Number(limit),
        offset: Number(offset)
      });
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get update logs';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/curriculum-sync/sync/:syncId/updates/summary
 * Résumé des changements
 */
router.get('/sync/:syncId/updates/summary', async (req: any, res: any) => {
  try {
    const summary = await updateLogService.getUpdateSummary((req as any).params.syncId);
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.get('/sync/:syncId/updates/changelog', async (req: any, res: any) => {
  try {
    const changelog = await updateLogService.generateChangelogText((req as any).params.syncId);
    res.set('Content-Type', 'text/plain');
    res.send(changelog);
  } catch (error) {
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
router.get(
  '/sync/:syncId/updates/export',
  async (req: any, res: any) => {
    try {
      const format = ((req as any).query.format as 'json' | 'csv') || 'json';
      const exported = await updateLogService.exportSyncLogs((req as any).params.syncId, format);

      if (format === 'csv') {
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename="sync-logs.csv"`);
      } else {
        res.set('Content-Type', 'application/json');
      }

      res.send(exported);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export logs';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ==================== WORKER STATUS ====================

/**
 * GET /api/curriculum-sync/worker/status
 * Obtenir le statut du worker de sync
 */
router.get('/worker/status', async (req: any, res: any) => {
  try {
    const status = await syncWorker.getWorkerStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.post('/worker/process-pending', async (req: any, res: any) => {
  try {
    const results = await syncWorker.processPendingSyncs();
    res.status(202).json({  // 202 Accepted
      success: true,
      data: {
        processed: results?.length || 0,
        results
      },
      message: 'Processing pending syncs',
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.post('/worker/process-retries', async (req: any, res: any) => {
  try {
    await syncWorker.processRetries();
    res.status(202).json({  // 202 Accepted
      success: true,
      data: { message: 'Processing retries' },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
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
router.get('/health', async (req: any, res: any) => {
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
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Service unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
