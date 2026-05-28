# NeoClass Prisma Schema

Ce document présente le schéma Prisma complet pour les modules suivants :

- ERP Financier scolaire
- LMS moderne
- IA pédagogique
- Application mobile React Native / Expo

## Objectifs

- Fournir un modèle de données multi-tenant pour les écoles
- Modéliser les revenus, dépenses, inscriptions, mensualités, cantine, transport, uniformes
- Gérer la comptabilité, le journal, le grand livre, et le bilan simplifié
- Modéliser le parcours d'apprentissage : cours, chapitres, leçons, exercices, quiz, validation
- Permettre l'analyse pédagogique automatique avec résumés, flashcards, quiz et plans personnalisés
- Supporter la synchronisation mobile et les notifications

## Fichier principal

Le schéma Prisma est disponible ici :

- `schema.prisma`

## Principaux modèles

### Modules financiers

- `Registration`
- `ReRegistration`
- `TuitionPlan`
- `MonthlyInstallment`
- `FeeItem`
- `Invoice` / `InvoiceLine`
- `Payment`
- `CantineOrder`
- `TransportSubscription`
- `UniformOrder`
- `Expense`
- `Supplier`
- `PurchaseOrder`
- `SalaryPayment`
- `Charge`
- `LedgerAccount`
- `JournalEntry` / `JournalLine`
- `FinancialReport`
- `SimplifiedBalanceSheet`

### LMS et formation

- `Course`
- `Chapter`
- `Lesson`
- `LessonResource`
- `Exercise`
- `Quiz`
- `QuizQuestion`
- `QuizOption`
- `QuizAttempt`
- `LessonUnlock`
- `LearningProgress`
- `ProgressHistory`
- `LessonValidation`
- `LessonAccess`

### IA pédagogique

- `CourseAnalysis`
- `Flashcard`
- `AIQuiz`
- `AIExercise`
- `StudentInsight`
- `MasteryScore`
- `PersonalizedPlan`
- `AIInteraction`

### Application mobile

- `MobileDevice`
- `SyncEvent`
- `Notification`
- `Message`

### Entités partagées

- `School`
- `User`
- `Student`
- `Teacher`
- `Parent`
- `AcademicYear`
- `Class`
- `Subject`
- `Enrollment`
- `AuditLog`

## Utilisation

1. Placer `schema.prisma` à la racine du projet.
2. Installer Prisma :

```bash
npm install @prisma/client prisma
```

3. Générer le client Prisma :

```bash
npx prisma generate
```

4. Créer une migration :

```bash
npx prisma migrate dev --name init
```

## Remarques

- Le schéma est conçu pour un ERP scolaire complet avec comptabilité et LMS.
- Les entités AI sont positionnées pour générer des contenus dérivés depuis le contenu pédagogique.
- Les objets mobiles gèrent la synchronisation et les notifications push.
- Les rapports financiers sont stockés en JSON pour la flexibilité des exports.
