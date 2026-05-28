"use strict";
/**
 * Validations Joi pour le système de synchronisation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = exports.updateSyncScheduleSchema = exports.createSyncScheduleSchema = exports.exportLogsSchema = exports.listUpdateLogsSchema = exports.createUpdateLogSchema = exports.listRetriesSchema = exports.createRetrySchema = exports.resetFailedSyncsSchema = exports.listSyncsSchema = exports.updateSyncStatusSchema = exports.initiateSyncSchema = exports.listPublicationsSchema = exports.publishPublicationSchema = exports.reviewPublicationSchema = exports.createPublicationSchema = void 0;
exports.isValidRetryStrategy = isValidRetryStrategy;
exports.isValidSyncFrequency = isValidSyncFrequency;
exports.isValidPublicationStatus = isValidPublicationStatus;
exports.isValidPublicationStatusTransition = isValidPublicationStatusTransition;
exports.isValidTimeFormat = isValidTimeFormat;
exports.compareTimes = compareTimes;
const joi_1 = __importDefault(require("joi"));
const J = joi_1.default;
const client_1 = require("@prisma/client");
// Use alias J for Joi helpers to satisfy TypeScript typing for .cuid()
// ==================== PUBLICATION VALIDATIONS ====================
exports.createPublicationSchema = J.object({
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
exports.reviewPublicationSchema = J.object({
    publicationId: J.string().cuid().required(),
    approved: J.boolean().required(),
    comments: J.string().max(1000).allow('', null)
});
exports.publishPublicationSchema = J.object({
    publicationId: J.string().cuid().required(),
    publishedBy: J.string().cuid().required(),
    shouldAutoSync: J.boolean().default(true)
});
exports.listPublicationsSchema = J.object({
    curriculumId: J.string().cuid().allow(''),
    status: J.string().valid(...Object.values(client_1.PublicationStatus)).allow(''),
    limit: J.number().integer().min(1).max(500).default(50),
    offset: J.number().integer().min(0).default(0)
});
// ==================== SYNC VALIDATIONS ====================
exports.initiateSyncSchema = J.object({
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
exports.updateSyncStatusSchema = J.object({
    curriculumSyncId: J.string().cuid().required(),
    status: J.string().valid('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'PARTIAL').required(),
    error: J.string().max(1000).allow('', null),
    errorStack: J.string().max(5000).allow('', null),
    changes: J.object().allow(null)
});
exports.listSyncsSchema = J.object({
    curriculumId: J.string().cuid().allow(''),
    schoolId: J.string().cuid().allow(''),
    status: J.string().valid('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'PARTIAL').allow(''),
    limit: J.number().integer().min(1).max(500).default(50),
    offset: J.number().integer().min(0).default(0)
});
exports.resetFailedSyncsSchema = J.object({
    curriculumId: J.string().cuid().required()
});
// ==================== RETRY VALIDATIONS ====================
exports.createRetrySchema = J.object({
    curriculumSyncId: J.string().cuid().required(),
    attempt: J.number().integer().min(1).max(10).required(),
    strategy: J.string().valid(...Object.values(client_1.SyncRetryStrategy)).required(),
    error: J.string().max(1000).required(),
    errorStack: J.string().max(5000).allow('', null)
});
exports.listRetriesSchema = J.object({
    curriculumSyncId: J.string().cuid().required(),
    limit: J.number().integer().min(1).max(500).default(50),
    offset: J.number().integer().min(0).default(0)
});
// ==================== UPDATE LOG VALIDATIONS ====================
exports.createUpdateLogSchema = J.object({
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
exports.listUpdateLogsSchema = J.object({
    curriculumSyncId: J.string().cuid().required(),
    changeType: J.string().valid('ADD', 'UPDATE', 'DELETE', 'REORDER').allow(''),
    entityType: J.string().max(50).allow(''),
    limit: J.number().integer().min(1).max(500).default(100),
    offset: J.number().integer().min(0).default(0)
});
exports.exportLogsSchema = J.object({
    curriculumSyncId: J.string().cuid().required(),
    format: J.string().valid('json', 'csv').default('json')
});
// ==================== SYNC SCHEDULE VALIDATIONS ====================
exports.createSyncScheduleSchema = J.object({
    curriculumId: J.string().cuid().required(),
    frequency: J.string().valid(...Object.values(client_1.SyncFrequency)).required(),
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
exports.updateSyncScheduleSchema = J.object({
    frequency: J.string().valid(...Object.values(client_1.SyncFrequency)),
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
const validateSchema = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const messages = error.details.map((detail) => ({
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
exports.validateSchema = validateSchema;
// ==================== HELPER FUNCTIONS ====================
/**
 * Valider une stratégie de retry
 */
function isValidRetryStrategy(strategy) {
    return Object.values(client_1.SyncRetryStrategy).includes(strategy);
}
/**
 * Valider une fréquence de sync
 */
function isValidSyncFrequency(frequency) {
    return Object.values(client_1.SyncFrequency).includes(frequency);
}
/**
 * Valider un statut de publication
 */
function isValidPublicationStatus(status) {
    return Object.values(client_1.PublicationStatus).includes(status);
}
/**
 * Valider une transition de statut de publication
 */
function isValidPublicationStatusTransition(from, to) {
    const validTransitions = {
        [client_1.PublicationStatus.DRAFT]: [client_1.PublicationStatus.REVIEWING],
        [client_1.PublicationStatus.REVIEWING]: [client_1.PublicationStatus.APPROVED, client_1.PublicationStatus.REJECTED, client_1.PublicationStatus.DRAFT],
        [client_1.PublicationStatus.APPROVED]: [client_1.PublicationStatus.PUBLISHED, client_1.PublicationStatus.REJECTED],
        [client_1.PublicationStatus.PUBLISHED]: [], // Pas de transition après publication
        [client_1.PublicationStatus.REJECTED]: [client_1.PublicationStatus.DRAFT]
    };
    return validTransitions[from]?.includes(to) || false;
}
/**
 * Valider une heure au format HH:MM
 */
function isValidTimeFormat(time) {
    const pattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    return pattern.test(time);
}
/**
 * Comparer deux heures (ex: syncWindowStart < syncWindowEnd)
 */
function compareTimes(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const mins1 = h1 * 60 + m1;
    const mins2 = h2 * 60 + m2;
    return mins1 < mins2 ? -1 : mins1 > mins2 ? 1 : 0;
}
