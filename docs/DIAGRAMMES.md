# NeoClass - Diagrammes Architecturaux

Visualisations de l'architecture système NeoClass.

---

## 1. Architecture Globale - Simplified

```
                          UTILISATEURS
                    ┌────────┬────────┬────────┬────────┐
                    |  Web   | iOS    |Android | Client |
                    └────────┴────────┴────────┴────────┘
                                    |
                        ┌───────────┴──────────┐
                        |   API Gateway        |
                        | (Kong + Auth + RateLimit)
                        └───────────┬──────────┘
                                    |
                ┌───────────────────┼───────────────────┐
                |                   |                   |
            ┌───▼────┐         ┌────▼────┐        ┌────▼────┐
            │  API   │         │  LMS    │        │  Worker │
            │Cluster │         │Service  │        │Cluster  │
            │ (10x)  │         │ (4x)    │        │ (20x)   │
            └───┬────┘         └────┬────┘        └────┬────┘
                |                   |                   |
                └───────────────────┼───────────────────┘
                                    |
                    ┌───────────────┼───────────────────┐
                    |               |                   |
                ┌───▼───┐      ┌────▼───┐         ┌────▼────┐
                │PostgreSQL    │MongoDB │         │ S3/CDN  │
                │ (Primary)    │ (Flex) │         │(Content)│
                └───────┘      └────────┘         └─────────┘
```

---

## 2. Microservices - Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Kong)                        │
│       JWT Auth │ Rate Limit │ Versioning │ Logging         │
└────────────────┬──────────────────────────────────────────┘
                 │
         ┌───────┼───────┐
         |       |       |
    ┌────▼─┐ ┌──▼──┐ ┌──▼──┐
    │Auth  │ │User │ │Acad │
    │Svc   │ │Mgmt │ │Svc  │
    │:3001 │ │:3003│ │:3004│
    └────┬─┘ └──┬──┘ └──┬──┘
         │      │      │
         └──────┼──────┤ ← REST/gRPC
                │      │
    ┌───────────▼──────▼──────────────┐
    │    RabbitMQ Message Queue       │
    │  Events: user.created,          │
    │          grade.updated, etc.    │
    └───────────┬─┬─┬─┬─┬─┬─┬─┬─┬─┬──┘
                | | | | | | | | | |
         ┌──────┼─┼─┼─┼─┼─┼─┼─┼─┼─▼───────┐
    ┌────▼─┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌────▼─┐
    │LMS   │ │AI   │ │Comm │ │Report│ │Notify│
    │:3006 │ │:3007│ │:3008│ │:3009│ │:3011 │
    └──────┘ └─────┘ └─────┘ └──────┘ └──────┘
         |        |      |       |        |
         └────────┼──────┼───────┼────────┘
                  |      |       |
            ┌─────▼──────▼───────▼────────┐
            │   PostgreSQL / MongoDB      │
            │  (Data Warehousing)         │
            └────────────────────────────┘
```

---

## 3. Multi-tenant Data Isolation

```
ÉCOLE 1 (school_id: "001")                ÉCOLE 2 (school_id: "002")
┌────────────────────────────────┐      ┌────────────────────────────────┐
│  Users Table (filtered)        │      │  Users Table (filtered)        │
│  ├─ teacher_1 (001)           │      │  ├─ teacher_5 (002)           │
│  ├─ student_1 (001)            │      │  ├─ student_10 (002)          │
│  └─ parent_1 (001)             │      │  └─ parent_5 (002)            │
│                                │      │                                │
│  Grades Table (filtered)       │      │  Grades Table (filtered)       │
│  ├─ grade_1 (001)             │      │  ├─ grade_100 (002)           │
│  ├─ grade_2 (001)             │      │  ├─ grade_101 (002)           │
│  └─ (RLS policy applied)      │      │  └─ (RLS policy applied)      │
└────────────────────────────────┘      └────────────────────────────────┘
              |   SELECT * FROM users       |   SELECT * FROM users
              |   WHERE school_id = '001'   |   WHERE school_id = '002'
              │                             │
              └─────────────────┬───────────┘
                                │
                      ┌─────────▼────────────────┐
                      │ PostgreSQL Database      │
                      │ (Row-Level Security)     │
                      │                          │
                      │ Single Database,         │
                      │ Multiple Schemas,        │
                      │ Complete Isolation       │
                      └──────────────────────────┘
