# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**WorkLog AI** - An AI-powered professional journaling application that helps individuals systematically track daily work accomplishments, extract career insights, and generate performance artifacts (reviews, resume bullets, etc.).

**Company**: AJKAY SOLUTIONS (ajkaysolutions.com)
**Tagline**: "Never miss a career win"
**Business Model**: Freemium SaaS (Free tier for MVP, paid features later)

---

## 🎯 Project Context

### **This is the SECOND application under AJKAY SOLUTIONS brand:**

1. **Job Assistant** (existing) - `/home/ajk/ajkay-solutions/`
   - LinkedIn job application tool with AI-powered cover letter generation
   - Ports: 3002 (frontend), 3003 (backend)
   - OAuth: Google + LinkedIn
   - Status: Production, deployed at ajkaysolutions.com/job-assistant

2. **WorkLog AI** (new, this repo) - `/home/ajk/worklog-ai/`
   - Career journaling with AI-powered insights
   - Ports: 5173 (frontend dev), 3004 (backend dev)
   - OAuth: Same credentials as Job Assistant
   - Status: Development (MVP phase)

**CRITICAL**: WorkLog AI borrows proven patterns from Job Assistant but is a separate, independent application.

---

## 📚 Key Documentation

### **Primary Documents (Read These First):**

1. **Project Charter**: `/home/ajk/worklog-ai/docs/PROJECT_CHARTER.md`
   - Business case, success metrics, timeline
   - 6-week MVP development plan
   - Target users and value propositions

2. **Technical Specification**: `/home/ajk/worklog-ai/docs/TECHNICAL_SPEC.md`
   - Complete architecture and data models
   - API specifications and component structure
   - Technology stack decisions (JavaScript, Vite, Supabase)
   - Code examples and implementation patterns

3. **UI/UX Design Document**: `/home/ajk/worklog-ai/docs/UI_UX_DESIGN.md`
   - Design system (colors, typography, spacing)
   - Component library specifications
   - User flows and wireframes
   - Accessibility requirements

### **Reference Documents:**

4. **Job Assistant Context**: `/home/ajk/ajkay-solutions/CLAUDE.md`
   - Existing application architecture
   - OAuth configuration (to be reused)
   - Mailgun email setup (to be reused)
   - Port usage (3002, 3003 - avoid conflicts!)

---

## 🏗️ Architecture Overview

### Tech Stack

**Frontend:**
- React 18.2+ (JavaScript, NOT TypeScript)
- Vite 5+ (build tool - faster than CRA)
- Tailwind CSS 3.4+ (utility-first styling)
- React Router v6 (navigation)
- Lucide React (icons - same as Job Assistant)

**Backend:**
- Node.js 18+ LTS
- Express.js 4.x (JavaScript, NOT TypeScript)
- Prisma 5.x (ORM)
- Passport.js (OAuth - copied from Job Assistant)
- JWT authentication (24h expiry)

**Databases & Services:**
- PostgreSQL 16 (Supabase free tier: 500 MB, separate dev/prod databases)
- Redis 7.x (Upstash free tier: 10K commands/day, single database with env prefixes)
- Anthropic Claude API (AI processing)
- Mailgun API (email - shared with Job Assistant)

**Deployment:**
- Render.com (free tier, separate service from Job Assistant)
- Domain: worklog.ajkaysolutions.com (subdomain)
- Auto-deploy from GitHub main branch

---

## 🔗 Code Reuse from Job Assistant

### **Files to Copy/Reference:**

**Authentication System (100% reusable):**
```
Source: /home/ajk/ajkay-solutions/server/
Copy to: /home/ajk/worklog-ai/backend/src/

Files:
├── config/passport.js          → OAuth configuration
├── routes/auth.js              → Auth routes (login, callback, logout)
├── middleware/auth.js          → JWT verification
└── services/authProviders/     → Google + LinkedIn providers
```

**Frontend Auth Service:**
```
Source: /home/ajk/ajkay-solutions/src/services/authService.js
Copy to: /home/ajk/worklog-ai/frontend/src/services/auth.js

Changes needed:
- Update API_BASE: http://localhost:3003 → http://localhost:3004
- Update callback URLs for WorkLog domain
```

