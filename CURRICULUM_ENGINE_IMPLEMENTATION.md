# 🎓 NeoClass Universal Curriculum Engine - Implementation Guide

## ✅ Résumé des Modifications

### **Schéma Prisma - Ajouts (Sans modifications existantes)**

#### **1. Enums Ajoutés**
```prisma
enum CurriculumType {
  NATIONAL       // Curriculum national (ex: Guinée)
  QURANIC        // Curriculum coranique
  CUSTOM         // Curriculum personnalisé par école
  PROFESSIONAL   // Formations professionnelles
}

enum VersionStatus {
  DRAFT          // Version en brouillon
  PUBLISHED      // Version publiée
  ARCHIVED       // Version archivée
}

enum SyncStatus {
  PENDING        // En attente de synchronisation
  SYNCED         // Synchronisé avec succès
  FAILED         // Erreur de synchronisation
  PARTIAL        // Synchronisation partielle
}
```

#### **2. Modèles Ajoutés**

**CurriculumVersion** - Gestion des versions
```prisma
model CurriculumVersion {
  id String @id
  curriculumId String (FK → Curriculum)
  version Int (séquence unique par curriculum)
  status VersionStatus (DRAFT|PUBLISHED|ARCHIVED)
  name String?
  description String?
  changelog String?
  metadata Json? (données flexibles)
  publishedAt DateTime?
  publishedBy String? (User ID)
  createdAt DateTime
  updatedAt DateTime
}
```

**CurriculumSync** - Synchronisation vers écoles
```prisma
model CurriculumSync {
  id String @id
  curriculumId String (FK → Curriculum)
  schoolId String (FK → School)
  status SyncStatus (PENDING|SYNCED|FAILED|PARTIAL)
  version Int? (version synchronisée)
  syncedAt DateTime?
  syncedBy String? (User ID)
  errorMessage String?
  metadata Json? (logs de sync, progress, etc.)
  createdAt DateTime
  updatedAt DateTime
  
  @@unique([curriculumId, schoolId]) // 1 sync par curriculum×school
}
```

**CurriculumPublicationLog** - Audit trail
```prisma
model CurriculumPublicationLog {
  id String @id
  curriculumId String (FK → Curriculum)
  version Int
  action String (published|archived|updated|synced)
  publishedBy String (User ID)
  description String?
  metadata Json?
  createdAt DateTime (immutable)
}
```

#### **3. Champs Ajoutés à Curriculum**
```prisma
model Curriculum {
  // ... existing fields ...
  
  type CurriculumType @default(NATIONAL)  // Type de curriculum
  publishedAt DateTime?                    // Quand publié
  deletedAt DateTime?                      // Soft delete
  
  // Nouvelles relations
  versions CurriculumVersion[]             // Historique versions
  syncs CurriculumSync[]                   // Syncs vers écoles
}
```

#### **4. Relation Ajoutée à School**
```prisma
model School {
  // ... existing fields ...
  
  curriculumSyncs CurriculumSync[] @relation("CurriculumSyncs")  // Syncs reçus
}
```

---

## 🚀 Services Backend Créés

### **1. curriculumVersionService.ts**
Gestion complète du versioning

**Fonctions principales:**
- `createDraftVersion()` - Créer nouveau brouillon
- `publishVersion()` - Publier une version
- `getVersionHistory()` - Historique des versions
- `getVersionDetails()` - Détails complets d'une version
- `logCurriculumAction()` - Logger les actions
- `getCurriculumActionLog()` - Récupérer l'audit trail
- `archiveVersion()` - Archiver une version
- `softDeleteCurriculum()` - Suppression logicielle
- `restoreCurriculum()` - Restauration

### **2. curriculumSyncService.ts**
Synchronisation vers les écoles

**Fonctions principales:**
- `initiateSyncToCurriculum()` - Lancer sync vers plusieurs écoles
- `updateSyncStatus()` - Mettre à jour statut de sync
- `getSyncStatus()` - Status global d'un curriculum
- `getSyncStatusForSchool()` - Status pour une école
- `getSchoolCurriculumSyncs()` - Tous les syncs d'une école
- `bulkUpdateSyncStatus()` - Mise à jour en masse
- `getPendingSyncs()` - Récupérer syncs en attente (pour background job)
- `completeSyncForSchool()` - Marquer sync comme terminée
- `failSyncForSchool()` - Marquer sync comme échouée
- `getSyncAuditTrail()` - Historique sync école×curriculum

