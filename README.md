AI Job Match Agent

An intelligent job matching platform designed to help candidates apply earlier by tracking company career pages and notifying users the moment jobs go live. Uses AI-powered resume parsing and (in progress) semantic matching to connect job seekers with relevant opportunities.

🔗 Live website: https://ai-job-match-agent-686566480080.us-central1.run.app

📸 Product Walkthrough (Screenshots)
1) Sign in and get started

2) Upload your resume — AI extracts your skills automatically

3) Monitor companies + control your alert intensity (quality vs quantity)

🧩 The Story (Why I Built This)

New grads often lose opportunities not because they aren’t qualified, but because they aren’t early.

Many roles hit 100+ applicants quickly due to aggregators and big job boards surfacing them instantly. By the time you find the posting, the competition is already stacked.

So I built AI Job Match Agent to restore the timing advantage:

You choose the companies you care about

The platform monitors their career pages

You get alerted as soon as a new role appears

You can choose more alerts (quantity) or fewer, higher-quality alerts (precision)

🎯 Problem Statement

New college graduates struggle to become early applicants at companies they want to work for due to intense competition and job posts getting flooded quickly. This platform aims to inform applicants immediately when a new job listing appears. It solves that by:

Using AI semantic matching to surface relevant opportunities (in progress)

Providing customizable notification levels (quality vs quantity)

🏢 Companies Monitoring System (Core Feature)

The monitoring system is built around control:

Monitor a curated list of companies (H1B-first / sponsorship-friendly list)

Add custom companies by pasting a careers page URL

Choose your alert level based on how many emails you want to manage:

Notification levels (quality vs quantity):

All Jobs (~40/week): Cast a wide net

Experience Match (~15/week): Filter by seniority level

Skill Match (~5/week): High-precision targeting

This design ensures alerts don’t become noise — users can tune the agent to match their search intensity.

✨ Features
Completed

✅ AI Resume Parsing: Upload PDF resume → Gemini 2.0 Flash extracts skills automatically

✅ Smart Profile Management: Edit skills, set experience level, vector embeddings for matching

✅ Custom Company Addition: Add any company's career page you want to monitor

✅ Notification Preferences:

All Jobs (~40/week): Cast a wide net

Experience Match (~15/week): Filter by seniority level

Skill Match (~5/week): High-precision targeting

✅ Dark Theme UI: Professional design with Times New Roman serif typography

In Progress

🚧 AI Matching Engine: Cosine similarity on resume/job embeddings

🚧 Job Display: Show matched jobs with similarity scores + reasoning

🚧 Web Scrapers: Automated job collection from company career pages

🛠️ Tech Stack

Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS

Backend: Next.js API Routes, Supabase (PostgreSQL + pgvector)

AI/ML: Google Gemini 2.0 Flash (resume parsing), Vector embeddings (768-dim)

Database: PostgreSQL with pgvector extension for semantic searching

Auth: Supabase Auth

🚀 Getting Started
Prerequisites

Node.js 18+

Supabase account

Google AI Studio API key (for Gemini)

Installation

Clone the repository

git clone https://github.com/devaki264/ai-job-match-agent.git
cd ai-job-match-agent

Install dependencies

npm install

Set up environment variables

Create .env.local in the root directory:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key

Set up Supabase database

Run the SQL schema in Supabase SQL Editor (found in project setup docs).

Seed companies

npx tsx scripts/seed-companies.ts

Run development server

npm run dev

Open http://localhost:3000

📊 Database Schema

profiles: User resume data, skills (JSONB), vector embeddings

companies: Curated H1B-verified companies

custom_companies: User-added companies

subscriptions: User → Company monitoring relationships

jobs: Job postings (scraped or added)

matches: AI-generated job matches with scores

🎨 Design Decisions

Dark Theme: Reduces eye strain for extended job searching sessions

Times New Roman: Classic, professional serif font for readability

Quality vs Quantity: Three-tier notification system gives users control

H1B-First: Every company is pre-verified for visa sponsorship

📈 Roadmap

 Implement cosine similarity matching algorithm

 Build job display page with "Why this matched" explanations

 Add web scrapers (Greenhouse, Workday, Lever parsers)

 Email notifications via Resend

 User feedback loop (thumbs up/down on matches)

 Analytics dashboard (precision, recall, engagement metrics)

 Deploy to production (Vercel + Cloud Run)

🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome! Open an issue or reach out.

📝 License

MIT License - feel free to use this for learning purposes.

👤 Author

Devakinandan Palla

GitHub: @devaki264

Email: devakinandanpp@gmail.com

Built with ❤️ for job seekers in the United States.
