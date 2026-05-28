# 🔄 SYSTÈME DE SYNCHRONISATION AUTOMATIQUE - Documentation Complète

## 📋 Table des Matières
1. Architecture générale
2. Modèles de données
3. Services métier
4. Workflow de publication
5. Workflow de synchronisation
6. Gestion des retries
7. Logging et audit
8. API endpoints
9. Configuration worker
10. Exemples d'utilisation

---

## 1️⃣ Architecture Générale

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│ SUPER ADMIN INTERFACE (Web/Mobile)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Modifie Curriculum National/Quranic                          │
│  2. Crée une Publication (DRAFT)                                 │
│  3. Soumet pour Review (REVIEWING)                               │
│  4. Admin approuve (APPROVED)                                    │
│  5. Publie (PUBLISHED)                                           │
│                                                                   │
│  ↓                                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SYSTÈME DE SYNC AUTOMATIQUE (Backend)                   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                           │    │
│  │ • CurriculumPublication (workflow)                       │    │
│  │ • CurriculumSync (traçage par école)                    │    │
│  │ • CurriculumSyncRetry (retry automatique)               │    │
│  │ • CurriculumUpdateLog (changements appliqués)           │    │
│  │ • CurriculumSyncSchedule (planning)                     │    │
│  │                                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        ↓                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ AUTO SYNC WORKER (Arrière-plan)                         │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                           │    │
│  │ Toutes les heures (configurable):                       │    │
│  │  1. Récupère syncs PENDING                              │    │
│  │  2. Transmet aux écoles (batch)                         │    │
│  │  3. Met à jour statuts (SYNCED/FAILED)                 │    │
│  │  4. Crée logs de changements                            │    │
│  │  5. Gère retries automatiques                           │    │
│  │  6. Nettoie vieux logs                                  │    │
│  │                                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        ↓                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ÉCOLES (Multiples)                                      │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                           │    │
│  │ Chaque école reçoit:                                    │    │
│  │  • Curriculum complet                                  │    │
│  │  • Toutes les leçons, exercices, quizzes              │    │
│  │  • Logs de changements (audit trail)                  │    │
│  │  • SANS supprimer ses données locales                 │    │
│  │                                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de données

```
Master Curriculum (NATIONAL/QURANIC)
    ↓ [Publier]
Publication (DRAFT → REVIEWING → APPROVED → PUBLISHED)
    ↓ [Auto-publication]
CurriculumSync Records (1 par école, PENDING → SYNCING → SYNCED)
    ↓ [Worker toutes les heures]
Transmission API à chaque école
    ↓ [Si erreur]
CurriculumSyncRetry (1min, 2min, 4min, 8min... ou 1min, 2min, 3min...)
    ↓ [Succès]
CurriculumUpdateLog (Audit trail complet)
```

---

## 2️⃣ Modèles de Données

### Schema Prisma - Nouveaux Enums

```prisma
enum PublicationStatus {
  DRAFT        // En brouillon
  REVIEWING    // En attente de review
  APPROVED     // Approuvée
  PUBLISHED    // Publiée (déclenche syncs)
  REJECTED     // Rejetée
}

enum SyncRetryStrategy {
  EXPONENTIAL  // 1min, 2min, 4min, 8min, 16min...
  LINEAR       // 1min, 2min, 3min, 4min, 5min...
  IMMEDIATE    // Retry immédiatement (30sec)
}

enum SyncFrequency {
  IMMEDIATE    // Immédiatement après publication
  HOURLY       // Chaque heure
  DAILY        // Chaque jour
  WEEKLY       // Chaque semaine
  MONTHLY      // Chaque mois
}
```

### Schema Prisma - Nouveaux Modèles

#### **CurriculumPublication** - Workflow de publication

