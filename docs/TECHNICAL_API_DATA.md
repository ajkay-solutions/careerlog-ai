# WorkLog AI - API & Data Models Document

## Document Control
- **Version**: 2.1
- **Date**: October 3, 2025
- **Author**: Arsalan Jehangir Khan
- **Status**: Active - MVP Phase with Performance Optimizations
- **Last Updated**: Performance optimization complete with Redis caching and connection pooling
- **Parent Document**: [TECHNICAL_SPEC.md](../TECHNICAL_SPEC.md)

---

## Overview

This document covers data models, API specifications, and AI integration for WorkLog AI. It's part of a split from the main technical specification for better maintainability.

**Related Documents:**
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - Architecture, infrastructure, performance
- [TECHNICAL_FRONTEND.md](./TECHNICAL_FRONTEND.md) - Frontend components, security, development guidelines
- [TECHNICAL_SPEC.md](../TECHNICAL_SPEC.md) - Main overview and index

---

## 1. Data Models

### 1.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")     // Pooled connection
  directUrl = env("DIRECT_URL")       // Direct connection for migrations
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  
  // OAuth provider info (same structure as Job Assistant)
  provider      String    // "google" | "linkedin"
  providerId    String    // Provider's user ID
  displayName   String?
  name          Json?     // { givenName, familyName }
  profilePhoto  String?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  entries       Entry[]
  projects      Project[]
  skills        Skill[]
  competencies  Competency[]
  settings      UserSettings?
  
  @@unique([provider, providerId])
  @@index([email])
}

