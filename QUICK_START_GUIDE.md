# 🚀 QUICK START GUIDE - Auto-Sync System

## 5 Minutes Setup

### 1. Migration DB (2 min)

```bash
cd /tmp/NeoClass-Architecture
npx prisma migrate dev --name add_auto_sync_system
```

✅ Créé 4 tables + enums

### 2. Vérifier Services (30 sec)

```bash
ls -la src/services/curriculum*
# curriculum{Publication,AutoSync,SyncRetry,UpdateLog}Service.ts
# curriculumSyncWorker.ts
```

### 3. Compiler (1 min)

```bash
npm run build
```

✅ 0 erreurs TypeScript

### 4. Démarrer (1 min)

```bash
npm start
```

✅ Logs:
```
🚀 NeoClass API running on http://localhost:4000
📚 Curriculum Management: http://localhost:4000/api/curricula
🔄 Auto-Sync System: http://localhost:4000/api/curriculum-sync
🔄 Starting Auto-Sync Worker...
```

### 5. Test Health (30 sec)

```bash
curl http://localhost:4000/api/curriculum-sync/health
```

✅ Response: `{"success": true, "data": {"status": "healthy", ...}}`

---

## 10 Minutes Complete Workflow

### Étape 1: Créer Publication

```bash
curl -X POST http://localhost:4000/api/curriculum-sync/publications \
  -H "Content-Type: application/json" \
  -d '{
    "curriculumId": "your-curriculum-id",
    "versionId": "v-1",
    "title": "Curriculum Guinée 2024",
    "description": "Mise à jour pédagogique",
    "changesSummary": "- 3 chapitres ajoutés\n- 15 exercices révisés",
    "publishedBy": "super-admin-id",
    "targetSchools": null
  }'
```

Copier `publicationId` du response

### Étape 2: Submit for Review

```bash
curl -X POST http://localhost:4000/api/curriculum-sync/publications/{publicationId}/submit-review \
  -H "Content-Type: application/json" \
  -d '{"submittedBy": "super-admin-id"}'
```

Status: `REVIEWING`

### Étape 3: Approuver

```bash
curl -X POST http://localhost:4000/api/curriculum-sync/publications/{publicationId}/review \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "comments": "Contenu validé"
  }'
```

Status: `APPROVED`

### Étape 4: Publier (Déclenche Syncs!)

```bash
curl -X POST http://localhost:4000/api/curriculum-sync/publications/{publicationId}/publish \
  -H "Content-Type: application/json" \
  -d '{
    "publishedBy": "super-admin-id",
    "shouldAutoSync": true
  }'
```

Status: `PUBLISHED`
Response: 202 (Async)

### Étape 5: Attendre et Vérifier Syncs

```bash
# Immédiatement après publish: syncs créés en PENDING
curl http://localhost:4000/api/curriculum-sync/curriculum/{curriculumId}/summary

# Réponse exemple:
# {
#   "total": 150,
#   "pending": 150,
#   "syncing": 0,
#   "synced": 0,
#   "failed": 0,
#   "partial": 0,
#   "successRate": 0
# }
```

### Étape 6: Worker Traite les Syncs

```bash
# (Attendre 1 minute pour que worker démarre son cycle)

curl http://localhost:4000/api/curriculum-sync/curriculum/{curriculumId}/summary

# Réponse exemple (quelques minutes après):
# {
#   "total": 150,
#   "pending": 0,
#   "syncing": 0,
#   "synced": 147,
#   "failed": 3,
#   "partial": 0,
#   "successRate": 98
# }
```

### Étape 7: Voir Logs de Changements

```bash
# Obtenir un sync ID d'abord
curl http://localhost:4000/api/curriculum-sync/curriculum/{curriculumId}/syncs

# Puis voir ses changements
curl http://localhost:4000/api/curriculum-sync/sync/{syncId}/updates/summary

# Réponse:
# {
#   "total": 45,
#   "byChangeType": {"add": 30, "update": 15, "delete": 0, "reorder": 0},
#   "byEntityType": {"SUBJECT": 3, "CHAPTER": 15, "LESSON": 27}
# }
```

### Étape 8: Voir Retries (si erreurs)

```bash
# Voir échoués
curl http://localhost:4000/api/curriculum-sync/curriculum/{curriculumId}/syncs?status=FAILED

# Voir retries pour l'un d'eux
curl http://localhost:4000/api/curriculum-sync/sync/{failedSyncId}/retries

# Réinitialiser pour relancer
curl -X POST http://localhost:4000/api/curriculum-sync/curriculum/{curriculumId}/reset-failed
```

---

## Key Endpoints Cheat Sheet

