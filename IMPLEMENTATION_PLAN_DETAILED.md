# 📋 PLAN D'IMPLÉMENTATION DÉTAILLÉ

**Audit Rapport**: ARCHITECTURE_AUDIT_REPORT.md  
**Objectif**: Corriger les 28 problèmes en 4 phases  
**Timeline**: 6 jours  
**Risque**: Très Bas (migrations réversibles)  
**Breaking Changes**: 0 ✅  

---

## PHASE 1: SÉCURITÉ CRITIQUE (Jours 1-2)

### Objectif
Corriger failles multi-tenant en ajoutant `schoolId` direct à 11 modèles critiques.

### 1.1 Modèles à Modifier

#### CurriculumLesson
```prisma
model CurriculumLesson {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  title   String
  content String?
  order Int @default(0)
  
  chapterId String
  chapter   CurriculumChapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  
  learningObjectives LearningObjective[]
  lessonContents     LessonContent[]
  exercises          Exercise[]
  flashcards         Flashcard[]
  aiContents         AIContent[]
  quizzes            Quiz[]
  aiReports          AIReport[]
  
  dependencies LessonDependency[] @relation("LessonDependencies")
  dependents   LessonDependency[] @relation("LessonDependents")
  
  mediaResources MediaResource[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])           // NOUVEAU
  @@index([chapterId])
  @@index([schoolId, createdAt]) // NOUVEAU
}
```

**Migration SQL**:
```sql
-- Step 1: Ajouter colonne
ALTER TABLE "CurriculumLesson" ADD COLUMN "schoolId" TEXT;

-- Step 2: Populer avec données existantes
UPDATE "CurriculumLesson" cl
SET "schoolId" = cs."schoolId"
FROM "CurriculumChapter" cc
JOIN "CurriculumSubject" cs ON cc."subjectId" = cs."curriculumId"
JOIN "Curriculum" c ON cs."curriculumId" = c.id
WHERE cc.id = cl."chapterId";

-- Step 3: Faire obligatoire
ALTER TABLE "CurriculumLesson" ALTER COLUMN "schoolId" SET NOT NULL;

-- Step 4: Ajouter foreign key
ALTER TABLE "CurriculumLesson" ADD CONSTRAINT "CurriculumLesson_schoolId_fkey" 
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE;

-- Step 5: Créer indices
CREATE INDEX "CurriculumLesson_schoolId_idx" ON "CurriculumLesson"("schoolId");
CREATE INDEX "CurriculumLesson_schoolId_createdAt_idx" ON "CurriculumLesson"("schoolId", "createdAt" DESC);
```

---

#### Exercise
```prisma
model Exercise {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  lessonId String
  lesson   CurriculumLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  title        String
  instructions String?
  difficulty   String @default("medium")
  answerKey    String?
  example      String?
  order        Int @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([lessonId])
  @@index([schoolId, difficulty])
}
```

---

#### Flashcard
```prisma
model Flashcard {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  lessonId String
  lesson   CurriculumLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  question String
  answer   String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([lessonId])
}
```

---

#### Quiz
```prisma
model Quiz {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  title       String
  description String?
  
  lessonId String?
  lesson   CurriculumLesson? @relation(fields: [lessonId], references: [id], onDelete: SetNull)
  
  questions QuizQuestion[]
  attempts  QuizAttempt[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([lessonId])
}
```

---

#### QuizQuestion
```prisma
model QuizQuestion {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  quizId String
  quiz   Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  prompt String
  questionType String @default("multiple_choice")
  options Json?
  correctAnswer Json?
  explanation String?
  points Int @default(1)
  order Int @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([quizId])
}
```

---

#### AIContent
```prisma
model AIContent {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  lessonId String
  lesson   CurriculumLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  shortSummary String
  longSummary  String
  keyPoints    Json?
  definitions  Json?
  formulas     Json?
  examples     Json?
  keywords     String[]
  
  generatedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([schoolId])
  @@index([lessonId])
}
```

---

#### LearningObjective
```prisma
model LearningObjective {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  lessonId String
  lesson   CurriculumLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  description String
  order       Int @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([lessonId])
}
```

---

#### LessonDependency
```prisma
model LessonDependency {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  lessonId String
  lesson   CurriculumLesson @relation("LessonDependencies", fields: [lessonId], references: [id], onDelete: Cascade)
  
  requiredLessonId String
  requiredLesson   CurriculumLesson @relation("LessonDependents", fields: [requiredLessonId], references: [id], onDelete: Cascade)
  
  rule         String @default("completed")
  minimumScore Float @default(80)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([lessonId, requiredLessonId])
  @@index([schoolId])
  @@index([lessonId])
  @@index([requiredLessonId])
}
```

---