### **3. curriculumManagementService.ts**
Gestion complète des curriculums

**Fonctions principales:**
- `createCurriculum()` - Créer nouveau curriculum
- `updateCurriculum()` - Modifier curriculum (brouillon seulement)
- `getCurriculumFull()` - Récupérer avec tout le contenu
- `listCurriculumsByType()` - Lister par type (NATIONAL, QURANIC, etc.)
- `getPublishedCurriculums()` - Curriculums publiés (pour étudiants)
- `publishCurriculum()` - Publier un curriculum
- `syncCurriculumToSchools()` - Lancer sync vers écoles
- `getSchoolCurriculums()` - Tous les curriculums d'une école
- `getCurriculumStats()` - Statistiques (chapitres, leçons, quizzes, etc.)
- `duplicateCurriculum()` - Dupliquer avec tout le contenu

---

## 🔌 API Routes Créées (`/api/curricula`)

### **Curriculum Management**
```
GET    /api/curricula              # Lister curriculums d'une école
POST   /api/curricula              # Créer curriculum
GET    /api/curricula/:id          # Détails complets
PATCH  /api/curricula/:id          # Mettre à jour
GET    /api/curricula/:id/stats    # Statistiques
DELETE /api/curricula/:id          # Supprimer (soft delete)
POST   /api/curricula/:id/duplicate# Dupliquer
```

### **Versioning**
```
GET    /api/curricula/:id/versions                 # Historique versions
POST   /api/curricula/:id/versions                 # Créer brouillon
GET    /api/curricula/:id/versions/:version        # Détails version
POST   /api/curricula/:id/publish                  # Publier
GET    /api/curricula/:id/changelog                # Audit trail
```

### **Synchronization**
```
POST   /api/curricula/:id/sync                     # Lancer sync vers écoles
GET    /api/curricula/:id/sync/status              # Status global sync
GET    /api/curricula/:id/sync/school/:schoolId    # Status pour école
PATCH  /api/curricula/:id/sync/school/:schoolId   # Mettre à jour status
```

### **Public Endpoints**
```
GET    /api/curricula/published/list               # Curriculums publiés
GET    /api/curricula/school/:schoolId/all         # Curriculums d'une école
```

---

## 💾 Migrations Prisma

**Fichier:** `prisma/migrations/[timestamp]_add_curriculum_versioning_and_sync/migration.sql`

**Modifications:**
1. Ajoute enums: `CurriculumType`, `VersionStatus`, `SyncStatus`
2. Crée tables: `CurriculumVersion`, `CurriculumSync`, `CurriculumPublicationLog`
3. Ajoute colonnes à `Curriculum`: `type`, `publishedAt`, `deletedAt`
4. Crée indices pour performances (type, deletedAt, status, syncedAt)
5. Crée contraintes unique (curriculumId_version, curriculumId_schoolId)

**Exécution:**
```bash
npx prisma migrate dev --name add_curriculum_versioning_and_sync
```

---

## 🏗️ Architecture du Moteur

