# Architecture Backend - NeoClass

## Stack technologique

```
Node.js 20 LTS (Runtime)
├─ Express.js / Fastify (Web Framework)
├─ TypeScript (Langage)
├─ Docker (Containerisation)
├─ Kubernetes (Orchestration)
└─ PostgreSQL + MongoDB (Bases de données)
```

---

## Structure microservices

### 1. **Auth Service** - Authentification et Autorisation
```
Port: 3001
Base: PostgreSQL (users, sessions, tokens)
Cache: Redis (token blacklist)

Endpoints:
  POST /auth/register        → Créer un compte
  POST /auth/login          → Authentication JWT
  POST /auth/refresh        → Renouveler le token
  POST /auth/logout         → Invalider le session
  PUT /auth/2fa             → Configurer 2FA
  POST /auth/password-reset → Réinitialiser MDP
  GET /auth/verify/:token   → Vérifier email
```

**Technologies**:
- JWT + OAuth2 (Google, Microsoft pour SSO)
- bcryptjs pour hachage des mots de passe
- rate-limiting : 5 tentatives/15 min

---

### 2. **School Management Service** - Gestion des écoles
```
Port: 3002
Base: PostgreSQL (schools, subscriptions, licenses)
Cache: Redis

Endpoints:
  POST /schools                 → Créer une école
  GET /schools/:schoolId        → Récupérer détails
  PUT /schools/:schoolId        → Mettre à jour
  GET /schools/:schoolId/config → Config & modules activés
  PUT /schools/:schoolId/modules → Activer/désactiver modules
  POST /schools/:schoolId/invite → Inviter administrateur
  GET /schools/:schoolId/usage   → Utilisation ressources
```

**Modèle de données**:
```typescript
interface School {
  id: string;
  name: string;
  country: string;
  region: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription: {
    planId: string;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'paused' | 'cancelled';
  };
  enabledModules: {
    academicManagement: boolean;
    financialManagement: boolean;
    lms: boolean;
    pedagogicalAI: boolean;
    communication: boolean;
    reporting: boolean;
    payments: boolean;
  };
  maxUsers: number;
  maxStorage: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 3. **User Management Service** - Gestion des utilisateurs
```
Port: 3003
Base: PostgreSQL (users, roles, permissions)
Cache: Redis

Endpoints:
  POST /users                    → Créer utilisateur
  GET /users/:userId             → Récupérer profil
  PUT /users/:userId             → Mettre à jour profil
  DELETE /users/:userId          → Supprimer compte
  POST /users/:userId/avatar     → Upload avatar
  GET /users/:userId/permissions → Lister permissions
  POST /users/bulk-import        → Import CSV
  GET /users/search              → Rechercher utilisateurs
```

**Rôles disponibles**:
- **Super Admin** : Accès complet à toutes les écoles
- **School Admin** : Gestion complète d'une école
- **Director** : Gestion directeur d'établissement
- **Teacher** : Enseignant (accès à ses classes)
- **Student** : Élève
- **Parent** : Parent (accès aux résultats enfant)
- **Finance Officer** : Agent financier
- **IT Support** : Support technique

---

### 4. **Academic Service** - Gestion Scolaire
```
Port: 3004
Base: PostgreSQL (years, semesters, classes, courses)
Cache: Redis

Endpoints:
  POST /academic/years              → Créer année scolaire
  GET /academic/classes/:classId     → Récupérer classe
  POST /academic/classes             → Créer classe
  POST /academic/courses             → Créer matière
  POST /academic/courses/:id/lessons → Créer leçon
  GET /academic/schedule             → Emploi du temps
  POST /academic/attendance          → Marquer présence
  GET /academic/grades/:studentId    → Bulletins scolaires
  POST /academic/grades              → Entrer notes
```

**Modèle de données clés**:
```typescript
interface AcademicYear {
  id: string;
  schoolId: string;
  name: string; // e.g., "2024-2025"
  startDate: Date;
  endDate: Date;
  active: boolean;
}

interface Class {
  id: string;
  schoolId: string;
  name: string; // e.g., "6ème A"
  level: number;
  academicYearId: string;
  teacherId: string;
  maxStudents: number;
  currentStudents: number;
}

interface Course {
  id: string;
  schoolId: string;
  classId: string;
  name: string;
  code: string;
  credit: number;
  teacherId: string;
}

interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  semesterId: string;
  score: number;
  coefficient: number;
  evaluationType: 'exam' | 'continuous' | 'project';
}
```

---

### 5. **Finance Service** - Gestion Financière
```
Port: 3005
Base: PostgreSQL (transactions, invoices, accounting), MongoDB (ledgers)
Cache: Redis

Endpoints:
  POST /finance/invoices                → Créer facture
  GET /finance/invoices/:invoiceId      → Récupérer facture
  GET /finance/invoices/student/:id     → Factures d'un élève
  POST /finance/payments                → Enregistrer paiement
  GET /finance/transactions             → Historique transactions
  GET /finance/reports/balance          → Bilan comptable
  GET /finance/reports/cashflow         → Flux de trésorerie
  POST /finance/expenses                → Enregistrer dépense
  GET /finance/analysis                 → Analyses financières
```

**Modèle de données**:
```typescript
interface Invoice {
  id: string;
  schoolId: string;
  studentId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'issued' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  description: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  date: Date;
  amount: number;
  method: 'cash' | 'check' | 'transfer' | 'momo' | 'card';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
}
```

---

### 6. **LMS Service** - Gestion du Contenu d'Apprentissage
```
Port: 3006
Base: PostgreSQL (courses metadata), MongoDB (course content)
Storage: S3/MinIO (videos, PDF, documents)

Endpoints:
  POST /lms/courses                      → Créer cours
  GET /lms/courses/:courseId             → Récupérer cours
  POST /lms/courses/:id/modules          → Ajouter module
  POST /lms/courses/:id/lessons          → Ajouter leçon
  POST /lms/lessons/:id/content          → Ajouter contenu
  POST /lms/lessons/:id/quiz             → Créer quiz
  POST /lms/submissions/:id              → Soumettre devoir
  GET /lms/progress/:studentId/:courseId → Progression étudiant
  POST /lms/feedback                     → Donner feedback
  GET /lms/search                        → Rechercher contenu
```

**Stockage des contenus**:
- Images/PDFs: S3 avec CDN CloudFront
- Vidéos: HLS streaming adaptatif (résolutions appropriées pour Afrique)
- Metadata: MongoDB avec indexation
- Cache: Redis (contenu populaire)

---

### 7. **AI Service** - Intelligence Pédagogique
```
Port: 3007
Base: PostgreSQL (analytics), MongoDB (models, predictions)
ML Framework: Python (FastAPI) avec TensorFlow/PyTorch

Endpoints:
  POST /ai/analyze-performance          → Analyser performance
  GET /ai/recommendations/:studentId    → Recommandations personnalisées
  POST /ai/detect-difficulty            → Détecter difficultés
  POST /ai/content-recommendations      → Recommander contenu
  POST /ai/predict-grades               → Prédire notes
  POST /ai/learning-paths               → Générer parcours d'apprentissage
  POST /ai/chat-tutor                   → Assistant IA pédagogique
  GET /ai/class-analytics               → Analytics classe
```

**Modèles disponibles**:
- Classification d'aptitudes
- Prédiction de réussite
- Génération de parcours personnalisés
- Détection d'incompréhension
- Recommendation de ressources

---

### 8. **Communication Service** - Système de Messagerie
```
Port: 3008
Base: PostgreSQL (messages, channels), MongoDB (archives)
Real-time: WebSocket via Socket.io

Endpoints:
  POST /messages                        → Envoyer message
  GET /messages/conversation/:userId    → Historique conversation
  POST /channels                        → Créer canal
  GET /channels/:classId                → Canaux d'une classe
  POST /channels/:id/members            → Ajouter membres
  POST /announcements                   → Créer annonce
  GET /announcements                    → Lister annonces
  POST /notifications/preferences       → Gérer notifications
```

**Types de communications**:
- Messages directs (1:1)
- Chats de groupe (classe, département)
- Annonces (broadcast par école/classe)
- Forums de discussion
- Notifications push

---

### 9. **Reporting Service** - Rapports et Analytique
```
Port: 3009
Base: PostgreSQL, Elasticsearch
Queue: RabbitMQ (génération async)

Endpoints:
  GET /reports/templates                → Templates disponibles
  POST /reports/generate                → Générer rapport
  GET /reports/:reportId                → Récupérer rapport
  GET /reports/export/:reportId/:format → Exporter (PDF/Excel)
  POST /reports/scheduled               → Planifier rapports
  GET /dashboards                       → Tableaux de bord
  GET /analytics/trends                 → Tendances analytics