```bash
# PUBLICATIONS
POST   /api/curriculum-sync/publications              # Create
GET    /api/curriculum-sync/publications              # List
GET    /api/curriculum-sync/publications/{id}         # Get
POST   /api/curriculum-sync/publications/{id}/submit-review
POST   /api/curriculum-sync/publications/{id}/review
POST   /api/curriculum-sync/publications/{id}/publish

# SYNCS
POST   /api/curriculum-sync/sync                       # Initiate manual
GET    /api/curriculum-sync/sync/{syncId}              # Get status
GET    /api/curriculum-sync/curriculum/{id}/syncs      # List
GET    /api/curriculum-sync/curriculum/{id}/summary    # Global status
POST   /api/curriculum-sync/curriculum/{id}/reset-failed

# LOGS
GET    /api/curriculum-sync/sync/{syncId}/updates      # List updates
GET    /api/curriculum-sync/sync/{syncId}/updates/summary
GET    /api/curriculum-sync/sync/{syncId}/updates/changelog
GET    /api/curriculum-sync/sync/{syncId}/updates/export?format=csv

# RETRIES
GET    /api/curriculum-sync/sync/{syncId}/retries
GET    /api/curriculum-sync/curriculum/{id}/retry-stats

# WORKER
GET    /api/curriculum-sync/health
GET    /api/curriculum-sync/worker/status
POST   /api/curriculum-sync/worker/process-pending     # Test only
```

---

## Statuts de Sync Expliqués

| Status | Signification | Action |
|--------|---------------|--------|
| **PENDING** | En attente de traitement | Worker va le traiter |
| **SYNCING** | En cours de transmission | Attendre... |
| **SYNCED** | ✅ Succès! | Rien, c'est fait |
| **FAILED** | ❌ Erreur lors transmission | Retry auto dans quelques minutes |
| **PARTIAL** | ⚠️ Partiellement synced | Retry automatique |

---

## Stratégies de Retry

| Stratégie | Délais | Usage |
|-----------|--------|-------|
| **EXPONENTIAL** | 1m, 2m, 4m, 8m, 16m | Par défaut (surcharges réseau) |
| **LINEAR** | 1m, 2m, 3m, 4m, 5m | Problèmes API lents |
| **IMMEDIATE** | 30s, 30s, 30s... | Problèmes intermittents |

---

## Troubleshooting

### Problem: "Cannot find module './routes/curriculum-sync.routes'"

```bash
# Solution: Vérifier fichier existe
ls -la src/routes/curriculum-sync.routes.ts

# Si absent: Error lors création fichier, relancer
npm run build
```

### Problem: "Sync status stuck at PENDING"

```bash
# Solution: Vérifier worker est actif
curl http://localhost:4000/api/curriculum-sync/worker/status

# Si `pending: 0` dans syncs mais status PENDING, forcer manuellement:
curl -X POST http://localhost:4000/api/curriculum-sync/worker/process-pending
```

### Problem: "Migration failed"

```bash
# Solution: Reset et relancer
npx prisma migrate reset --force  # ⚠️ ATTENTION: Supprime all data
npm run build
npm start
```

### Problem: "TypeScript compilation errors"

```bash
# Solution: Vérifier prisma client généré
npx prisma generate
npm run build
```

---

## File Checklist

```
✅ Prisma Schema
   prisma/schema.prisma (+ 4 models, 3 enums)

✅ Services (5 fichiers)
   src/services/curriculumPublicationService.ts
   src/services/curriculumAutoSyncService.ts
   src/services/curriculumSyncRetryService.ts
   src/services/curriculumUpdateLogService.ts
   src/services/curriculumSyncWorker.ts

✅ Types & Validation
   src/types/curriculum-sync.types.ts
   src/validations/curriculum-sync.validations.ts

✅ Routes
   src/routes/curriculum-sync.routes.ts

✅ Server Integration
   src/server.ts (updated)

✅ Documentation
   AUTO_SYNC_SYSTEM_DOCUMENTATION.md
   AUTO_SYNC_IMPLEMENTATION_SUMMARY.md
   QUICK_START_GUIDE.md (ce fichier)
```

---

## Next Steps

1. ✅ Migration DB
2. ✅ Compilation
3. ✅ Test endpoints
4. ✅ Configure production (env vars, DB, etc.)
5. ✅ Production deploy
6. ✅ Monitor worker status
7. ✅ Setup alerts (optional)

---

## Support

**Documentation complète**: `AUTO_SYNC_SYSTEM_DOCUMENTATION.md`
**Détails techniques**: `AUTO_SYNC_IMPLEMENTATION_SUMMARY.md`
**Exemples curl**: Voir documentation

---

**Système prêt! 🚀**