**Email Service (Mailgun):**
```
Source: /home/ajk/ajkay-solutions/server/routes/api.js
Extract: Mailgun integration functions
Copy to: /home/ajk/worklog-ai/backend/src/services/emailService.js

Reuse:
- MAILGUN_API_KEY (same)
- MAILGUN_DOMAIN=mg.ajkaysolutions.com (same)
```

**AI Service Pattern:**
```
Source: /home/ajk/ajkay-solutions/src/services/aiApiService.js
Reference: Multi-provider fallback pattern
Extend: Add Anthropic Claude API as primary provider
```

### **OAuth Credentials (Shared):**

```bash
# Same OAuth apps, different callback URLs
GOOGLE_CLIENT_ID=677875518045-8qa0q2msug0ngmgvkokc5s3somaooh0.apps.googleusercontent.com
LINKEDIN_CLIENT_ID=7730ozpx4pzs6w

# Add these callback URLs to existing OAuth apps:
# Google: https://worklog.ajkaysolutions.com/auth/google/callback
# LinkedIn: https://worklog.ajkaysolutions.com/auth/linkedin/callback

# Development:
# Google: http://localhost:3004/auth/google/callback
# LinkedIn: http://localhost:3004/auth/linkedin/callback
```

---

## 🚨 Port Management (CRITICAL)

### **Existing Ports (Job Assistant - DO NOT USE):**
- `3002` - Job Assistant frontend (React dev server)
- `3003` - Job Assistant backend (Express API)

### **WorkLog AI Ports (THIS PROJECT):**
- `5173` - Frontend (Vite dev server)
- `3004` - Backend (Express API)
- `5555` - Prisma Studio (optional database GUI)

**IMPORTANT**: 
- Always use port 3004 for WorkLog AI backend (hardcoded in many places)
- Always use port 5173 for WorkLog AI frontend (Vite default)
- Never change these ports as workarounds - they're configured in OAuth callbacks

### **Port Conflict Prevention:**

```bash
# Before starting development, check ports:
sudo netstat -tulpn | grep -E ':(3004|5173|3002|3003)'

# If WorkLog AI ports are blocked, kill them:
sudo fuser -k 3004/tcp 5173/tcp

# Job Assistant can run simultaneously (different ports)
# Both apps can be developed/tested at same time
```

---

## 📂 Project Structure

```
worklog-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── journal/           # Journal entry UI
│   │   │   │   ├── JournalEditor.jsx
│   │   │   │   ├── AIPromptWindow.jsx
│   │   │   │   ├── DateNavigator.jsx
│   │   │   │   └── EntryStats.jsx
│   │   │   ├── insights/          # Analytics dashboard
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CompetencyChart.jsx
│   │   │   │   ├── ProjectList.jsx
│   │   │   │   └── SkillCloud.jsx
│   │   │   ├── generate/          # Export/generation tools
│   │   │   │   ├── PerformanceReviewGenerator.jsx
│   │   │   │   ├── ResumeBulletGenerator.jsx
│   │   │   │   └── ExportOptions.jsx
│   │   │   ├── auth/              # Authentication UI
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── AuthStatus.jsx
│   │   │   └── common/            # Reusable components
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Public landing page
│   │   │   ├── JournalView.jsx    # Main journal page (default home)
│   │   │   ├── InsightsView.jsx   # Analytics dashboard
│   │   │   └── SettingsView.jsx   # User settings
│   │   ├── services/
│   │   │   ├── auth.js            # Auth service (copied from Job Assistant)
│   │   │   └── api.js             # API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── utils/
│   │   │   ├── date.js            # Date formatting utilities
│   │   │   └── validation.js      # Input validation
│   │   ├── styles/
│   │   │   └── tailwind.css       # Tailwind + custom styles
│   │   ├── App.jsx                # Root component
│   │   └── main.jsx               # Vite entry point
│   ├── public/
│   ├── .env                       # Environment variables
│   ├── package.json
│   ├── vite.config.js             # Vite configuration
│   └── tailwind.config.js         # Tailwind configuration
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js            # OAuth routes (copied from Job Assistant)
│   │   │   ├── entries.js         # Entry CRUD operations
│   │   │   ├── insights.js        # Analytics endpoints
│   │   │   ├── projects.js        # Project management
│   │   │   └── generate.js        # Export/generation endpoints
│   │   ├── services/
│   │   │   ├── aiService.js       # Claude API integration (extended from Job Asst)
│   │   │   ├── aiQueue.js         # Async AI processing
│   │   │   ├── cache.js           # Redis caching
│   │   │   └── emailService.js    # Mailgun integration (copied from Job Asst)
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification (copied from Job Assistant)
│   │   │   └── rateLimiter.js     # Rate limiting
│   │   ├── config/
│   │   │   └── passport.js        # Passport OAuth config (copied from Job Asst)
│   │   ├── utils/
│   │   │   └── validation.js      # Server-side validation
│   │   └── server.js              # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Database migrations
│   ├── .env                       # Environment variables
│   └── package.json
│
├── docs/
│   ├── PROJECT_CHARTER.md         # Business case and timeline
│   ├── TECHNICAL_SPEC.md          # Complete technical specifications
│   ├── UI_UX_DESIGN.md            # Design system and guidelines
│   └── SETUP.md                   # Development setup guide
│
├── .gitignore
├── README.md
├── render.yaml                    # Render.com deployment config
└── CLAUDE.md                      # This file
```