model UserSettings {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Preferences
  reminderTime        String?  // "18:00" for daily reminder
  reminderEnabled     Boolean  @default(true)
  aiPromptStyle       String   @default("balanced") // "minimal", "balanced", "detailed"
  defaultTags         String[] // Quick-add tags
  
  // Privacy
  allowExport         Boolean  @default(true)
  allowAnalytics      Boolean  @default(true)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Entry {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Content
  date          DateTime  // Entry date (not created date)
  rawText       String    @db.Text // User's original input
  wordCount     Int       @default(0)
  
  // AI Extracted Data (JSON fields for flexibility)
  extractedData Json?     // {projects: [], skills: [], metrics: [], people: [], competencies: [], keywords: []}
  
  // Manual Tags (array of IDs)
  projectIds    String[]  // References to Project.id
  skillIds      String[]  // References to Skill.id
  competencyIds String[]  // References to Competency.id
  
  // Metadata
  isHighlight   Boolean   @default(false) // User marked as important
  sentiment     String?   // "positive", "neutral", "negative" (AI detected)
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Optimized indexes for better query performance
  @@index([userId, date])           // Primary lookup (userId + date)
  @@index([userId, createdAt])      // Chronological queries
  @@index([userId, isHighlight])    // Filtered queries by highlight
  @@index([userId, sentiment])      // Sentiment analysis queries
  @@index([userId, wordCount])      // Word count sorting/filtering
  @@index([date])                   // Global date queries (for admin)
  @@unique([userId, date])          // One entry per user per date
}

model Project {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name          String
  description   String?   @db.Text
  status        String    @default("active") // "active", "completed", "archived"
  
  // Timeline
  startDate     DateTime?
  endDate       DateTime?
  
  // Metrics (denormalized for performance)
  entryCount    Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Optimized indexes for dashboard queries
  @@index([userId])                    // Basic user lookup
  @@index([userId, status])            // Status filtering
  @@index([userId, entryCount])        // Sorting by usage
  @@index([userId, updatedAt])         // Recent projects
  @@unique([userId, name])             // Prevent duplicate project names per user
}

model Skill {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name          String    // e.g., "Python", "Leadership", "Public Speaking"
  category      String?   // "technical", "soft", "domain"
  
  // Tracking
  firstUsed     DateTime  @default(now())
  lastUsed      DateTime  @default(now())
  usageCount    Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Optimized indexes for dashboard queries
  @@index([userId])                    // Basic user lookup
  @@index([userId, category])          // Category filtering
  @@index([userId, usageCount])        // Sorting by usage frequency
  @@index([userId, lastUsed])          // Recent skills
  @@unique([userId, name])             // Prevent duplicate skill names per user
}

model Competency {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name          String    // e.g., "Leadership", "Innovation", "Customer Focus"
  framework     String?   // "custom", "corporate", "industry_standard"
  description   String?   @db.Text
  
  // Tracking
  demonstrationCount Int @default(0)
  lastDemonstrated   DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Optimized indexes for dashboard queries
  @@index([userId])                         // Basic user lookup
  @@index([userId, framework])              // Framework filtering
  @@index([userId, demonstrationCount])     // Sorting by demonstration frequency
  @@index([userId, lastDemonstrated])       // Recent competencies
  @@unique([userId, name])                  // Prevent duplicate competency names per user
}
```

### 1.2 Data Relationships

```
User (1) ──→ (N) Entry
User (1) ──→ (N) Project  
User (1) ──→ (N) Skill
User (1) ──→ (N) Competency
User (1) ──→ (1) UserSettings

Entry contains:
├── projectIds[]     (references Project.id)
├── skillIds[]       (references Skill.id)
├── competencyIds[]  (references Competency.id)
└── extractedData    (JSON with AI-extracted entities)
```

### 1.3 JSON Data Structures

#### extractedData (Entry.extractedData)
```javascript
{
  "projects": [
    {
      "name": "Q4 Planning",
      "confidence": 0.95,
      "mentions": 3
    }
  ],
  "skills": [
    {
      "name": "Python",
      "category": "technical",
      "confidence": 0.9,
      "context": "automated data processing"
    },
    {
      "name": "Leadership", 
      "category": "soft",
      "confidence": 0.85,
      "context": "led team meeting"
    }
  ],
  "competencies": [
    {
      "name": "Innovation",
      "evidence": "proposed new automation solution",
      "confidence": 0.8
    }
  ],
  "metrics": [
    {
      "type": "performance",
      "value": "reduced processing time by 40%",
      "unit": "percentage",
      "confidence": 0.9
    }
  ],
  "people": [
    {
      "name": "Sarah",
      "role": "stakeholder",
      "relationship": "collaborator"
    }
  ],
  "keywords": ["automation", "optimization", "stakeholder meeting"],
  "sentiment": "positive",
  "primaryTopic": "process improvement"
}
```

#### User.name (OAuth data)
```javascript
{
  "givenName": "Arsalan",
  "familyName": "Khan",
  "middleName": null
}
```

---

## 2. API Specifications

### 2.1 Authentication APIs

#### OAuth Initialization
```http
GET /auth/google
GET /auth/linkedin

Response: Redirect to OAuth provider
```

#### OAuth Callback
```http
GET /auth/google/callback?code=...
GET /auth/linkedin/callback?code=...

Success Response (302 Redirect):
Location: http://localhost:5173/?token=eyJhbGciOiJIUzI1NiIs...

Error Response (302 Redirect):
Location: http://localhost:5173/?error=authentication_failed
```

#### Authentication Status
```http
GET /auth/status
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "user": {
    "id": "cm2example123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "provider": "google",
    "profilePhoto": "https://...",
    "lastLoginAt": "2025-10-03T10:30:00.000Z"
  }
}

Response 401:
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2.2 Entry APIs

#### List Entries
```http
GET /api/entries
Authorization: Bearer <token>
Query Parameters:
- limit: number (default: 50, max: 100)
- offset: number (default: 0)
- startDate: string (ISO date)
- endDate: string (ISO date)
- highlighted: boolean
- search: string

Response 200:
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "cm2entry123",
        "date": "2025-10-03",
        "rawText": "Today I completed the API documentation...",
        "wordCount": 142,
        "isHighlight": false,
        "sentiment": "positive",
        "extractedData": { /* AI analysis results */ },
        "createdAt": "2025-10-03T14:30:00.000Z",
        "updatedAt": "2025-10-03T14:32:00.000Z"
      }
    ],
    "total": 47,
    "hasMore": true
  }
}
```

#### Get Entry by Date
```http
GET /api/entries/2025-10-03
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "entry": {
      "id": "cm2entry123",
      "date": "2025-10-03",
      "rawText": "Today I completed...",
      "wordCount": 142,
      "isHighlight": false,
      "extractedData": { /* AI analysis */ },
      "createdAt": "2025-10-03T14:30:00.000Z",
      "updatedAt": "2025-10-03T14:32:00.000Z"
    }
  }
}

Response 404:
{
  "success": false,
  "message": "No entry found for this date"
}
```

