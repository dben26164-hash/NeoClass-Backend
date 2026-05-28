/**
 * Validations Joi pour le système de synchronisation
 */

import Joi from 'joi';
const J: any = Joi;
import { PublicationStatus, SyncRetryStrategy, SyncFrequency } from '@prisma/client';

// Use alias J for Joi helpers to satisfy TypeScript typing for .cuid()


// ==================== PUBLICATION VALIDATIONS ====================

export const createPublicationSchema = J.object({
  curriculumId: J.string().cuid().required().messages({
    'string.empty': 'Curriculum ID is required',
    'any.required': 'Curriculum ID is required'
  }),
  versionId: J.string().cuid().required().messages({
    'string.empty': 'Version ID is required',
    'any.required': 'Version ID is required'
  }),
  title: J.string().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required'
  }),
  description: J.string().max(1000).allow('', null),
  changesSummary: J.string().max(2000).allow('', null),
  publishedBy: J.string().cuid().required().messages({
    'any.required': 'publishedBy (user ID) is required'
  }),
  targetSchools: J.array().items(J.string().cuid()).max(1000).allow(null).messages({
    'array.max': 'Maximum 1000 schools can be specified'
  })
});

export const reviewPublicationSchema = J.object({
  publicationId: J.string().cuid().required(),
  approved: J.boolean().required(),
  comments: J.string().max(1000).allow('', null)
});

export const publishPublicationSchema = J.object({
  publicationId: J.string().cuid().required(),
  publishedBy: J.string().cuid().required(),
  shouldAutoSync: J.boolean().default(true)
});

export const listPublicationsSchema = J.object({
  curriculumId: J.string().cuid().allow(''),
  status: J.string().valid(...Object.values(PublicationStatus)).allow(''),
  limit: J.number().integer().min(1).max(500).default(50),
  offset: J.number().integer().min(0).default(0)
});

// ==================== SYNC VALIDATIONS ====================

export const initiateSyncSchema = J.object({
  curriculumId: J.string().cuid().required().messages({
    'any.required': 'Curriculum ID is required'
  }),
  schoolIds: J.array()
    .items(J.string().cuid())
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.min': 'At least one school ID is required',
      'array.max': 'Maximum 1000 schools can be synced at once',
      'any.required': 'schoolIds array is required'
    }),
  initiatedBy: J.string().cuid().required().messages({
    'any.required': 'initiatedBy (user ID) is required'
  }),
  maxConcurrent: J.number().integer().min(1).max(50).default(5)
});

