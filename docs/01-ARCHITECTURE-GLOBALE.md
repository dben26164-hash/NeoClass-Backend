# Architecture Globale - NeoClass

## Vue d'ensemble

NeoClass est une plateforme SaaS EdTech multi-tenant, multi-plateforme destinée aux écoles africaines. Elle suit une architecture **microservices modulaire** avec une approche API-first.

### Principes architecturaux

1. **Modularité** : Chaque module peut être activé/désactivé indépendamment
2. **Multi-tenant** : Isolation complète des données par école/organisation
3. **Multi-plateforme** : Web, iOS, Android avec synchronisation temps réel
4. **Résilience** : Tolérance aux interruptions réseau (offline-first)
5. **Scalabilité** : Infrastructure cloud capable de supporter des milliers d'écoles
6. **Conformité** : RGPD, CCPA, et lois de protection des données des pays africains

---

## Architecture en couches

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  Web (React/Next.js) │ iOS (Swift) │ Android (Kotlin/React) │
└──────────────────────┬──────────────────────────────────────┘
                       │ GraphQL/REST APIs
┌──────────────────────▼──────────────────────────────────────┐
│              API GATEWAY & AUTHENTICATION                    │
│  Kong/Traefik │ JWT/OAuth2 │ Rate Limiting │ API Versioning │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              MICROSERVICES LAYER                             │
│  ├─ Auth Service                                             │
│  ├─ School Management Service                                │
│  ├─ User Management Service                                  │
│  ├─ Academic Service (Gestion scolaire)                      │
│  ├─ Finance Service (Gestion financière)                     │
│  ├─ LMS Service (Learning Management)                        │
│  ├─ AI Service (IA pédagogique)                              │
│  ├─ Communication Service                                    │
│  ├─ Reporting Service (Rapports)                             │
│  ├─ Payment Service (Paiements)                              │
│  └─ Notification Service                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            DATA & INFRASTRUCTURE LAYER                       │
│  ├─ PostgreSQL (données relationnelles)                      │
│  ├─ MongoDB (données non-structurées)                        │
│  ├─ Redis (cache & session)                                  │
│  ├─ Elasticsearch (recherche & logs)                         │
│  ├─ Message Queue (RabbitMQ/Kafka)                           │
│  ├─ File Storage (S3/MinIO)                                  │
│  └─ CDN (Cloudflare/Akamai)                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Composants clés

### 1. Frontend Web
- **Framework** : Next.js 14+ (React, TypeScript)
- **UI Library** : Tailwind CSS + shadcn/ui
- **State Management** : TanStack Query + Zustand
- **Real-time** : WebSocket + Socket.io
- **Offline** : Service Workers + LocalForage
- **i18n** : Next-i18next (Français, Anglais, Langues locales)

### 2. Mobile (iOS & Android)
- **Framework** : React Native ou Flutter (recommandé pour unicité)
- **Database** : SQLite + WatermelonDB (sync offline)
- **State** : Redux Toolkit ou Riverpod (Flutter)
- **Push Notifications** : FCM + Firebase Cloud Messaging
- **Storage** : Realm Database ou Hive

### 3. Backend
- **Framework** : Node.js (Express/Fastify) ou Python (FastAPI)
- **Microservices** : Containerisés avec Docker
- **Orchestration** : Kubernetes (K8s)
- **Communication** : gRPC en interne, REST/GraphQL en externe

### 4. Data Layer
- **SQL** : PostgreSQL (données transactionnelles)
- **NoSQL** : MongoDB (logs, documents, données flexibles)
- **Cache** : Redis (sessions, cache API)
- **Search** : Elasticsearch (recherche globale)
- **Message Queue** : RabbitMQ ou Kafka (événements asynchrones)

### 5. Infrastructure
- **Cloud Provider** : AWS/Google Cloud/Azure
- **Container Registry** : Docker Hub/ECR
- **CI/CD** : GitHub Actions/GitLab CI
- **Monitoring** : Prometheus + Grafana + ELK Stack
- **IaC** : Terraform/CloudFormation

