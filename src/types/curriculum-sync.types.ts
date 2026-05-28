/**
 * Types TypeScript pour le système de synchronisation automatique
 */

import { CurriculumType, SyncStatus, PublicationStatus, SyncRetryStrategy, SyncFrequency } from '@prisma/client';

// ==================== PUBLICATION ====================

export interface CurriculumPublicationDTO {
  id: string;
  curriculumId: string;
  versionId: string;
  status: PublicationStatus;
  title: string;
  description?: string;
  changesSummary?: string;
  publishedBy?: string;
  publishedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePublicationRequest {
  curriculumId: string;
  versionId: string;
  title: string;
  description?: string;
  changesSummary?: string;
  publishedBy: string;  // Super Admin user ID
  targetSchools?: string[];  // null = all schools
}

export interface ReviewPublicationRequest {
  publicationId: string;
  approved: boolean;
  comments?: string;
}

// ==================== SYNC ====================

export interface CurriculumSyncDTO {
  id: string;
  curriculumId: string;
  schoolId: string;
  status: SyncStatus;
  version?: number;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastAttemptAt?: Date;
  syncedAt?: Date;
  syncedBy?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InitiateSyncRequest {
  curriculumId: string;
  schoolIds: string[];
  initiatedBy: string;
  maxConcurrent?: number;
}

export interface SyncStatusResponse {
  syncId: string;
  status: SyncStatus;
  curriculumName: string;
  schoolName: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  errorMessage?: string;
  progress: {
    percentage: number;
    changes: number;
    duration: number;
  };
}

export interface CurriculumSyncSummary {
  curriculumId: string;
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  partial: number;
  successRate: number;
  lastSyncAt?: Date;
}

// ==================== RETRY ====================

export interface CurriculumSyncRetryDTO {
  id: string;
  curriculumSyncId: string;
  attempt: number;
  strategy: SyncRetryStrategy;
  error?: string;
  errorStack?: string;
  scheduledFor: Date;
  executedAt?: Date;
  success: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface RetryStatusResponse {
  retry: CurriculumSyncRetryDTO;
  isReadyForRetry: boolean;
  timeSinceScheduled: number;
  status: 'completed' | 'pending';
}

export interface RetryStatsResponse {
  totalSyncs: number;
  syncsWithRetries: number;
  totalRetryAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetriesPerSync: number;
}

// ==================== UPDATE LOG ====================

export interface CurriculumUpdateLogDTO {
  id: string;
  curriculumSyncId: string;
  changeType: 'ADD' | 'UPDATE' | 'DELETE' | 'REORDER';
  entityType: string;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  appliedAt: Date;
  appliedBy?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLogSummary {
  total: number;
  byChangeType: {
    add: number;
    update: number;
    delete: number;
    reorder: number;
  };
  byEntityType: Record<string, number>;
  details: CurriculumUpdateLogDTO[];
}

// ==================== SYNC SCHEDULE ====================

export interface CurriculumSyncScheduleDTO {
  id: string;
  curriculumId: string;
  frequency: SyncFrequency;
  enabled: boolean;
  nextSyncAt?: Date;
  lastSyncAt?: Date;
  targetSchools?: string[];
  maxConcurrent: number;
  timeoutSeconds: number;
  syncWindowStart?: string;  // HH:MM format
  syncWindowEnd?: string;    // HH:MM format
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSyncScheduleRequest {
  curriculumId: string;
  frequency: SyncFrequency;
  enabled?: boolean;
  targetSchools?: string[];
  maxConcurrent?: number;
  timeoutSeconds?: number;
  syncWindowStart?: string;
  syncWindowEnd?: string;
}

// ==================== PUBLICATION LOG ====================

export interface CurriculumPublicationLogDTO {
  id: string;
  curriculumId: string;
  version: number;
  action: string;  // published, archived, updated, synced, etc.
  publishedBy: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ==================== WORKER STATUS ====================

export interface WorkerStatusResponse {
  status: 'running' | 'stopped' | 'error';
  syncs: {
    pending: number;
    syncing: number;
    failed: number;
    synced: number;
  };
  retries: {
    pending: number;
  };
  lastCheck: string;
}

// ==================== SYNC RESULT ====================

export interface SyncResult {
  syncId: string;
  schoolId: string;
  curriculumId: string;
  status: 'success' | 'failed' | 'timeout';
  error?: string;
  changes?: number;
  duration: number;
  timestamp: Date;
}

export interface SyncBatchResult {
  total: number;
  successful: number;
  failed: number;
  timedOut: number;
  averageDuration: number;
  totalChanges: number;
  results: SyncResult[];
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ==================== REQUEST FILTERS ====================

export interface ListPublicationsFilter {
  curriculumId?: string;
  status?: PublicationStatus;
  limit?: number;
  offset?: number;
}

export interface ListUpdateLogsFilter {
  curriculumSyncId: string;
  changeType?: 'ADD' | 'UPDATE' | 'DELETE' | 'REORDER';
  entityType?: string;
  limit?: number;
  offset?: number;
}

export interface ListSyncsFilter {
  curriculumId?: string;
  schoolId?: string;
  status?: SyncStatus;
  limit?: number;
  offset?: number;
}

// ==================== ERROR TYPES ====================

export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class PublicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'PublicationError';
  }
}

export class RetryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'RetryError';
  }
}