```prisma
model CurriculumPublication {
  id                String @id
  curriculumId      String (FK)
  versionId         String (FK)
  
  status            PublicationStatus  // DRAFT|REVIEWING|APPROVED|PUBLISHED|REJECTED
  title             String
  description       String?
  changesSummary    String?
  
  publishedBy       String?  // Super Admin user ID
  publishedAt       DateTime?
  reviewedBy        String?  // Admin reviewer
  reviewedAt        DateTime?
  reviewComments    String?
  
  metadata          Json?    // {targetSchools, timestamps, etc}
  
  createdAt         DateTime
  updatedAt         DateTime
  
  @@unique([curriculumId, versionId])
}
```

#### **CurriculumSync** - Traçage par école (Amélioré)

```prisma
model CurriculumSync {
  id                String @id
  curriculumId      String (FK)
  schoolId          String (FK)
  
  status            SyncStatus  // PENDING|SYNCING|SYNCED|FAILED|PARTIAL
  version           Int?        // Version synced
  
  // Retry management
  attemptCount      Int @default(0)
  maxAttempts       Int @default(5)
  nextRetryAt       DateTime?   // Quand retry?
  lastAttemptAt     DateTime?
  
  syncedAt          DateTime?
  syncedBy          String?
  errorMessage      String?
  
  metadata          Json?       // {changes, delta, progress}
  retries           CurriculumSyncRetry[]
  updateLogs        CurriculumUpdateLog[]
  
  createdAt         DateTime
  updatedAt         DateTime
  
  @@unique([curriculumId, schoolId])
}
```

#### **CurriculumSyncRetry** - Retry automatique

```prisma
model CurriculumSyncRetry {
  id                String @id
  curriculumSyncId  String (FK)
  
  attempt           Int     // Numéro tentative (1, 2, 3...)
  strategy          SyncRetryStrategy
  
  error             String?
  errorStack        String?
  
  scheduledFor      DateTime
  executedAt        DateTime?
  success           Boolean @default(false)
  
  metadata          Json?   // {context, etc}
  createdAt         DateTime
  
  @@index([scheduledFor], [success], [attempt])
}
```

#### **CurriculumUpdateLog** - Audit trail

```prisma
model CurriculumUpdateLog {
  id                String @id
  curriculumSyncId  String (FK)
  
  changeType        String  // ADD|UPDATE|DELETE|REORDER
  entityType        String  // SUBJECT|CHAPTER|LESSON|EXERCISE|QUIZ
  entityId          String
  
  oldValue          Json?   // Ancienne valeur
  newValue          Json?   // Nouvelle valeur
  
  appliedAt         DateTime @default(now())
  appliedBy         String?
  
  metadata          Json?   // Contexte
  
  @@index([curriculumSyncId], [changeType], [entityType])
}
```

#### **CurriculumSyncSchedule** - Planning automatique

```prisma
model CurriculumSyncSchedule {
  id                String @id
  curriculumId      String @unique (FK)
  
  frequency         SyncFrequency @default(IMMEDIATE)
  enabled           Boolean @default(true)
  
  nextSyncAt        DateTime?
  lastSyncAt        DateTime?
  
  targetSchools     Json?           // Array d'IDs, null=toutes
  maxConcurrent     Int @default(5)
  timeoutSeconds    Int @default(300)
  
  syncWindowStart   String?  // HH:MM (ex: "22:00")
  syncWindowEnd     String?  // HH:MM (ex: "06:00")
  
  metadata          Json?
  createdAt         DateTime
  updatedAt         DateTime
}
```

---

## 3️⃣ Services Métier

### Service: `curriculumPublicationService.ts`

Gère le workflow de publication (DRAFT → REVIEWING → APPROVED → PUBLISHED)

```typescript
// Créer publication en DRAFT
await createPublication({
  curriculumId,
  versionId,
  title,
  description,
  changesSummary,
  publishedBy,        // Super Admin
  targetSchools: null // null = toutes écoles
});

// Soumettre pour review
await submitForReview(publicationId, submittedBy);

// Reviewer approuve/rejette
await reviewPublication({
  publicationId,
  approved: true,
  comments: "Looks good"
});

// Publier (déclenche syncs auto)
await publishPublication(publicationId, publishedBy, shouldAutoSync);

// Lister/obtenir
await listPublications(filters);
await getPublicationDetails(publicationId);
```