#### Create/Update Entry
```http
POST /api/entries
PUT /api/entries/2025-10-03
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "date": "2025-10-03",
  "rawText": "Today I completed the API documentation and implemented caching..."
}

Response 200:
{
  "success": true,
  "data": {
    "entry": {
      "id": "cm2entry123",
      "date": "2025-10-03",
      "rawText": "Today I completed...",
      "wordCount": 142,
      "isHighlight": false,
      "extractedData": null, // Will be populated by AI analysis
      "createdAt": "2025-10-03T14:30:00.000Z",
      "updatedAt": "2025-10-03T14:30:00.000Z"
    },
    "message": "Entry saved successfully"
  }
}
```

#### Toggle Highlight
```http
PATCH /api/entries/2025-10-03/highlight
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "isHighlight": true
  }
}
```

#### Delete Entry
```http
DELETE /api/entries/2025-10-03
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

### 2.3 AI Analysis APIs

#### Analyze Entry
```http
POST /api/ai/analyze/cm2entry123
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "jobId": "ai_job_456",
    "status": "queued",
    "message": "Analysis started"
  }
}

Response 400:
{
  "success": false,
  "message": "Entry not found or empty"
}
```

#### Check Analysis Status
```http
GET /api/ai/job/ai_job_456
Authorization: Bearer <token>

Response 200 (In Progress):
{
  "success": true,
  "data": {
    "jobId": "ai_job_456", 
    "status": "processing",
    "progress": 75
  }
}

Response 200 (Completed):
{
  "success": true,
  "data": {
    "jobId": "ai_job_456",
    "status": "completed",
    "result": {
      "projects": [...],
      "skills": [...],
      "competencies": [...],
      "metrics": [...],
      "people": [...],
      "keywords": [...],
      "sentiment": "positive"
    }
  }
}
```

#### Batch Analysis
```http
POST /api/ai/analyze-batch
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "entryIds": ["cm2entry1", "cm2entry2", "cm2entry3"],
  "priority": "normal" // "low", "normal", "high"
}

Response 200:
{
  "success": true,
  "data": {
    "batchJobId": "batch_789",
    "entryCount": 3,
    "estimatedTime": "2-3 minutes"
  }
}
```

### 2.4 Insights APIs

#### Dashboard Summary
```http
GET /api/insights/dashboard
Authorization: Bearer <token>
Query Parameters:
- period: string (7d, 30d, 90d, all) default: 30d

Response 200:
{
  "success": true,
  "data": {
    "summary": {
      "totalEntries": 47,
      "currentStreak": 12,
      "longestStreak": 18,
      "totalWords": 15420,
      "averageWordsPerEntry": 328
    },
    "competencies": [
      {
        "name": "Leadership",
        "demonstrationCount": 12,
        "trend": "+20%"
      }
    ],
    "projects": [
      {
        "id": "proj1",
        "name": "Q4 Planning",
        "entryCount": 8,
        "status": "active",
        "lastEntry": "2025-10-03"
      }
    ],
    "skills": [
      {
        "name": "Python",
        "usageCount": 15,
        "category": "technical",
        "trend": "+5%"
      }
    ]
  }
}
```

#### Competency Trends
```http
GET /api/insights/competencies/trends
Authorization: Bearer <token>
Query Parameters:
- period: string (7d, 30d, 90d, all)
- competencyId: string (optional)

Response 200:
{
  "success": true,
  "data": {
    "trends": [
      {
        "competency": "Leadership",
        "timeline": [
          {"date": "2025-09-03", "count": 2},
          {"date": "2025-09-10", "count": 3},
          {"date": "2025-09-17", "count": 1}
        ]
      }
    ]
  }
}
```

### 2.5 Project APIs

#### List Projects
```http
GET /api/projects
Authorization: Bearer <token>
Query Parameters:
- status: string (active, completed, archived, all) default: all
- limit: number (default: 50)

Response 200:
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj1",
        "name": "Q4 Planning",
        "description": "Quarterly planning and goal setting",
        "status": "active",
        "entryCount": 8,
        "startDate": "2025-09-01",
        "endDate": null,
        "createdAt": "2025-09-01T10:00:00.000Z",
        "updatedAt": "2025-10-03T14:30:00.000Z"
      }
    ],
    "total": 12
  }
}
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "New Marketing Campaign",
  "description": "Launch campaign for Q1 2026",
  "status": "active",
  "startDate": "2025-10-01"
}