```

**Rapports disponibles**:
- Bulletins scolaires
- Rapports de performance par classe
- Analyses financières
- Taux d'assiduité
- Rapport d'utilisation LMS
- Rapport de santé du système

---

### 10. **Payment Service** - Traitement des Paiements
```
Port: 3010
Base: PostgreSQL (transactions)
Providers: Stripe, PayPal, MTN Mobile Money, Orange Money, Flutterwave

Endpoints:
  POST /payments/initiate                → Initier paiement
  GET /payments/:paymentId               → Statut paiement
  POST /payments/webhook                 → Webhook providers
  GET /payments/methods                  → Méthodes disponibles
  POST /payments/refund                  → Remboursement
  GET /payments/statement                → Relevé paiements
  POST /payments/reconciliation          → Réconciliation
```

**Méthodes acceptées**:
- Carte bancaire (Visa, Mastercard)
- Transfert bancaire mobile (MTN, Orange, Vodafone)
- e-Wallets (PayPal, Stripe)
- USSD pour Afrique
- Crypto (optionnel)

---

### 11. **Notification Service** - Système de Notifications
```
Port: 3011
Base: PostgreSQL (templates), MongoDB (logs)
Providers: FCM, SendGrid, Twilio

Endpoints:
  POST /notifications/send              → Envoyer notification
  POST /notifications/schedule          → Planifier notification
  GET /notifications/history            → Historique notifications
  GET /notifications/preferences        → Préférences utilisateur
  PUT /notifications/preferences        → Mettre à jour préférences
```

**Canaux**:
- Push notifications (Web, iOS, Android)
- Emails
- SMS
- WebSocket (temps réel)

---

## Communication inter-services

### Pattern : API Gateway → Microservices

```
Client
  ↓
API Gateway (Kong/Traefik)
  ├─ Auth Service
  ├─ School Service
  ├─ User Service
  ├─ Academic Service
  ├─ Finance Service
  ├─ LMS Service (S3)
  ├─ AI Service
  ├─ Communication Service
  ├─ Reporting Service
  ├─ Payment Service
  └─ Notification Service
```

### Synchrone : REST/gRPC
- Requêtes nécessitant une réponse immédiate
- Timeout: 30 secondes
- Retry avec exponential backoff

### Asynchrone : Message Queue (RabbitMQ)
- Paiements complétés → mise à jour Finance
- Grades entrées → notification Parents
- Rapports générés → notification Admin
- Logs → Elasticsearch

---

## Schéma des bases de données

### PostgreSQL (Données relationnelles)
```sql
-- Tenant tenant-agnostic (super admin)
schools
tenants_licensing
tenants_features

-- Tables avec school_id (isolation multi-tenant)
users
roles
permissions
academic_years
semesters
classes
courses
lessons
grades
attendance
invoices
payments
transactions
announcements
channels
messages
reports
```

### MongoDB (Données flexible)
```
collections:
  - course_content (contenu LMS)
  - user_profiles (données enrichies)
  - learning_analytics (événements pédagogiques)
  - ai_models (modèles et prédictions)
  - communication_archives (messages archivés)
  - financial_ledgers (registres comptables)
```

---

## Déploiement microservices

### Dockerfile (template)
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: neoclass/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: postgres-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1024Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Docker Compose (Développement)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports: ["5672:5672", "15672:15672"]
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

  auth-service:
    build: ./services/auth
    ports: ["3001:3001"]
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/neoclass
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
```

---

## Monitoring & Observabilité

### Health Checks
```typescript
// Tous les services exposent:
GET /health       → Status simple
GET /ready        → Prêt pour recevoir du trafic
GET /live         → Santé globale
```

### Logs structurés
```json
{
  "timestamp": "2024-05-23T10:30:00Z",
  "level": "info",
  "service": "academic-service",
  "schoolId": "school_123",
  "traceId": "abc-123-def",
  "userId": "user_456",
  "message": "Grade created",
  "action": "grade.create",
  "metadata": {
    "courseId": "course_789",
    "studentId": "student_001"
  }
}
```

### Métriques Prometheus
```
service_requests_total{service="auth-service", method="POST", endpoint="/login", status="200"}
service_request_duration_seconds{service="academic-service", method="GET", endpoint="/classes"}
database_query_duration_seconds{service="finance-service", query_type="select"}
cache_hit_ratio{service="lms-service"}
```

