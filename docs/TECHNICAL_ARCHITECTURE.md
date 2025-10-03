# WorkLog AI - Technical Architecture Document

## Document Control
- **Version**: 2.1
- **Date**: October 3, 2025
- **Author**: Arsalan Jehangir Khan
- **Status**: Active - MVP Phase with Performance Optimizations
- **Last Updated**: Performance optimization complete with Redis caching and connection pooling
- **Parent Document**: [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)

---

## Overview

This document covers the technical architecture, infrastructure, and performance specifications for WorkLog AI. It's part of a split from the main technical specification for better maintainability.

**Related Documents:**
- [TECHNICAL_API_DATA.md](./TECHNICAL_API_DATA.md) - Data models, API specs, AI integration
- [TECHNICAL_FRONTEND.md](./TECHNICAL_FRONTEND.md) - Frontend components, security, development guidelines
- [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) - Main overview and index

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                   CLIENT LAYER                  │
│  React SPA (Vite + JavaScript)                  │
│  - Journal Entry UI                             │
│  - Insights Dashboard                           │
│  - Export/Generation Tools                      │
└─────────────┬───────────────────────────────────┘
              │ HTTPS/REST API
┌─────────────┴───────────────────────────────────┐
│                   API LAYER                     │
│  Express.js + JavaScript                        │
│  - OAuth authentication (copied from Job Asst)  │
│  - Entry CRUD operations                        │
│  - AI processing queue                          │
│  - Export generation                            │
└─────────────┬───────────────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────┴─────┐   ┌──────┴──────┐
│ Supabase  │   │ Upstash     │
│PostgreSQL │   │ Redis Cache │
│ (Pooled)  │   │ (90%+ boost)│
└───────────┘   └─────────────┘
      │
      └─────────┐
              ┌─┴──────────────┐
              │ Anthropic API  │
              │ (Claude Sonnet)│
              └────────────────┘
```

### 1.2 Technology Stack

#### Frontend Stack
```json
{
  "framework": "React 18.2+",
  "language": "JavaScript (ES6+)",
  "buildTool": "Vite 5+",
  "styling": "Tailwind CSS 3.4+",
  "state": "React Context + useState/useEffect",
  "router": "React Router v6",
  "forms": "Controlled components with validation",
  "richText": "Textarea with auto-expand (MVP), Lexical (Phase 2)",
  "charts": "Recharts",
  "http": "fetch API (native)",
  "dateTime": "date-fns",
  "icons": "Lucide React (already used in Job Assistant)"
}
```

#### Backend Stack
```json
{
  "runtime": "Node.js 18 LTS",
  "framework": "Express.js 4.x",
  "language": "JavaScript (ES6+)",
  "database": "PostgreSQL 16 (Supabase)",
  "orm": "Prisma 5.x",
  "cache": "Redis 7.x (Upstash)",
  "auth": "Passport.js + JWT (copied from Job Assistant)",
  "email": "Mailgun API (reuse existing setup)",
  "validation": "Manual validation with error handling",
  "api": "RESTful"
}
```

#### Infrastructure Stack
```json
{
  "frontend_hosting": "Render.com (serves with backend)",
  "backend_hosting": "Render.com (free tier)",
  "database": "Supabase (optimized with ORMs connection pooling)",
  "redis": "Upstash (high-performance caching: 90%+ improvement)",
  "monitoring": "Render logs + manual monitoring",
  "analytics": "Manual tracking in database"
}
```

### 1.3 Repository Structure

```
GitHub:
└── worklog-ai (new repository)
    └── github.com/ajkay-solutions/worklog-ai

Local Development:
/home/ajk/worklog-ai/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── server.js
│
├── shared/
│   └── (copied utilities from Job Assistant)
│
├── .env.example
├── render.yaml
└── README.md

Deployment:
Render Service: ajkay-worklog
Domain: worklog.ajkaysolutions.com (subdomain)
Auto-deploy: On push to main branch
```

---

## 2. Infrastructure & Deployment

### 2.1 Render.com Configuration

#### Service Configuration
```yaml
# render.yaml
services:
  - type: web
    name: worklog-ai
    env: node
    plan: free
    buildCommand: |
      cd backend && npm ci
      cd ../frontend && npm ci && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3004
```

#### Environment Variables
```bash
# Backend Production (.env)
NODE_ENV=production
PORT=3004