Response 201:
{
  "success": true,
  "data": {
    "project": {
      "id": "proj_new123",
      "name": "New Marketing Campaign",
      "description": "Launch campaign for Q1 2026",
      "status": "active",
      "entryCount": 0,
      "startDate": "2025-10-01T00:00:00.000Z",
      "endDate": null,
      "createdAt": "2025-10-03T15:00:00.000Z",
      "updatedAt": "2025-10-03T15:00:00.000Z"
    }
  }
}
```

### 2.6 Export APIs

#### Export User Data
```http
GET /api/export/data
Authorization: Bearer <token>
Query Parameters:
- format: string (json, csv) default: json
- startDate: string (ISO date, optional)
- endDate: string (ISO date, optional)

Response 200:
{
  "success": true,
  "data": {
    "user": { /* user data */ },
    "entries": [ /* all entries */ ],
    "projects": [ /* all projects */ ],
    "skills": [ /* all skills */ ],
    "competencies": [ /* all competencies */ ],
    "exportDate": "2025-10-03T15:30:00.000Z",
    "totalEntries": 47
  }
}

Response 200 (CSV format):
Content-Type: text/csv
Content-Disposition: attachment; filename="worklog-export-2025-10-03.csv"

Date,Entry Text,Word Count,Projects,Skills,Competencies
2025-10-03,"Today I completed...",142,"Q4 Planning","Python,Leadership","Innovation"
```

---

## 3. AI Integration

### 3.1 Anthropic Claude API Integration

#### Service Configuration
```javascript
// backend/src/services/ai/claudeService.js
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 30000 // 30 seconds
});

const claudeConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 2000,
  temperature: 0.1, // Low temperature for consistent extraction
  systemPrompt: `You are an AI assistant specialized in analyzing professional journal entries...`
};
```

#### Analysis Pipeline
```javascript
// Analysis workflow
const analyzeEntry = async (entryText) => {
  try {
    // Step 1: Basic validation
    if (!entryText || entryText.length < 10) {
      throw new Error('Entry too short for analysis');
    }

    // Step 2: Check cache first
    const cacheKey = `ai:analysis:${hash(entryText)}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Step 3: Call Claude API
    const response = await anthropic.messages.create({
      model: claudeConfig.model,
      max_tokens: claudeConfig.maxTokens,
      temperature: claudeConfig.temperature,
      system: claudeConfig.systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this journal entry: "${entryText}"`
      }]
    });

    // Step 4: Parse and validate response
    const analysis = JSON.parse(response.content[0].text);
    
    // Step 5: Cache result (7 days TTL)
    await cache.set(cacheKey, JSON.stringify(analysis), 604800);
    
    return analysis;
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
};
```

### 3.2 Analysis Prompts

#### System Prompt
```
You are an AI assistant specialized in analyzing professional journal entries to extract structured career data. Your task is to analyze work-related text and extract:

1. Projects mentioned (with confidence scores)
2. Skills demonstrated (technical, soft, domain-specific)
3. Competencies shown (leadership, innovation, communication, etc.)
4. Metrics and achievements (quantifiable impacts)
5. People mentioned (colleagues, stakeholders, clients)
6. Keywords and themes
7. Overall sentiment (positive, neutral, negative)

Guidelines:
- Only extract information that is clearly mentioned or strongly implied
- Assign confidence scores (0-1) to all extractions
- Focus on professional/career-relevant content
- Ignore personal or non-work activities
- Use consistent naming conventions
- Return valid JSON with the specified structure

