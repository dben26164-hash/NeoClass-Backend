# 🔧 ENVIRONMENT & DEPLOYMENT GUIDE

## Prerequisites

### System Requirements
- **Node.js**: 18.x or later
- **PostgreSQL**: 12+ with Prisma support
- **npm**: 9.x or later
- **Git**: for version control

### Installed Packages (Existing)
```json
{
  "express": "^4.x",
  "prisma": "^5.18.0",
  "@prisma/client": "^5.18.0",
  "joi": "^17.x",
  "typescript": "latest",
  "cors": "^2.x"
}
```

---

## Environment Variables

### Create `.env` file

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/neoclass"

# Server
PORT=4000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:4000"

# Upload Directory
UPLOAD_DIR="uploads"

# Worker Configuration
AUTO_SYNC_BATCH_SIZE=5
AUTO_SYNC_TIMEOUT_SECONDS=300
AUTO_SYNC_RETRY_DELAY_SECONDS=30
AUTO_SYNC_WORKER_ENABLED=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

### Create `.env.production` file

```bash
DATABASE_URL="postgresql://prod-user:${DB_PASSWORD}@prod-db.example.com:5432/neoclass"
PORT=4000
NODE_ENV=production
ALLOWED_ORIGINS="https://app.neoclass.com"
UPLOAD_DIR="/var/uploads"
AUTO_SYNC_BATCH_SIZE=10
AUTO_SYNC_TIMEOUT_SECONDS=600
AUTO_SYNC_WORKER_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## Installation Steps

### 1. Install Dependencies

```bash
cd /tmp/NeoClass-Architecture
npm install
```

Expected: All packages installed, no errors

### 2. Generate Prisma Client

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

### 3. Run Database Migration

```bash
# Development (avec seed)
npx prisma migrate dev --name add_auto_sync_system

# Production (sans seed)
npx prisma migrate deploy
```

Expected: Migration succeeds, new tables created

### 4. Verify Database

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Verify new tables
\dt "Curriculum*"

# Verify new enums
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('PublicationStatus', 'SyncRetryStrategy', 'SyncFrequency')
ORDER BY t.typname, e.enumsortorder;
```

Expected Output:
```
       typname         |  enumlabel
----------------------+---------------
 PublicationStatus    | DRAFT
 PublicationStatus    | REVIEWING
 PublicationStatus    | APPROVED
 PublicationStatus    | PUBLISHED
 PublicationStatus    | REJECTED
 SyncFrequency        | IMMEDIATE
 SyncFrequency        | HOURLY
 SyncFrequency        | DAILY
 SyncFrequency        | WEEKLY
 SyncFrequency        | MONTHLY
 SyncRetryStrategy    | EXPONENTIAL
 SyncRetryStrategy    | LINEAR
 SyncRetryStrategy    | IMMEDIATE
```

---

## Build & Run

### Development Mode

```bash
# Install with devDependencies
npm install

# Build TypeScript
npm run build

# Run with hot reload (if configured)
npm run dev

# Or direct start
npm start
```

Expected Console Output:
```
🚀 NeoClass API running on http://localhost:4000
📚 Curriculum Management: http://localhost:4000/api/curricula
📚 File Management: http://localhost:4000/api/files
📚 Import Management: http://localhost:4000/api/import
🔄 Auto-Sync System: http://localhost:4000/api/curriculum-sync
🔄 Starting Auto-Sync Worker...
```

### Production Build

```bash
# Install production-only dependencies
npm ci --production

# Build TypeScript
npm run build

# Start with process manager (PM2 recommended)
pm2 start dist/server.js --name neoclass --instances max
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist
COPY prisma ./prisma

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server.js"]
```

Build & Run:
```bash
docker build -t neoclass-api:latest .
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e NODE_ENV=production \
  neoclass-api:latest
```

---

## Health Checks

### 1. Application Health

