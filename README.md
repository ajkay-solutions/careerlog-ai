# 📊 CareerLog AI

> **Never miss a career win** - An AI-powered professional journaling application that systematically tracks daily work accomplishments and transforms them into career insights.

[![License: Private](https://img.shields.io/badge/License-Private-red.svg)](https://github.com/ajkay-solutions/careerlog-ai)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2+-blue.svg)](https://reactjs.org/)

## 🎯 Overview

CareerLog AI is a full-stack SaaS application designed for professionals who want to:
- **Track daily accomplishments** with effortless journaling
- **Extract career insights** using AI-powered analysis
- **Generate performance artifacts** (reviews, resume bullets, etc.)
- **Build a comprehensive career narrative** over time

## ✨ Features

### 📝 **Smart Journaling**
- Daily work log entries with auto-save
- Intuitive date navigation and entry management
- Rich text editor with highlighting capabilities
- Mobile-responsive design

### 🤖 **AI-Powered Analysis** 
- Automatic extraction of projects, skills, and competencies
- Sentiment analysis and career pattern recognition
- Real-time insights generation using Anthropic Claude
- Intelligent categorization and tagging

### 📊 **Career Insights Dashboard**
- Visual analytics of professional growth
- Skill development tracking over time
- Project contribution summaries
- Performance metrics and trends

### 🎯 **Content Generation**
- AI-generated performance review content
- Professional resume bullet points
- Career story narratives
- Export capabilities (PDF, Word, JSON)

## 🏗️ Tech Stack

### **Frontend**
- **React 18.2+** - Modern UI framework
- **Vite 5+** - Lightning-fast build tool
- **Tailwind CSS 3.4+** - Utility-first styling
- **React Router v6** - Client-side routing
- **Lucide React** - Beautiful icons

### **Backend** 
- **Node.js 18+** - Server runtime
- **Express.js 4.x** - Web framework
- **Prisma 5.x** - Type-safe ORM
- **Passport.js** - OAuth authentication
- **JWT** - Secure session management

### **Database & Services**
- **PostgreSQL 16** - Primary database (Supabase)
- **Redis 7.x** - Caching layer (Upstash) 
- **Anthropic Claude** - AI processing
- **OAuth 2.0** - Google & LinkedIn authentication
- **Mailgun** - Email delivery

### **Deployment**
- **Render.com** - Backend hosting
- **Vite Build** - Frontend static hosting
- **GitHub Actions** - CI/CD pipeline

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Supabase account)
- Redis instance (Upstash account)
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ajkay-solutions/careerlog-ai.git
   cd careerlog-ai
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend  
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit .env with your database URLs, API keys, etc.
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Set VITE_API_URL=http://localhost:3005
   ```

4. **Database setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development servers**
   ```bash
   # Option 1: Use startup script
   ./start-careerlog.sh
   
   # Option 2: Manual startup
   # Terminal 1 - Backend (port 3005)
   cd backend && npm run dev
   
   # Terminal 2 - Frontend (port 5174)  
   cd frontend && npm run dev
   ```

6. **Open application**
   - Visit `http://localhost:5174`
   - Login with Google or LinkedIn OAuth

## 📂 Project Structure

```
careerlog-ai/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API & auth services
│   │   └── styles/         # Tailwind CSS
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth & validation
│   │   └── config/         # App configuration
│   └── prisma/             # Database schema & migrations
├── docs/                   # Technical documentation
└── README.md
```

## 🔧 Development

### **Available Scripts**

**Backend:**
```bash
npm run dev          # Development server with nodemon
npm start           # Production server
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Prisma Studio GUI
```

**Frontend:**
```bash
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

## 🚀 Deployment

### **Production Environment**
- **Backend**: Deployed on Render.com
- **Frontend**: Static hosting (Render/Vercel/Netlify)
- **Database**: Supabase PostgreSQL
- **Domain**: `careerlog.ai` (planned)

### **Environment Variables**
See `.env.example` files for required configuration.

## 📄 API Documentation

### **Authentication Endpoints**
- `GET /auth/google` - Google OAuth login
- `GET /auth/linkedin` - LinkedIn OAuth login  
- `GET /auth/status` - Check auth status
- `POST /auth/logout` - User logout

### **Journal Endpoints**
- `GET /api/entries` - List user entries
- `GET /api/entries/:date` - Get entry by date
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:date` - Update entry
- `DELETE /api/entries/:date` - Delete entry

### **AI Processing**
- `POST /api/ai/analyze/:entryId` - Analyze entry
- `GET /api/ai/insights` - Get career insights
- `GET /api/ai/summary` - Generate summaries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Roadmap

- [x] **Week 1-3**: Foundation (Auth, Database, Core Features)
- [ ] **Week 4**: Insights Dashboard & Analytics
- [ ] **Week 5**: Content Generation & Export
- [ ] **Week 6**: Polish & Production Launch
- [ ] **Future**: Mobile app, advanced AI features, team collaboration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic Claude](https://www.anthropic.com/) for AI processing
- [Supabase](https://supabase.com/) for database hosting
- [Render](https://render.com/) for deployment platform
- [Tailwind CSS](https://tailwindcss.com/) for styling framework

## 📧 Contact

**AJKAY SOLUTIONS**
- Website: [ajkaysolutions.com](https://ajkaysolutions.com)
- Email: [contact@ajkaysolutions.com](mailto:contact@ajkaysolutions.com)

---

⭐ **Star this repo if you find it helpful!**