---

## Flux de données multi-tenant

```
┌─────────────────────────────────────────────────────────┐
│              REQUEST D'UN CLIENT                        │
│  Utilisateur d'une école spécifique (School ID)        │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  API Gateway            │
        │  - Authentification JWT │
        │  - Extraction School ID │
        │  - Rate Limiting        │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Service approprié      │
        │  (avec context X-School)│
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Row-Level Security     │
        │  (RLS) - PostgreSQL     │
        │  - Filtre par School    │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Base de données        │
        │  (données isolées)      │
        └────────────────────────┘
```

---

## Modèle de licensing et activation des modules

### Par école :
```json
{
  "schoolId": "school_001",
  "name": "École Polytechnique d'Abidjan",
  "country": "Côte d'Ivoire",
  "tier": "premium",
  "enabledModules": {
    "academicManagement": true,
    "financialManagement": true,
    "lms": true,
    "pedagogicalAI": true,
    "communication": true,
    "reporting": true,
    "payments": true
  },
  "maxUsers": 5000,
  "maxStorage": 1000,
  "supportLevel": "premium_24h"
}
```

---

## Sécurité multi-tenant

### Isolation des données
- **Schéma multi-tenant par base** : Préfixe school_id sur toutes les tables
- **Row-Level Security (RLS)** : Politiques PostgreSQL par tenant
- **Chiffrement** : Données sensibles chiffrées (SSN, paiements)
- **API Keys** : Isolées par école

### Authentification & Autorisation
- **OAuth2 + OpenID Connect** pour intégrations tierces
- **JWT** avec school_id encodé
- **RBAC** : Rôles (Admin, Directeur, Enseignant, Parent, Élève)
- **ABAC** : Règles d'accès granulaires par module

---

## Communication temps réel

### WebSocket
- **Événements** : Notifications, mises à jour d'emploi du temps, communications
- **Rooms** : Par école, par classe, par utilisateur
- **Fallback** : Polling pour clients sans WebSocket

### Message Queue
- **Événements asynchrones** : Paiements, génération de rapports
- **Retry logic** : Garantie de livraison
- **Dead Letter Queue** : Gestion des erreurs

---

## Stratégie offline-first

### Web
- Service Workers + IndexedDB
- Synchronisation lors du retour en ligne
- Conflict resolution local

### Mobile
- Base de données locale (SQLite/Realm)
- Sync engine automatique
- Gestion des conflits et versions

---

## Monitoring et observabilité

### Logs
- **Centralisé** : ELK Stack (Elasticsearch, Logstash, Kibana)
- **Par tenant** : Tags school_id sur tous les logs

### Métriques
- **Prometheus** : Collecte des métriques des services
- **Grafana** : Tableaux de bord
- **SLOs** : 99.9% uptime pour production

### Tracing
- **Jaeger/DataDog** : Tracing distribué des requêtes
- **Corrélation** : Trace-ids à travers tous les services

---

## Déploiement

### Environnements
- **Développement** : Localhost + Docker Compose
- **Staging** : Cluster K8s de test
- **Production** : Multi-région, haute disponibilité

### Stratégie
- **Blue-Green Deployment** pour zéro downtime
- **Canary Releases** : 10% → 50% → 100%
- **Rollback automatique** en cas d'erreur

---

## Coûts et optimisations pour l'Afrique

### Optimisations
- **CDN régional** : Réduction de la bande passante
- **Compression** : Gzip + Brotli pour toutes les réponses
- **Pagination** : Limite les données transmises
- **Lazy loading** : Chargement progressif

### Infrastructure
- **Multi-région** : Servers en Afrique du Sud, Nigeria, Égypte
- **Caching agressif** : Réduction des appels DB
- **Data centers partenaires** : Réductions de coûts