export const updateSyncStatusSchema = J.object({
  curriculumSyncId: J.string().cuid().required(),
  status: J.string().valid('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'PARTIAL').required(),
  error: J.string().max(1000).allow('', null),
  errorStack: J.string().max(5000).allow('', null),
  changes: J.object().allow(null)
});

export const listSyncsSchema = J.object({
  curriculumId: J.string().cuid().allow(''),
  schoolId: J.string().cuid().allow(''),
  status: J.string().valid('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'PARTIAL').allow(''),
  limit: J.number().integer().min(1).max(500).default(50),
  offset: J.number().integer().min(0).default(0)
});

export const resetFailedSyncsSchema = J.object({
  curriculumId: J.string().cuid().required()
});

// ==================== RETRY VALIDATIONS ====================

export const createRetrySchema = J.object({
  curriculumSyncId: J.string().cuid().required(),
  attempt: J.number().integer().min(1).max(10).required(),
  strategy: J.string().valid(...Object.values(SyncRetryStrategy)).required(),
  error: J.string().max(1000).required(),
  errorStack: J.string().max(5000).allow('', null)
});

export const listRetriesSchema = J.object({
  curriculumSyncId: J.string().cuid().required(),
  limit: J.number().integer().min(1).max(500).default(50),
  offset: J.number().integer().min(0).default(0)
});

// ==================== UPDATE LOG VALIDATIONS ====================

export const createUpdateLogSchema = J.object({
  curriculumSyncId: J.string().cuid().required(),
  changeType: J.string().valid('ADD', 'UPDATE', 'DELETE', 'REORDER').required(),
  entityType: J.string().max(50).required().messages({
    'any.required': 'Entity type is required (e.g., SUBJECT, LESSON, QUIZ)'
  }),
  entityId: J.string().cuid().required(),
  oldValue: J.object().allow(null),
  newValue: J.object().allow(null),
  appliedBy: J.string().cuid().allow('', null)
});

export const listUpdateLogsSchema = J.object({
  curriculumSyncId: J.string().cuid().required(),
  changeType: J.string().valid('ADD', 'UPDATE', 'DELETE', 'REORDER').allow(''),
  entityType: J.string().max(50).allow(''),
  limit: J.number().integer().min(1).max(500).default(100),
  offset: J.number().integer().min(0).default(0)
});

export const exportLogsSchema = J.object({
  curriculumSyncId: J.string().cuid().required(),
  format: J.string().valid('json', 'csv').default('json')
});

// ==================== SYNC SCHEDULE VALIDATIONS ====================

export const createSyncScheduleSchema = J.object({
  curriculumId: J.string().cuid().required(),
  frequency: J.string().valid(...Object.values(SyncFrequency)).required(),
  enabled: J.boolean().default(true),
  targetSchools: J.array().items(J.string().cuid()).max(1000).allow(null),
  maxConcurrent: J.number().integer().min(1).max(50).default(5),
  timeoutSeconds: J.number().integer().min(30).max(3600).default(300),
  syncWindowStart: J.string()
    .pattern(/^\d{2}:\d{2}$/)
    .messages({ 'string.pattern.base': 'Format must be HH:MM' })
    .allow('', null),
  syncWindowEnd: J.string()
    .pattern(/^\d{2}:\d{2}$/)
    .messages({ 'string.pattern.base': 'Format must be HH:MM' })
    .allow('', null)
});

export const updateSyncScheduleSchema = J.object({
  frequency: J.string().valid(...Object.values(SyncFrequency)),
  enabled: J.boolean(),
  targetSchools: J.array().items(J.string().cuid()).max(1000).allow(null),
  maxConcurrent: J.number().integer().min(1).max(50),
  timeoutSeconds: J.number().integer().min(30).max(3600),
  syncWindowStart: J.string()
    .pattern(/^\d{2}:\d{2}$/)
    .allow('', null),
  syncWindowEnd: J.string()
    .pattern(/^\d{2}:\d{2}$/)
    .allow('', null)
}).min(1);

// ==================== VALIDATION MIDDLEWARE ====================

export const validateSchema = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors: messages
      });
    }

    req.validatedData = value;
    next();
  };
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Valider une stratégie de retry
 */
export function isValidRetryStrategy(strategy: string): strategy is SyncRetryStrategy {
  return Object.values(SyncRetryStrategy).includes(strategy as SyncRetryStrategy);
}

/**
 * Valider une fréquence de sync
 */
export function isValidSyncFrequency(frequency: string): frequency is SyncFrequency {
  return Object.values(SyncFrequency).includes(frequency as SyncFrequency);
}

/**
 * Valider un statut de publication
 */
export function isValidPublicationStatus(status: string): status is PublicationStatus {
  return Object.values(PublicationStatus).includes(status as PublicationStatus);
}

/**
 * Valider une transition de statut de publication
 */
export function isValidPublicationStatusTransition(from: PublicationStatus, to: PublicationStatus): boolean {
  const validTransitions: Record<PublicationStatus, PublicationStatus[]> = {
    [PublicationStatus.DRAFT]: [PublicationStatus.REVIEWING],
    [PublicationStatus.REVIEWING]: [PublicationStatus.APPROVED, PublicationStatus.REJECTED, PublicationStatus.DRAFT],
    [PublicationStatus.APPROVED]: [PublicationStatus.PUBLISHED, PublicationStatus.REJECTED],
    [PublicationStatus.PUBLISHED]: [],  // Pas de transition après publication
    [PublicationStatus.REJECTED]: [PublicationStatus.DRAFT]
  };

  return validTransitions[from]?.includes(to) || false;
}

/**
 * Valider une heure au format HH:MM
 */
export function isValidTimeFormat(time: string): boolean {
  const pattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return pattern.test(time);
}

/**
 * Comparer deux heures (ex: syncWindowStart < syncWindowEnd)
 */
export function compareTimes(time1: string, time2: string): -1 | 0 | 1 {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  
  const mins1 = h1 * 60 + m1;
  const mins2 = h2 * 60 + m2;
  
  return mins1 < mins2 ? -1 : mins1 > mins2 ? 1 : 0;
}