Output format: JSON object with the structure shown in the example.
```

#### Analysis Examples

**Input Text:**
```
"Today I led the sprint planning meeting for the mobile app project. We decided to prioritize the authentication feature using React Native. I also mentored two junior developers on best practices for API integration. The team appreciated my leadership during the discussion about technical debt, and we successfully reduced our backlog by 15%. Sarah from product management provided great insights about user requirements."
```

**Expected Output:**
```json
{
  "projects": [
    {
      "name": "mobile app project",
      "confidence": 0.95,
      "mentions": 1,
      "context": "sprint planning meeting"
    }
  ],
  "skills": [
    {
      "name": "React Native",
      "category": "technical",
      "confidence": 0.9,
      "context": "authentication feature implementation"
    },
    {
      "name": "API integration",
      "category": "technical", 
      "confidence": 0.85,
      "context": "mentoring junior developers"
    },
    {
      "name": "Mentoring",
      "category": "soft",
      "confidence": 0.9,
      "context": "guided junior developers"
    }
  ],
  "competencies": [
    {
      "name": "Leadership",
      "evidence": "led sprint planning meeting, team appreciated leadership during technical debt discussion",
      "confidence": 0.92
    },
    {
      "name": "Communication",
      "evidence": "facilitated meeting discussion, mentored developers",
      "confidence": 0.85
    }
  ],
  "metrics": [
    {
      "type": "efficiency",
      "value": "reduced backlog by 15%",
      "unit": "percentage",
      "confidence": 0.95
    }
  ],
  "people": [
    {
      "name": "Sarah",
      "role": "product management",
      "relationship": "collaborator"
    }
  ],
  "keywords": ["sprint planning", "mobile app", "authentication", "technical debt", "mentoring"],
  "sentiment": "positive",
  "primaryTopic": "project management and technical leadership"
}
```

### 3.3 AI Job Queue System

#### Queue Architecture
```javascript
// backend/src/services/ai/jobQueue.js
class AIJobQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.retryAttempts = 3;
  }

  async addJob(entryId, userId, priority = 'normal') {
    const job = {
      id: generateJobId(),
      entryId,
      userId,
      priority,
      status: 'queued',
      createdAt: new Date(),
      attempts: 0
    };

    this.queue.push(job);
    this.sortByPriority();
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return job.id;
  }

  async processQueue() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      
      try {
        job.status = 'processing';
        const result = await this.processJob(job);
        
        job.status = 'completed';
        job.result = result;
        job.completedAt = new Date();
        
        // Save result to database
        await this.saveJobResult(job);
        
      } catch (error) {
        job.attempts++;
        
        if (job.attempts < this.retryAttempts) {
          job.status = 'queued';
          this.queue.unshift(job); // Add back to front
        } else {
          job.status = 'failed';
          job.error = error.message;
        }
      }
    }
    
    this.processing = false;
  }
}
```

### 3.4 Cost Management

#### Usage Tracking
```javascript
// AI usage monitoring
const aiUsageTracker = {
  trackUsage: async (userId, operation, inputTokens, outputTokens, cost) => {
    await db.aiUsage.create({
      data: {
        userId,
        operation,
        inputTokens,
        outputTokens,
        cost,
        timestamp: new Date()
      }
    });
  },

  getDailyUsage: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    return await db.aiUsage.aggregate({
      where: {
        userId,
        timestamp: {
          gte: new Date(today)
        }
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true
      }
    });
  }
};

// Cost estimation
const estimateCost = (text) => {
  const inputTokens = text.length / 4; // Rough estimation
  const outputTokens = 500; // Expected analysis output
  
  // Claude Sonnet pricing (as of Oct 2025)
  const inputCost = (inputTokens / 1000000) * 3.00;  // $3/M input tokens
  const outputCost = (outputTokens / 1000000) * 15.00; // $15/M output tokens
  
  return inputCost + outputCost;
};
```

#### Rate Limiting
```javascript
// Rate limiting for AI API calls
const aiRateLimiter = {
  limits: {
    perUser: {
      perHour: 20,    // 20 analyses per hour per user
      perDay: 100     // 100 analyses per day per user
    },
    global: {
      perMinute: 50,  // 50 total analyses per minute
      perHour: 2000   // 2000 total analyses per hour
    }
  },

  checkLimit: async (userId, operation) => {
    const userHourly = await this.getUserUsage(userId, 'hour');
    const userDaily = await this.getUserUsage(userId, 'day');
    const globalMinute = await this.getGlobalUsage('minute');
    const globalHourly = await this.getGlobalUsage('hour');

    if (userHourly >= this.limits.perUser.perHour) {
      throw new Error('User hourly limit exceeded');
    }
    if (userDaily >= this.limits.perUser.perDay) {
      throw new Error('User daily limit exceeded');
    }
    if (globalMinute >= this.limits.global.perMinute) {
      throw new Error('Global rate limit exceeded');
    }
    if (globalHourly >= this.limits.global.perHour) {
      throw new Error('Global hourly limit exceeded');
    }

    return true;
  }
};
```

---

## Document Maintenance

This document should be updated when:
- New API endpoints are added or modified
- Database schema changes are made
- AI integration prompts or models change
- Data structures are modified
- New analysis features are implemented

**Next Review Date**: January 3, 2026
**Reviewers**: Technical Lead, Backend Developer