```bash
curl http://localhost:4000/api/curriculum-sync/health
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Worker Status

```bash
curl http://localhost:4000/api/curriculum-sync/worker/status
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "syncs": {
      "pending": 0,
      "syncing": 0,
      "failed": 0,
      "synced": 150,
      "total": 150
    },
    "retries": {
      "pending": 0,
      "total": 0
    },
    "lastCheck": "2024-01-15T10:00:00Z"
  }
}
```

### 3. Database Connection

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.\$queryRaw\`SELECT 1\`;
    console.log('✅ Database connected');
  } catch (e) {
    console.log('❌ Database error:', e.message);
  }
  await prisma.\$disconnect();
})();
"
```

---

## Monitoring

### 1. Worker Monitoring

Create `scripts/monitor-worker.sh`:

```bash
#!/bin/bash

while true; do
  echo "=== $(date) ==="
  curl -s http://localhost:4000/api/curriculum-sync/worker/status | jq .
  echo ""
  sleep 60
done
```

Run:
```bash
chmod +x scripts/monitor-worker.sh
./scripts/monitor-worker.sh
```

### 2. Sync Monitoring

Create `scripts/monitor-syncs.sh`:

```bash
#!/bin/bash

CURRICULUM_ID="$1"
if [ -z "$CURRICULUM_ID" ]; then
  echo "Usage: $0 <curriculum-id>"
  exit 1
fi

while true; do
  echo "=== $(date) ==="
  curl -s "http://localhost:4000/api/curriculum-sync/curriculum/$CURRICULUM_ID/summary" | jq .
  echo ""
  sleep 30
done
```

Run:
```bash
chmod +x scripts/monitor-syncs.sh
./scripts/monitor-syncs.sh curr-123
```

### 3. Log Monitoring

```bash
# Watch logs in real-time
npm start | grep -E "(ERROR|WARN|Sync|Retry)"

# Or use PM2
pm2 logs neoclass --lines 100
```

---

## Scaling Configuration

### For 150 Schools

```env
AUTO_SYNC_BATCH_SIZE=5
AUTO_SYNC_MAX_CONCURRENT=5
AUTO_SYNC_TIMEOUT_SECONDS=300
```

Estimated completion time: **10-15 minutes**

### For 500 Schools

```env
AUTO_SYNC_BATCH_SIZE=10
AUTO_SYNC_MAX_CONCURRENT=10
AUTO_SYNC_TIMEOUT_SECONDS=600
```

Estimated completion time: **30-45 minutes**

### For 1000+ Schools

```env
AUTO_SYNC_BATCH_SIZE=20
AUTO_SYNC_MAX_CONCURRENT=20
AUTO_SYNC_TIMEOUT_SECONDS=900

# Horizontal scaling: multiple worker instances
WORKER_INSTANCES=3
```

Estimated completion time: **60-90 minutes**

---

## Troubleshooting

### Issue: "Cannot find module 'curriculum-sync.routes'"

**Solution**: Verify file exists and is imported correctly
```bash
ls -la src/routes/curriculum-sync.routes.ts
grep -n "curriculumSyncRouter" src/server.ts
```

### Issue: "Database connection failed"

**Solution**: Check DATABASE_URL
```bash
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: "Prisma Client not generated"

**Solution**: Regenerate
```bash
npx prisma generate
npx prisma generate --watch  # For development
```

### Issue: "Worker not processing syncs"

**Solution**: Check worker status and logs
```bash
curl http://localhost:4000/api/curriculum-sync/worker/status
npm start 2>&1 | grep -i "worker\|sync"
```

### Issue: "Migration failed"

**Solution**: Check migration status
```bash
# View status
npx prisma migrate status

# Reset (CAUTION: deletes all data)
npx prisma migrate reset --force

# Or manual rollback
npx prisma migrate resolve --rolled-back "<migration_name>"
```

---

## Backup & Recovery

### Database Backup

```bash
# Full backup
pg_dump $DATABASE_URL > neoclass-backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup.sql.gz