---

## 🎨 Design System (Summary)

### **Colors:**
```javascript
// Primary Blue (matching Job Assistant for brand consistency)
primary: {
  DEFAULT: '#2563EB',
  hover: '#1D4ED8',
  active: '#1E40AF',
  light: '#DBEAFE'
}

// Neutrals (gray scale)
gray: {
  950: '#0A0A0A',  // Primary text
  700: '#374151',  // Secondary text
  400: '#9CA3AF',  // Tertiary text
  200: '#E5E7EB',  // Borders
  100: '#F3F4F6',  // Backgrounds
  50: '#F9FAFB'    // Subtle backgrounds
}

// Semantic colors
success: '#10B981',
warning: '#F59E0B',
error: '#EF4444'
```

### **Typography:**
```javascript
// System font stack (performance + native feel)
fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

// Type scale
text-4xl: 36px (H1)
text-2xl: 24px (H3)
text-base: 16px (Body)
text-sm: 14px (Small text)
```

### **Spacing (8px grid):**
```
space-2: 8px
space-4: 16px (component padding)
space-6: 24px (card padding)
space-8: 32px (section spacing)
```

---

## 🔐 Authentication Flow

### **User Journey:**

1. User visits `worklog.ajkaysolutions.com`
2. Lands on public homepage (not logged in)
3. Clicks "Get Started" → `/login` page
4. Clicks "Sign in with Google" or "Sign in with LinkedIn"
5. Redirects to OAuth provider
6. After successful auth, returns to `/journal` with JWT token
7. Token stored in `localStorage` (key: `auth_token`)
8. All API requests include `Authorization: Bearer <token>` header

### **Security:**

- JWT tokens expire in 24 hours
- Tokens include: userId, email, displayName, provider
- Backend verifies token on every protected route
- User data isolated by `userId` (row-level security)

### **Implementation Notes:**

- Authentication is **separate** from Job Assistant (users must login again)
- Uses **same OAuth apps** (just different callback URLs)
- Future: Add SSO (single sign-on) in Phase 2 for seamless transition

---

## 🤖 AI Integration

### **Primary AI Provider: Anthropic Claude**

```javascript
// Claude API configuration
Model: claude-sonnet-4-20250514
Cost: $3/M input tokens, $15/M output tokens
Use cases:
  - Extract entities from journal entries (projects, skills, metrics)
  - Generate performance reviews
  - Generate resume bullets
  - Provide contextual writing prompts
```

### **Multi-Provider Fallback Pattern:**

```javascript
// Copied from Job Assistant, extended with Claude
const AI_PROVIDERS = [
  'claude',   // Primary (WorkLog AI)
  'groq',     // Free fallback (Job Assistant)
  'cohere',   // Free fallback (Job Assistant)
  'openai'    // Paid fallback (both apps)
];

// Pattern: Try each provider, fallback on failure
// Cost optimization: Cache all AI responses for 7 days
```

### **AI Processing:**

- Entry extraction: Async (queued, non-blocking)
- Performance review generation: Synchronous (user waits 2-5s)
- Caching: All AI responses cached in Redis for 7 days
- Budget: $50/month ≈ 12,500 entry extractions