### Service: `curriculumAutoSyncService.ts`

Orchestration des syncs automatiques

```typescript
// Initier sync vers écoles
await initiateAutoSync({
  curriculumId,
  schoolIds: ['school1', 'school2', ...],
  initiatedBy: 'admin',
  maxConcurrent: 5
});

// Obtenir statut
await getSyncStatus(curriculumSyncId);

// Mettre à jour statut
await updateSyncStatus({
  curriculumSyncId,
  status: 'SYNCED',
  changes: {}
});

// Marquer comme terminée
await completeSyncForSchool(curriculumId, schoolId, completedBy);

// Statistiques
await getCurriculumSyncSummary(curriculumId);
// Retour: {total, pending, syncing, synced, failed, partial, successRate}

// Réinitialiser échoués
await resetFailedSyncs(curriculumId);
```

### Service: `curriculumSyncRetryService.ts`

Gestion des retries avec stratégies

```typescript
// Créer retry avec backoff exponentiel
await createRetry({
  curriculumSyncId,
  attempt: 1,
  strategy: 'EXPONENTIAL',  // 1min, 2min, 4min, 8min...
  error: 'Connection timeout'
});

// Calculer délai (interne)
calculateRetryDelay(attempt, strategy);
// EXPONENTIAL: 60 * 2^(attempt-1) secondes
// LINEAR: 60 * attempt secondes
// IMMEDIATE: 30 secondes

// Retries en attente (pour worker)
await getPendingRetries(limit);

// Statistiques retry
await getRetryStats(curriculumId);
// {totalSyncs, syncsWithRetries, totalRetryAttempts, ...}
```

### Service: `curriculumUpdateLogService.ts`

Logging complète des changements

```typescript
// Créer log de changement
await createUpdateLog({
  curriculumSyncId,
  changeType: 'ADD',        // ADD|UPDATE|DELETE|REORDER
  entityType: 'LESSON',
  entityId: lessonId,
  oldValue: null,
  newValue: { title: '...', content: '...' },
  appliedBy: 'system'
});

// Résumé des changements
await getUpdateSummary(curriculumSyncId);
// {total, byChangeType: {add, update, delete, reorder}, byEntityType: {...}}

// Générer changelog texte
await generateChangelogText(curriculumSyncId);

// Exporter (JSON ou CSV)
await exportSyncLogs(curriculumSyncId, 'csv');

// Nettoyer vieux logs (> 90 jours)
await cleanupOldLogs(90);
```

### Worker: `curriculumSyncWorker.ts`

Exécution automatique en arrière-plan

```typescript
// Démarrer au boot du serveur
startAutoSyncWorker();
// Exécute:
//  - processPendingSyncs() toutes les heures
//  - processRetries() toutes les heures
//  - cleanupOldLogs() tous les jours

// Status du worker
await getWorkerStatus();
// {syncs: {pending, syncing, failed, synced}, retries: {pending}}

// Traiter manuellement (pour tests)
await processPendingSyncs();
await processRetries();
```

---

## 4️⃣ Workflow de Publication

### Étape 1: Créer Publication (DRAFT)

```bash
POST /api/curriculum-sync/publications
{
  "curriculumId": "curr-123",
  "versionId": "v-456",
  "title": "Curriculum Guinée 2024 - Patch Février",
  "description": "Mise à jour pédagogique...",
  "changesSummary": "- 3 chapitres ajoutés\n- 15 exercices révisés",
  "publishedBy": "admin-super",
  "targetSchools": null  // null = toutes écoles
}
```

