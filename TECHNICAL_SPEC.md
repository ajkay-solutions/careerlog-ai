# WorkLog AI - Technical Specification Document

## Document Control
- **Version**: 2.0
- **Date**: September 30, 2025
- **Author**: Arsalan Jehangir Khan
- **Status**: Active - MVP Phase
- **Last Updated**: Aligned with existing ajkay-solutions architecture

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Data Models](#2-data-models)
3. [API Specifications](#3-api-specifications)
4. [Frontend Components](#4-frontend-components)
5. [AI Integration](#5-ai-integration)
6. [Security & Privacy](#6-security--privacy)
7. [Performance Requirements](#7-performance-requirements)
8. [Development Guidelines](#8-development-guidelines)

---

## 1. Architecture Overview

### 1.1 System Architecture

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
│ (500 MB)  │   │ (10K/day)   │
└───────────┘   └─────────────┘
      │
      └─────────┐
              ┌─┴──────────────┐
              │ Anthropic API  │
              │ (Claude Sonnet)│
              └────────────────┘
```

### 1.2 Technology Stack Detail

#### Frontend
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

#### Backend
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

#### Infrastructure
```json
{
  "frontend_hosting": "Render.com (serves with backend)",
  "backend_hosting": "Render.com (free tier)",
  "database": "Supabase (free tier: 500 MB)",
  "redis": "Upstash (free tier: 10K commands/day, single DB with env prefixes)",
  "monitoring": "Render logs + manual monitoring",
  "analytics": "Manual tracking in database"
}
```

### 1.3 Repository Structure

```
GitHub:
└── worklog-ai (new repository)
    └── github.com/yourusername/worklog-ai

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

## 2. Data Models

### 2.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
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
  
  @@unique([provider, providerId])
  @@index([email])
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
  extractedData Json?     // {projects: [], skills: [], metrics: [], people: []}
  
  // Manual Tags (array of IDs)
  projectIds    String[]  
  skillIds      String[]  
  competencyIds String[]  
  
  // Metadata
  isHighlight   Boolean   @default(false) // User marked as important
  sentiment     String?   // "positive", "neutral", "negative" (AI detected)
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId, date])
  @@index([userId, createdAt])
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
  
  @@index([userId])
  @@unique([userId, name]) // Prevent duplicate project names per user
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
  
  @@index([userId])
  @@unique([userId, name])
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
  
  @@index([userId])
  @@unique([userId, name])
}
```

### 2.2 Extracted Data JSON Schema

```javascript
// JavaScript types for Entry.extractedData field

/**
 * @typedef {Object} ExtractedData
 * @property {ExtractedProject[]} projects
 * @property {ExtractedSkill[]} skills
 * @property {ExtractedMetric[]} metrics
 * @property {ExtractedPerson[]} people
 * @property {string[]} keywords
 * @property {ExtractedCompetency[]} competencies
 */

/**
 * @typedef {Object} ExtractedProject
 * @property {string} name
 * @property {number} confidence - 0-1
 */

/**
 * @typedef {Object} ExtractedSkill
 * @property {string} name
 * @property {'technical'|'soft'|'domain'} category
 * @property {number} confidence
 */

/**
 * @typedef {Object} ExtractedMetric
 * @property {'percentage'|'dollar'|'time'|'count'} type
 * @property {number} value
 * @property {string} [unit]
 * @property {string} context - Surrounding text for context
 * @property {number} confidence
 */

/**
 * @typedef {Object} ExtractedPerson
 * @property {string} name
 * @property {string} [role]
 * @property {'colleague'|'manager'|'client'|'stakeholder'} relationship
 */

/**
 * @typedef {Object} ExtractedCompetency
 * @property {string} name
 * @property {string} evidence - Quote from entry showing demonstration
 * @property {number} confidence
 */
```

---

## 3. API Specifications

### 3.1 Authentication Endpoints

**Note:** Authentication system copied from Job Assistant (ajkay-solutions)

```javascript
// OAuth routes (same as Job Assistant)
GET /auth/google
  → Initiates Google OAuth flow

GET /auth/google/callback
  → OAuth callback, generates JWT token
  → Response: Redirects to /journal?token=xxx

GET /auth/linkedin
  → Initiates LinkedIn OAuth flow

GET /auth/linkedin/callback
  → OAuth callback, generates JWT token
  → Response: Redirects to /journal?token=xxx

GET /auth/status
  Headers: { Authorization: "Bearer <token>" }
  Response: {
    authenticated: boolean,
    user: {
      id: string,
      email: string,
      displayName: string,
      provider: string,
      profilePhoto: string
    }
  }

POST /auth/logout
  Headers: { Authorization: "Bearer <token>" }
  Response: { success: boolean }
```

**OAuth Configuration (Reuse from Job Assistant):**
```javascript
// Same OAuth apps, add new callback URLs:
Google OAuth:
  Client ID: 677875518045-8qa0q2msug0ngmgvkokc5s3somaooh0.apps.googleusercontent.com
  Add callback: https://worklog.ajkaysolutions.com/auth/google/callback

LinkedIn OAuth:
  Client ID: 7730ozpx4pzs6w
  Add callback: https://worklog.ajkaysolutions.com/auth/linkedin/callback
```

### 3.2 Entry Endpoints

```javascript
// Create or update entry (upsert by date)
POST /api/entries
Headers: { Authorization: "Bearer <token>" }
Request: {
  date: string, // ISO date "2025-09-30"
  rawText: string,
  projectIds?: string[],
  skillIds?: string[],
  competencyIds?: string[]
}
Response: {
  entry: Entry,
  aiProcessing: boolean // If AI extraction is queued
}

// Get entries with filters
GET /api/entries?startDate=2025-09-01&endDate=2025-09-30&projectId=xxx
Headers: { Authorization: "Bearer <token>" }
Response: {
  entries: Entry[],
  pagination: {
    total: number,
    page: number,
    pageSize: number
  }
}

// Get single entry
GET /api/entries/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  entry: Entry
}

// Delete entry
DELETE /api/entries/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  success: boolean
}

// Get AI prompts for current entry (rule-based for MVP)
POST /api/entries/ai-prompts
Headers: { Authorization: "Bearer <token>" }
Request: {
  currentText: string,
  cursorPosition: number
}
Response: {
  prompts: string[] // ["What project was this for?", "Who attended?"]
}
```

### 3.3 Insights Endpoints

```javascript
// Get dashboard analytics
GET /api/insights/dashboard?period=30d
Headers: { Authorization: "Bearer <token>" }
Response: {
  summary: {
    totalEntries: number,
    currentStreak: number,
    longestStreak: number,
    wordCount: number
  },
  competencies: Array<{
    name: string,
    count: number,
    trend: 'up' | 'down' | 'stable'
  }>,
  projects: Array<{
    id: string,
    name: string,
    entryCount: number,
    lastEntry: string // ISO date
  }>,
  skills: Array<{
    name: string,
    usageCount: number,
    category: string
  }>
}
```

### 3.4 Export/Generation Endpoints

```javascript
// Generate performance review
POST /api/generate/performance-review
Headers: { Authorization: "Bearer <token>" }
Request: {
  startDate: string,
  endDate: string,
  competencies?: string[], // Focus on specific competencies
  format: 'structured' | 'narrative'
}
Response: {
  content: string, // Markdown formatted
  metadata: {
    entryCount: number,
    projectsIncluded: string[],
    wordCount: number
  }
}

// Generate resume bullets
POST /api/generate/resume-bullets
Headers: { Authorization: "Bearer <token>" }
Request: {
  projectId?: string,
  skillIds?: string[],
  count: number, // Number of bullets to generate
  style: 'action' | 'achievement' | 'impact'
}
Response: {
  bullets: string[]
}

// Export data
GET /api/export?format=pdf&startDate=2025-01-01&endDate=2025-09-30
Headers: { Authorization: "Bearer <token>" }
Response: Binary (PDF/DOCX file)
```

---

## 4. Frontend Components

### 4.1 Component Tree

```
App
├── AuthProvider (Context - copied from Job Assistant pattern)
├── Router
│   ├── PublicRoutes
│   │   ├── Landing /
│   │   └── Login /login (OAuth buttons)
│   │
│   └── ProtectedRoutes (requires auth)
│       ├── JournalView /journal (default home)
│       │   ├── DateNavigator
│       │   ├── LeftPanel (AI Assistant)
│       │   │   ├── AIPromptWindow
│       │   │   └── InsightsPreview
│       │   └── RightPanel (Editor)
│       │       ├── TextArea (auto-expand)
│       │       ├── QuickTagBar
│       │       └── EntryStats
│       │
│       ├── InsightsDashboard /insights
│       │   ├── SummaryCards
│       │   ├── CompetencyChart
│       │   ├── ProjectList
│       │   └── SkillCloud
│       │
│       ├── Generate /generate
│       │   ├── PerformanceReviewGenerator
│       │   ├── ResumeBulletGenerator
│       │   └── ExportOptions
│       │
│       └── Settings /settings
│           ├── ProfileSettings
│           └── DataManagement
│
└── Notifications (Toast system)
```

### 4.2 Key Component Specifications

#### JournalView Component
```javascript
// frontend/src/pages/JournalView.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AIPromptWindow from '../components/journal/AIPromptWindow';
import TextEditor from '../components/journal/TextEditor';

function JournalView() {
  const { user } = useAuth();
  const [entry, setEntry] = useState(null);
  const [aiPrompts, setAiPrompts] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Auto-save logic (debounced to 2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (entry?.rawText) {
        saveEntry(entry);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [entry?.rawText]);
  
  // Fetch AI prompts based on content (rule-based for MVP)
  useEffect(() => {
    if (entry?.rawText) {
      fetchAIPrompts(entry.rawText);
    }
  }, [entry?.rawText]);
  
  const saveEntry = async (entryData) => {
    setSaving(true);
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryData)
      });
      const data = await response.json();
      setEntry(data.entry);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="flex h-screen">
      <LeftPanel aiPrompts={aiPrompts} />
      <RightPanel 
        entry={entry}
        onTextChange={(text) => setEntry({...entry, rawText: text})}
        saving={saving}
      />
    </div>
  );
}

