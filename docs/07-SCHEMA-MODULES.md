# Schéma des Modules - NeoClass

## Vue d'ensemble

NeoClass est architec turé comme un système **modulaire avec activations indépendantes**. Chaque école peut choisir les modules adaptés à ses besoins.

---

## 1. MODULE : GESTION SCOLAIRE (Academic Management)

### Description
Gestion complète de la structure scolaire : années, trimestres, classes, emploi du temps, cours, présences.

### Features
- ✅ Années académiques et trimestres
- ✅ Gestion des classes et sections
- ✅ Emploi du temps (calendrier)
- ✅ Cours et matières
- ✅ Présence/Absences
- ✅ Gestion des enseignants et leurs horaires
- ✅ Documents d'absence
- ✅ Rapport d'assiduité

### Permissions
```
Roles autorisés:
- Super Admin
- School Admin (complet)
- Director (vision)
- Teacher (sa classe + marquer présence)
- Student (consulter)
- Parent (consulter)
```

### API Endpoints
```
GET   /api/academic/years
POST  /api/academic/years
PUT   /api/academic/years/:id
DELETE /api/academic/years/:id

GET   /api/academic/classes
POST  /api/academic/classes
PUT   /api/academic/classes/:id
DELETE /api/academic/classes/:id

GET   /api/academic/attendance
POST  /api/academic/attendance
GET   /api/academic/attendance/report

GET   /api/academic/schedule
POST  /api/academic/schedule
PUT   /api/academic/schedule/:id
```

### Database Tables
```
academic_years
academic_semesters
classes
courses
lessons
attendance_records
schedules
course_assignments
```

### Events Émis
```
academic:year_created
academic:class_opened
academic:class_closed
attendance:marked
attendance:bulk_imported
schedule:changed
```

### Dépendances
- User Management (nécessaire)
- Communication (notifier changements)