```

---

## 4. Real-time Communication Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Server (Socket.io)             │
│              Port 8001 (persistent connections)             │
└──────────────┬──────────────────────────────────────────────┘
               |
    ┌──────────┼──────────┐
    |          |          |
┌───▼──┐  ┌───▼──┐  ┌───▼──┐
│Class │  │ User │  │Direct│
│Room  │  │Notif │  │ Msg  │
│ 001  │  │ Room │  │ Room │
└───┬──┘  └───┬──┘  └───┬──┘
    |         |         |
    └─────────┼─────────┘
              |
        ┌─────▼──────┐
        │ Redis Pub/Sub
        │ (Cluster)
        └─────┬──────┘
              |
    ┌─────────┼──────────┐
    |         |          |
┌───▼──┐  ┌──▼───┐  ────▼────
│Event │  │ Cache│  Service
│Queue │  │Hit   │  Callbacks
│Listen   │       │
└────────┘  └──────┘
```

---

## 5. Data Flow : Grade Submission

```
┌─────────────────┐
│  TEACHER        │
│  Enters Grades  │
│  UI (Web/Mobile)│
└────────┬────────┘
         │ POST /api/grades
         ▼
┌──────────────────┐
│  API Gateway     │
│  - Auth JWT      │
│  - Rate Limit    │
│  - Log Request   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────┐
│ Academic Service │──────│ PostgreSQL   │
│ - Validate Data  │  SQL │ - Insert     │
│ - Calc Stats     │      │ - school_id  │
│ - Format         │      └──────────────┘
└────────┬─────────┘
         │ PUBLISH event
         ▼
    ┌────────────────────────────────┐
    │   RabbitMQ (Message Queue)     │
    │   Event: "grades:submitted"    │
    │   schoolId: 001, gradeId: 123  │
    └────┬───────────┬───────┬───────┘
         │           │       │
    ┌────▼───┐  ┌────▼──┐ ┌─▼──────┐
    │ LMS    │  │Reports│ │Notify  │
    │ Update │  │Update │ │Service │
    │ Progress   │Stats │ │(Async) │
    └────┬───┘  └───┬───┘ └─┬──────┘
         │          │       │
         │ Consume   │ Consume
         ▼          ▼       ▼
    ┌────────────────────────────────┐
    │  Notifications Sent             │
    │  - Teacher: Confirmation       │
    │  - Student: Grade Alert        │
    │  - Parent: Grade Update        │
    └────────────────────────────────┘
```

---

## 6. Kubernetes Deployment

```
┌──────────────────────────────────────────────────┐
│           Kubernetes Cluster (EKS)              │
│  Region: eu-west-1 (Ireland)                   │
└──────────┬─────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────────┐  ┌▼──────────┐
│ Node Group │  │Node Group │
│ API (5)    │  │ LMS (3)   │
│ t3.xlarge  │  │m5.2xlarge │
└───┬────────┘  └┬──────────┘
    │            │
    │ Pods:      │ Pods:
    │-Auth      │- LMS API
    │-API       │- Content
    │-User      │- Analytics
    │-Academic  │
    │-Finance   │
    │-Payment   │
    │           │
    ├─────┬─────┤
    │     │     │
    │ ┌───▼─────┐
    │ │ RDS     │
    │ │ Aurora  │
    │ │ Cluster │
    │ └─────────┘
    │
    └─ Service Mesh: Istio
       ├─ Traffic management
       ├─ Circuit breaking
       ├─ Observability
       └─ Security policies
```

---