# Database (Supabase) - Optimized for Prisma ORMs
DATABASE_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Redis (Upstash) - Single database with environment prefixes
REDIS_URL=redis://default:[password]@us1-xxx.upstash.io:6379

# OAuth (same as Job Assistant)
GOOGLE_CLIENT_ID=677875518045-8qa0q2msug0ngmgvkokc5s3somaooh0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=7730ozpx4pzs6w
LINKEDIN_CLIENT_SECRET=...

# JWT & Sessions
JWT_SECRET=your-secret-key-256-bit
SESSION_SECRET=your-session-secret

# AI
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Email (same as Job Assistant)
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.ajkaysolutions.com
```

### 2.2 Database Configuration (Supabase)

#### Connection Optimization
```javascript
// Supabase ORMs Configuration for optimal performance
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")     // Pooled connection via pgbouncer
  directUrl = env("DIRECT_URL")       // Direct connection for migrations
}

// Connection Pool Settings (via DATABASE_URL parameters)
?pgbouncer=true                     // Enable connection pooling
&connection_limit=20                // Max connections per pool
&pool_timeout=30                    // Connection timeout (seconds)
```

#### Performance Benchmarks
| Operation | Before Optimization | After Caching | Improvement |
|-----------|-------------------|---------------|-------------|
| User Count | 3,602ms | 216ms | **94% faster** |
| Entry Count | 1,560ms | 216ms | **86% faster** |
| Project Count | 1,562ms | 217ms | **86% faster** |
| Recent Entries | 2,048ms | 235ms | **88% faster** |
| **Average** | **2,193ms** | **221ms** | **90% faster** |

### 2.3 Redis Configuration (Upstash)

#### Cache Architecture
```javascript
// Redis Cache Implementation
├── Global Counts (5min TTL)
│   ├── user count
│   ├── entry count
│   └── project count
├── User Data (10min TTL)
│   ├── recent entries
│   ├── user projects
│   └── user skills
└── Dashboard Data (10min TTL)
    ├── insights summary
    ├── competency data
    └── trend analysis
```

#### Cache Configuration
```javascript
// backend/src/services/cache.js
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_delay_on_failure: 100,
  max_attempts: 3
});

// Cache TTL Policies
const TTL = {
  GLOBAL_COUNTS: 300,    // 5 minutes
  USER_DATA: 600,        // 10 minutes  
  DASHBOARD: 600,        // 10 minutes
  AI_ANALYSIS: 604800    // 7 days
};

// Environment Separation
const getKey = (key) => {
  const env = process.env.NODE_ENV || 'development';
  return `worklog:${env}:${key}`;
};
```

---

## 3. Performance Requirements & Optimization

### 3.1 Performance Targets

#### Response Time Requirements
```
Cached Operations:
- User dashboard load: < 250ms
- Entry list fetch: < 300ms
- Project/skill counts: < 200ms

Uncached Operations:
- First-time data load: < 1.5s
- AI analysis: < 3s (acceptable for background)
- Export generation: < 5s

User Experience:
- Journal entry save: < 100ms (optimistic UI)
- Auto-save trigger: 2s debounce
- Page transitions: < 200ms
```

#### Throughput Requirements
```
Concurrent Users: 100+ (MVP target)
Daily Entries: 1,000+ 
AI Analysis Queue: 50 jobs/minute
Database Connections: Max 20 pooled
Cache Hit Ratio: > 80%
```

### 3.2 Performance Monitoring

#### Key Metrics to Track
```javascript
// Performance monitoring dashboard (manual)
const performanceMetrics = {
  database: {
    avgResponseTime: '<250ms target',
    connectionPoolUtilization: '<80%',
    querySuccess: '>99%',
    slowQueries: '<5% over 1s'
  },
  cache: {
    hitRatio: '>80%',
    avgResponseTime: '<50ms',
    memoryUsage: '<80%',
    connectionHealth: '100%'
  },
  api: {
    avgResponseTime: '<500ms',
    errorRate: '<1%',
    throughput: '100+ req/min',
    uptime: '>99%'
  }
};
```

#### Health Check Endpoints
```javascript
// GET /api/health/database
{
  "database": {
    "status": "healthy",
    "responseTime": "145ms",
    "connectionPool": "8/20 connections"
  },
  "cache": {
    "status": "healthy", 
    "hitRatio": "87%",
    "responseTime": "12ms"
  },
  "ai": {
    "status": "healthy",
    "queueLength": 3,
    "avgProcessingTime": "2.1s"
  }
}
```

### 3.3 Optimization Strategies

#### Database Optimization
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_entries_user_date ON entries(user_id, date);
CREATE INDEX CONCURRENTLY idx_entries_user_created ON entries(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_projects_user_status ON projects(user_id, status);
CREATE INDEX CONCURRENTLY idx_skills_user_usage ON skills(user_id, usage_count DESC);

-- Query optimization patterns
-- Use prepared statements for repeated queries
-- Implement pagination for large result sets
-- Use SELECT only required fields
-- Leverage connection pooling
```