Réponse:
```json
{
  "success": true,
  "data": {
    "id": "pub-789",
    "status": "DRAFT",
    "curriculumId": "curr-123",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Étape 2: Soumettre pour Review (REVIEWING)

```bash
POST /api/curriculum-sync/publications/{id}/submit-review
{
  "submittedBy": "admin-super"
}
```

### Étape 3: Reviewer Approuve (APPROVED)

```bash
POST /api/curriculum-sync/publications/{id}/review
{
  "approved": true,
  "comments": "Contenu validé, prêt pour publication"
}
```

Ou rejette:
```bash
POST /api/curriculum-sync/publications/{id}/review
{
  "approved": false,
  "comments": "Les images ne correspondent pas au contexte"
}
```

### Étape 4: Publier (PUBLISHED)

```bash
POST /api/curriculum-sync/publications/{id}/publish
{
  "publishedBy": "admin-super",
  "shouldAutoSync": true  // Déclenche syncs auto
}
```

Réponse (202 Accepted = async):
```json
{
  "success": true,
  "data": {
    "id": "pub-789",
    "status": "PUBLISHED",
    "publishedAt": "2024-01-15T10:15:00Z"
  },
  "message": "Publication published and syncs initiated"
}
```

---

## 5️⃣ Workflow de Synchronisation

### Vue d'ensemble

```
Publication créée (DRAFT)
    ↓
Approuvée (APPROVED)
    ↓
Publiée (PUBLISHED)
    ↓
Pour chaque école:
    ├─ Créer CurriculumSync (PENDING)
    ├─ Attendre worker...
    ├─ Transmettre à école (SYNCING)
    ├─ Si OK → SYNCED
    ├─ Si erreur → FAILED → Créer CurriculumSyncRetry
    └─ Si retry OK → SYNCED
```

### Initier Sync Manuel

```bash
POST /api/curriculum-sync/sync
{
  "curriculumId": "curr-123",
  "schoolIds": ["school-1", "school-2", "school-3"],
  "initiatedBy": "admin",
  "maxConcurrent": 5
}
```

Réponse:
```json
{
  "success": true,
  "data": {
    "totalScheduled": 3,
    "syncs": [...],
    "maxConcurrent": 5,
    "estimatedTime": "5 minutes"
  }
}
```

### Obtenir Statut Global

```bash
GET /api/curriculum-sync/curriculum/curr-123/summary
```

Réponse:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 0,
    "syncing": 0,
    "synced": 148,
    "failed": 2,
    "partial": 0,
    "successRate": 98.67
  }
}
```

### Lister Tous les Syncs d'un Curriculum

```bash
GET /api/curriculum-sync/curriculum/curr-123/syncs?status=FAILED&limit=50
```

### Réinitialiser les Syncs Échoués

```bash
POST /api/curriculum-sync/curriculum/curr-123/reset-failed
```

---

## 6️⃣ Gestion des Retries

### Stratégies de Retry

#### **EXPONENTIAL** (Backoff exponentiel)

```
Attempt 1: 1min
Attempt 2: 2min
Attempt 3: 4min
Attempt 4: 8min
Attempt 5: 16min
```

✅ Bon pour: Surcharges réseau temporaires

#### **LINEAR** (Backoff linéaire)

```
Attempt 1: 1min
Attempt 2: 2min
Attempt 3: 3min
Attempt 4: 4min
Attempt 5: 5min
```

✅ Bon pour: Problèmes qui se résolvent lentement

#### **IMMEDIATE** (Retry immédiat)

```
Tous les: 30 secondes
```

✅ Bon pour: Problèmes intermittents

### Workflow Retry

```
Sync échoue (FAILED)
    ↓
Créer CurriculumSyncRetry
    - attempt = 1
    - strategy = EXPONENTIAL (ou linéaire)
    - scheduledFor = now + délai
    - success = false
    ↓
Attendre worker (toutes les heures)
    ↓
Worker: isPending = true && scheduledFor <= now?
    ↓
Exécuter retry (appel API école)
    ↓
Si OK:
    - Marquer retry comme success = true
    - Mettre à jour sync à SYNCED
Si erreur:
    - Créer nouveau CurriculumSyncRetry
    - attempt = 2, scheduledFor = now + délai (plus long)
```

