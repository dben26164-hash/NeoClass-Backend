"use strict";
/**
 * Worker de synchronisation automatique
 * Exécution en arrière-plan pour:
 * - Traiter les syncs en attente
 * - Gérer les retries
 * - Mettre à jour les statuts
 * - Logs complètes
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAutoSyncWorker = startAutoSyncWorker;
exports.processPendingSyncs = processPendingSyncs;
exports.processRetries = processRetries;
exports.getWorkerStatus = getWorkerStatus;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const autoSyncService = __importStar(require("./curriculumAutoSyncService"));
const retryService = __importStar(require("./curriculumSyncRetryService"));
const updateLogService = __importStar(require("./curriculumUpdateLogService"));
// Configuration
const BATCH_SIZE = 5; // Nombre de syncs parallèles
const RETRY_DELAY_SECONDS = 30; // Délai minimum avant retry
const TIMEOUT_SECONDS = 300; // Timeout par sync
/**
 * Démarrer le worker de sync automatique
 * À appeler au démarrage du serveur
 */
async function startAutoSyncWorker() {
    console.log('🔄 Auto Sync Worker started...');
    // Exécuter les syncs immédiatement au démarrage
    await processPendingSyncs();
    // Puis exécuter toutes les heures
    setInterval(async () => {
        try {
            await processPendingSyncs();
            await processRetries();
        }
        catch (error) {
            console.error('❌ Auto Sync Worker error:', error);
        }
    }, 60 * 60 * 1000); // 1 heure
    // Cleanup des vieux logs toutes les 24h
    setInterval(async () => {
        try {
            await updateLogService.cleanupOldLogs(90);
            await retryService.cleanupOldRetries(30);
        }
        catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 heures
}
/**
 * Traiter les syncs en attente
 */
async function processPendingSyncs() {
    console.log('📤 Processing pending syncs...');
    const pending = await autoSyncService.getPendingRetries(BATCH_SIZE);
    if (pending.length === 0) {
        console.log('✅ No pending syncs');
        return;
    }
    console.log(`📦 Found ${pending.length} pending syncs, processing...`);
    const results = [];
    for (const sync of pending) {
        try {
            const result = await executeSyncToSchool(sync);
            results.push(result);
        }
        catch (error) {
            console.error(`❌ Error syncing to school ${sync.schoolId}:`, error);
        }
    }
    // Afficher un résumé
    printSyncSummary(results);
    return results;
}
/**
 * Traiter les retries en attente
 */
async function processRetries() {
    console.log('🔁 Processing pending retries...');
    const retries = await retryService.getPendingRetries(BATCH_SIZE);
    if (retries.length === 0) {
        console.log('✅ No pending retries');
        return;
    }
    console.log(`🔁 Found ${retries.length} retries to process...`);
    for (const retry of retries) {
        try {
            const result = await executeSyncToSchool(retry.curriculumSync);
            if (result.status === 'success') {
                await retryService.markRetryAsSuccess(retry.id);
                console.log(`✅ Retry ${retry.attempt} succeeded for ${retry.curriculumSync.schoolId}`);
            }
            else {
                console.log(`❌ Retry ${retry.attempt} failed for ${retry.curriculumSync.schoolId}`);
                // Créer un nouvelle tentative si on n'a pas dépassé le max
                if (retry.curriculumSync.attemptCount < retry.curriculumSync.maxAttempts) {
                    await retryService.createRetry({
                        curriculumSyncId: retry.curriculumSync.id,
                        attempt: retry.curriculumSync.attemptCount + 1,
                        strategy: retry.strategy,
                        error: result.error || 'Retry failed',
                        errorStack: result.error
                    });
                    console.log(`🔄 Next retry scheduled for attempt ${retry.curriculumSync.attemptCount + 1}`);
                }
                else {
                    console.log(`❌ Max retries reached for ${retry.curriculumSync.schoolId}`);
                }
            }
        }
        catch (error) {
            console.error(`❌ Error processing retry:`, error);
        }
    }
}
/**
 * Exécuter une synchronisation vers une école
 * C'est ici que la logique "réelle" de sync s'exécute
 */
async function executeSyncToSchool(sync) {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
        throw new Error(`Sync timeout after ${TIMEOUT_SECONDS}s`);
    }, TIMEOUT_SECONDS * 1000);
    try {
        // Marquer comme SYNCING
        await prisma_1.prisma.curriculumSync.update({
            where: { id: sync.id },
            data: { status: client_1.SyncStatus.SYNCING }
        });
        console.log(`🔄 Syncing curriculum ${sync.curriculumId} to school ${sync.schoolId}...`);
        // Simuler la transmission (à remplacer par la logique réelle)
        const changeCount = await simulateSyncTransmission(sync);
        const duration = Date.now() - startTime;
        // Marquer comme SYNCED
        await autoSyncService.updateSyncStatus({
            curriculumSyncId: sync.id,
            status: client_1.SyncStatus.SYNCED,
            changes: { transmittedAt: new Date().toISOString(), changeCount }
        });
        clearTimeout(timeout);
        return {
            syncId: sync.id,
            schoolId: sync.schoolId,
            curriculumId: sync.curriculumId,
            status: 'success',
            changes: changeCount,
            duration
        };
    }
    catch (error) {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Sync failed: ${errorMessage}`);
        // Marquer comme FAILED
        await autoSyncService.updateSyncStatus({
            curriculumSyncId: sync.id,
            status: client_1.SyncStatus.FAILED,
            error: errorMessage
        });
        // Créer une tentative de retry
        if (sync.attemptCount < sync.maxAttempts) {
            await retryService.createRetry({
                curriculumSyncId: sync.id,
                attempt: sync.attemptCount + 1,
                strategy: 'EXPONENTIAL',
                error: errorMessage
            });
        }
        return {
            syncId: sync.id,
            schoolId: sync.schoolId,
            curriculumId: sync.curriculumId,
            status: 'failed',
            error: errorMessage,
            duration
        };
    }
}
/**
 * Simuler la transmission du curriculum à une école
 * À remplacer par l'implémentation réelle (API call, webhook, etc.)
 */
async function simulateSyncTransmission(sync) {
    // Récupérer le curriculum complet avec tout le contenu
    const curriculum = await prisma_1.prisma.curriculum.findUnique({
        where: { id: sync.curriculumId },
        include: {
            subjects: {
                include: {
                    chapters: {
                        include: {
                            lessons: {
                                include: {
                                    learningObjectives: true,
                                    lessonContents: true,
                                    exercises: true,
                                    flashcards: true,
                                    quizzes: {
                                        include: { questions: true }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            versions: {
                where: { status: 'PUBLISHED' },
                take: 1
            }
        }
    });
    if (!curriculum) {
        throw new Error('Curriculum not found');
    }
    // Simuler un appel API à l'école
    // En production, cela serait un appel HTTP real vers le serveur de l'école
    const response = await simulateSchoolAPICall(sync.schoolId, curriculum);
    if (!response.success) {
        throw new Error(response.error || 'Sync transmission failed');
    }
    // Créer des logs de mise à jour
    let changeCount = 0;
    // Logger: curriculum publié
    await updateLogService.createUpdateLog({
        curriculumSyncId: sync.id,
        changeType: 'ADD',
        entityType: 'CURRICULUM',
        entityId: curriculum.id,
        newValue: {
            name: curriculum.name,
            type: curriculum.type,
            version: curriculum.versions[0]?.version
        }
    });
    changeCount++;
    // Logger: sujets ajoutés
    for (const subject of curriculum.subjects) {
        await updateLogService.createUpdateLog({
            curriculumSyncId: sync.id,
            changeType: 'ADD',
            entityType: 'SUBJECT',
            entityId: subject.id,
            newValue: { name: subject.name }
        });
        changeCount++;
    }
    return changeCount;
}
/**
 * Simuler un appel API à l'école
 * En production: remplacer par un vrai appel HTTP
 */
async function simulateSchoolAPICall(schoolId, curriculum) {
    // Simuler un appel avec 95% de succès
    const shouldSucceed = Math.random() < 0.95;
    if (!shouldSucceed) {
        return {
            success: false,
            error: 'Connection timeout'
        };
    }
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    return {
        success: true,
        schoolId,
        curriculumId: curriculum.id,
        timestamp: new Date().toISOString()
    };
}
/**
 * Afficher un résumé des résultats de sync
 */
function printSyncSummary(results) {
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    const timed = results.filter(r => r.status === 'timeout');
    console.log('📊 Sync Summary:');
    console.log(`   ✅ Successful: ${successful.length}/${results.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log(`   ⏱️  Timeout: ${timed.length}`);
    if (successful.length > 0) {
        const totalDuration = successful.reduce((sum, r) => sum + r.duration, 0);
        const avgDuration = Math.round(totalDuration / successful.length);
        console.log(`   ⏱️  Avg Duration: ${avgDuration}ms`);
        const totalChanges = successful.reduce((sum, r) => sum + (r.changes || 0), 0);
        console.log(`   📝 Total Changes: ${totalChanges}`);
    }
}
/**
 * Obtenir le statut du worker
 */
async function getWorkerStatus() {
    const pending = await prisma_1.prisma.curriculumSync.count({
        where: { status: client_1.SyncStatus.PENDING }
    });
    const syncing = await prisma_1.prisma.curriculumSync.count({
        where: { status: client_1.SyncStatus.SYNCING }
    });
    const failed = await prisma_1.prisma.curriculumSync.count({
        where: { status: client_1.SyncStatus.FAILED }
    });
    const synced = await prisma_1.prisma.curriculumSync.count({
        where: { status: client_1.SyncStatus.SYNCED }
    });
    const pendingRetries = await prisma_1.prisma.curriculumSyncRetry.count({
        where: {
            success: false,
            scheduledFor: { lte: new Date() }
        }
    });
    return {
        status: 'running',
        syncs: {
            pending,
            syncing,
            failed,
            synced
        },
        retries: {
            pending: pendingRetries
        },
        lastCheck: new Date().toISOString()
    };
}