#### Cache Strategy
```javascript
// Multi-level caching approach
const cacheStrategy = {
  l1: 'Browser cache (static assets)',
  l2: 'Redis cache (API responses)', 
  l3: 'Database query cache (Supabase)',
  
  invalidation: {
    onUserAction: ['user specific data'],
    onDataChange: ['affected aggregations'],
    scheduled: ['global counts every 5min']
  }
};

// Smart cache warming
const warmCache = async () => {
  // Pre-load common queries during low-traffic periods
  await Promise.all([
    cacheGlobalCounts(),
    cacheRecentUsers(),
    preloadCommonDashboardData()
  ]);
};
```

#### Connection Optimization
```javascript
// Database connection management
const dbConfig = {
  connectionPooling: true,
  maxConnections: 20,
  idleTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  
  // Prisma configuration
  prismaConfig: {
    log: ['error', 'warn'],
    errorFormat: 'pretty',
    rejectOnNotFound: false
  }
};

// Connection warming for cold starts
const connectionWarmer = {
  warmOnStartup: true,
  keepAlive: true,
  healthCheck: 30000, // 30s intervals
  reconnectOnFailure: true
};
```

---

## 4. Security Architecture

### 4.1 Security Stack

```javascript
// Security middleware stack (Express.js)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "http:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://worklog.ajkaysolutions.com'] 
    : ['http://localhost:5173', 'http://localhost:3004'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 4.2 Authentication & Authorization

```javascript
// JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  issuer: 'worklog-ai',
  audience: 'worklog-app',
  algorithm: 'HS256'
};

// Session Configuration  
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// OAuth Provider Configuration (copied from Job Assistant)
const oauthConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  linkedin: {
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: '/auth/linkedin/callback',
    scope: ['r_liteprofile', 'r_emailaddress']
  }
};
```

### 4.3 Data Protection

```javascript
// Row-level security (implemented in application layer)
const userDataIsolation = {
  queryFilter: 'WHERE user_id = $userId',
  insertValidation: 'user_id must match authenticated user',
  updateValidation: 'can only modify own records',
  deleteValidation: 'can only delete own records'
};

// Data encryption
const encryptionConfig = {
  atRest: 'Supabase native encryption',
  inTransit: 'HTTPS/TLS 1.2+',
  application: 'No PII encryption needed (text content only)',
  backups: 'Supabase automatic encrypted backups'
};

// Privacy compliance
const privacyControls = {
  dataExport: 'User can export all data via /api/export',
  dataDelete: 'User can delete account and all data',
  dataSharing: 'No data sharing with third parties',
  analytics: 'Optional user analytics tracking'
};
```

---

## 5. Scalability & Future Architecture

### 5.1 Scaling Strategy

#### Current Architecture (MVP)
```
Single Render Instance:
- Frontend + Backend on same service
- Single database connection pool
- Single Redis cache instance
- Anthropic API integration

Estimated Capacity:
- 1,000 active users
- 5,000 entries/day
- 500 AI analyses/day
```

#### Phase 2 Scaling (6 months)
```
Microservices Split:
- Frontend: Static hosting (Vercel/Netlify)
- API Gateway: Express.js on Render
- AI Service: Separate worker service
- Cache: Redis cluster (Upstash Pro)

Estimated Capacity:
- 10,000 active users
- 50,000 entries/day  
- 5,000 AI analyses/day
```

#### Phase 3 Scaling (12+ months)
```
Cloud Infrastructure:
- Frontend: CDN distribution
- Backend: Auto-scaling containers
- Database: Read replicas + sharding
- AI: Dedicated GPU instances
- Cache: Multi-region Redis