### API Retries

```bash
# Obtenir tentatives pour un sync
GET /api/curriculum-sync/sync/{syncId}/retries

# Statistiques retry pour un curriculum
GET /api/curriculum-sync/curriculum/{curriculumId}/retry-stats
```

---

## 7️⃣ Logging et Audit

### CurriculumUpdateLog

Chaque changement lors du sync est logué:

```bash
# Lister changements pour un sync
GET /api/curriculum-sync/sync/{syncId}/updates?changeType=ADD&entityType=LESSON

# Résumé
GET /api/curriculum-sync/sync/{syncId}/updates/summary

# Générer changelog texte
GET /api/curriculum-sync/sync/{syncId}/updates/changelog

# Exporter JSON ou CSV
GET /api/curriculum-sync/sync/{syncId}/updates/export?format=csv
```

### Logs Disponibles

```
CurriculumPublicationLog:
  - publication_created
  - publication_submitted_for_review
  - publication_approved
  - publication_rejected
  - publication_published
  - auto_sync_initiated
  - sync_completed
  - sync_failed

CurriculumUpdateLog:
  - changeType: ADD, UPDATE, DELETE, REORDER
  - entityType: CURRICULUM, SUBJECT, CHAPTER, LESSON, EXERCISE, QUIZ, ...
```

---

## 8️⃣ API Endpoints

### Publications

```
POST   /api/curriculum-sync/publications
GET    /api/curriculum-sync/publications
GET    /api/curriculum-sync/publications/:id
POST   /api/curriculum-sync/publications/:id/submit-review
POST   /api/curriculum-sync/publications/:id/review
POST   /api/curriculum-sync/publications/:id/publish
```

### Synchronisations

```
POST   /api/curriculum-sync/sync
GET    /api/curriculum-sync/sync/:syncId
GET    /api/curriculum-sync/curriculum/:curriculumId/syncs
GET    /api/curriculum-sync/curriculum/:curriculumId/summary
POST   /api/curriculum-sync/curriculum/:curriculumId/reset-failed
```

### Retries

```
GET    /api/curriculum-sync/sync/:syncId/retries
GET    /api/curriculum-sync/curriculum/:curriculumId/retry-stats
```

### Logs de Mise à Jour

```
GET    /api/curriculum-sync/sync/:syncId/updates
GET    /api/curriculum-sync/sync/:syncId/updates/summary
GET    /api/curriculum-sync/sync/:syncId/updates/changelog
GET    /api/curriculum-sync/sync/:syncId/updates/export
```

### Worker

```
GET    /api/curriculum-sync/health
GET    /api/curriculum-sync/worker/status
POST   /api/curriculum-sync/worker/process-pending    (pour tests)
POST   /api/curriculum-sync/worker/process-retries    (pour tests)
```

---

## 9️⃣ Configuration Worker

### Auto-Démarrage

Le worker démarre automatiquement au boot du serveur:

```typescript
// Dans server.ts
import * as syncWorker from './services/curriculumSyncWorker';

// Au démarrage
syncWorker.startAutoSyncWorker();
```

### Cycles de Traitement

```
Démarrage du serveur
    ↓
Exécuter processPendingSyncs() immédiatement
    ↓
Puis répéter toutes les heures:
  - processPendingSyncs()
  - processRetries()
    ↓
Cleanup tous les jours:
  - Supprimer logs > 90 jours
  - Supprimer retries réussis > 30 jours
```

### Configuration

Éditer `/src/services/curriculumSyncWorker.ts`:

```typescript
const BATCH_SIZE = 5;              // Syncs parallèles
const RETRY_DELAY_SECONDS = 30;    // Délai mini
const TIMEOUT_SECONDS = 300;       // Timeout (5min)

// Dans startAutoSyncWorker():
setInterval(() => { /* ... */ }, 60 * 60 * 1000);  // 1 heure
```