### Coûts
- Stockage : Bas (données structurées)
- Calcul : Modéré (rapports d'assiduité)
- API : Modéré

---

## 2. MODULE : GESTION FINANCIÈRE (Financial Management)

### Description
Gestion complète de la finance scolaire : factures, paiements, comptabilité.

### Features
- ✅ Génération de factures (mensuelles, annuelles)
- ✅ Suivi des paiements
- ✅ Rapports comptables
- ✅ Gestion des dépenses
- ✅ Rapprochement bancaire
- ✅ Plans de paiement (échelonnement)
- ✅ Remises et ajustements
- ✅ Historique de trésorerie
- ✅ Rapports financiers

### Permissions
```
Roles autorisés:
- Super Admin (analytics)
- School Admin (complet)
- Finance Officer (gestion)
- Director (vision)
- Parent (consulter ses factures)
```

### API Endpoints
```
GET   /api/finance/invoices
POST  /api/finance/invoices
PUT   /api/finance/invoices/:id
DELETE /api/finance/invoices/:id
GET   /api/finance/invoices/:id/print

GET   /api/finance/payments
POST  /api/finance/payments
PUT   /api/finance/payments/:id
GET   /api/finance/transactions/report

GET   /api/finance/reports/balance
GET   /api/finance/reports/cashflow
GET   /api/finance/reconciliation
POST  /api/finance/reconciliation/match
```

### Database Tables
```
invoices
invoice_items
payments
transactions
chart_of_accounts
ledger_entries
financial_reports
payment_plans
```

### Events Émis
```
finance:invoice_created
finance:invoice_paid
finance:payment_failed
finance:due_reminder
finance:reconciliation_complete
```

### Dépendances
- User Management (obligatoire)
- Payment Service (optionnel : paiements en ligne)
- Communication (notifications)
- Reporting (rapports)

### Coûts
- Stockage : Modéré
- Calcul : Modéré (rapports comptables)
- API : Modéré

---

## 3. MODULE : LMS (Learning Management System)

### Description
Plateforme complète d'apprentissage en ligne : cours, contenus, évaluations, devoirs.

### Features
- ✅ Création et gestion de cours
- ✅ Upload de contenu (PDF, vidéo, images)
- ✅ Leçons et modules
- ✅ Quiz et évaluations
- ✅ Devoirs et soumissions
- ✅ Classe virtuelle (Zoom, Meet integrate)
- ✅ Forums de discussion
- ✅ Feedback et commentaires
- ✅ Progression des élèves
- ✅ Certificats de complétion
- ✅ Contenu réutilisable

### Permissions
```
Roles autorisés:
- Super Admin (modération)
- School Admin (modération)
- Teacher (créer/gérer cours)
- Student (collaborer)
- Parent (vision)
```

### API Endpoints
```
GET   /api/lms/courses
POST  /api/lms/courses
PUT   /api/lms/courses/:id
DELETE /api/lms/courses/:id

GET   /api/lms/courses/:id/modules
POST  /api/lms/courses/:id/modules
GET   /api/lms/modules/:id/lessons

POST  /api/lms/content/upload    # Upload vidéo/fichier
GET   /api/lms/content/:id/download

GET   /api/lms/quizzes/:id
POST  /api/lms/quizzes/:id/submit
GET   /api/lms/assignments/:id
POST  /api/lms/assignments/:id/submit

GET   /api/lms/progress/:courseId/:studentId
POST  /api/lms/certificates/generate
```

### Storage
```
Fichiers:
- S3 ou MinIO (vidéos, PDFs, documents)
- CDN Cloudflare (cache + distribution)

Metadata:
- PostgreSQL (cours, leçons, quiz)
- MongoDB (contenu flexe, commentaires)
```

### Events Émis
```
lms:course_created
lms:lesson_completed
lms:quiz_submitted
lms:assignment_submitted
lms:certificate_issued
```

### Dépendances
- User Management (obligatoire)
- Academic Module (lier à classes)
- Communication (notifications)
- Reporting (progression)
- AI Module (recommandations optionnelles)

### Coûts
- Stockage : **ÉLEVÉ** (vidéos)
- Bande passante : **ÉLEVÉ** (streaming)
- Calcul : Modéré
- CDN : Important

---

## 4. MODULE : IA PÉDAGOGIQUE (Pedagogical AI)

### Description
Intelligence artificielle pour personnaliser l'apprentissage et analyser la performance.

### Features
- ✅ Recommandations personnalisées de contenu
- ✅ Prédiction de réussite/échec
- ✅ Détection des difficultés d'apprentissage
- ✅ Génération de parcours pédagogiques adaptatifs
- ✅ Assistant tuteur IA (chatbot)
- ✅ Analytics sur performance de classe
- ✅ Early warning system (risque d'abandon)
- ✅ Optimisation du curriculum

### Permissions
```
Roles autorisés:
- Super Admin (analytics global)
- School Admin (analytics école)
- Teacher (recommandations + analytics classe)
- Student (recommandations personnalisées)
- Parent (vue enfant)
```

### API Endpoints
```
POST  /api/ai/analyze-performance/:studentId
GET   /api/ai/recommendations/:studentId

POST  /api/ai/generate-learning-path
GET   /api/ai/class-analytics/:classId

POST  /api/ai/chat-tutor
GET   /api/ai/early-warnings/:classId
GET   /api/ai/skill-assessment/:studentId
```

### ML Models
```
1. Student Performance Predictor
   - Input: Grades, attendance, engagement
   - Output: Predicted final grade, risk score
   - Retraining: Monthly

2. Content Recommender
   - Input: Student profile, learning history
   - Output: Top 5 resources
   - Retraining: Weekly

3. Learning Path Generator
   - Input: Student goals, current level
   - Output: Personalized curriculum
   - Retraining: On-demand

4. Difficulty Detector
   - Input: Assignment submissions, quiz results
   - Output: Concepts student struggles with
   - Retraining: Real-time
```

### Tech Stack
```
Python (Backend)
├─ FastAPI
├─ TensorFlow / PyTorch
├─ Scikit-learn
├─ Pandas
└─ Jupyter

Data:
├─ PostgreSQL (features)
├─ MongoDB (raw data logs)
└─ MinIO (model artifacts)

Deployment:
├─ Container (Docker)
├─ Inference service (scaling)
└─ Batch processing (nightly)
```

### Events Émis
```
ai:prediction_generated
ai:recommendation_created
ai:early_warning_triggered
ai:learning_path_generated
```

### Dépendances
- Academic Module (données)
- Grades Module (performance)
- LMS Module (engagement)
- Reporting Module (output)

### Coûts
- Compute : **ÉLEVÉ** (GPU pour training)
- Storage : Modéré (models + data)
- API : Modéré

### Considérations Afrique
- Modèles optimisés (légers pour bande passante)
- Offline predictions possible
- Fairness & bias audit (pas de discrimination)

---

## 5. MODULE : COMMUNICATION (Communication)

### Description
Système complet de communication : messages, annonces, notifications.

### Features
- ✅ Messages directs (1:1)
- ✅ Chats de groupe (classe, département)
- ✅ Annonces broadcast
- ✅ Forums de discussion
- ✅ Notifications push/email/SMS
- ✅ Historique des conversations
- ✅ Partage de fichiers
- ✅ Mentions et tags
- ✅ Traduction automatique (langues locales)

### Permissions
```
Roles autorisés:
- Super Admin (broadcast global)
- School Admin (broadcast école)
- Director
- Teacher (classe + directs)
- Student (limité)
- Parent (messages école)
```

### API Endpoints
```
GET   /api/messages/conversations
POST  /api/messages/send
GET   /api/messages/conversation/:userId
GET   /api/messages/search

GET   /api/channels
POST  /api/channels
GET   /api/channels/:id/messages
POST  /api/channels/:id/messages

POST  /api/announcements
GET   /api/announcements
GET   /api/announcements/archive

GET   /api/notifications/preferences
PUT   /api/notifications/preferences
POST  /api/notifications/translate
```

### Real-time
```
WebSocket Events:
- message_received
- user_typing
- user_online/offline
- notification_sent

Fallback: Polling (30s) si pas WebSocket
```

### Database
```
PostgreSQL:
- messages (avec indexation)
- channels
- announcements
- notification_preferences

MongoDB:
- message_archives (old messages)
- conversation_threads
- notification_logs
```

### Events Émis
```
communication:message_sent
communication:announcement_created
communication:user_mentioned
```

### Dépendances
- User Management (obligatoire)
- Notification Service (obligatoire)

### Coûts
- Stockage : Modéré
- Bande passante : Modéré (WebSocket persistent)
- API : Modéré

---

## 6. MODULE : RAPPORTS (Reporting & Analytics)

### Description
Génération de rapports et tableaux de bord analytics.

### Features
- ✅ Bulletins scolaires
- ✅ Rapports de performance classe
- ✅ Rapports d'assiduité
- ✅ Rapports financiers
- ✅ Rapports de santé LMS
- ✅ Rapports personnalisés
- ✅ Planification de rapports (schedules)
- ✅ Export (PDF, Excel, CSV)
- ✅ Tableaux de bord interactifs
- ✅ Analytics en temps réel

### Permissions
```
Roles autorisés:
- Super Admin (tous rapports)
- School Admin (tous rapports école)
- Director (rapports classe)
- Teacher (rapports classe)
- Parent (rapports enfant)
```

### API Endpoints
```
GET   /api/reports/templates
GET   /api/reports/templates/:id

POST  /api/reports/generate
GET   /api/reports/:reportId
GET   /api/reports/:reportId/download/:format

POST  /api/reports/schedule
GET   /api/reports/scheduled
DELETE /api/reports/scheduled/:id

GET   /api/dashboards/admin
GET   /api/dashboards/school
GET   /api/dashboards/class
GET   /api/dashboards/student

POST  /api/analytics/custom-query
```

### Reporting Engine
```
Technology:
- Apache Superset (dashboards)
- ReportLab (génération PDF)
- PyXL (generation Excel)
- Elasticsearch (aggregations)

Architecture:
1. Data Collection (Kafka)
2. Data Warehouse (PostgreSQL / BigQuery)
3. Transformation (DBT)
4. Visualization (Superset)
5. Report Generation (Async queue)
```

### Report Types
```
1. Academic
   - Bulletin scolaire détaillé
   - Classement élève
   - Performance classe
   - Assiduité détaillée

2. Financial
   - Balance comptable
   - Cashflow
   - Impayés
   - Dépenses par catégorie

3. LMS
   - Engagement étudiant
   - Taux de complétion
   - Performance quizzes
   - Génération certificats

4. Admin
   - Santé du système
   - Utilisation ressources
   - Incidents
   - Performance API
```

### Events Émis
```
reporting:report_generated
reporting:scheduled_sent
```

### Dépendances
- Tous les modules (data source)

### Coûts
- Stockage : Modéré (data warehouse)
- Compute : **ÉLEVÉ** (reporting async)
- API : Bas

---

## 7. MODULE : PAIEMENTS (Payment Processing)

### Description
Traitement des paiements en ligne et intégrations bancaires.

### Features
- ✅ Paiement par carte (Visa, Mastercard)
- ✅ Paiement par mobile money (MTN, Orange, Vodafone)
- ✅ Paiement USSD
- ✅ Paiement par virement bancaire
- ✅ Plans de paiement échelonnés
- ✅ Conversion devises locales
- ✅ Réconciliation automatique
- ✅ Webhooks de confirmation
- ✅ Tokens de sécurité (PCI-DSS)
- ✅ Possibilité remboursement

### Permissions
```
Roles:
- School Admin (config providers)
- Finance Officer (gestion)
- Parent (effectuer paiement)
```

### API Endpoints
```
POST  /api/payments/initiate
GET   /api/payments/:paymentId/status
POST  /api/payments/:paymentId/confirm
POST  /api/payments/:paymentId/refund

GET   /api/payments/methods
POST  /api/payments/methods/add
DELETE /api/payments/methods/:id

POST  /api/payments/webhook/stripe
POST  /api/payments/webhook/flutterwave
POST  /api/payments/webhook/mtn
```

### Providers
```
Global:
- Stripe (cartes, e-wallets)
- PayPal (international)

Afrique (priorité):
- Flutterwave (35+ pays africains)
- Paystack (Nigeria, Ghana, Kenya, etc.)
- MTN Mobile Money (12+ pays)
- Orange Money (13+ pays)

Locale:
- Virement bancaire
- USSD
- Paiement de comptoir (offline)
```

### Security
```
- Chiffrement PCI-DSS
- Tokens de sécurité
- 3D Secure
- Hachage + salting
- No raw data storage
```

### Events Émis
```
payment:initiated
payment:completed
payment:failed
payment:refunded
```

### Dépendances
- Finance Module (obligatoire)
- Notification Service (confirmation)

### Coûts
- Frais de transaction : 1-3% (provider)
- Intégration : Bas
- API : Bas

---

## Matrice d'Activation des Modules

```
╔═══════════════════════════════════════════════════════════════╗
║  PLAN        │ ACADEMIC │ FINANCE │ LMS │ AI │ COMM │ REPORT │
╠═════════════╢ PAYMENT  │         │     │    │      │        ║
║ FREE        │    ✓     │    ✗    │ ✗   │ ✗  │  ✓   │   ✓    ║
║             │ (limité) │         │     │    │      │ (limité)║
╠═════════════╪═════════════════════════════════════════════════╣
║ BASIC       │    ✓     │    ✓    │ ✓   │ ✗  │  ✓   │   ✓    ║
║ (150$/mois) │          │         │     │    │      │        ║
╠═════════════╪═════════════════════════════════════════════════╣
║ PREMIUM     │    ✓     │    ✓    │ ✓   │ ✓  │  ✓   │   ✓    ║
║ (500$/mois) │ (complet)│ (complet)│     │    │      │        ║
╠═════════════╪═════════════════════════════════════════════════╣
║ ENTERPRISE  │    ✓     │    ✓    │ ✓   │ ✓  │  ✓   │   ✓    ║
║ (custom)    │ (complet)│ (custom)│     │    │      │        ║
║             │ + API    │ + avancé│     │    │      │        ║
╚═════════════╧═════════════════════════════════════════════════╝
```

---

## Configuration par Module

### Activation/Désactivation
```typescript
// Modèle de configuration
interface SchoolModuleConfig {
  schoolId: string;
  academicManagement: {
    enabled: true;
    features: ['attendance', 'schedule', 'grades'];
  };
  financialManagement: {
    enabled: true;
    features: ['invoicing', 'reporting'];
    maxInvoicesPerMonth: 5000;
  };
  lms: {
    enabled: true;
    features: ['courses', 'quizzes', 'assignments'];
    maxStorageGB: 100;
  };
  pedagogicalAI: {
    enabled: false; // Pas dans forfait FREE
  };
  communication: {
    enabled: true;
    features: ['messages', 'announcements'];
  };
  reporting: {
    enabled: true;
    features: ['academic_reports', 'basic_analytics'];
  };
  payments: {
    enabled: false; // Optionnel add-on
    providers: ['flutterwave', 'stripe'];
  };
}
```

### API de contrôle
```
POST /api/schools/:schoolId/modules/:moduleId/enable
POST /api/schools/:schoolId/modules/:moduleId/disable
GET  /api/schools/:schoolId/modules/status
PUT  /api/schools/:schoolId/modules/:moduleId/config
```