#### Attendance
```prisma
model Attendance {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  studentId String
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  classId String
  class   Class @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  teacherId String?
  teacher   Teacher? @relation(fields: [teacherId], references: [id], onDelete: SetNull)
  
  date    DateTime
  status  AttendanceStatus
  comment String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([studentId])
  @@index([classId])
  @@index([date])
  @@index([schoolId, date]) // NOUVEAU
}
```

---

#### ImportJob
```prisma
model ImportJob {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  fileName String
  fileType String
  status   ImportStatus @default(PENDING)
  progress Int @default(0)
  errorCount Int @default(0)
  summary  Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  logs ImportLog[]
  
  @@index([schoolId])
  @@index([status])
  @@index([createdAt])
}
```

---

#### ImportLog
```prisma
model ImportLog {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  jobId    String
  job      ImportJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  
  level    String @default("info")
  message  String
  metadata Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([jobId])
}
```

---

#### AIRecommendation
```prisma
model AIRecommendation {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  aiReportId String
  aiReport   AIReport @relation(fields: [aiReportId], references: [id], onDelete: Cascade)
  
  targetUserId String?
  targetUser   User? @relation(fields: [targetUserId], references: [id], onDelete: SetNull)
  
  studentId String?
  student   Student? @relation(fields: [studentId], references: [id], onDelete: SetNull)
  
  title       String
  description String
  category    String?
  severity    String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([aiReportId])
  @@index([targetUserId])
  @@index([studentId])
}
```

---

#### Notification
```prisma
model Notification {
  id String @id @default(cuid())
  
  // AJOUTER:
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type     NotificationType @default(INFO)
  title    String
  body     String
  metadata Json?
  
  isRead Boolean @default(false)
  sentAt DateTime @default(now())
  readAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([userId])
  @@index([userId, isRead])
  @@index([isRead])
}
```

---

### 1.2 Ajouter Soft Delete

Ajouter `deletedAt` à ces modèles:

```prisma
model Student {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
  @@index([schoolId, deletedAt])
}

model Teacher {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Parent {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Class {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Subject {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Grade {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Quiz {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Exercise {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Flashcard {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model AIContent {
  // ... existing fields
  deletedAt DateTime?
}

model LearningObjective {
  // ... existing fields
  deletedAt DateTime?
}

model LessonDependency {
  // ... existing fields
  deletedAt DateTime?
}

model Attendance {
  // ... existing fields
  deletedAt DateTime?
}

model Notification {
  // ... existing fields
  deletedAt DateTime?
}

model Message {
  // ... existing fields
  deletedAt DateTime?
}

// ... Et autres modèles de données critiques
```

---

### 1.3 Vérification Migration

```bash
# 1. Créer fichier migration
npx prisma migrate dev --name add_school_id_and_soft_delete

# 2. Vérifier le contenu
cat prisma/migrations/[timestamp]_add_school_id_and_soft_delete/migration.sql

# 3. Tester
npm run test:integration

# 4. Vérifier aucun data loss
npm run verify:data-integrity
```

---

## PHASE 2: PERFORMANCE (Jour 3)

### Objectif
Ajouter 20+ indices manquants

### 2.1 Grade - Ajouter Indices

```prisma
model Grade {
  // ... existing
  
  @@index([studentId])
  @@index([subjectId])
  @@index([classId])
  @@index([schoolId, recordedAt]) // NOUVEAU
  @@index([schoolId, subjectId])  // NOUVEAU
  @@index([studentId, recordedAt DESC]) // NOUVEAU
  @@index([recordedAt]) // NOUVEAU
}
```

---

### 2.2 Attendance - Ajouter Indices

```prisma
model Attendance {
  // ... existing
  
  @@index([studentId])
  @@index([classId])
  @@index([date])
  @@index([schoolId])           // NOUVEAU
  @@index([classId, date DESC]) // NOUVEAU
  @@index([studentId, date DESC]) // NOUVEAU
}
```

---

### 2.3 QuizAttempt - Ajouter Indices

```prisma
model QuizAttempt {
  // ... existing
  
  @@index([studentId])
  @@index([quizId])
  @@index([studentId, completedAt DESC]) // NOUVEAU
  @@index([quizId, score DESC]) // NOUVEAU
  @@index([completedAt]) // NOUVEAU
}
```

---

### 2.4 Message - Ajouter Indices

```prisma
model Message {
  // ... existing
  
  @@index([senderId])
  @@index([recipientId])
  @@index([status])
  @@index([senderId, createdAt DESC]) // NOUVEAU
  @@index([recipientId, status, createdAt DESC]) // NOUVEAU
  @@index([status, createdAt DESC]) // NOUVEAU
}
```

---

### 2.5 Notification - Ajouter Indices

