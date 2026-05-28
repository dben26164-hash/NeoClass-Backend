# Plan de Scalabilité - NeoClass

## Vision

NeoClass doit supporter de 100 à 10,000+ écoles africaines, avec millions d'utilisateurs,  tout en maintenant une latence faible et une haute disponibilité (99.99% uptime).

---

## 1. Phases de Croissance

### Phase 1 : MVP (Mois 0-3)
**Cible** : 10-50 écoles, ~5,000 utilisateurs

```
Architecture:
- Single AWS region (N. Virginia)
- RDS PostgreSQL (db.t3.medium)
- Single Redis (cache.t3.micro)
- Load Balancer + 2 API servers (t3.small)
- Storage S3 (< 10GB)

Coûts:
- Infrastructure: ~$500/mois
- Personnel: 2 engineers
- Support: DIY
```

### Phase 2 : Early Growth (Mois 3-12)
**Cible** : 100-300 écoles, 50,000+ utilisateurs

```
Architecture:
- RDS PostgreSQL (db.t3.large, Multi-AZ)
- Redis Cluster (2 nodes, cache.m5.large)
- Auto-scaling group (3-8 API servers t3.medium)
- Load Balancer
- CloudFront CDN
- RabbitMQ (t3.small, 3 nodes)
- ElasticSearch (t3.small, 3 nodes)

Bases de données:
- Multi-schema PostgreSQL (par school_id)
- MongoDB (1 replica set)

Coûts:
- Infrastructure: $2,000-3,000/mois
- Personnel: 3-4 engineers + 1 DevOps
- Support: Email + Discord
```

### Phase 3 : Scale-up (Mois 12-24)
**Cible** : 500-2,000 écoles, 500K+ utilisateurs

```
Architecture:
- Multi-region deployment
- RDS Aurora (Multiple AZs)
- Read replicas for analytics
- Redis cluster with Sentinel
- Kubernetes cluster (EKS)
- Microservices (containerized)
- S3 + CloudFront (multi-region)
- WAF (DDoS protection)

Bases de données:
- Database per school (isolation)
- Read-only replicas pour analytics
- Data warehouse (Redshift or BigQuery)
- Elasticsearch cluster (5+ nodes)

Coûts:
- Infrastructure: $8,000-12,000/mois
- Personnel: 6-8 engineers + 2 DevOps + 1 SRE
- Support: 24/7 on-call + ticket system
```

### Phase 4 : Enterprise Scale (24+ mois)
**Cible** : 3,000-10,000 écoles, 2M+ utilisateurs

```
Architecture:
- Multi-cloud (AWS + Google Cloud + Azure)
- Geo-distributed Kubernetes clusters
- Database sharding
- Event streaming (Kafka)
- GraphQL + gRPC federation
- Advanced caching (Memcached + Redis)
- Service mesh (Istio)

Régions:
- Africa (Johannesburg, Lagos)
- Europe (Frankfurt)
- USA (Virginia, Oregon)
- Asia (Singapour)

Coûts:
- Infrastructure: $30,000-50,000/mois
- Personnel: 15-20 engineers + 3-4 DevOps + 2 SRE
- Support: 24/7 worldwide + dedicated accounts
```

---

## 2. Architecture de Base de Données Scalable

### Stratégie Multi-tenant

#### Option 1 : Shared Database, Separate Schema (Recommandé Phase 1-2)
```
Database: neoclass_prod
├─ Schema: school_001
│  ├─ users
│  ├─ classes
│  ├─ grades
│  └─ ... toutes les tables
├─ Schema: school_002
└─ Schema: school_N

Avantages:
- Simple à mettre en place
- Facile à migrer
- Coûts réduits

Inconvénients:
- Une école peut impacter les autres (shared resources)
- Limite à ~500 écoles
```

#### Option 2 : Database per Tenant (Recommandé Phase 3+)
```
AWS RDS Aurora Cluster
├─ neoclass_school_001
├─ neoclass_school_002
├─ neoclass_school_N
└─ neoclass_shared (users globaux)

Avantages:
- Complète isolation
- Backups per school
- Scale individually
- Compliance (data residency)

Inconvénients:
- Complexité (multi-DB management)
- Coûts plus élevés
- Operational overhead

Déploiement:
- Aurora auto-scaling
- CloudFormation templates
- Automated provisioning via Terraform
```

#### Option 3 : Sharding (Phase 4)
```
Routing Layer:
- Consistent hashing de schoolId
- Shard 1-N (distributed)
- Read replicas par shard

School 001-100 → PostgreSQL Cluster 1
School 101-200 → PostgreSQL Cluster 2
School 201-300 → PostgreSQL Cluster 3
...

Avantages:
- Ultra-scale (millions d'écoles)
- Vraie distribution

Inconvénients:
- Très complexe
- Cross-shard queries difficiles
- Onéreux
```

### Replication Strategy

```
Master (PRIMARY)
├─ Synchronous Replica 1 (same AZ)
├─ Synchronous Replica 2 (different AZ)
└─ Asynchronous Read Replicas
   ├─ Analytics
   ├─ Backup
   └─ Disaster recovery

RPO (Recovery Point Objective): 0 (zero data loss)
RTO (Recovery Time Objective): < 60 seconds
```