export default JournalView;
```

---

## 5. AI Integration

### 5.1 Claude API Integration (Extended from Job Assistant Pattern)

```javascript
// backend/src/services/aiService.js
// Extended from Job Assistant's aiApiService.js pattern

const AI_PROVIDERS = [
  {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: 'mixtral-8x7b-32768',
    free: true
  },
  {
    name: 'cohere',
    baseUrl: 'https://api.cohere.ai/v1/chat',
    apiKey: process.env.COHERE_API_KEY,
    model: 'command-r',
    free: true
  },
  {
    name: 'claude',  // NEW: WorkLog AI primary provider
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
    free: false
  },
  {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    free: false
  }
];

/**
 * Multi-provider AI call with fallback
 * Same pattern as Job Assistant
 */
async function callAI(prompt, options = {}) {
  const primaryProvider = options.primaryProvider || 'claude';
  const providers = [
    AI_PROVIDERS.find(p => p.name === primaryProvider),
    ...AI_PROVIDERS.filter(p => p.name !== primaryProvider)
  ].filter(Boolean);
  
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name}...`);
      const response = await callProvider(provider, prompt, options);
      return response;
    } catch (error) {
      console.error(`${provider.name} failed:`, error.message);
      continue; // Try next provider
    }
  }
  
  throw new Error('All AI providers failed');
}

/**
 * Extract entities from entry text
 */
async function extractEntities(entryText) {
  const prompt = buildExtractionPrompt(entryText);
  
  try {
    const response = await callAI(prompt, {
      primaryProvider: 'claude',
      maxTokens: 1000
    });
    
    return parseExtractedData(response);
  } catch (error) {
    console.error('Entity extraction failed:', error);
    return getEmptyExtractedData();
  }
}

function buildExtractionPrompt(entryText) {
  return `Analyze this work journal entry and extract structured information.

Entry:
"${entryText}"

Extract and return ONLY a valid JSON object:
{
  "projects": [{"name": "project name", "confidence": 0.95}],
  "skills": [{"name": "skill", "category": "technical|soft|domain", "confidence": 0.90}],
  "metrics": [{"type": "percentage|dollar|time|count", "value": 15, "unit": "%", "context": "text", "confidence": 0.85}],
  "people": [{"name": "person", "role": "title", "relationship": "colleague|manager|client"}],
  "competencies": [{"name": "competency", "evidence": "quote", "confidence": 0.80}],
  "keywords": ["keyword1", "keyword2"]
}

Rules:
- Only extract explicitly mentioned entities
- Confidence scores: 0-1 (1 = certain)
- Return ONLY JSON, no markdown formatting
- Empty arrays if nothing found

DO NOT include any text outside JSON.`;
}

function parseExtractedData(responseText) {
  // Strip markdown formatting
  let cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    return {
      projects: parsed.projects || [],
      skills: parsed.skills || [],
      metrics: parsed.metrics || [],
      people: parsed.people || [],
      competencies: parsed.competencies || [],
      keywords: parsed.keywords || []
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return getEmptyExtractedData();
  }
}

/**
 * Generate performance review
 */
async function generatePerformanceReview(entries, options) {
  const entriesSummary = entries.map(e => ({
    date: e.date,
    text: e.rawText.substring(0, 200) // Truncate for token efficiency
  }));
  
  const prompt = `Create a professional performance review based on these entries:

${JSON.stringify(entriesSummary, null, 2)}

${options.competencies ? `Focus on: ${options.competencies.join(', ')}` : ''}

Format: ${options.format === 'structured' ? 'Bullet points by competency' : 'Narrative paragraph'}

Requirements:
- Professional, achievement-oriented language
- Quantify impact where possible
- Be concise (300-500 words)
- Use action verbs
- Focus on outcomes

Generate the review:`;

  return await callAI(prompt, {
    primaryProvider: 'claude',
    maxTokens: 1500
  });
}

/**
 * Generate resume bullets
 */
async function generateResumeBullets(entries, options) {
  const context = entries.map(e => e.rawText).join('\n\n');
  
  const styleGuidance = {
    action: 'Start with strong action verbs, focus on what you did',
    achievement: 'Emphasize outcomes and accomplishments',
    impact: 'Lead with quantifiable business impact'
  };
  
  const prompt = `Generate ${options.count} resume bullet points from this work:

${context}

Style: ${styleGuidance[options.style]}

Format:
- One sentence per bullet (15-25 words)
- Start with past-tense action verb
- Include metrics (%, $, time, users)
- XYZ formula: "Accomplished [X] by [Y] resulting in [Z]"

Return ONLY the bullets, one per line, no symbols or numbering.`;

  const response = await callAI(prompt, {
    primaryProvider: 'claude',
    maxTokens: 800
  });
  
  return response.split('\n').filter(line => line.trim().length > 0).slice(0, options.count);
}

module.exports = {
  extractEntities,
  generatePerformanceReview,
  generateResumeBullets
};
```

### 5.2 AI Processing Queue (Simple In-Memory for MVP)

```javascript
// backend/src/services/aiQueue.js

class AIQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async addJob(type, payload) {
    const job = {
      id: Date.now().toString(),
      type,
      payload,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.queue.push(job);
    this.processQueue();
    
    return job.id;
  }
  
  async processQueue() {
    if (this.processing) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.find(j => j.status === 'pending');
      if (!job) break;
      
      job.status = 'processing';
      
      try {
        const { extractEntities } = require('./aiService');
        job.result = await extractEntities(job.payload.text);
        job.status = 'completed';
      } catch (error) {
        job.status = 'failed';
        job.error = error.message;
      }
    }
    
    this.processing = false;
  }
}

module.exports = new AIQueue();
```

### 5.3 Caching Strategy (Upstash Redis)

```javascript
// backend/src/services/cache.js

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

async function cacheExtraction(entryText, result) {
  const key = `extraction:${hashText(entryText)}`;
  await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(result)); // 7 days
}

async function getCachedExtraction(entryText) {
  const key = `extraction:${hashText(entryText)}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

function hashText(text) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(text).digest('hex');
}

module.exports = {
  cacheExtraction,
  getCachedExtraction
};
```

---

## 6. Security & Privacy

### 6.1 Authentication & Authorization

**OAuth System (Copied from Job Assistant):**

```javascript
// Backend: config/passport.js
// Copied from ajkay-solutions/server/config/passport.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

// Google OAuth (same credentials as Job Assistant)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://worklog.ajkaysolutions.com/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user
  const user = {
    id: profile.id,
    provider: 'google',
    email: profile.emails[0].value,
    displayName: profile.displayName,
    profilePhoto: profile.photos[0]?.value
  };
  return done(null, user);
}));

// LinkedIn OAuth (same credentials)
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: 'https://worklog.ajkaysolutions.com/auth/linkedin/callback',
  scope: ['openid', 'profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  const user = {
    id: profile.id,
    provider: 'linkedin',
    email: profile.emails[0].value,
    displayName: profile.displayName,
    profilePhoto: profile.photos[0]?.value
  };
  return done(null, user);
}));
```

**JWT Token Management:**
```javascript
// src/middleware/auth.js
// Copied from ajkay-solutions pattern