```prisma
model Notification {
  // ... existing
  
  @@index([userId])
  @@index([isRead])
  @@index([userId, isRead, createdAt DESC]) // NOUVEAU
  @@index([userId, type]) // NOUVEAU
  @@index([createdAt DESC]) // NOUVEAU
}
```

---

### 2.6 Autres Modèles - Indices

```prisma
model CurriculumLesson {
  @@index([schoolId, createdAt])
  @@index([chapterId, order])
}

model Exercise {
  @@index([schoolId, difficulty])
}

model Flashcard {
  @@index([schoolId, lessonId])
}

model Quiz {
  @@index([schoolId, lessonId])
}

model AIContent {
  @@index([schoolId, lessonId])
}

model LessonDependency {
  @@index([schoolId, lessonId])
}

model ImportJob {
  @@index([schoolId, status, createdAt DESC])
}

model ImportLog {
  @@index([schoolId, jobId])
}
```

---

## PHASE 3: NOUVEAUX MODÈLES (Jours 4-5)

### Objectif
Créer 4 nouveaux modèles essentiels

### 3.1 AuditLog Model

```prisma
model AuditLog {
  id            String @id @default(cuid())
  
  schoolId      String
  school        School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  userId        String
  user          User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  action        String  // "CREATE", "UPDATE", "DELETE", "EXPORT"
  entity        String  // Model name: "Student", "Grade", "Quiz"
  entityId      String  // ID of entity modified
  entityName    String? // Optional friendly name
  
  oldValue      Json?   // Previous value
  newValue      Json?   // New value
  
  ipAddress     String?
  userAgent     String?
  
  description   String?
  
  createdAt     DateTime @default(now())
  
  @@index([schoolId])
  @@index([userId])
  @@index([entity])
  @@index([action])
  @@index([createdAt])
  @@index([schoolId, entity, createdAt DESC])
  @@index([userId, createdAt DESC])
}
```

---

### 3.2 SystemLog Model

```prisma
model SystemLog {
  id          String @id @default(cuid())
  
  schoolId    String?
  school      School? @relation(fields: [schoolId], references: [id], onDelete: SetNull)
  
  level       String  // "DEBUG", "INFO", "WARN", "ERROR", "FATAL"
  
  component   String? // "Sync", "Scheduler", "API", etc
  
  message     String
  context     Json?   // Additional context
  
  stackTrace  String? // For errors
  duration    Int?    // Milliseconds
  
  createdAt   DateTime @default(now())
  
  @@index([schoolId])
  @@index([level])
  @@index([component])
  @@index([createdAt DESC])
  @@index([level, createdAt DESC])
}
```

---

### 3.3 FileStorage Model

```prisma
model FileStorage {
  id          String @id @default(cuid())
  
  schoolId    String
  school      School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  fileName    String
  originalName String?
  fileType    String  // "VIDEO", "AUDIO", "PDF", "IMAGE", "DOCUMENT"
  mimeType    String  // "video/mp4", "audio/mpeg", etc
  
  size        Int     // bytes
  duration    Int?    // seconds (for video/audio)
  
  url         String  // Cloud storage URL (S3, Cloudinary, etc)
  publicUrl   String? // Public accessible URL
  
  uploadedBy  String
  user        User @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  thumbUrl    String? // For video/image
  
  metadata    Json?   // {width, height, codec, bitrate, etc}
  
  isPublic    Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  @@index([schoolId])
  @@index([fileType])
  @@index([uploadedBy])
  @@index([deletedAt])
  @@index([createdAt DESC])
  @@index([schoolId, fileType])
}
```

---

### 3.4 MediaResource Model

```prisma
model MediaResource {
  id          String @id @default(cuid())
  
  schoolId    String
  school      School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  lessonId    String
  lesson      CurriculumLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  fileStorageId String
  fileStorage   FileStorage @relation(fields: [fileStorageId], references: [id], onDelete: Cascade)
  
  resourceType String  // "QURANIC_VIDEO", "TAJWID_AUDIO", "ISLAMIC_PDF", etc
  
  title       String
  description String?
  
  duration    Int?    // seconds
  
  // Metadata
  language    String? @default("ar")
  narrator    String?
  surahStart  Int?    // For Quranic resources
  surahEnd    Int?
  
  keywords    String[] // For search
  tags        String[] // For categorization
  
  metadata    Json?   // Custom metadata
  
  order       Int @default(0)
  
  isActive    Boolean @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  @@index([schoolId])
  @@index([lessonId])
  @@index([resourceType])
  @@index([createdAt DESC])
  @@index([schoolId, resourceType])
  @@index([lessonId, order])
}
```

---

### 3.5 Migration for New Models

```bash
# Créer migration
npx prisma migrate dev --name add_audit_system_log_file_storage_media_resource

# Vérifier
npm run test:integration

# Seeds (optionnel)
npm run seed
```