```
┌─────────────────────────────────────────────────────────────┐
│  CURRICULUM UNIVERSEL                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Type: NATIONAL  → Programme Guinée officiel                │
│  Type: QURANIC   → Programme coranique                      │
│  Type: CUSTOM    → Programme école personnalisé             │
│  Type: PROFESSIONAL → Formations professionnelles           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CURRICULUM (Base)                                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ id, name, type, level, code, country                │   │
│  │ isPublished, publishedAt, deletedAt                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                        │                                     │
│         ┌──────────────┼──────────────┐                     │
│         ▼              ▼              ▼                      │
│    ┌─────────┐ ┌─────────────┐ ┌──────────┐               │
│    │VERSIONS │ │ SUBJECTS    │ │  SYNCS   │               │
│    │(History)│ │(Curriculum) │ │ (Schools)│               │
│    └─────────┘ └─────────────┘ └──────────┘               │
│         │              │              │                      │
│         │ PUBLISHED    │              │ SYNCED              │
│         │ DRAFT        │              │ FAILED              │
│         │ ARCHIVED     │              │ PENDING             │
│                        │                                     │
│         ┌──────────────┼──────────────────────────────┐    │
│         ▼              ▼              ▼               ▼     │
│    CHAPTERS      EXERCISES      FLASHCARDS      QUIZZES     │
│         │              │              │               │     │
│         └──────────────┼──────────────────────────────┘    │
│                        ▼                                    │
│                    LESSONS (Existing structure)             │
│                        │                                    │
│         ┌──────────────┼──────────────┐                    │
│         ▼              ▼              ▼                     │
│    OBJECTIVES   CONTENTS      DEPENDENCIES                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PUBLICATION LOG (Audit Trail)                       │   │
│  │ Tracks: published, archived, synced, etc.           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Flux de Travail

### **1. Créer un Curriculum National**
```typescript
const curriculum = await curriculumManagementService.createCurriculum({
  schoolId: 'CENTRAL_LIBRARY',
  name: 'Curriculum National Guinée 2024',
  type: 'NATIONAL',
  level: '6ème',
  code: 'GN_6EM_2024',
  country: 'GN'
});
// → Créé avec isPublished=false, type=NATIONAL
```

### **2. Éditer le Curriculum**
```typescript
// Tant que non publié, on peut éditer directement
await curriculumManagementService.updateCurriculum({
  id: curriculum.id,
  name: 'Curriculum National Guinée 2024 (Révisé)'
});
```

### **3. Publier le Curriculum**
```typescript
const published = await curriculumManagementService.publishCurriculum(
  curriculum.id,
  'admin-user-id',
  'Version initiale du curriculum 2024'
);
// → Crée version v1, marque comme PUBLISHED
// → Crée log d'audit
// → isPublished=true, publishedAt=now
```

### **4. Synchroniser vers les Écoles**
```typescript
const syncs = await curriculumManagementService.syncCurriculumToSchools(
  curriculum.id,
  ['school-id-1', 'school-id-2', 'school-id-3'],
  'admin-user-id'
);
// → Crée CurriculumSync records avec status=PENDING pour chaque école
// → Logs l'action dans publication log
```

### **5. Mettre à Jour Statut de Sync**
```typescript
// Après sync réussie sur serveur école:
await curriculumSyncService.completeSyncForSchool(
  curriculum.id,
  'school-id-1',
  'sync-service-user'
);
// → status=SYNCED, syncedAt=now

// Ou en cas d'erreur:
await curriculumSyncService.failSyncForSchool(
  curriculum.id,
  'school-id-1',
  'Connection timeout'
);
// → status=FAILED, errorMessage=...
```

### **6. Créer une Nouvelle Version**
```typescript
const v2 = await curriculumVersionService.createDraftVersion({
  curriculumId: curriculum.id,
  description: 'Ajout de 2 nouveaux chapitres',
  changelog: '- Chapitre X ajouté\n- Chapitre Y ajouté'
});
// → Crée version v2 avec status=DRAFT
// → Les versions antérieures restent PUBLISHED/ARCHIVED
```

### **7. Éditer la Nouvelle Version**
```typescript
// Éditer le curriculum en mode brouillon (avant publication)
await curriculumManagementService.updateCurriculum({
  id: curriculum.id,
  description: 'Updated description'
});
// → Seuls les brouillons peuvent être modifiés
```

### **8. Publier la Nouvelle Version**
```typescript
await curriculumVersionService.publishVersion(
  { curriculumId: curriculum.id, version: 2, publishedBy: 'admin-id' }
);
// → v1 archivée, v2 publiée
// → Crée log d'audit
// → Tous les syncs deviennent PENDING pour nouvelle version
```

---

## 🔄 Patterns de Réutilisation (Architecture Universelle)

### **Même structure pour tous les types**

**Curriculum NATIONAL + Curriculum QURANIC = Même schéma**
```prisma
Curriculum {
  name: "Lecture Coranique" OR "Mathématiques"
  type: QURANIC OR NATIONAL
  level: "1ère année" OR "6ème"
  // ↓ Même structure de contenu
  subjects → chapters → lessons → content/quiz/exercise
}
```

**Métadata flexible pour différences pédagogiques:**
```prisma
CurriculumLesson {
  // Pour leçon coranique:
  metadata: {
    sura: 1,
    ayahs: [1, 7],
    recitation_points: [...],
    memorization_level: "BASIC"
  }
  
  // Pour leçon académique: métadata vide ou académique
  metadata: { difficulty_curve: [...] }
}