---

## 🗄️ Database Schema (Key Models)

### **Core Models:**

```prisma
User {
  id, email, provider (google|linkedin), displayName, profilePhoto
  → Has many: entries, projects, skills, competencies
}

Entry {
  id, userId, date, rawText (user input), extractedData (AI output)
  → Journal entry for a specific date
  → extractedData contains: projects, skills, metrics, people, competencies
}

Project {
  id, userId, name, status (active|completed|archived)
  → Organizes work by project
}

Skill {
  id, userId, name, category (technical|soft|domain), usageCount
  → Tracks skills used over time
}

Competency {
  id, userId, name, demonstrationCount
  → Organizational values demonstrated (Leadership, Innovation, etc.)
}
```

### **Data Flow:**

1. User writes journal entry → Save `rawText` immediately
2. Queue AI extraction job (async)
3. AI extracts structured data → Save to `extractedData` JSON field
4. Update related entities (projects, skills, competencies)
5. Denormalize counts for performance (entryCount, usageCount)

---

## 🚀 Development Commands

### Frontend (Vite)
```bash
cd frontend
npm run dev        # Start dev server on port 5173
npm run build      # Build production bundle
npm run preview    # Preview production build
```

### Backend (Express)
```bash
cd backend
npm run dev        # Start dev server with nodemon on port 3004
npm start          # Production server
npm run db:migrate # Run database migrations
npm run db:studio  # Open Prisma Studio on port 5555
```

### Full Stack Development
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Terminal 3 (optional)
cd backend && npm run db:studio
```

### Quick Restart
```bash
# Kill blocked ports
sudo fuser -k 3004/tcp 5173/tcp

# Restart services
cd backend && npm run dev &
cd frontend && npm run dev &
```

---

## 🔧 Environment Configuration

### Backend `.env`
```bash
# Server
NODE_ENV=development|production
PORT=3004

# Database (Supabase)
DATABASE_URL=postgresql://postgres.[project]:[password]@...pooler.supabase.com:6543/postgres

# Redis (Upstash) - Single database with environment prefixes
# Same connection string for dev/prod, code handles separation via key prefixes
REDIS_URL=redis://default:[password]@us1-xxx.upstash.io:6379

# OAuth (same as Job Assistant)
GOOGLE_CLIENT_ID=677875518045-8qa0q2msug0ngmgvkokc5s3somaooh0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=7730ozpx4pzs6w
LINKEDIN_CLIENT_SECRET=...

# JWT
JWT_SECRET=your-secret-key-256-bit
SESSION_SECRET=your-session-secret

# AI
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Email (same as Job Assistant)
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.ajkaysolutions.com
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:3004
VITE_APP_NAME=WorkLog AI
```

---

## 📋 Development Guidelines

### **Code Style:**

**JavaScript (NOT TypeScript):**
- Use ES6+ syntax (const, let, arrow functions, async/await)
- Use JSDoc comments for complex functions
- Consistent naming: camelCase variables, PascalCase components

**Component Structure:**
```javascript
// Functional components with hooks (same as Job Assistant)
import { useState, useEffect } from 'react';

function JournalEditor() {
  const [entry, setEntry] = useState('');
  
  useEffect(() => {
    // Auto-save logic
  }, [entry]);
  
  return (
    <div className="journal-editor">
      {/* Component JSX */}
    </div>
  );
}

export default JournalEditor;
```

**Error Handling:**
```javascript
// Always wrap async operations in try-catch
async function saveEntry(data) {
  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Save failed');
    
    return await response.json();
  } catch (error) {
    console.error('Error saving entry:', error);
    // Show user-friendly error message
  }
}
```

### **Git Workflow:**
```bash
# Branch naming
feature/journal-editor
fix/auth-redirect
docs/update-readme