## 7. Offline-First Sync

```
┌─────────────────────────────────┐
│   Mobile App / Web (Offline)    │
│  ┌────────────────────────────┐ │
│  │ IndexedDB / WatermelonDB   │ │
│  │ (Local Database)           │ │
│  │ ├─ Users (cached)          │ │
│  │ ├─ Grades (cached)         │ │
│  │ ├─ Classes (cached)        │ │
│  │ └─ Pending Changes Queue   │ │
│  └────────────────────────────┘ │
│              │                  │
│              ▼                  │
│  ┌────────────────────────────┐ │
│  │ Service Worker             │ │
│  │ ├─ Intercept API calls     │ │
│  │ ├─ Queue if offline        │ │
│  │ └─ Retry on reconnect      │ │
│  └────────────────────────────┘ │
└─────────────────┬────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Network Check     │ (Online)
        │ (NetInfo)         │
        └─────────┬─────────┘
                  │
        ┌─────────▼──────────┐
        │ Sync Engine        │
        │ - Upload pending   │
        │ - Download updates │
        │ - Conflict resolve │
        │ - Merge strategy   │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │  Backend API       │
        │  ├─ Persist        │
        │  ├─ Notify others  │
        │  └─ Publish queue  │
        └────────────────────┘
```

---

## 8. Database Scaling Strategy

```
PHASE 1 (MVP): Shared Database
┌─────────────────────────────┐
│ PostgreSQL (db.t3.medium)   │
│ ├─ schema: school_001       │
│ ├─ schema: school_002       │
│ └─ schema: school_N (10s)   │
│ Single point of failure     │
└─────────────────────────────┘

                    ▼

PHASE 2 (Growth): Multi-schema with Replicas
┌─────────────────────────────┐
│ PostgreSQL (db.t3.large)    │
│ ├─ schema: school_001       │
│ ├─ schema: school_002       │
│ └─ schema: school_500s      │
│                             │
│ + Read Replicas (3)         │
│ + Automated Backups         │
└─────────────────────────────┘

                    ▼

PHASE 3 (Scale): Database per Tenant
School 001-100      School 101-200      School 201-300
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│PostgreSQL #1 │   │PostgreSQL #2 │   │PostgreSQL #3 │
│ (Cluster 1)  │   │ (Cluster 2)  │   │ (Cluster 3)  │
└──────────────┘   └──────────────┘   └──────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌────────▼────────┐
                  │ Router/Proxy    │
                  │ (Consistent     │
                  │  Hashing)       │
                  └─────────────────┘

                    ▼

PHASE 4: Full Sharding + Geo-distribution
┌─────────────────┐      ┌─────────────────┐
│ EU Region       │      │ Africa Region   │
│ (Frankfurt)     │      │ (Lagos/Joburg)  │
│ ├─ Cluster 1-3  │      │ ├─ Cluster 4-6  │
│ └─ Read replica │      │ └─ Read replica │
└─────────────────┘      └─────────────────┘
```

---

## 9. Security Layers

```
┌──────────────────────────────────────────────┐
│           User/Client                        │
└────────────┬─────────────────────────────────┘
             │ HTTPS + TLS 1.3
             ▼
┌──────────────────────────────────────────────┐
│        CloudFlare WAF                        │
│ ├─ DDoS Protection                          │
│ ├─ Bot Management                           │
│ └─ Rate Limiting                            │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│      AWS WAF & Shield                       │
│ ├─ Web ACL Rules                            │
│ ├─ IP Reputation                            │
│ └─ SQL Injection Prevention                 │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│      Application Security                   │
│ ├─ OAuth2 + JWT Auth                       │
│ ├─ API Key Signing                         │
│ ├─ Request Validation                      │
│ └─ Secrets Management (HashiCorp Vault)    │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│      Database Security                      │
│ ├─ Row-Level Security (RLS)                 │
│ ├─ Column-level Encryption                  │
│ ├─ Encrypted Backups                        │
│ └─ Private Subnets (VPC Isolated)          │
└──────────────────────────────────────────────┘
```