# Scheduled backup (cron)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/neoclass-$(date +\%Y\%m\%d).sql.gz
```

### Recovery

```bash
# From backup
psql $DATABASE_URL < backup.sql

# From compressed
zcat backup.sql.gz | psql $DATABASE_URL

# Verify recovery
npx prisma db push
npm start
```

---

## Performance Optimization

### 1. Database Indices

Verify indices created:

```bash
psql $DATABASE_URL -c "
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'Curriculum%'
ORDER BY tablename, indexname;
"
```

### 2. Connection Pooling

Add to `.env`:

```bash
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000
```

### 3. Query Optimization

Enable query logging:

```bash
# In .env
LOG_QUERIES=true
LOG_QUERY_THRESHOLD_MS=1000  # Log queries > 1s
```

### 4. Worker Optimization

For large deployments:

```env
# Multiple worker processes
WORKER_PROCESSES=4

# Larger batch size
AUTO_SYNC_BATCH_SIZE=20

# Longer timeout for complex syncs
AUTO_SYNC_TIMEOUT_SECONDS=900

# Connection pooling
DATABASE_POOL_MAX=20
```

---

## Security Hardening

### 1. Environment Variables

- ✅ Never commit `.env` files
- ✅ Use strong DATABASE_PASSWORD
- ✅ Rotate credentials regularly
- ✅ Use VPN/SSH tunnels for DB

### 2. API Security

```bash
# Enable CORS properly
ALLOWED_ORIGINS="https://app.neoclass.com,https://admin.neoclass.com"

# Enable HTTPS in production
NODE_ENV=production
# Use nginx/reverse proxy for TLS

# Rate limiting (configure in Express)
# Implement authentication/authorization
# Validate all inputs (done with Joi)
```

### 3. Database Security

```bash
# Separate DB user for app (non-superuser)
CREATE USER neoclass_user WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE neoclass TO neoclass_user;
GRANT USAGE ON SCHEMA public TO neoclass_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO neoclass_user;

# Restrict network access
# Use VPC security groups
# Enable SSL connections
```

### 4. Data Protection

```bash
# Encryption at rest (PostgreSQL pgcrypto)
# Encryption in transit (SSL/TLS)
# Sensitive data in CurriculumUpdateLog masked
# Audit logging enabled
```

---

## Monitoring & Alerts

### 1. Error Tracking

```bash
# Log errors to external service
ERROR_TRACKING_API="https://sentry.io/..."
ERROR_TRACKING_TOKEN="your-token"
```

### 2. Metrics Collection

```bash
# Prometheus metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# Worker metrics
# - syncs_total
# - syncs_succeeded
# - syncs_failed
# - syncs_duration_seconds
# - retries_total
```

### 3. Alert Rules

```
IF worker_status != "running" FOR 5min
  THEN notify #alerts

IF sync_success_rate < 95% FOR 30min
  THEN notify #alerts

IF database_connection_errors > 5 FOR 10min
  THEN notify #alerts
```

---

## Deployment Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment configured (`.env` file)
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Build successful (`npm run build`)
- [ ] Health check passes (`curl /health`)
- [ ] Worker initialized (check logs)
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Auto-scaling configured (if applicable)
- [ ] Documentation deployed
- [ ] Team trained

---

## Rollback Plan

If deployment fails:

```bash
# 1. Stop current version
pm2 stop neoclass

# 2. Revert code
git checkout previous-tag
npm install
npm run build

# 3. Rollback database (if needed)
psql $DATABASE_URL < backup.sql

# 4. Start previous version
pm2 start neoclass
```

---

## Support & Documentation

- **Quick Start**: `QUICK_START_GUIDE.md`
- **Full Documentation**: `AUTO_SYNC_SYSTEM_DOCUMENTATION.md`
- **Technical Summary**: `AUTO_SYNC_IMPLEMENTATION_SUMMARY.md`
- **This Guide**: `ENVIRONMENT_DEPLOYMENT_GUIDE.md`

---

**System ready for production! 🚀**