### Backup Strategy

```
Automated:
- Snapshots: hourly (kept for 7 days)
- Point-in-time recovery: 35 days
- Cross-region backup: daily

Configuration:
aws rds create-db-cluster-snapshot \
  --db-cluster-snapshot-identifier neoclass-backup-$(date +%s)
```

---

## 3. Caching & Performance

### Multi-layer Caching Strategy

```
Browser Cache (CDN)
       ↓ CloudFlare
API Response Cache (Redis)
       ↓
Database Query Cache (Redis)
       ↓
PostgreSQL Query Cache
```

### Redis Clusters

#### Development
```yaml
redis-dev:
  cluster_mode: false
  nodes: 1 (cache.t3.micro)
  memory: 512 MB
  persistence: RDB
```

#### Production
```yaml
redis-prod:
  cluster_mode: true
  nodes: 6 (cache.m5.large)
  memory: 6 GB each
  persistence: AOF + RDB
  replication: Multi-AZ
  
Sharding:
- Consistent hashing
- 16,384 slots
- Auto-failover
```

### Cache Invalidation

```typescript
// Pattern: Cache-Aside
const getUser = async (userId) => {
  // Try cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  // Cache miss: fetch from DB
  const user = await db.users.findById(userId);
  
  // Store in cache (5 min TTL)
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user));
  
  return user;
};

// Invalidate on update
app.put('/users/:id', async (req, res) => {
  const user = await db.users.update(req.params.id, req.body);
  
  // Invalidate cache
  await redis.del(`user:${req.params.id}`);
  
  // Publish event for other servers
  await pubsub.publish(`user:${req.params.id}:updated`, user);
  
  res.json(user);
});
```

### CDN Strategy (CloudFront)

```
┌─────────────────────────────────────┐
│     CloudFront Edge Locations       │
│     (200+ worldwide)                │
└──────────────┬──────────────────────┘
               ↓
         Origin S3 buckets
        (regional + backup)

Cache behaviors:
- Static files (images, CSS, JS): 1 year
- API responses: 5-60 minutes
- HTML pages: 1 minute
- Dynamic content: no-cache
```

---

## 4. API Gateway & Load Balancing

### AWS Application Load Balancer (ALB)

```
┌──────────────────────────────┐
│   Route 53 (DNS)             │
│   Geolocation routing        │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│  WAF (DDoS + Attack filter)  │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│  ALB (SSL termination)       │
│  - Port 80 → 443             │
│  - Path-based routing        │
└──────────────┬───────────────┘
               ↓
        ┌──────┴──────┐
        ↓             ↓
  ┌─────────┐    ┌──────────┐
  │ API (6) │    │ LMS (4)  │
  │ workers │    │ workers  │
  └─────────┘    └──────────┘
        ↓             ↓
    PostgreSQL    MongoDB
      RDS          RDS
```

### Auto-scaling Config

```yaml
Services:
  api-service:
    min_replicas: 3
    max_replicas: 20
    scale_up_threshold:
      cpu: 70%
      memory: 80%
      request_latency: > 500ms
    scale_down_threshold:
      cpu: 20%
      memory: 30%

  lms-service:
    min_replicas: 2
    max_replicas: 15
    scale_up_threshold:
      cpu: 75%
      disk_io: > 1000 IOPS

  worker-service:
    min_replicas: 1
    max_replicas: 50
    scale_based_on: queue_length
    target_queue_depth: 100
```

---

## 5. Kubernetes Deployment (Phase 3+)

### Cluster Configuration

```yaml
# EKS Cluster
cluster:
  name: neoclass-prod
  version: 1.28
  region: eu-west-1
  
node_groups:
  api:
    desired_size: 5
    min_size: 3
    max_size: 20
    instance_types: [t3.xlarge, t3a.xlarge]
    
  lms:
    desired_size: 3
    min_size: 2
    max_size: 15
    instance_types: [m5.2xlarge] # More memory
    
  worker:
    desired_size: 2
    min_size: 1
    max_size: 50
    instance_types: [t3.large]
    spot_fleet: true # Cost savings 70%

  monitoring:
    desired_size: 2
    instance_types: [t3.large]
```

### Helm Charts Deployment

```bash
# Install NeoClass Helm chart
helm repo add neoclass https://charts.neoclass.io
helm repo update

# Deploy to production
helm upgrade --install neoclass neoclass/platform \
  --namespace neoclass \
  --values values-prod.yaml \
  --set replicaCount=5 \
  --set image.tag=1.2.0
```

### Service Mesh (Istio)