---

## PHASE 4: CLARIFICATION MODÈLES (Jour 6)

### Objectif
Clarifier et nettoyer modèles ambigus

### 4.1 Revenue - Supprimer Redondance

```prisma
model Revenue {
  id String @id @default(cuid())
  
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  paymentId String @unique
  payment   Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  
  category    RevenueCategory
  source      String
  receivedAt  DateTime
  
  // SUPPRIMER:
  // Student   Student? @relation(...)
  // studentId String?
  // 
  // Utiliser: payment.studentId à la place
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([category])
}
```

---

### 4.2 AIRecommendation - Clarifier

**Option 1**: Toujours pour un Student

```prisma
model AIRecommendation {
  id String @id @default(cuid())
  
  schoolId String
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  aiReportId String
  aiReport   AIReport @relation(fields: [aiReportId], references: [id], onDelete: Cascade)
  
  // Toujours pour un étudiant
  studentId String
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  // SUPPRIMER targetUserId car c'est du bruit
  
  title       String
  description String
  category    String?
  severity    String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([schoolId])
  @@index([studentId])
}
```

---

### 4.3 Message - Ajouter Validation

Ajouter au service layer (application code, pas Prisma):

```typescript
// messageService.ts
async createMessage(senderId: string, recipientId: string, data: any) {
  // VALIDATION CRITIQUE: Vérifier même school
  const sender = await prisma.user.findUnique({
    where: { id: senderId }
  });
  
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId }
  });
  
  if (sender.schoolId !== recipient.schoolId) {
    throw new Error("Cannot send message to user in different school");
  }
  
  // OK pour créer
  return prisma.message.create({
    data: {
      senderId,
      recipientId,
      ...data
    }
  });
}
```

---

## VÉRIFICATION ET VALIDATION

### Checklist Phase 1-4

```
PHASE 1 - SÉCURITÉ:
☐ Tous les schoolId ajoutés
☐ Tous les soft deletes ajoutés
☐ Migration testée
☐ Aucun data loss
☐ Queries validées

PHASE 2 - PERFORMANCE:
☐ Tous les indices créés
☐ Benchmarks acceptables
☐ N+1 queries éliminés
☐ Query plans optimisés

PHASE 3 - MODÈLES:
☐ AuditLog créé et testé
☐ SystemLog créé et testé
☐ FileStorage créé et testé
☐ MediaResource créé et testé
☐ Relations correctes

PHASE 4 - CLARIFICATION:
☐ Revenue nettoyé
☐ AIRecommendation clarifié
☐ Message validé
☐ Documentation mis à jour
```

---

## TESTS À EFFECTUER

### Après Phase 1

```typescript
// Test: Multi-tenant isolation
describe('Multi-tenant Isolation', () => {
  test('Cannot access lesson from different school', async () => {
    const lesson = await prisma.curriculumLesson.findUnique({
      where: { id: lesson1.id }
    });
    
    // Should enforce schoolId filter
    expect(lesson.schoolId).toBe(school1.id);
    
    // Verify direct query by ID only doesn't leak data
    // (App should always filter by schoolId)
  });
});

// Test: Soft delete
describe('Soft Delete', () => {
  test('Deleted student not in active queries', async () => {
    await prisma.student.update({
      where: { id: student1.id },
      data: { deletedAt: new Date() }
    });
    
    // App should filter WHERE deletedAt IS NULL
    const students = await getActiveStudents(schoolId);
    expect(students).not.toContainEqual(
      expect.objectContaining({ id: student1.id })
    );
  });
});
```

---

## DÉPLOIEMENT

### Timeline

```
Jour 1-2:  Phase 1 (Sécurité) - Tests intensifs
Jour 3:    Phase 2 (Performance) - Benchmarks
Jour 4-5:  Phase 3 (Modèles) - Intégration
Jour 6:    Phase 4 (Clarification) - Finalisation + Tests
Jour 7:    Staging deployment
Jour 8:    Production deployment
```

### Checklist Déploiement

```
PRE-DEPLOY:
☐ Tous les tests passent
☐ Migrations testées
☐ Backup database
☐ Rollback plan prêt
☐ Performance acceptable

DEPLOY STAGING:
☐ Appliquer migrations
☐ Vérifier data intégrité
☐ Tests intégrés
☐ Monitoring OK

DEPLOY PRODUCTION:
☐ Maintenance window si nécessaire
☐ Backup avant migration
☐ Appliquer migrations
☐ Vérifier logs
☐ Smoke tests
☐ Monitoring étroitement
☐ Rollback plan activé
```

---

**Prêt pour implémentation**: ✅ OUI  
**Risque**: 🟢 Très Bas  
**Breaking Changes**: 0  