const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign({
    id: user.id,
    provider: user.provider,
    email: user.email,
    displayName: user.displayName
  }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { generateToken, verifyToken };
```

### 6.2 Data Privacy

**Principles:**
1. **User Ownership**: All data belongs to the user
2. **No Training**: User data NEVER used to train AI models
3. **Encryption**: All data encrypted at rest (Supabase default)
4. **Transport**: All communication over HTTPS/TLS 1.3
5. **Deletion**: Hard delete on user request (GDPR compliance)

**Row-Level Security (Supabase):**
```sql
-- Enable RLS on all tables
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER# WorkLog AI - Technical Specification Document

## Document Control
- **Version**: 2.0
- **Date**: September 30, 2025
- **Author**: Arsalan Jehangir Khan
- **Status**: Active - MVP Phase
- **Last Updated**: Aligned with existing ajkay-solutions architecture

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Data Models](#2-data-models)
3. [API Specifications](#3-api-specifications)
4. [Frontend Components](#4-frontend-components)
5. [AI Integration](#5-ai-integration)
6. [Security & Privacy](#6-security--privacy)
7. [Performance Requirements](#7-performance-requirements)
8. [Development Guidelines](#8-development-guidelines)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────┐
│                   CLIENT LAYER                  │
│  React SPA (Vite + TypeScript + Tailwind)      │
│  - Journal Entry UI                             │
│  - Insights Dashboard                           │
│  - Export/Generation Tools                      │
└─────────────┬───────────────────────────────────┘
              │ HTTPS/REST API
┌─────────────┴───────────────────────────────────┐
│                   API LAYER                     │
│  Express.js/Fastify + TypeScript                │
│  - Authentication middleware                    │
│  - Entry CRUD operations                        │
│  - AI processing queue                          │
│  - Export generation                            │
└─────────────┬───────────────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────┴─────┐   ┌──────┴──────┐
│ PostgreSQL│   │ Redis Cache │
│  (Primary) │   │  (Sessions) │
└───────────┘   └─────────────┘
      │
      └─────────┐
              ┌─┴──────────────┐
              │ Anthropic API  │
              │ (Claude Sonnet)│
              └────────────────┘
```

### 1.2 Technology Stack Detail

#### Frontend
```json
{
  "framework": "React 18.3+",
  "language": "TypeScript 5.0+",
  "styling": "Tailwind CSS 3.4+",
  "state": "Zustand (lightweight)",
  "router": "React Router v6",
  "forms": "React Hook Form + Zod validation",
  "richText": "Lexical (extensible editor)",
  "charts": "Recharts",
  "http": "Axios",
  "dateTime": "date-fns",
  "build": "Vite 5+"
}
```

#### Backend
```json
{
  "runtime": "Node.js 20 LTS",
  "framework": "Express.js 4.x",
  "language": "TypeScript 5.0+",
  "database": "PostgreSQL 16",
  "orm": "Prisma 5.x",
  "cache": "Redis 7.x",
  "auth": "JWT + bcrypt",
  "validation": "Zod",
  "api": "RESTful"
}
```

#### Infrastructure
```json
{
  "frontend_hosting": "Vercel",
  "backend_hosting": "Railway/Render",
  "database": "Supabase (managed Postgres)",
  "redis": "Upstash (serverless Redis)",
  "cdn": "Vercel Edge Network",
  "monitoring": "Sentry",
  "analytics": "Vercel Analytics"
}
```

---

## 2. Data Models

### 2.1 Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  avatar        String?
  industry      String?   // For vocabulary context
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  entries       Entry[]
  projects      Project[]
  skills        Skill[]
  competencies  Competency[]
  
  // Settings
  settings      UserSettings?
  
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
  extractedData Json?     // {projects: [], skills: [], metrics: [], people: []}
  
  // Manual Tags
  projectIds    String[]  // References to Project.id
  skillIds      String[]  // References to Skill.id
  competencyIds String[]  // References to Competency.id
  
  // Metadata
  isHighlight   Boolean   @default(false) // User marked as important
  sentiment     String?   // "positive", "neutral", "negative" (AI detected)
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId, date])
  @@index([userId, createdAt])
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
  
  // Metrics
  entryCount    Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
  @@unique([userId, name]) // Prevent duplicate project names per user
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
  
  @@index([userId])
  @@unique([userId, name])
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
  
  @@index([userId])
  @@unique([userId, name])
}
```

### 2.2 Extracted Data JSON Schema

```typescript
// Types for Entry.extractedData field

interface ExtractedData {
  projects: ExtractedProject[];
  skills: ExtractedSkill[];
  metrics: ExtractedMetric[];
  people: ExtractedPerson[];
  keywords: string[];
  competencies: ExtractedCompetency[];
}

interface ExtractedProject {
  name: string;
  confidence: number; // 0-1
}

interface ExtractedSkill {
  name: string;
  category: 'technical' | 'soft' | 'domain';
  confidence: number;
}

interface ExtractedMetric {
  type: 'percentage' | 'dollar' | 'time' | 'count';
  value: number;
  unit?: string;
  context: string; // Surrounding text for context
  confidence: number;
}

interface ExtractedPerson {
  name: string;
  role?: string;
  relationship: 'colleague' | 'manager' | 'client' | 'stakeholder';
}

interface ExtractedCompetency {
  name: string;
  evidence: string; // Quote from entry showing demonstration
  confidence: number;
}
```

---

## 3. API Specifications

### 3.1 Authentication Endpoints

```typescript
POST /api/auth/register
Request: {
  email: string;
  password: string;
  name?: string;
}
Response: {
  token: string;
  user: UserPublic;
}

POST /api/auth/login
Request: {
  email: string;
  password: string;
}
Response: {
  token: string;
  user: UserPublic;
}

GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: {
  user: UserPublic;
}
```

### 3.2 Entry Endpoints

```typescript
// Create or update entry (upsert by date)
POST /api/entries
Headers: { Authorization: "Bearer <token>" }
Request: {
  date: string; // ISO date "2025-09-30"
  rawText: string;
  projectIds?: string[];
  skillIds?: string[];
  competencyIds?: string[];
}
Response: {
  entry: Entry;
  aiProcessing: boolean; // If AI extraction is queued
}

// Get entries with filters
GET /api/entries?startDate=2025-09-01&endDate=2025-09-30&projectId=xxx
Headers: { Authorization: "Bearer <token>" }
Response: {
  entries: Entry[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  }
}

// Get single entry
GET /api/entries/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  entry: Entry;
}

// Delete entry
DELETE /api/entries/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  success: boolean;
}

// Get AI prompts for current entry
POST /api/entries/ai-prompts
Headers: { Authorization: "Bearer <token>" }
Request: {
  currentText: string;
  cursorPosition: number;
}
Response: {
  prompts: string[];
  suggestions: {
    tags?: string[];
    projects?: string[];
  }
}
```

### 3.3 Insights Endpoints

```typescript
// Get dashboard analytics
GET /api/insights/dashboard?period=30d
Headers: { Authorization: "Bearer <token>" }
Response: {
  summary: {
    totalEntries: number;
    currentStreak: number;
    longestStreak: number;
    wordCount: number;
  },
  competencies: Array<{
    name: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>,
  projects: Array<{
    id: string;
    name: string;
    entryCount: number;
    lastEntry: string; // ISO date
  }>,
  skills: Array<{
    name: string;
    usageCount: number;
    category: string;
  }>
}

// Get competency heatmap data
GET /api/insights/competencies/heatmap?year=2025
Headers: { Authorization: "Bearer <token>" }
Response: {
  data: Array<{
    date: string;
    competencies: Record<string, number>; // {Leadership: 2, Innovation: 1}
  }>
}
```

### 3.4 Export/Generation Endpoints

```typescript
// Generate performance review
POST /api/generate/performance-review
Headers: { Authorization: "Bearer <token>" }
Request: {
  startDate: string;
  endDate: string;
  competencies?: string[]; // Focus on specific competencies
  format: 'structured' | 'narrative';
}
Response: {
  content: string; // Markdown formatted
  metadata: {
    entryCount: number;
    projectsIncluded: string[];
    wordCount: number;
  }
}

// Generate resume bullets
POST /api/generate/resume-bullets
Headers: { Authorization: "Bearer <token>" }
Request: {
  projectId?: string;
  skillIds?: string[];
  count: number; // Number of bullets to generate
  style: 'action' | 'achievement' | 'impact';
}
Response: {
  bullets: string[];
}

// Export data
GET /api/export?format=pdf&startDate=2025-01-01&endDate=2025-09-30
Headers: { Authorization: "Bearer <token>" }
Response: Binary (PDF/DOCX file)
```

### 3.5 Projects, Skills, Competencies Management

```typescript
// Projects
GET /api/projects
POST /api/projects { name, description, startDate? }
PUT /api/projects/:id
DELETE /api/projects/:id

// Skills (similar CRUD)
GET /api/skills
POST /api/skills { name, category }
PUT /api/skills/:id
DELETE /api/skills/:id

// Competencies (similar CRUD)
GET /api/competencies
POST /api/competencies { name, framework?, description? }
PUT /api/competencies/:id
DELETE /api/competencies/:id
```

---

## 4. Frontend Components

### 4.1 Component Tree

```
App
├── AuthProvider (Context)
├── Router
│   ├── PublicRoutes
│   │   ├── Landing /
│   │   ├── Login /login
│   │   └── Register /register
│   │
│   └── ProtectedRoutes (requires auth)
│       ├── Dashboard /dashboard
│       ├── JournalView /journal
│       │   ├── JournalHeader
│       │   ├── TwoColumnLayout
│       │   │   ├── LeftPanel (AI Assistant)
│       │   │   │   ├── AIPromptWindow
│       │   │   │   ├── VocabularyPanel
│       │   │   │   └── InsightsPreview
│       │   │   │
│       │   │   └── RightPanel (Editor)
│       │   │       ├── DateNavigator
│       │   │       ├── RichTextEditor
│       │   │       ├── QuickTagBar
│       │   │       └── EntryStats
│       │   │
│       │   └── AutoSaveIndicator
│       │
│       ├── InsightsDashboard /insights
│       │   ├── SummaryCards
│       │   ├── CompetencyChart
│       │   ├── ProjectList
│       │   ├── SkillCloud
│       │   └── TimelineView
│       │
│       ├── ExportGenerate /generate
│       │   ├── PerformanceReviewGenerator
│       │   ├── ResumeBulletGenerator
│       │   └── ExportOptions
│       │
│       └── Settings /settings
│           ├── ProfileSettings
│           ├── PreferencesSettings
│           └── DataManagement
│
└── GlobalModals
    ├── ProjectModal
    ├── SkillModal
    └── CompetencyModal
```

### 4.2 Key Component Specifications

#### JournalView Component
```typescript
// src/pages/JournalView.tsx

interface JournalViewProps {
  date: Date;
}

const JournalView: React.FC<JournalViewProps> = ({ date }) => {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Auto-save logic (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (entry?.rawText) {
        saveEntry(entry);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [entry?.rawText]);
  
  // Fetch AI prompts when cursor moves
  useEffect(() => {
    if (entry?.rawText) {
      fetchAIPrompts(entry.rawText, cursorPosition);
    }
  }, [cursorPosition, entry?.rawText]);
  
  return (
    <div className="flex h-screen">
      <LeftPanel 
        aiPrompts={aiPrompts}
        insights={/* ... */}
      />
      <RightPanel 
        entry={entry}
        onTextChange={(text) => setEntry({...entry, rawText: text})}
        onCursorMove={setCursorPosition}
      />
    </div>
  );
};
```

#### AIPromptWindow Component
```typescript
// src/components/AIPromptWindow.tsx

interface AIPromptWindowProps {
  prompts: string[];
  position: { x: number; y: number };
  onDismiss: () => void;
}

const AIPromptWindow: React.FC<AIPromptWindowProps> = ({ 
  prompts, 
  position, 
  onDismiss 
}) => {
  return (
    <div 
      className="absolute bg-white shadow-lg rounded-lg p-4 max-w-sm"
      style={{ top: position.y, left: position.x }}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-sm">AI Suggestions</h4>
        <button onClick={onDismiss}>✕</button>
      </div>
      <ul className="space-y-2">
        {prompts.map((prompt, idx) => (
          <li key={idx} className="text-sm text-gray-700">
            • {prompt}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

#### InsightsPreview Component
```typescript
// src/components/InsightsPreview.tsx

interface InsightsPreviewProps {
  userId: string;
  period: '7d' | '30d' | '90d';
}

const InsightsPreview: React.FC<InsightsPreviewProps> = ({ 
  userId, 
  period 
}) => {
  const { data, isLoading } = useQuery(['insights', period], () =>
    fetchInsights(period)
  );
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">📊 Insights ({period})</h3>
      
      <div>
        <h4 className="text-sm text-gray-600">Top Competencies</h4>
        {data.competencies.slice(0, 3).map(comp => (
          <div key={comp.name} className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${comp.count * 10}%` }}
              />
            </div>
            <span className="text-xs">{comp.name} ({comp.count})</span>
          </div>
        ))}
      </div>
      
      <Link to="/insights" className="text-blue-600 text-sm">
        View Full Dashboard →
      </Link>
    </div>
  );
};
```

---

## 5. AI Integration

### 5.1 Claude API Integration Architecture

```typescript
// src/services/ai/claudeService.ts

interface ClaudeConfig {
  apiKey: string;
  model: 'claude-sonnet-4-20250514';
  maxTokens: number;
}

class ClaudeService {
  private config: ClaudeConfig;
  
  constructor(config: ClaudeConfig) {
    this.config = config;
  }
  
  async extractEntities(entryText: string): Promise<ExtractedData> {
    const prompt = this.buildExtractionPrompt(entryText);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    const data = await response.json();
    
    // Parse and validate the response
    return this.parseExtractedData(data.content[0].text);
  }
  
  private buildExtractionPrompt(entryText: string): string {
    return `Analyze the following work journal entry and extract structured information.

Entry:
"${entryText}"

Extract and return ONLY a valid JSON object with the following structure:
{
  "projects": [{"name": "project name", "confidence": 0.95}],
  "skills": [{"name": "skill name", "category": "technical|soft|domain", "confidence": 0.90}],
  "metrics": [{"type": "percentage|dollar|time|count", "value": 15, "unit": "%", "context": "reduced costs by 15%", "confidence": 0.85}],
  "people": [{"name": "person name", "role": "title", "relationship": "colleague|manager|client|stakeholder"}],
  "competencies": [{"name": "competency name", "evidence": "quote from text", "confidence": 0.80}],
  "keywords": ["keyword1", "keyword2"]
}

Rules:
- Only extract entities explicitly mentioned or strongly implied
- Confidence scores: 0-1 (1 = certain, 0 = uncertain)
- Skills categories: technical (programming, tools), soft (leadership, communication), domain (industry knowledge)
- Return ONLY the JSON object, no markdown, no explanations
- If no entities found for a category, return empty array

DO NOT include any text outside the JSON structure.`;
  }
  
  private parseExtractedData(responseText: string): ExtractedData {
    // Strip potential markdown formatting
    let cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleaned);
      
      // Validate structure
      return {
        projects: parsed.projects || [],
        skills: parsed.skills || [],
        metrics: parsed.metrics || [],
        people: parsed.people || [],
        competencies: parsed.competencies || [],
        keywords: parsed.keywords || []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        projects: [],
        skills: [],
        metrics: [],
        people: [],
        competencies: [],
        keywords: []
      };
    }
  }
  
  async generatePrompts(currentText: string, cursorPosition: number): Promise<string[]> {
    // For MVP, use rule-based prompts
    // Phase 2: Use AI for context-aware prompts
    
    const prompts: string[] = [];
    const textBeforeCursor = currentText.substring(0, cursorPosition);
    const lastSentence = textBeforeCursor.split('.').pop()?.trim() || '';
    
    // Rule-based prompt generation
    if (lastSentence.match(/presented|meeting|demo/i)) {
      prompts.push("Who was your audience?");
      prompts.push("What was the outcome or feedback?");
    }
    
    if (lastSentence.match(/\d+%|\$\d+|reduced|increased|improved/i)) {
      prompts.push("What metric does this represent?");
      prompts.push("What was the baseline or comparison?");
    }
    
    if (lastSentence.match(/worked with|collaborated|partnered/i)) {
      prompts.push("Who were your key collaborators?");
      prompts.push("What was your specific contribution?");
    }
    
    // Default prompts if none matched
    if (prompts.length === 0) {
      prompts.push("What project was this related to?");
      prompts.push("What skills did you use?");
      prompts.push("What was the business impact?");
    }
    
    return prompts;
  }
  
  async generatePerformanceReview(entries: Entry[], options: {
    format: 'structured' | 'narrative';
    competencies?: string[];
  }): Promise<string> {
    const entriesSummary = entries.map(e => ({
      date: e.date,
      text: e.rawText.substring(0, 200) // Truncate for token efficiency
    }));
    
    const prompt = `Create a professional performance review summary based on these work journal entries:

${JSON.stringify(entriesSummary, null, 2)}

${options.competencies ? `Focus on these competencies: ${options.competencies.join(', ')}` : ''}

Format: ${options.format === 'structured' ? 'Use bullet points organized by competency areas' : 'Write as a narrative paragraph highlighting key achievements'}

Requirements:
- Use professional, achievement-oriented language
- Quantify impact where possible
- Be concise (300-500 words)
- Use action verbs (led, developed, improved, delivered)
- Focus on outcomes and business value

Generate the performance review:`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    const data = await response.json();
    return data.content[0].text;
  }
  
  async generateResumeBullets(entries: Entry[], options: {
    count: number;
    style: 'action' | 'achievement' | 'impact';
    projectId?: string;
  }): Promise<string[]> {
    const relevantEntries = options.projectId
      ? entries.filter(e => e.projectIds.includes(options.projectId))
      : entries;
    
    const context = relevantEntries.map(e => e.rawText).join('\n\n');
    
    const styleGuidance = {
      action: 'Start with strong action verbs, focus on what you did',
      achievement: 'Emphasize outcomes and accomplishments',
      impact: 'Lead with quantifiable business impact and results'
    };
    
    const prompt = `Based on this work experience, generate ${options.count} professional resume bullet points:

${context}

Style: ${styleGuidance[options.style]}

Format rules:
- Each bullet is one concise sentence (15-25 words)
- Start with past-tense action verbs (Led, Developed, Reduced, Improved)
- Include metrics where possible (%, $, time saved, users impacted)
- Focus on business value
- Use XYZ formula: "Accomplished [X] by [Y] resulting in [Z]"

Return ONLY the bullet points, one per line, without bullet symbols or numbering.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    const data = await response.json();
    const bullets = data.content[0].text
      .split('\n')
      .filter((line: string) => line.trim().length > 0);
    
    return bullets.slice(0, options.count);
  }
}

export default ClaudeService;
```

### 5.2 AI Processing Queue

For async processing to avoid blocking user experience:

```typescript
// src/services/ai/processingQueue.ts

interface QueueJob {
  id: string;
  type: 'extract_entities' | 'generate_review' | 'generate_bullets';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

class AIProcessingQueue {
  private queue: QueueJob[] = [];
  private processing = false;
  
  async addJob(type: QueueJob['type'], payload: any): Promise<string> {
    const job: QueueJob = {
      id: crypto.randomUUID(),
      type,
      payload,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.queue.push(job);
    this.processQueue(); // Start processing
    
    return job.id;
  }
  
  private async processQueue() {
    if (this.processing) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.find(j => j.status === 'pending');
      if (!job) break;
      
      job.status = 'processing';
      
      try {
        const result = await this.processJob(job);
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;
        
        // Notify client via WebSocket or polling
        this.notifyCompletion(job);
      } catch (error) {
        job.status = 'failed';
        job.error = error.message;
      }
    }
    
    this.processing = false;
  }
  
  private async processJob(job: QueueJob): Promise<any> {
    const claudeService = new ClaudeService(/* config */);
    
    switch (job.type) {
      case 'extract_entities':
        return await claudeService.extractEntities(job.payload.text);
      
      case 'generate_review':
        return await claudeService.generatePerformanceReview(
          job.payload.entries,
          job.payload.options
        );
      
      case 'generate_bullets':
        return await claudeService.generateResumeBullets(
          job.payload.entries,
          job.payload.options
        );
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }
  
  private notifyCompletion(job: QueueJob) {
    // Implementation depends on notification method
    // Could use WebSocket, Server-Sent Events, or polling
  }
  
  async getJobStatus(jobId: string): Promise<QueueJob | null> {
    return this.queue.find(j => j.id === jobId) || null;
  }
}
```

### 5.3 Caching Strategy

To reduce AI API costs:

```typescript
// src/services/ai/cache.ts

interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
}

class AICache {
  private redis: RedisClient;
  private envPrefix: string;
  
  constructor() {
    this.envPrefix = process.env.NODE_ENV === 'production' ? 'prod:' : 'dev:';
  }
  
  // Cache extracted entities for 7 days with environment prefix
  async cacheExtraction(entryText: string, result: ExtractedData) {
    const key = `${this.envPrefix}extraction:${this.hashText(entryText)}`;
    await this.redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(result));
  }
  
  async getCachedExtraction(entryText: string): Promise<ExtractedData | null> {
    const key = `${this.envPrefix}extraction:${this.hashText(entryText)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  private hashText(text: string): string {
    // Simple hash for cache key
    return crypto.createHash('md5').update(text).digest('hex');
  }
}
```

---

## 6. Security & Privacy

### 6.1 Authentication & Authorization

**JWT Token Structure:**
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  iat: number; // Issued at
  exp: number; // Expires (7 days from iat)
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- Hashed with bcrypt (cost factor: 12)

**Token Management:**
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days
- Stored in httpOnly cookies (not localStorage)

### 6.2 Data Privacy

**Principles:**
1. **User Ownership**: All data belongs to the user
2. **No Training**: User data NEVER used to train AI models
3. **Encryption**: All data encrypted at rest (database level)
4. **Transport**: All communication over HTTPS/TLS 1.3
5. **Deletion**: Hard delete on user request (GDPR compliance)

**Database Security:**
```typescript
// Row-level security (RLS) in PostgreSQL
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY entries_isolation ON entries
  USING (user_id = current_user_id());

CREATE POLICY entries_insert ON entries
  FOR INSERT
  WITH CHECK (user_id = current_user_id());
```

### 6.3 API Rate Limiting

```typescript
// src/middleware/rateLimiter.ts

const rateLimitConfig = {
  'POST /api/entries/ai-prompts': {
    windowMs: 60 * 1000, // 1 minute
    max: 30 // 30 requests per minute
  },
  'POST /api/generate/*': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20 // 20 generations per hour
  },
  'default': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per 15 minutes
  }
};
```

### 6.4 Input Validation

**All user inputs validated with Zod schemas:**

```typescript
// src/validation/entrySchema.ts

import { z } from 'zod';

export const createEntrySchema = z.object({
  date: z.string().datetime(),
  rawText: z.string()
    .min(10, 'Entry must be at least 10 characters')
    .max(10000, 'Entry cannot exceed 10,000 characters'),
  projectIds: z.array(z.string().cuid()).optional(),
  skillIds: z.array(z.string().cuid()).optional(),
  competencyIds: z.array(z.string().cuid()).optional()
});

export const generateReviewSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  competencies: z.array(z.string()).optional(),
  format: z.enum(['structured', 'narrative'])
});
```

### 6.5 CORS Configuration

```typescript
// src/config/cors.ts

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://ajkaysolutions.com', 'https://app.ajkaysolutions.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

## 7. Performance Requirements

### 7.1 Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Page load (first paint) | < 1.5s | 3s |
| API response (simple) | < 200ms | 500ms |
| API response (with AI) | < 2s | 5s |
| Auto-save delay | 2s debounce | - |
| Search/filter | < 300ms | 1s |

### 7.2 Scalability Targets (Year 1)

- **Concurrent users**: 100
- **Database size**: 10 GB
- **API requests**: 100K/month
- **AI API calls**: 10K/month

### 7.3 Optimization Strategies

**Frontend:**
- Code splitting (React.lazy)
- Image optimization (WebP format)
- Bundle size < 500KB (gzipped)
- Lazy load charts and heavy components
- Service worker for offline capability (PWA)

**Backend:**
- Database connection pooling (max 10 connections)
- Redis caching for frequent queries
- AI response caching (7-day TTL)
- Batch AI processing (queue multiple entries)

**Database:**
- Index on frequently queried columns
- Pagination for large result sets (50 entries per page)
- Materialized views for analytics queries

---

## 8. Development Guidelines

### 8.1 Code Structure

```
worklog-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── journal/
│   │   │   │   ├── JournalEditor.tsx
│   │   │   │   ├── AIPromptWindow.tsx
│   │   │   │   └── QuickTagBar.tsx
│   │   │   ├── insights/
│   │   │   │   ├── CompetencyChart.tsx
│   │   │   │   └── ProjectTimeline.tsx
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Modal.tsx
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── pages/
│   │   │   ├── JournalView.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── auth.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useEntries.ts
│   │   │   └── useAutoSave.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── date.ts
│   │       └── validation.ts
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── entryController.ts
│   │   │   ├── insightsController.ts
│   │   │   └── generateController.ts
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── claudeService.ts
│   │   │   │   ├── processingQueue.ts
│   │   │   │   └── cache.ts
│   │   │   ├── entryService.ts
│   │   │   └── analyticsService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── entry.routes.ts
│   │   │   └── insights.routes.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── logger.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
└── README.md
```

### 8.2 Coding Standards

**TypeScript:**
- Strict mode enabled
- Explicit return types for functions
- No `any` types (use `unknown` if needed)
- Interfaces for objects, types for unions/intersections

**Naming Conventions:**
- Components: PascalCase (JournalEditor)
- Files: camelCase (journalEditor.tsx)
- Functions: camelCase (getUserEntries)
- Constants: UPPER_SNAKE_CASE (MAX_ENTRY_LENGTH)
- CSS classes: kebab-case (journal-editor)

**Git Workflow:**
- Branch naming: `feature/`, `fix/`, `docs/`
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- PR required for main branch

### 8.3 Testing Strategy

**Unit Tests (Jest):**
- All utility functions
- Business logic in services
- AI parsing functions
- Target: 70% coverage

**Integration Tests:**
- API endpoints
- Database operations
- Authentication flow

**E2E Tests (Playwright):**
- Critical user journeys:
  - User registration → First entry → View insights
  - Entry creation → Auto-save → Export
  - Generate performance review

### 8.4 Environment Variables

```bash
# Backend .env
DATABASE_URL=postgresql://user:password@host:5432/worklog  # Separate dev/prod databases
REDIS_URL=redis://host:6379  # Single database, env prefixes for separation
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=sk-ant-xxx
NODE_ENV=development|production  # Controls Redis key prefixes
PORT=3004

# Frontend .env
VITE_API_URL=http://localhost:3004/api
VITE_APP_NAME=WorkLog AI
```

---

## 9. Deployment Configuration (Render.com Free Tier)

### 9.1 Render.com Constraints & Adaptations

**Free Tier Limitations:**
- Service spins down after 15 minutes of inactivity
- 750 hours/month (shared across services)
- 512 MB RAM per service
- No persistent disk storage
- Cold start delay: 30-60 seconds

**Architecture Adjustments for Free Tier:**

```
┌─────────────────────────────────────────────────┐
│            Vercel (Frontend - FREE)             │
│  - Static site hosting                          │
│  - Edge network CDN                             │
│  - Zero cold starts                             │
└─────────────┬───────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────┐
│         Render.com (Backend - FREE)             │
│  - Node.js API service                          │
│  - ⚠️  Spins down after 15min idle              │
│  - 512 MB RAM (optimize bundle size)            │
└─────────────┬───────────────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────┴─────┐   ┌──────┴──────┐
│ Supabase  │   │   Upstash   │
│   (Free)  │   │   (Free)    │
│ Postgres  │   │   Redis     │
│  500 MB   │   │  10K cmds/d │
└───────────┘   └─────────────┘
```

### 9.2 Optimization for Cold Starts

**Backend Optimizations:**

```typescript
// src/app.ts - Minimize cold start time

// ✅ DO: Lazy load heavy dependencies
const claudeService = () => import('./services/ai/claudeService');

// ✅ DO: Use connection pooling with small pool size
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Reduce connection pool for free tier
  connection: {
    max: 3, // Instead of default 10
  }
});

// ✅ DO: Implement health check endpoint for ping services
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// ❌ AVOID: Loading all AI models at startup
// ❌ AVOID: Heavy synchronous operations in global scope
```

**Keep-Alive Strategy:**

```typescript
// frontend/src/services/keepAlive.ts

class RenderKeepAlive {
  private pingInterval: NodeJS.Timeout | null = null;
  
  // Ping backend every 14 minutes to prevent spin-down during active use
  startPinging() {
    if (this.pingInterval) return;
    
    this.pingInterval = setInterval(async () => {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/health`);
        console.log('Backend kept alive');
      } catch (error) {
        console.warn('Keep-alive ping failed:', error);
      }
    }, 14 * 60 * 1000); // 14 minutes
  }
  
  stopPinging() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Use in App.tsx when user is active
useEffect(() => {
  const keepAlive = new RenderKeepAlive();
  keepAlive.startPinging();
  
  return () => keepAlive.stopPinging();
}, []);
```

**Loading State for Cold Starts:**

```typescript
// frontend/src/components/ColdStartLoader.tsx

const ColdStartLoader: React.FC = () => {
  const [isWakingUp, setIsWakingUp] = useState(false);
  
  useEffect(() => {
    const checkBackend = async () => {
      const start = Date.now();
      
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/health`);
        const duration = Date.now() - start;
        
        // If took > 5s, it was likely a cold start
        if (duration > 5000) {
          setIsWakingUp(true);
          setTimeout(() => setIsWakingUp(false), 2000);
        }
      } catch (error) {
        setIsWakingUp(true);
      }
    };
    
    checkBackend();
  }, []);
  
  if (!isWakingUp) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700">Waking up the server...</p>
        <p className="text-sm text-gray-500 mt-2">This takes ~30 seconds (one-time delay)</p>
      </div>
    </div>
  );
};
```

### 9.3 Memory Optimization (512 MB Limit)

**Backend Memory Budget:**

```typescript
// Measure and limit memory usage

// ✅ Stream large exports instead of loading into memory
app.get('/api/export', async (req, res) => {
  const entries = await getEntriesStream(userId); // Use cursor/stream
  
  res.setHeader('Content-Type', 'application/pdf');
  const pdfStream = generatePDFStream(entries); // Stream, don't buffer
  pdfStream.pipe(res);
});

// ✅ Limit concurrent AI processing
const aiQueue = new PQueue({ concurrency: 1 }); // Process 1 at a time

// ✅ Use pagination aggressively
const ENTRIES_PER_PAGE = 20; // Small page size

// ❌ AVOID: Loading all user entries at once
// ❌ AVOID: In-memory caching of large datasets
```

### 9.4 Database Optimization (Supabase Free Tier)

**Supabase Free Limits:**
- 500 MB storage
- 2 GB bandwidth/month
- 50 MB file upload
- Paused after 1 week of inactivity

**Optimization Strategies:**

```sql
-- Efficient indexes for common queries
CREATE INDEX idx_entries_user_date ON entries(user_id, date DESC);
CREATE INDEX idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX idx_projects_user ON projects(user_id);

-- Partial index for active projects only
CREATE INDEX idx_active_projects ON projects(user_id) 
WHERE status = 'active';

-- Clean up old AI extraction cache (if stored in DB)
DELETE FROM ai_cache WHERE created_at < NOW() - INTERVAL '7 days';
```

**Storage Estimates (500 MB limit):**
- Average entry: 500 bytes (text) + 2 KB (extracted JSON) ≈ 2.5 KB
- 500 MB ÷ 2.5 KB ≈ **200,000 entries**
- Per user (1000 entries/year): **200 users** for 1 year

### 9.5 Redis Optimization (Upstash Free Tier)

**Upstash Free Limits:**
- 10,000 commands/day
- 256 MB storage
- **Only 1 database allowed** (shared between dev/prod)

**Single Database Strategy:**

```typescript
// Environment-based key prefixes for dev/prod separation
const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod:' : 'dev:';

// ✅ Cache AI extractions (expensive to regenerate)
await redis.setex(`${ENV_PREFIX}extraction:${hash}`, 7 * 24 * 60 * 60, data);

// ✅ Cache insights dashboard (computed heavy)
await redis.setex(`${ENV_PREFIX}insights:${userId}:30d`, 60 * 60, JSON.stringify(insights));

// Key separation examples:
// Development: "dev:extraction:abc123", "dev:insights:user1:30d"
// Production:  "prod:extraction:abc123", "prod:insights:user1:30d"

// ❌ AVOID: Caching every API response
// ❌ AVOID: Session storage in Redis (use JWT instead)
```

### 9.6 AI API Cost Management

**Anthropic Claude API Costs (Estimated):**
- Claude Sonnet 4: $3 per million input tokens, $15 per million output tokens
- Average entry extraction: ~500 input + 200 output tokens = $0.004/entry
- **Budget: $50/month** ≈ 12,500 extractions

**Cost Reduction Strategies:**

```typescript
// 1. Aggressive caching (avoid re-processing same text)
const cached = await aiCache.getCachedExtraction(entryText);
if (cached) return cached;

// 2. Batch processing (process multiple entries in one call)
const batchExtract = async (entries: string[]) => {
  const prompt = `Extract entities from these entries (separated by ---):
${entries.join('\n---\n')}`;
  // Returns array of extractions
};

// 3. Defer AI processing for non-critical features
const processEntry = async (entry: Entry) => {
  // Save entry immediately (fast)
  await saveEntry(entry);
  
  // Queue AI extraction (async, non-blocking)
  await aiQueue.addJob('extract_entities', { entryId: entry.id });
};

// 4. Use smaller models for simple tasks
// Use Haiku for prompt generation, Sonnet for extraction/generation

// 5. Implement request debouncing
// Only process AI prompts if user pauses typing for 3+ seconds
```

### 9.7 Render.com Deployment Configuration

**`render.yaml` (Infrastructure as Code):**

```yaml
services:
  - type: web
    name: worklog-api
    env: node
    region: oregon # Choose closest to users
    plan: free
    branch: main
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false # Set manually in Render dashboard
      - key: REDIS_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: PORT
        value: 3004
```

**Auto-Deploy Setup:**
1. Connect GitHub repo to Render
2. Enable auto-deploy on push to `main`
3. Set environment variables in Render dashboard
4. Configure health check endpoint

### 9.8 Monitoring & Alerts (Free Tools)

**Uptime Monitoring:**
- **UptimeRobot** (free): Ping `/health` every 5 minutes
- Alert if down for > 2 minutes
- Tracks uptime percentage

**Error Tracking:**
```typescript
// Sentry (free tier: 5K errors/month)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of requests
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Usage Tracking:**
```typescript
// Simple analytics (store in Postgres)
const trackEvent = async (userId: string, event: string, metadata?: any) => {
  await prisma.analyticsEvent.create({
    data: {
      userId,
      event,
      metadata,
      timestamp: new Date()
    }
  });
};

// Track key metrics
trackEvent(userId, 'entry_created', { wordCount: 150 });
trackEvent(userId, 'export_generated', { format: 'pdf' });
```

---

## 10. Migration Path to Paid Tier

When you outgrow free tier (indicators):
- Backend downtime impacts >10 active users
- AI costs exceed $50/month
- Storage approaching 400 MB
- Need faster response times

**Recommended Upgrades:**

| Bottleneck | Solution | Cost |
|------------|----------|------|
| Backend cold starts | Render Starter ($7/mo) | Always-on instance |
| Database storage | Supabase Pro ($25/mo) | 8 GB storage |
| AI processing | Increase budget | Scale with revenue |
| Redis cache | Upstash Pay-as-go | ~$10/mo for 100K cmds |

**Total cost to scale:** ~$42-50/month for 100-500 active users

---

## 11. Development Workflow

### 11.1 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/worklog-ai.git
cd worklog-ai

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npx prisma generate
npx prisma migrate dev
npm run dev

# 3. Setup frontend (in new terminal)
cd ../frontend
npm install
cp .env.example .env
# Edit .env to point to local backend
npm run dev

# 4. Access app at http://localhost:5173
```

### 11.2 Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_competency_framework

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma client after schema changes
npx prisma generate
```

### 11.3 Testing

```bash
# Backend unit tests
cd backend
npm test

# Frontend component tests
cd frontend
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 12. Future Enhancements (Post-MVP)

### Phase 2 (Weeks 7-12)
- Context-aware AI prompts (analyze surrounding text)
- Competency heatmap visualization
- Timeline view (visual journal)
- Voice-to-text entry
- Mobile app (React Native)

### Phase 3 (Months 4-6)
- Team features (share with manager)
- Integrations:
  - LinkedIn (auto-update profile)
  - Google Calendar (sync meetings as context)
  - Slack (daily reminder bot)
- Custom competency frameworks
- Goal tracking & progress monitoring

### Phase 4 (Months 7-12)
- AI career coach (personalized recommendations)
- Job market alignment analysis
- Resume builder integration
- Interview prep assistant (mock questions from entries)
- API for third-party integrations

---

## 13. Success Metrics & KPIs

### Product Metrics
- **Weekly Active Users (WAU)**: Target 70% of registered users
- **Retention Rate**:
  - Day 7: 60%
  - Day 30: 40%
  - Day 90: 25%
- **Average entries per active user**: 3-5/week
- **Feature adoption**:
  - Insights dashboard: 80%
  - Export generation: 50%
  - AI prompts used: 60%

### Technical Metrics
- **API Response Time**: p95 < 1s
- **Uptime**: 99%+ (accounting for Render cold starts)
- **Error Rate**: < 1%
- **AI Processing Success**: > 95%

### Business Metrics (Freemium Model)
- **Free to Paid Conversion**: 5-10%
- **Churn Rate**: < 5%/month
- **Customer Acquisition Cost (CAC)**: < $10
- **Lifetime Value (LTV)**: > $100

---

## 14. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| Entry | A single journal entry for a specific date |
| Extraction | AI-powered process of identifying structured data from free text |
| Competency | A skill or behavior valued by organizations (e.g., Leadership) |
| Insight | Analytics derived from journal entries |
| Cold Start | Delay when Render spins up inactive service |

### B. Resources

- [Anthropic Claude API Docs](https://docs.anthropic.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Best Practices](https://react.dev)
- [Render.com Docs](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### C. Support & Contact

- **Issues**: GitHub Issues tracker
- **Email**: support@ajkaysolutions.com
- **Documentation**: `/docs` folder in repository

---

## Document Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Technical Lead | Arsalan Jehangir Khan | 2025-09-30 | Approved |
| Product Owner | Arsalan Jehangir Khan | 2025-09-30 | Approved |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | AJK | Initial technical specification |
| 1.1 | 2025-09-30 | AJK | Added Render.com free tier optimizations |

---

**Next Steps:**
1. Review and approve this specification
2. Set up development environment
3. Initialize Git repository with project structure
4. Begin Sprint 1: Authentication & Database Setup

**Ready to build! 🚀**