# Commit messages (conventional commits)
feat: Add journal entry auto-save
fix: Resolve OAuth callback redirect
docs: Update API documentation
refactor: Extract AI service to separate module
```

---

## 🎯 MVP Development Plan (6 Weeks)

### **Week 1: Foundation**
- ✅ Project setup (repos, environments)
- ✅ Copy authentication from Job Assistant
- ✅ Database schema and migrations
- ✅ Basic frontend structure

### **Week 2: Core Journaling**
- Entry CRUD operations
- Date navigation
- Auto-save functionality
- Basic text editor

### **Week 3: AI Integration**
- Claude API integration
- Entity extraction (projects, skills, metrics)
- AI prompt system (rule-based MVP)
- Caching layer

### **Week 4: Insights Dashboard**
- Summary metrics (entries, streak, word count)
- Competency visualization
- Project/skill lists
- Basic charts

### **Week 5: Export & Generation**
- Performance review generator
- Resume bullet generator
- PDF/Word export
- Email functionality

### **Week 6: Polish & Deploy**
- Bug fixes and optimization
- Onboarding flow
- Production deployment to Render
- Beta testing

---

## 🚨 Important Reminders

### **Authentication:**
- WorkLog AI uses **separate authentication** from Job Assistant
- Users must login again (no SSO in MVP)
- Same OAuth credentials, different callback URLs
- Add new callbacks to existing Google/LinkedIn apps

### **Port Management:**
- **NEVER use ports 3002 or 3003** (Job Assistant uses these)
- **ALWAYS use ports 5173 (frontend) and 3004 (backend)** for WorkLog AI
- Both apps can run simultaneously for testing

### **Code Reuse:**
- Copy authentication code from Job Assistant (don't import as package)
- Reuse OAuth credentials, Mailgun config, AI service pattern
- Keep codebases separate (different repos, different deployments)

### **Database:**
- Use Supabase FREE tier (500 MB) for MVP
- Run migrations with `npx prisma migrate dev`
- Use Prisma Studio for GUI: `npx prisma studio`

### **AI Costs:**
- Budget: $50/month = ~12,500 extractions
- Cache aggressively (7-day TTL)
- Process async when possible
- Monitor usage via Anthropic dashboard

### **Deployment:**
- Deploy to Render.com (separate service from Job Assistant)
- Domain: worklog.ajkaysolutions.com (subdomain)
- Auto-deploy from GitHub main branch
- Free tier: Spins down after 15 minutes idle

---

## 📞 Support & Resources

### **Documentation:**
- Full specs in `/docs/` folder
- Job Assistant reference: `/home/ajk/ajkay-solutions/CLAUDE.md`
- Anthropic API: https://docs.anthropic.com
- Prisma ORM: https://www.prisma.io/docs
- Vite: https://vitejs.dev/guide/

### **External Services:**
- Supabase Dashboard: https://supabase.com/dashboard
- Upstash Dashboard: https://console.upstash.com
- Anthropic Console: https://console.anthropic.com
- Render Dashboard: https://dashboard.render.com

### **OAuth Configuration:**
- Google Console: https://console.cloud.google.com
- LinkedIn Developers: https://www.linkedin.com/developers

---

## ✅ Pre-Development Checklist

Before starting development, ensure:

- [ ] Read PROJECT_CHARTER.md (business context)
- [ ] Read TECHNICAL_SPEC.md (implementation details)
- [ ] Read UI_UX_DESIGN.md (design system)
- [ ] Review Job Assistant CLAUDE.md (understand existing architecture)
- [ ] Understand port allocation (3004, 5173 for WorkLog AI)
- [ ] Have Supabase database connection string
- [ ] Have Upstash Redis connection string
- [ ] Have Anthropic API key
- [ ] Have OAuth credentials from Job Assistant
- [ ] Added new OAuth callback URLs to Google/LinkedIn apps
- [ ] Understand authentication is separate (not SSO)

---

## 🎉 Ready to Build!

This project reuses proven patterns from Job Assistant while building a new, valuable career development tool. Focus on:

1. **Fast iteration** (Vite + JavaScript for speed)
2. **User value** (journaling must be effortless)
3. **AI quality** (insights must be meaningful)
4. **Clean code** (following Job Assistant patterns)

The technical foundation is solid. The design is clear. Let's build something amazing! 🚀

---

## Current Status

- **Phase**: Initial setup / MVP development starting
- **Repository**: github.com/yourusername/worklog-ai (to be created)
- **Deployment**: Not yet deployed (will be worklog.ajkaysolutions.com)
- **Next Steps**: Follow Week 1 development plan

**Last Updated**: September 30, 2025