---

## 🔟 Exemples d'Utilisation Complets

### Scénario 1: Publication et Sync Simple

```bash
# 1. Créer publication
curl -X POST http://localhost:4000/api/curriculum-sync/publications \
  -H "Content-Type: application/json" \
  -d '{
    "curriculumId": "curr-123",
    "versionId": "v-1",
    "title": "Curriculum Guinée 2024",
    "publishedBy": "admin-super",
    "targetSchools": null
  }'

# 2. Soumettre pour review
curl -X POST http://localhost:4000/api/curriculum-sync/publications/pub-789/submit-review \
  -d '{"submittedBy": "admin-super"}'

# 3. Approuver
curl -X POST http://localhost:4000/api/curriculum-sync/publications/pub-789/review \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# 4. Publier (déclenche syncs auto)
curl -X POST http://localhost:4000/api/curriculum-sync/publications/pub-789/publish \
  -H "Content-Type: application/json" \
  -d '{"publishedBy": "admin-super", "shouldAutoSync": true}'

# 5. Vérifier statut (dans 1 heure max)
curl http://localhost:4000/api/curriculum-sync/curriculum/curr-123/summary
```

### Scénario 2: Sync Manuel Vers Écoles Spécifiques

```bash
# Initier sync manuel
curl -X POST http://localhost:4000/api/curriculum-sync/sync \
  -H "Content-Type: application/json" \
  -d '{
    "curriculumId": "curr-123",
    "schoolIds": ["school-guinee-1", "school-guinee-2"],
    "initiatedBy": "admin",
    "maxConcurrent": 3
  }'

# Vérifier progression
curl http://localhost:4000/api/curriculum-sync/curriculum/curr-123/summary

# Obtenir logs de changements
curl http://localhost:4000/api/curriculum-sync/sync/sync-456/updates/summary
```

### Scénario 3: Gérer les Erreurs de Sync

```bash
# Voir syncs échoués
curl http://localhost:4000/api/curriculum-sync/curriculum/curr-123/syncs?status=FAILED

# Voir tentatives retry
curl http://localhost:4000/api/curriculum-sync/sync/sync-456/retries

# Statistiques retry
curl http://localhost:4000/api/curriculum-sync/curriculum/curr-123/retry-stats

# Réinitialiser syncs échoués
curl -X POST http://localhost:4000/api/curriculum-sync/curriculum/curr-123/reset-failed
```

### Scénario 4: Exporter Audit Trail

```bash
# Changelog texte
curl http://localhost:4000/api/curriculum-sync/sync/sync-456/updates/changelog

# Exporter CSV
curl http://localhost:4000/api/curriculum-sync/sync/sync-456/updates/export?format=csv \
  > updates.csv
```

---

## ✅ Garanties du Système

✅ **Synchronisation Automatique**: Aucune intervention manuelle après publication
✅ **Idempotence**: Syncer 2x le même curriculum = même résultat
✅ **Retries Intelligents**: Backoff exponentiel, max 5 tentatives
✅ **Audit Trail Complet**: Tous les changements logués
✅ **Pas de Perte de Données**: Aucune suppression dans les écoles
✅ **Rétrocompatibilité**: Ne casse aucun code existant
✅ **Scalabilité**: Support 1000+ écoles avec worker optimisé

---

## 🚀 Déploiement

### Avant Production

```bash
# 1. Migration DB
npx prisma migrate dev --name add_auto_sync_system

# 2. Compiler
npm run build

# 3. Tests API
npm test

# 4. Démarrer
npm start
```

### Vérifications

```bash
# Health check
curl http://localhost:4000/api/curriculum-sync/health

# Worker status
curl http://localhost:4000/api/curriculum-sync/worker/status
```

---

**Système complètement opérationnel! 🎉**
