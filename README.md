# AI Job Match Agent

An intelligent job matching platform specifically designed for international talent seeking H1B visa sponsorship. Uses AI-powered resume parsing and semantic matching to connect job seekers with verified H1B-sponsoring companies.

## 🎯 Problem Statement

International students and workers waste countless hours applying to jobs at companies that don't sponsor H1B visas. This platform solves that by:
- Using **AI semantic matching** to surface relevant opportunities
- Providing **customizable notification levels** (quality vs quantity)

## ✨ Features

### Completed
- ✅ **AI Resume Parsing**: Upload PDF resume → Gemini 2.0 Flash extracts skills automatically
- ✅ **Smart Profile Management**: Edit skills, set experience level, vector embeddings for matching
- ✅ **Verified H1B Companies**: Pre-vetted list of 20+ companies (Intel, Micron, Google, Microsoft, etc.)
- ✅ **Custom Company Addition**: Add any company's career page you want to monitor
- ✅ **Notification Preferences**: 
  - **All Jobs** (~40/week): Cast a wide net
  - **Experience Match** (~15/week): Filter by seniority level
  - **Skill Match** (~5/week): High-precision targeting
- ✅ **Dark Theme UI**: Professional design with Times New Roman serif typography

### In Progress
- 🚧 **AI Matching Engine**: Cosine similarity on resume/job embeddings
- 🚧 **Job Display**: Show matched jobs with similarity scores + reasoning
- 🚧 **Web Scrapers**: Automated job collection from company career pages

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + pgvector)
- **AI/ML**: Google Gemini 2.0 Flash (resume parsing), Vector embeddings (768-dim)
- **Database**: PostgreSQL with pgvector extension for semantic search
- **Auth**: Supabase Auth

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Google AI Studio API key (for Gemini)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/devaki264/ai-job-match-agent.git
cd ai-job-match-agent
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local` in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

4. **Set up Supabase database**

Run the SQL schema in Supabase SQL Editor (found in project setup docs).

5. **Seed companies**
```bash
npx tsx scripts/seed-companies.ts
```

6. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

- **profiles**: User resume data, skills (JSONB), vector embeddings
- **companies**: Curated H1B-verified companies
- **custom_companies**: User-added companies
- **subscriptions**: User → Company monitoring relationships
- **jobs**: Job postings (scraped or added)
- **matches**: AI-generated job matches with scores

## 🎨 Design Decisions

- **Dark Theme**: Reduces eye strain for extended job searching sessions
- **Times New Roman**: Classic, professional serif font for readability
- **Quality vs Quantity**: Three-tier notification system gives users control
- **H1B-First**: Every company is pre-verified for visa sponsorship

## 📈 Roadmap

- [ ] Implement cosine similarity matching algorithm
- [ ] Build job display page with "Why this matched" explanations
- [ ] Add web scrapers (Greenhouse, Workday, Lever parsers)
- [ ] Email notifications via Resend
- [ ] User feedback loop (thumbs up/down on matches)
- [ ] Analytics dashboard (precision, recall, engagement metrics)
- [ ] Deploy to production (Vercel + Cloud Run)

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome! Open an issue or reach out.

## 📝 License

MIT License - feel free to use this for learning purposes.

## 👤 Author

**Devakinandan Palla**
- GitHub: [@devaki264](https://github.com/devaki264)
- Email: devakinandanpp@gmail.com


---

Built with ❤️ for international job seekers navigating the H1B process.