---

## 10. Deployment Pipeline (CI/CD)

```
┌────────────────────────┐
│  Developer Pushes Code │
│  to Main Branch        │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│  GitHub Actions        │
│  ├─ Tests (Jest)       │
│  ├─ Linting (ESLint)   │
│  ├─ Build              │
│  └─ Security Scan      │
└────────────┬───────────┘
             │ (All pass)
             ▼
┌────────────────────────┐
│  Build Docker Image    │
│  └─ Push to ECR        │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐      ┌──────────────────┐
│  Deploy to Staging     │——────│ Smoke Tests      │
│  (Kubernetes)          │      │ (Automated)      │
└────────────┬───────────┘      └──────────────────┘
             │ (Tests pass)
             ▼
┌────────────────────────┐
│  Approval Required     │
│  (Team Lead)           │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│  Deploy to Production  │
│  ├─ Blue-Green Deploy  │
│  ├─ Health Checks      │
│  └─ Monitoring Alert   │
└────────────────────────┘
             │
             ▼
┌────────────────────────┐
│  Rollback Ready        │
│  (1-click if needed)   │
└────────────────────────┘
```

---

## 11. Growth Phases Timeline

```
Month 0-3: MVP
├─ Single region (AWS N. Virginia)
├─ 5,000 users, 10-50 schools
├─ 2-3 engineers
└─ $500/month infra
    │
    ▼ (Success!)

Month 3-6: Alpha Growth
├─ 20,000 users, 100-150 schools
├─ Add monitoring + analytics
├─ Expand to 3-4 regions
└─ $1-2K/month infra
    │
    ▼ (Traction!)

Month 6-12: Beta Scale
├─ 100,000 users, 300-500 schools
├─ Introduce Kubernetes
├─ Multi-cloud setup begins
├─ 5-6 engineers + DevOps
└─ $3-5K/month infra
    │
    ▼ (Gaining momentum!)

Month 12-24: Production Scale
├─ 500K users, 2,000 schools
├─ Full microservices
├─ Global distribution
├─ 24/7 SRE team
└─ $8-15K/month infra
    │
    ▼ (Enterprise ready!)

Year 2+: Mega-scale
├─ 2M+ users, 10,000 schools
├─ Multi-cloud (AWS + GCP + Azure)
├─ Advanced ML features
├─ Full compliance (SOC2, ISO 27001)
└─ $30-50K/month infra
```

---

## 12. Monitoring Dashboard

```
┌────────────────────────────────────────────┐
│      Grafana Monitoring Dashboard          │
├────────────────────────────────────────────┤
│                                            │
│  API Response Time (p99)                   │
│  ▁▁▂▂▃▃▃▄▄▄▅▅▅▆▆▆▇▇▆▆▅▄  150ms           │
│                                            │
│  Error Rate                                │
│  ▁▁▁▁▁▁▁▂▂▂▂▁▁▁▁▁▁▁▁▁▁▁  0.02%          │
│                                            │
│  Active Users: 8,500 | Requests/sec: 2.1K │
│  Cache Hit: 94.5% | DB Connections: 280   │
│                                            │
│  ⚠️  Alerts:                               │
│  • High latency detected (p95 > 500ms)    │
│  • CPU usage > 80% on 2 instances         │
│  • Disk space low (85% used)              │
│                                            │
│  Services Status:                          │
│  ✓ API (3/3 healthy)                      │
│  ✓ LMS (4/4 healthy)                      │
│  ✓ PostgreSQL (Primary + 2 replicas)      │
│  ✓ Redis Cluster (6/6 nodes)              │
│                                            │
└────────────────────────────────────────────┘
```

---

## References

- [Cloud Architecture Icons](https://aws.amazon.com/architecture/icons/)
- [C4 Model for Architecture](https://c4model.com/)
- [System Design Primer](https://github.com/donnemartin/system-design-primer)