Estimated Capacity:
- 100,000+ active users
- 500,000+ entries/day
- 50,000+ AI analyses/day
```

### 5.2 Migration Strategy

```javascript
// Database migration strategy
const migrationPlan = {
  phase1: {
    current: 'Single Supabase instance',
    optimization: 'Connection pooling + indexing'
  },
  phase2: {
    target: 'Read replicas for dashboard queries',
    timeline: '6 months',
    complexity: 'Medium'
  },
  phase3: {
    target: 'Sharded database by user_id',
    timeline: '12+ months', 
    complexity: 'High'
  }
};

// Service migration strategy
const serviceMigration = {
  step1: 'Extract AI service to separate worker',
  step2: 'Implement API Gateway pattern',
  step3: 'Split frontend to static hosting',
  step4: 'Implement microservices architecture'
};
```

---

## 6. Monitoring & Operations

### 6.1 Monitoring Stack

```javascript
// Monitoring configuration
const monitoring = {
  application: {
    logs: 'Render native logging',
    metrics: 'Custom performance endpoints',
    alerts: 'Manual monitoring + email notifications'
  },
  database: {
    performance: 'Supabase dashboard',
    queries: 'Slow query monitoring',
    connections: 'Pool utilization tracking'
  },
  cache: {
    performance: 'Upstash dashboard',
    hitRatio: 'Custom metrics endpoint',
    memory: 'Usage tracking'
  },
  external: {
    anthropic: 'API usage dashboard',
    render: 'Service health monitoring',
    uptime: 'Manual checks + user feedback'
  }
};
```

### 6.2 Operational Procedures

```javascript
// Health check procedures
const healthChecks = {
  database: {
    endpoint: '/api/health/database',
    frequency: '30s',
    timeout: '5s',
    actions: ['restart', 'alert']
  },
  cache: {
    endpoint: '/api/health/cache', 
    frequency: '60s',
    timeout: '3s',
    actions: ['clear cache', 'alert']
  },
  ai: {
    endpoint: '/api/health/ai',
    frequency: '5m',
    timeout: '10s', 
    actions: ['queue clear', 'alert']
  }
};

// Backup procedures
const backupStrategy = {
  database: {
    frequency: 'Daily automatic (Supabase)',
    retention: '30 days',
    testing: 'Monthly restore test'
  },
  codebase: {
    frequency: 'Git commits',
    backup: 'GitHub repository',
    releases: 'Tagged releases'
  },
  configuration: {
    frequency: 'On change',
    backup: 'Environment variable documentation',
    testing: 'Deployment verification'
  }
};
```

---

## 7. Development & Deployment

### 7.1 Development Workflow

```bash
# Local development setup
git clone https://github.com/ajkay-solutions/worklog-ai
cd worklog-ai

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure environment variables
npx prisma generate
npx prisma migrate dev
npm run dev # Starts on port 3004

# Frontend setup (new terminal)
cd frontend  
npm install
npm run dev # Starts on port 5173
```

### 7.2 Deployment Pipeline

```yaml
# GitHub Actions (future implementation)
name: Deploy to Render
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
      - name: Deploy to Render
        # Automatic deployment via Render GitHub integration
```

### 7.3 Environment Management

```javascript
// Environment configuration
const environments = {
  development: {
    database: 'Local PostgreSQL or Supabase dev',
    cache: 'Local Redis or Upstash dev',
    ai: 'Anthropic API (rate limited)',
    oauth: 'localhost:3004 callbacks'
  },
  staging: {
    database: 'Supabase staging branch',
    cache: 'Upstash staging database',
    ai: 'Anthropic API (full access)',
    oauth: 'staging.worklog.ajkaysolutions.com callbacks'
  },
  production: {
    database: 'Supabase production',
    cache: 'Upstash production database', 
    ai: 'Anthropic API (full access)',
    oauth: 'worklog.ajkaysolutions.com callbacks'
  }
};
```

---

## Document Maintenance

This document should be updated when:
- Infrastructure changes are made
- Performance benchmarks change significantly  
- New optimization strategies are implemented
- Scaling milestones are reached
- Security configurations are modified

**Next Review Date**: January 3, 2026
**Reviewers**: Technical Lead, DevOps Engineer (if applicable)