Quiz {
  type: QURANIC_MEMORIZATION // Nouveau type
  OR
  type: FORMATIVE // Existant
}

Grade {
  type: QURANIC_RECITATION // Nouveau type
  metadata: { accuracy: 95, fluency: 88 }
}
```

---

## 🛡️ Intégrité des Données

### **Soft Delete**
```typescript
// Supprimer (logique):
await curriculumVersionService.softDeleteCurriculum(curriculumId);
// → deletedAt=now
// → Le curriculum n'apparaît plus dans les listes

// Restaurer:
await curriculumVersionService.restoreCurriculum(curriculumId);
// → deletedAt=null
```

### **Cascade Deletions**
- Curriculum (DELETE) → CurriculumVersion (DELETE CASCADE)
- Curriculum (DELETE) → CurriculumSync (DELETE CASCADE)
- Curriculum (DELETE) → CurriculumPublicationLog (DELETE CASCADE)
- School (DELETE) → CurriculumSync (DELETE CASCADE)

### **Contraintes Uniques**
- `CurriculumVersion`: Un seul version number par curriculum
- `CurriculumSync`: Un seul sync record par (curriculum, school)
- `Curriculum`: Code unique (immuable)

---

## ⚡ Performance & Indices

**Indices Créés:**
```sql
Curriculum:
  - (type) → filtrer par NATIONAL/QURANIC/CUSTOM
  - (deletedAt) → soft deletes
  - (schoolId, type) → lister curriculums école par type

CurriculumVersion:
  - (curriculumId, version) → recherche rapide version
  - (status) → filtrer DRAFT/PUBLISHED/ARCHIVED
  - (publishedAt) → trier par date publication

CurriculumSync:
  - (curriculumId) → trouver tous syncs curriculum
  - (schoolId) → trouver tous syncs école
  - (status) → filtrer par PENDING/SYNCED/FAILED
  - (syncedAt) → trier par date sync

CurriculumPublicationLog:
  - (curriculumId) → historique curriculum
  - (action) → filtrer par type action
  - (createdAt) → trier par date
```

---

## 🚫 Ce Qui N'a PAS Changé

**Tous les modèles existants restent inchangés:**
- ✅ Curriculum (structure existante + 3 champs)
- ✅ CurriculumSubject
- ✅ CurriculumChapter
- ✅ CurriculumLesson
- ✅ LearningObjective
- ✅ LessonContent
- ✅ Exercise
- ✅ Flashcard
- ✅ Quiz
- ✅ QuizQuestion
- ✅ QuizAttempt
- ✅ AIContent
- ✅ Grade
- ✅ Toutes autres tables

**Toutes les fonctionnalités existantes restent actives!**

---

## 📋 Checklist Intégration

- ✅ Enums ajoutés au schema.prisma
- ✅ Modèles CurriculumVersion, Sync, Log ajoutés
- ✅ Champs type, publishedAt, deletedAt ajoutés à Curriculum
- ✅ Relation School → curriculumSyncs ajoutée
- ✅ Migration SQL créée
- ✅ Services curriculum version créés
- ✅ Services curriculum sync créés
- ✅ Services curriculum management créés
- ✅ Routes API /api/curricula créées
- ✅ Server.ts intégré avec nouvelles routes

**Prêt pour:**
1. Exécuter migration Prisma: `npx prisma migrate dev`
2. Compiler TypeScript: `npm run build`
3. Démarrer serveur: `npm start`