```yaml
# Traffic management
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: api-service
spec:
  hosts:
  - api.neoclass.io
  http:
  - match:
    - uri:
        prefix: /v1
    route:
    - destination:
        host: api-service.neoclass.svc.cluster.local
        port:
          number: 8080
    retries:
      attempts: 3
      perTryTimeout: 2s
    timeout: 10s

# Circuit breaker
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: api-service
spec:
  host: api-service.neoclass.svc.cluster.local
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

---

## 6. Monitoring & Observability

### Metrics (Prometheus + Grafana)

```
Key Metrics:
├─ API Latency (p50, p95, p99)
├─ Error Rate (4xx, 5xx)
├─ Throughput (requests/sec)
├─ Database connections
├─ Cache hit rate
├─ Queue depth
├─ Disk usage
└─ Network I/O

SLOs:
├─ 99.9% uptime (SLA)
├─ < 200ms p99 latency
├─ < 0.1% error rate
└─ 95%+ cache hit rate
```

### Logging (ELK Stack)

```
Elasticsearch:
├─ logs-neoclass-2024-05-23
├─ logs-neoclass-2024-05-24
└─ logs-archive (older)

Log Format:
{
  "timestamp": "2024-05-23T10:30:00Z",
  "level": "info",
  "service": "api-service",
  "schoolId": "school_123",
  "traceId": "abc-123",
  "userId": "user_456",
  "action": "grade.created",
  "duration_ms": 150,
  "status": 201
}

Retention:
- Hot: 7 days (Elasticsearch)
- Warm: 30 days (S3)
- Cold: 1 year (Glacier)
```

### Distributed Tracing (Jaeger)

```
├─ HTTP request enters API Gateway
├─ Service A processes (50ms)
│  ├─ Database query (20ms)
│  └─ Cache lookup (2ms)
├─ Service B called (30ms)
├─ Event published (5ms)
└─ Response sent (1ms)

Total: 86ms (with trace visualization)
```

---

## 7. Disaster Recovery & Business Continuity

### Active-Active Multi-Region

```
Region 1 (Africa - Nigeria)
├─ EKS Cluster
├─ RDS Aurora
├─ ElastiCache
└─ S3

       ↓ (Replication)

Region 2 (Europe - Frankfurt)
├─ EKS Cluster
├─ RDS Aurora
├─ ElastiCache
└─ S3

DNS:
- Route53 health checks
- Auto-failover if latency > 200ms
- Geo-proximity routing
```

### Backup Strategy

```
Daily Backups:
- Full DB snapshot (3 AM UTC)
- Incremental backups (hourly)
- Cross-region copy
- Retention: 35 days
- RTO: < 15 minutes (from snapshot)
- RPO: 1 hour max

Testing:
- Monthly restore test
- Automated validation
- Documentation updates
```

### Incident Response

```
Severity 1 (Total outage):
- Page on-call SRE immediately
- Activate war room
- Parallel: restore from backup & debug
- Target resolution: < 30 minutes

Severity 2 (Partial outage):
- Alert team
- Rollback or mitigation
- Target resolution: < 2 hours

Severity 3 (Degradation):
- Monitor & investigate
- No immediate action needed
```

---

## 8. Cost Optimization

### Infrastructure

```
Component        | Dev     | Prod    | Optimizations
─────────────────┼─────────┼─────────┼──────────────
PostgreSQL       | $50     | $500    | RDS RI (1-year)
Redis            | $20     | $200    | Cluster mode
API servers      | $100    | $800    | Spot instances 50%
LMS storage      | $10     | $500    | Tiered storage
CDN bandwidth    | $20     | $1000   | Compression + cache
─────────────────┴─────────┴─────────┴──────────────
Total/month      | $200    | $3000   |
```

### Per-School Costs

```
At 1,000 schools:
Total infrastructure: $3,000/month
Per school: $3/month

Revenue options:
- Basic plan: $49/month
- Premium plan: $199/month
- Margin: > 90%
```

### Cost Reduction Tips

```
1. Use Reserved Instances
   - Save 30-40% on compute

2. Spot Instances for workers
   - Save 70% on non-critical workloads

3. Data tiering
   - Hot (7 day): SSD
   - Warm (30 day): HDD
   - Cold (1+ year): S3 Glacier

4. Right-sizing
   - Monitor actual usage
   - Downsize oversized instances

5. Compression
   - Gzip all responses
   - Save 70% bandwidth
```

---

## 9. Load Testing & Capacity Planning

### Targets

```
Concurrent users: 10,000
Requests/sec: 5,000
Database connections: 500
Memory: 30GB (across cluster)
Disk IO: 10,000 IOPS
```

### Load Testing Script (k6)

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up
    { duration: '5m', target: 1000 },  // Main load
    { duration: '2m', target: 0 },     // Ramp-down
  ],
};

export default function() {
  const res = http.get('https://api.neoclass.io/dashboard');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 10. Roadmap Technique

```
Q1 2024 : MVP
├─ Auth + Dashboard
├─ Academic Module
└─ Basic Communication

Q2 2024 : Financial + LMS
├─ Finance Module
├─ LMS Core
└─ Reporting

Q3 2024 : Scale + Mobile
├─ Multi-region
├─ Mobile Apps
├─ AI Module

Q4 2024 : Enterprise
├─ Advanced Features
├─ SLA 99.99%
└─ Premium Support

2025 : Global Expansion
├─ Mega-scale
├─ Multi-cloud
└─ Ecosystem partners
```

