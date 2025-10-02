# WorkLog AI - UI/UX Design Document

## Document Control
- **Version**: 1.0
- **Date**: September 30, 2025
- **Designer**: Arsalan Jehangir Khan
- **Status**: Active - MVP Phase

---

## Table of Contents
1. [Design Philosophy](#1-design-philosophy)
2. [User Research & Personas](#2-user-research--personas)
3. [Information Architecture](#3-information-architecture)
4. [User Flows](#4-user-flows)
5. [Wireframes & Layouts](#5-wireframes--layouts)
6. [Visual Design System](#6-visual-design-system)
7. [Component Library](#7-component-library)
8. [Responsive Design](#8-responsive-design)
9. [Accessibility](#9-accessibility)
10. [Micro-interactions & Animations](#10-micro-interactions--animations)
11. [Content Strategy](#11-content-strategy)
12. [Usability Testing Plan](#12-usability-testing-plan)

---

## 1. Design Philosophy

### 1.1 Core Principles

**1. Frictionless Capture**
- Every interaction optimized for speed
- Reduce cognitive load during journaling
- Default to simplicity, complexity on demand

**2. Intelligence Without Intrusion**
- AI assists, never dictates
- Suggestions are helpful, not distracting
- User maintains full control

**3. Progressive Disclosure**
- Show essentials first, details on demand
- Avoid overwhelming with features
- Let users discover advanced capabilities naturally

**4. Data Empowerment**
- User sees their growth visually
- Insights inspire action
- Clear path from entry to career benefit

**5. Trust Through Transparency**
- Privacy controls visible and accessible
- No hidden data usage
- Export everything, anytime

### 1.2 Design Values

| Value | What it Means | How We Achieve It |
|-------|---------------|-------------------|
| **Calm** | Interface doesn't compete for attention | Generous whitespace, muted colors, minimal chrome |
| **Fast** | Immediate response to every action | Optimistic UI updates, skeleton screens, instant feedback |
| **Smart** | Anticipates needs without being presumptuous | Context-aware prompts, intelligent defaults |
| **Rewarding** | Positive reinforcement for good habits | Streak tracking, progress visualization, achievement highlights |
| **Professional** | Serious tool for career growth | Clean typography, data-driven visuals, business-appropriate tone |

### 1.3 Inspiration & References

**Similar Products (to learn from, not copy):**
- **Notion**: Clean editor, flexible structure
- **Reflect**: Daily journaling UX, AI integration
- **Linear**: Fast interactions, keyboard shortcuts
- **Superhuman**: Email-like speed and efficiency

**Design Trends to Embrace:**
- ✅ Minimalist interfaces (fewer borders, more space)
- ✅ Subtle animations (improve perception of speed)
- ✅ System fonts (better performance, native feel)
- ✅ Dark mode support (professional user preference)

**Design Trends to Avoid:**
- ❌ Overly playful/gamified (we're professional development, not Duolingo)
- ❌ Heavy illustrations (adds visual noise)
- ❌ Complex dashboard widgets (focus on clarity)

---

## 2. User Research & Personas

### 2.1 Primary Persona: "Career-Conscious Priya"

**Demographics:**
- Age: 28-35
- Role: Mid-level professional (Software Engineer, Product Manager, Consultant)
- Experience: 5-8 years in field
- Location: Urban, tech-forward city

**Goals:**
- Get promoted to senior role within 18 months
- Build compelling case for salary increase
- Switch companies with strong resume

**Pain Points:**
- Forgets achievements by performance review time
- Struggles to articulate impact in interviews
- Unsure if work aligns with career goals
- Resume feels generic, not differentiated

**Behaviors:**
- Checks LinkedIn 2-3x/week for opportunities
- Uses productivity tools (Notion, Todoist, Slack)
- Reads career development content
- Values data-driven insights

**Quote:** *"I do great work, but when it's time for my review, I blank on what I actually accomplished. I need a system to track this without it feeling like homework."*

**User Journey with WorkLog AI:**
1. Discovers via career development blog post
2. Signs up, attracted by "2-minute daily logging"
3. Uses consistently for 30 days (forming habit)
4. Generates performance review → impressed by output
5. Becomes power user, explores all features
6. Upgrades to paid for advanced analytics

### 2.2 Secondary Persona: "Consultant Raj"

**Demographics:**
- Age: 32-40
- Role: Independent consultant, freelancer
- Experience: 10+ years, multiple clients

**Goals:**
- Build portfolio of successful projects
- Win larger contracts with proof of impact
- Transition expertise into thought leadership

**Pain Points:**
- Manages 3-5 concurrent projects, hard to track all wins
- Needs client testimonials and case studies
- Struggles to remember project details after 6 months

**Behaviors:**
- Highly organized, uses multiple tools (CRM, project management)
- Willing to pay for tools that save time
- Active on professional networks

### 2.3 User Needs Prioritization

| Need | Priya (Primary) | Raj (Secondary) | MVP Priority |
|------|-----------------|-----------------|--------------|
| Fast entry logging | 🔥 Critical | 🔥 Critical | **P0** |
| AI-assisted prompts | ⭐ High | ⭐ High | **P0** |
| Performance review generation | 🔥 Critical | ⭐ High | **P0** |
| Competency tracking | 🔥 Critical | ⚠️ Medium | **P0** |
| Resume bullet generation | 🔥 Critical | ⚠️ Medium | **P0** |
| Project timeline view | ⭐ High | 🔥 Critical | **P1** |
| Client/stakeholder tracking | ⚠️ Medium | 🔥 Critical | **P1** |
| Export to portfolio site | ⚠️ Low | ⭐ High | **P2** |

---

## 3. Information Architecture

### 3.1 Site Map

```
WorkLog AI
│
├── 🔐 Authentication (Public)
│   ├── Landing Page (/)
│   ├── Login (/login)
│   ├── Register (/register)
│   └── Password Reset (/reset-password)
│
└── 📱 Application (Protected)
    │
    ├── 📝 Journal (/journal) [DEFAULT HOME]
    │   ├── Today's Entry (default view)
    │   ├── Date Navigation (prev/next, calendar picker)
    │   ├── Search Entries (/journal/search)
    │   └── Entry Detail (/journal/:id)
    │
    ├── 📊 Insights (/insights)
    │   ├── Dashboard Overview (default)
    │   ├── Competencies View (/insights/competencies)
    │   ├── Projects View (/insights/projects)
    │   ├── Skills View (/insights/skills)
    │   └── Timeline View (/insights/timeline)
    │
    ├── ✨ Generate (/generate)
    │   ├── Performance Review (/generate/review)
    │   ├── Resume Bullets (/generate/resume)
    │   ├── Cover Letter (/generate/cover-letter) [Phase 2]
    │   └── Export Data (/generate/export)
    │
    ├── ⚙️ Settings (/settings)
    │   ├── Profile (/settings/profile)
    │   ├── Preferences (/settings/preferences)
    │   ├── Projects Management (/settings/projects)
    │   ├── Skills Management (/settings/skills)
    │   ├── Competencies (/settings/competencies)
    │   └── Account & Privacy (/settings/account)
    │
    └── ❓ Help (/help)
        ├── Getting Started Guide
        ├── FAQ
        └── Contact Support
```

### 3.2 Navigation Structure

**Primary Navigation (Always Visible):**
```
┌────────────────────────────────────────────────────┐
│ [Logo] WorkLog AI                    [User Menu ▾] │
├────────────────────────────────────────────────────┤
│                                                    │
│  📝 Journal  │  📊 Insights  │  ✨ Generate      │
│   (active)                                         │
└────────────────────────────────────────────────────┘
```

**Secondary Navigation (Contextual):**
- Journal: Date picker, search
- Insights: Time period selector (7d, 30d, 90d, All)
- Settings: Sidebar with sub-sections

### 3.3 Content Hierarchy

**Journal Page (Most Important):**
1. **Primary**: Text editor (center, full focus)
2. **Secondary**: AI prompts (left panel, supportive)
3. **Tertiary**: Quick insights preview (collapsible)
4. **Utility**: Date navigation, save status (header)

**Insights Dashboard:**
1. **Primary**: Key metrics cards (top, scannable)
2. **Secondary**: Competency chart (main visual)
3. **Tertiary**: Project/skill lists (scrollable)

---

## 4. User Flows

### 4.1 First-Time User Onboarding

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. Landing Page                                    │
│     "Never miss a career win"                       │
│     [Get Started Free] [See How It Works]           │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  2. Registration                                    │
│     Email + Password (or Google/GitHub)             │
│     Optional: Industry selection                    │
│     [Create Account]                                │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  3. Welcome Tour (3 slides, skippable)              │
│     Slide 1: "Log work in 2 minutes"                │
│     Slide 2: "AI extracts key data"                 │
│     Slide 3: "Generate career docs instantly"       │
│     [Skip] [Next] [Get Started →]                   │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  4. First Entry (Guided)                            │
│     Empty editor with example placeholder:          │
│     "Today I presented the Q3 roadmap to..."        │
│                                                     │
│     AI Prompt Panel shows:                          │
│     💡 "Try answering these as you write:"          │
│     • What did you accomplish today?                │
│     • What project was this for?                    │
│     • What was the impact?                          │
│                                                     │
│     [First-time helper tooltip on AI panel]         │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  5. Success + Next Steps                            │
│     ✅ "Great first entry!"                         │
│     "You've logged 125 words and 2 skills"          │
│                                                     │
│     [View Insights] [Add Another Day] [Set Reminder]│
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Onboarding Goals:**
- User logs first entry within 5 minutes
- User understands AI assistance value
- User enabled daily reminder
- User feels accomplished, not overwhelmed

### 4.2 Daily Logging Flow (Returning User)

```
User opens app → Journal page (today's entry) → 
Sees AI prompts → Types entry (AI assists) → 
Auto-saves → Sees quick insight preview →
Closes app (confident work is captured)

Time: 2-5 minutes
```

**Detailed Steps:**

1. **Entry Point**
   - Email reminder: "Log today's wins" (links to journal)
   - Or: User opens app directly
   - Landing: Journal page with today's date

2. **AI Assistance Kicks In**
   - User starts typing: "Had a great meeting with..."
   - AI prompts appear (non-blocking):
     - "Who attended?"
     - "What was decided?"
   - User continues or ignores prompts

3. **Real-time Enhancements**
   - User types: "reduced costs by 15%"
   - AI suggestion bubble: "Add metric tag?" → [Yes] [No]
   - Quick-tag buttons suggest: [#CostReduction] [#Efficiency]

4. **Completion & Feedback**
   - Auto-save indicator: "✓ Saved 2 seconds ago"
   - Entry stats appear: "142 words • 2 skills • 1 project"
   - Quick insight: "🎯 You demonstrated Leadership 3x this week!"

5. **Optional Actions**
   - [View Insights] → Navigate to dashboard
   - [Add Tags Manually] → Opens tag modal
   - Or simply close app (entry is saved)

### 4.3 Performance Review Generation Flow

```
User needs review → Navigate to Generate → 
Select date range → Choose format → 
AI generates → User edits → Export/Copy

Time: 5-10 minutes
```

**Detailed Steps:**

1. **Trigger**: User clicks "Generate" in nav → "Performance Review"

2. **Configuration Screen:**
   ```
   ┌──────────────────────────────────────────┐
   │  Generate Performance Review             │
   ├──────────────────────────────────────────┤
   │  Time Period:                            │
   │  [Start Date] to [End Date]              │
   │  Quick Select: [This Quarter] [Last 6mo] │
   │                                          │
   │  Focus Areas (optional):                 │
   │  ☑ Leadership                            │
   │  ☑ Technical Excellence                  │
   │  ☐ Communication                         │
   │                                          │
   │  Format:                                 │
   │  ⚫ Structured (bullet points)           │
   │  ⚪ Narrative (paragraph)                │
   │                                          │
   │  Based on 47 entries                     │
   │                                          │
   │  [Cancel] [Generate Review →]            │
   └──────────────────────────────────────────┘
   ```

3. **Generation Loading:**
   - Progress indicator: "Analyzing your entries..."
   - Takes 5-15 seconds
   - Skeleton screen of output format

4. **Review & Edit:**
   ```
   ┌──────────────────────────────────────────┐
   │  Your Performance Review                 │
   │  (Based on 47 entries, Jan-Mar 2025)     │
   ├──────────────────────────────────────────┤
   │                                          │
   │  [Editable text area with AI output]     │
   │                                          │
   │  Leadership & Management                 │
   │  • Led cross-functional team of 6...     │
   │  • Reduced project timeline by 20%...    │
   │                                          │
   │  Technical Excellence                    │
   │  • Implemented new CI/CD pipeline...     │
   │                                          │
   ├──────────────────────────────────────────┤
   │  [← Back] [Regenerate] [Copy] [Export]   │
   └──────────────────────────────────────────┘
   ```

5. **Export Options:**
   - Copy to clipboard
   - Download as PDF
   - Download as Word doc
   - Email to self

### 4.4 Error Recovery Flows

**Connection Lost During Entry:**
```
User typing → Connection drops → 
Browser cache saves text → 
Connection restored → 
"Synced successfully" notification

No data loss.
```

**Cold Start (Render.com):**
```
User clicks link → Backend waking up → 
Loading screen (30-60s) with message:
"Warming up the server... This is a one-time delay"
→ App loads → Normal experience
```

---

## 5. Wireframes & Layouts

### 5.1 Journal View (Desktop) - Main Workspace

```
┌────────────────────────────────────────────────────────────────────┐
│  Logo  WorkLog AI      📝 Journal  📊 Insights  ✨ Generate    [AJ▾]│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────┐ ┌──────────────────────────────────────┐│
│  │  AI ASSISTANT        │ │  [← Sep 29]  Sep 30, 2025  [Oct 1 →] ││
│  │  ─────────────────   │ │  ─────────────────────────────────── ││
│  │                      │ │                                       ││
│  │  💡 Prompts          │ │   Journal Area                        ││
│  │  ─────────           │ │   ─────────────                       ││
│  │  Based on what you   │ │                                       ││
│  │  wrote:              │ │   [Large text editor area]            ││
│  │                      │ │                                       ││
│  │  • What project was  │ │   Today I presented the business case ││
│  │    this for?         │ │   to the management team...           ││
│  │  • Who attended?     │ │                                       ││
│  │  • What was decided? │ │                                       ││
│  │                [✕]   │ │                                       ││
│  │                      │ │                                       ││
│  │  ─────────────────   │ │                                       ││
│  │                      │ │                                       ││
│  │  📚 Vocabulary       │ │                                       ││
│  │  ─────────           │ │                                       ││
│  │  • Stakeholder       │ │                                       ││
│  │  • ROI               │ │   ───────────────────────────────    ││
│  │  • Sprint            │ │   Quick Tags:                         ││
│  │  [See all...]        │ │   [+ Project] [+ Skill] [+ Person]    ││
│  │                      │ │                                       ││
│  │  ─────────────────   │ │   142 words • 2 min read • ✓ Saved   ││
│  │                      │ │                                       ││
│  │  📊 Quick Insights   │ │                                       ││
│  │  ─────────           │ │                                       ││
│  │  This Week:          │ │                                       ││
│  │  🔥 5-day streak     │ │                                       ││
│  │  ⭐ Leadership (3x)  │ │                                       ││
│  │                      │ │                                       ││
│  │  [View Dashboard →]  │ │                                       ││
│  │                      │ │                                       ││
│  └──────────────────────┘ └──────────────────────────────────────┘│
│                                                                    │
│  Left: 320px            Right: Flexible (min 600px)               │
└────────────────────────────────────────────────────────────────────┘

Dimensions: 
- Total: 1440px (standard laptop)
- Left panel: 320px (AI assistance)
- Right panel: ~1120px (journal + padding)
- Responsive breakpoint: 1024px (collapse to single column)
```

### 5.2 Insights Dashboard (Desktop)

```
┌────────────────────────────────────────────────────────────────────┐
│  Logo  WorkLog AI      📝 Journal  📊 Insights  ✨ Generate    [AJ▾]│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Insights Dashboard                    [Last 30 Days ▾] [Export]   │
│  ───────────────────────────────────────────────────────────────   │
│                                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│  │   ENTRIES    │ │    STREAK    │ │  PROJECTS    │ │  SKILLS  │ │
│  │      47      │ │    🔥 12     │ │      8       │ │    23    │ │
│  │  ↑ 12% more  │ │    days      │ │   2 active   │ │ +5 new   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Competencies Demonstrated                                 │   │
│  │  ────────────────────────────────────────────────────────  │   │
│  │                                                            │   │
│  │  Leadership           ████████████░░ 12 times             │   │
│  │  Communication        ████████░░░░░  8 times              │   │
│  │  Problem Solving      ██████░░░░░░░  6 times              │   │
│  │  Innovation           ████░░░░░░░░░  4 times              │   │
│  │  Customer Focus       ██░░░░░░░░░░░  2 times              │   │
│  │                                                            │   │
│  │  [View Details →]                                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │  Recent Projects            │ │  Top Skills                 │ │
│  │  ────────────────────────   │ │  ───────────────────────    │ │
│  │                             │ │                             │ │
│  │  🟢 Project Alpha           │ │  Python          ████░░ 8x  │ │
│  │     23 entries, active      │ │  Leadership      ████░░ 8x  │ │
│  │                             │ │  SQL             ███░░░ 6x  │ │
│  │  🟢 System Migration        │ │  Public Speaking ██░░░░ 4x  │ │
│  │     12 entries, active      │ │  React           ██░░░░ 4x  │ │
│  │                             │ │                             │ │
│  │  ⚪ Q4 Planning             │ │  [View All Skills →]        │ │
│  │     8 entries, completed    │ │                             │ │
│  │                             │ │                             │ │
│  │  [Manage Projects →]        │ │                             │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 5.3 Mobile Layout (375px width)

```
┌─────────────────────────────────┐
│  ☰  WorkLog AI          [AJ ▾]  │
├─────────────────────────────────┤
│                                 │
│  ← Sep 29   Sep 30, 2025  Oct 1→│
│  ─────────────────────────────  │
│                                 │
│  [Full-width text editor]       │
│                                 │
│  Today I presented the          │
│  business case to management... │
│                                 │
│                                 │
│                                 │
│  ───────────────────────────    │
│                                 │
│  💡 AI Suggestions (tap to view)│
│                                 │
│  ───────────────────────────    │
│                                 │
│  [+ Project] [+ Skill] [+ Tag]  │
│                                 │
│  142 words • ✓ Saved            │
│                                 │
├─────────────────────────────────┤
│  📝 Journal │ 📊 │ ✨ │ ⚙️      │
└─────────────────────────────────┘

Features:
- Hamburger menu (☰) for secondary nav
- AI panel becomes bottom sheet (swipe up)
- Single column layout
- Bottom tab navigation
- Thumb-friendly tap targets (44x44px min)
```

### 5.4 Generate Performance Review Page

```
┌────────────────────────────────────────────────────────────────────┐
│  Logo  WorkLog AI      📝 Journal  📊 Insights  ✨ Generate    [AJ▾]│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Generate Performance Review                                       │
│  ───────────────────────────────────────────────────────────────   │
│                                                                    │
│  Step 1 of 2: Configure                                            │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Time Period                                                 │ │
│  │  ─────────────────                                           │ │
│  │  From: [Jan 1, 2025 ▾]    To: [Mar 31, 2025 ▾]              │ │
│  │                                                              │ │
│  │  Quick Select:                                               │ │
│  │  [This Quarter] [Last 6 Months] [This Year] [Custom]        │ │
│  │                                                              │ │
│  │  ─────────────────────────────────────────────────────────  │ │
│  │                                                              │ │
│  │  Focus on Competencies (optional)                            │ │
│  │  ─────────────────────────────────────                       │ │
│  │  ☑ Leadership & Management                                   │ │
│  │  ☑ Technical Excellence                                      │ │
│  │  ☑ Communication                                             │ │
│  │  ☐ Innovation                                                │ │
│  │  ☐ Customer Focus                                            │ │
│  │                                                              │ │
│  │  ─────────────────────────────────────────────────────────  │ │
│  │                                                              │ │
│  │  Output Format                                               │ │
│  │  ─────────────────────                                       │ │
│  │  ⚫ Structured (bullet points by competency)                 │ │
│  │  ⚪ Narrative (flowing paragraphs)                           │ │
│  │                                                              │ │
│  │  ─────────────────────────────────────────────────────────  │ │
│  │                                                              │ │
│  │  📊 Based on 47 entries across 8 projects                    │ │
│  │                                                              │ │
│  │                            [Cancel] [Generate Review →]      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6. Visual Design System

### 6.1 Color Palette

**Primary Colors:**
```
Brand Blue (Primary Action)
- Primary:   #2563EB (rgb(37, 99, 235))
- Hover:     #1D4ED8
- Active:    #1E40AF
- Light:     #DBEAFE (backgrounds)

Usage: CTAs, links, active states, focus rings
```

**Neutral Gray (Interface)**
```
- Gray 950:  #0A0A0A (text primary)
- Gray 700:  #374151 (text secondary)
- Gray 400:  #9CA3AF (text tertiary, borders)
- Gray 200:  #E5E7EB (dividers)
- Gray 100:  #F3F4F6 (backgrounds)
- Gray 50:   #F9FAFB (subtle backgrounds)
- White:     #FFFFFF
```

**Semantic Colors:**
```
Success Green:  #10B981 (saved, completed)
Warning Amber:  #F59E0B (pending, needs attention)
Error Red:      #EF4444 (errors, destructive actions)
Info Blue:      #3B82F6 (informational messages)

Usage: Notifications, status indicators, alerts
```

**Accent Colors (Data Visualization):**
```
Chart 1: #8B5CF6 (purple - Competencies)
Chart 2: #EC4899 (pink - Skills)
Chart 3: #14B8A6 (teal - Projects)
Chart 4: #F97316 (orange - Metrics)
Chart 5: #6366F1 (indigo - People)
```

**Dark Mode Palette:**
```
Background:    #0F172A (slate-900)
Surface:       #1E293B (slate-800)
Border:        #334155 (slate-700)
Text Primary:  #F1F5F9 (slate-100)
Text Secondary:#CBD5E1 (slate-300)

Primary Blue adapts to: #60A5FA (lighter for contrast)
```

### 6.2 Typography

**Font Stack:**
```css
/* System Font Stack (Performance + Native Feel) */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

**Type Scale:**
```css
/* Display (Headings) */
.text-4xl  { font-size: 36px; line-height: 40px; font-weight: 700; } /* H1 */
.text-3xl  { font-size: 30px; line-height: 36px; font-weight: 600; } /* H2 */
.text-2xl  { font-size: 24px; line-height: 32px; font-weight: 600; } /* H3 */
.text-xl   { font-size: 20px; line-height: 28px; font-weight: 600; } /* H4 */

/* Body Text */
.text-base { font-size: 16px; line-height: 24px; font-weight: 400; } /* Default */
.text-lg   { font-size: 18px; line-height: 28px; font-weight: 400; } /* Large body */
.text-sm   { font-size: 14px; line-height: 20px; font-weight: 400; } /* Small text */
.text-xs   { font-size: 12px; line-height: 16px; font-weight: 400; } /* Captions */

/* Editor Text (Slightly larger for readability) */
.editor-text { font-size: 18px; line-height: 32px; font-weight: 400; }
```

**Font Weights:**
```css
.font-normal   { font-weight: 400; } /* Body text */
.font-medium   { font-weight: 500; } /* Emphasis */
.font-semibold { font-weight: 600; } /* Headings, buttons */
.font-bold     { font-weight: 700; } /* Strong emphasis */
```

**Usage Guidelines:**
- **Headings**: Use semibold (600) or bold (700)
- **Body text**: Regular (400)
- **UI elements**: Medium (500) or semibold (600)
- **Line height**: 1.5-2x font size for readability
- **Letter spacing**: Default (no custom tracking)

### 6.3 Spacing System

**8px Base Grid:**
```css
/* Tailwind-inspired spacing scale */
.space-1  { margin/padding: 4px;   } /* 0.5 × 8 */
.space-2  { margin/padding: 8px;   } /* 1 × 8 */
.space-3  { margin/padding: 12px;  } /* 1.5 × 8 */
.space-4  { margin/padding: 16px;  } /* 2 × 8 */
.space-6  { margin/padding: 24px;  } /* 3 × 8 */
.space-8  { margin/padding: 32px;  } /* 4 × 8 */
.space-12 { margin/padding: 48px;  } /* 6 × 8 */
.space-16 { margin/padding: 64px;  } /* 8 × 8 */
```

**Common Patterns:**
```
Component padding:    16px (space-4)
Card padding:         24px (space-6)
Section spacing:      48px (space-12)
Page margins:         32px (space-8)
Button padding:       12px 24px (space-3 space-6)
Input padding:        12px 16px
Icon-text gap:        8px (space-2)
```

### 6.4 Elevation (Shadows)

**Shadow System:**
```css
/* Subtle elevation for cards */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

/* Default cards, dropdowns */
.shadow-md {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
              0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Modals, elevated panels */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
              0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* AI Prompt floating window */
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
              0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

**Usage:**
- **Cards**: shadow-md
- **Dropdowns/Popovers**: shadow-lg
- **Modals**: shadow-xl
- **Floating AI prompts**: shadow-xl
- **Buttons**: No shadow (flat design)

### 6.5 Border Radius

```css
.rounded-none { border-radius: 0px;   } /* Sharp corners */
.rounded-sm   { border-radius: 4px;   } /* Subtle */
.rounded      { border-radius: 8px;   } /* Default - cards, buttons */
.rounded-lg   { border-radius: 12px;  } /* Large panels */
.rounded-full { border-radius: 9999px;} /* Pills, avatars */
```

**Component Standards:**
- **Buttons**: 8px (rounded)
- **Inputs**: 8px (rounded)
- **Cards**: 12px (rounded-lg)
- **Modals**: 16px (rounded-xl)
- **Tags/Pills**: 9999px (rounded-full)
- **Avatar**: 9999px (rounded-full)

### 6.6 Iconography

**Icon Library**: Lucide React (consistent, modern, open-source)

**Icon Sizes:**
```css
.icon-xs { width: 12px; height: 12px; } /* Inline with text-xs */
.icon-sm { width: 16px; height: 16px; } /* Inline with text-sm */
.icon-md { width: 20px; height: 20px; } /* Default */
.icon-lg { width: 24px; height: 24px; } /* Prominent actions */
.icon-xl { width: 32px; height: 32px; } /* Hero sections */
```

**Key Icons:**
```
Journal:           📝 BookOpen, Edit3
Insights:          📊 BarChart2, TrendingUp
Projects:          📁 Folder, Briefcase
Skills:            🎯 Target, Zap
Competencies:      ⭐ Award, Star
Generate:          ✨ Sparkles, FileText
Settings:          ⚙️ Settings, Sliders
User:              👤 User, UserCircle
Save:              ✓ Check, CheckCircle
AI Prompt:         💡 Lightbulb, MessageSquare
Search:            🔍 Search
Calendar:          📅 Calendar
Export:            📤 Download, Share
Delete:            🗑️ Trash2
Edit:              ✏️ Edit2
Close:             ✕ X
Menu:              ☰ Menu
```

**Icon Guidelines:**
- Use 2px stroke width (matches font weight)
- Align with text baseline
- Add 8px gap between icon and text
- Maintain 1:1 aspect ratio
- Use currentColor for easy theming

---

## 7. Component Library

### 7.1 Buttons

**Primary Button:**
```html
<button class="btn-primary">
  Generate Review
</button>

CSS:
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Button:**
```html
<button class="btn-secondary">
  Cancel
</button>

CSS:
.btn-secondary {
  background: #F3F4F6;
  color: #374151;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid #E5E7EB;
}

.btn-secondary:hover {
  background: #E5E7EB;
}
```

**Ghost Button:**
```html
<button class="btn-ghost">
  <Icon name="settings" />
  Settings
</button>

CSS:
.btn-ghost {
  background: transparent;
  color: #374151;
  padding: 8px 12px;
  border-radius: 6px;
}

.btn-ghost:hover {
  background: #F3F4F6;
}
```

**Button Sizes:**
```css
.btn-sm  { padding: 8px 16px;  font-size: 14px; } /* Small */
.btn-md  { padding: 12px 24px; font-size: 16px; } /* Default */
.btn-lg  { padding: 16px 32px; font-size: 18px; } /* Large */
```

**Button States:**
```css
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

### 7.2 Form Inputs

**Text Input:**
```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input 
    type="email" 
    class="form-input" 
    placeholder="your@email.com"
  />
</div>

CSS:
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  background: white;
  transition: all 150ms ease;
}

.form-input:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input::placeholder {
  color: #9CA3AF;
}
```

**Error State:**
```css
.form-input.error {
  border-color: #EF4444;
}

.form-error-message {
  color: #EF4444;
  font-size: 14px;
  margin-top: 6px;
}
```

**Textarea (Journal Editor):**
```css
.journal-editor {
  width: 100%;
  min-height: 400px;
  padding: 24px;
  font-size: 18px;
  line-height: 32px;
  border: none;
  resize: none;
  outline: none;
}

.journal-editor::placeholder {
  color: #9CA3AF;
  font-style: italic;
}
```

### 7.3 Cards

**Basic Card:**
```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    Content goes here
  </div>
</div>

CSS:
.card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
}

.card-body {
  padding: 24px;
}
```

**Metric Card:**
```html
<div class="metric-card">
  <div class="metric-value">47</div>
  <div class="metric-label">Entries</div>
  <div class="metric-change positive">↑ 12% more</div>
</div>

CSS:
.metric-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.metric-value {
  font-size: 36px;
  font-weight: 700;
  color: #0A0A0A;
  line-height: 1;
}

.metric-label {
  font-size: 14px;
  color: #6B7280;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-change {
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
}

.metric-change.positive { color: #10B981; }
.metric-change.negative { color: #EF4444; }
```

### 7.4 Modals

**Modal Structure:**
```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <button class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      Modal content
    </div>
    <div class="modal-footer">
      <button class="btn-secondary">Cancel</button>
      <button class="btn-primary">Confirm</button>
    </div>
  </div>
</div>

CSS:
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn 200ms ease;
}

.modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideUp 250ms ease;
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

### 7.5 Tags/Pills

**Tag Component:**
```html
<span class="tag tag-primary">
  Leadership
  <button class="tag-remove">✕</button>
</span>

CSS:
.tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 9999px;
  gap: 6px;
}

.tag-primary {
  background: #DBEAFE;
  color: #1E40AF;
}

.tag-secondary {
  background: #F3F4F6;
  color: #374151;
}

.tag-remove {
  background: none;
  border: none;
  padding: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.6;
}

.tag-remove:hover {
  opacity: 1;
}
```

### 7.6 Progress Bars

**Competency Bar:**
```html
<div class="progress-bar-container">
  <div class="progress-bar-label">
    <span>Leadership</span>
    <span class="progress-bar-count">12 times</span>
  </div>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 80%"></div>
  </div>
</div>

CSS:
.progress-bar-container {
  margin-bottom: 16px;
}

.progress-bar-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.progress-bar {
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563EB 0%, #3B82F6 100%);
  border-radius: 4px;
  transition: width 500ms ease;
}
```

### 7.7 Notifications/Toasts

**Toast Component:**
```html
<div class="toast toast-success">
  <div class="toast-icon">✓</div>
  <div class="toast-content">
    <div class="toast-title">Entry saved</div>
    <div class="toast-message">Your work has been captured</div>
  </div>
  <button class="toast-close">✕</button>
</div>

CSS:
.toast {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 400px;
  animation: slideInRight 300ms ease;
}

.toast-success {
  border-left: 4px solid #10B981;
}

.toast-error {
  border-left: 4px solid #EF4444;
}

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.toast-success .toast-icon {
  background: #D1FAE5;
  color: #10B981;
}

.toast-title {
  font-weight: 600;
  color: #0A0A0A;
}

.toast-message {
  font-size: 14px;
  color: #6B7280;
  margin-top: 2px;
}
```

---

## 8. Responsive Design

### 8.1 Breakpoints

```css
/* Mobile First Approach */
/* Default: 320px+ (mobile) */

@media (min-width: 640px)  { /* sm: Small tablets */ }
@media (min-width: 768px)  { /* md: Tablets */ }
@media (min-width: 1024px) { /* lg: Laptops */ }
@media (min-width: 1280px) { /* xl: Desktops */ }
@media (min-width: 1536px) { /* 2xl: Large desktops */ }
```

### 8.2 Layout Adaptations

**Journal View:**

```css
/* Mobile (< 768px) */
.journal-layout {
  display: flex;
  flex-direction: column;
}

.left-panel {
  display: none; /* Hidden on mobile, accessible via bottom sheet */
}

.right-panel {
  width: 100%;
  padding: 16px;
}

/* Tablet+ (768px+) */
@media (min-width: 768px) {
  .journal-layout {
    flex-direction: row;
  }
  
  .left-panel {
    display: block;
    width: 300px;
    min-width: 300px;
  }
  
  .right-panel {
    flex: 1;
    padding: 32px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .left-panel {
    width: 320px;
  }
  
  .right-panel {
    padding: 48px;
    max-width: 900px;
  }
}
```

**Insights Dashboard:**

```css
/* Mobile: Stack all cards */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet: 2 columns */
@media (min-width: 640px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns */
@media (min-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
}
```

### 8.3 Touch Targets

**Mobile Optimization:**
```css
/* Minimum touch target: 44x44px (Apple HIG) */
.btn-mobile {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 20px;
}

/* Increase spacing between interactive elements */
.mobile-nav {
  gap: 16px; /* More space between tap targets */
}

/* Larger form inputs for easier typing */
@media (max-width: 768px) {
  .form-input {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 16px;
  }
}
```

### 8.4 Mobile Navigation

**Bottom Tab Bar (Mobile):**
```html
<nav class="mobile-tab-bar">
  <a href="/journal" class="tab-item active">
    <Icon name="edit" />
    <span>Journal</span>
  </a>
  <a href="/insights" class="tab-item">
    <Icon name="bar-chart" />
    <span>Insights</span>
  </a>
  <a href="/generate" class="tab-item">
    <Icon name="sparkles" />
    <span>Generate</span>
  </a>
  <a href="/settings" class="tab-item">
    <Icon name="settings" />
    <span>Settings</span>
  </a>
</nav>

CSS:
.mobile-tab-bar {
  display: none; /* Hidden on desktop */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #E5E7EB;
  padding: 8px 0;
  z-index: 40;
}

@media (max-width: 768px) {
  .mobile-tab-bar {
    display: flex;
    justify-content: space-around;
  }
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: #6B7280;
  text-decoration: none;
  font-size: 12px;
}

.tab-item.active {
  color: #2563EB;
}

.tab-item svg {
  width: 24px;
  height: 24px;
}
```

---

## 9. Accessibility

### 9.1 WCAG 2.1 Level AA Compliance

**Color Contrast:**
- Text on background: Minimum 4.5:1
- Large text (18px+): Minimum 3:1
- Interactive elements: Minimum 3:1

**Tested Combinations:**
```
✓ #0A0A0A on #FFFFFF = 19.56:1 (Excellent)
✓ #374151 on #FFFFFF = 10.84:1 (Excellent)
✓ #2563EB on #FFFFFF = 4.87:1 (Pass)
✓ #FFFFFF on #2563EB = 4.87:1 (Pass)
✗ #9CA3AF on #FFFFFF = 2.85:1 (Fail - use for disabled only)
```

### 9.2 Keyboard Navigation

**Focus Management:**
```css
/* Visible focus ring */
*:focus {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

/* Skip to content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #2563EB;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

**Keyboard Shortcuts:**
```
Ctrl/Cmd + K     = Quick search
Ctrl/Cmd + N     = New entry
Ctrl/Cmd + S     = Save (manual)
Ctrl/Cmd + /     = Show keyboard shortcuts
Esc              = Close modal/drawer
Tab              = Next focusable element
Shift + Tab      = Previous focusable element
```

### 9.3 Screen Reader Support

**Semantic HTML:**
```html
<!-- Use proper headings hierarchy -->
<h1>WorkLog AI</h1>
<h2>Journal Entry</h2>
<h3>AI Suggestions</h3>

<!-- Use semantic elements -->
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<aside aria-label="AI Assistant">...</aside>

<!-- ARIA labels for icons -->
<button aria-label="Close dialog">
  <Icon name="x" aria-hidden="true" />
</button>

<!-- Loading states -->
<div role="status" aria-live="polite">
  <span class="sr-only">Generating performance review...</span>
</div>

<!-- Form labels -->
<label for="entry-date">Entry Date</label>
<input id="entry-date" type="date" />
```

**Screen Reader Only Text:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 9.4 Alternative Text

**Image/Icon Guidelines:**
- Decorative icons: `aria-hidden="true"`
- Functional icons: `aria-label="descriptive text"`
- Avatar images: `alt="User name"`
- Charts: Include data table alternative

---

## 10. Micro-interactions & Animations

### 10.1 Animation Principles

**Duration:**
```css
/* Quick: UI feedback */
--duration-fast: 150ms;

/* Standard: Most transitions */
--duration-normal: 250ms;

/* Slow: Dramatic reveals */
--duration-slow: 400ms;
```

**Easing:**
```css
/* Natural motion */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);

/* Bounce */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Standard */
--ease: ease-in-out;
```

### 10.2 Button Interactions

```css
.btn {
  transition: all 150ms ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  transition-duration: 50ms;
}
```

### 10.3 Auto-Save Indicator

```css
@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

.save-indicator {
  animation: fadeInOut 2s ease;
}

.save-indicator::before {
  content: "✓";
  color: #10B981;
  margin-right: 6px;
}
```

### 10.4 Loading States

**Skeleton Screen:**
```css
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 0px,
    #E5E7EB 40px,
    #F3F4F6 80px
  );
  background-size: 400px 100%;
  animation: shimmer 1.5s infinite;
}
```

**Spinner:**
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #E5E7EB;
  border-top-color: #2563EB;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

### 10.5 Page Transitions

```css
/* Fade in on mount */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.page-enter {
  animation: fadeIn 300ms ease;
}

/* Slide up (modals) */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-enter {
  animation: slideUp 250ms ease;
}
```

### 10.6 Streak Celebration

```css
/* When user hits 7-day streak */
@keyframes celebrate {
  0%, 100% { transform: scale(1); }
  10%, 30% { transform: scale(1.1) rotate(-5deg); }
  20%, 40% { transform: scale(1.1) rotate(5deg); }
  50% { transform: scale(1.2); }
}

.streak-badge.milestone {
  animation: celebrate 600ms ease;
}
```

---

## 11. Content Strategy

### 11.1 Voice & Tone

**Brand Voice:**
- **Professional**: Serious about career development
- **Empowering**: You're in control of your story
- **Supportive**: We're here to help, not judge
- **Concise**: Respect user's time

**Tone Matrix:**

| Context | Tone | Example |
|---------|------|---------|
| Onboarding | Encouraging, Clear | "Let's capture your first win" |
| Daily logging | Neutral, Helpful | "What did you accomplish today?" |
| Success | Celebratory, Warm | "🎉 7-day streak! You're building a great habit" |
| Error | Apologetic, Solution-