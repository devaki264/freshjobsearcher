# AI Job Match Agent

An intelligent job matching platform designed for one simple outcome: **help candidates apply earlier** by tracking company career pages and sending alerts the moment jobs go live.

🔗 Live website: https://ai-job-match-agent-686566480080.us-central1.run.app

---

## 📸 Quick Walkthrough (Screenshots)

### 1) Sign in and get started
![Landing page + sign in](assets/01-landing.png)

### 2) Upload your resume — AI extracts skills automatically
![Resume upload + skill extraction](assets/02-resume-upload.png)

### 3) Monitor companies + control your alert intensity
![Company monitoring + alert levels](assets/03-monitor-companies-alert-level.png)

---

## 🎯 Problem Statement

New grads often lose opportunities **not because they aren’t qualified**, but because they aren’t early.

Many roles hit **100+ applicants** fast due to aggregators and big job boards surfacing them immediately. By the time you see the listing, you’re already late.

**AI Job Match Agent** aims to restore the timing advantage:
- Track companies you care about (including custom career pages)
- Get notified as soon as new roles appear
- Choose **quantity vs quality** so alerts don’t become noise

---

## 🏢 Companies Monitoring System (Core Feature)

The monitoring system is built around **control**:

- **Monitor a curated list of companies** (H1B-first / sponsorship-friendly list)
- **Add custom companies** by pasting a careers page URL
- Choose your alert level based on how many emails you want to manage:

**Notification levels (quality vs quantity):**
- **All Jobs (~40/week):** Cast a wide net
- **Experience Match (~15/week):** Filter by seniority level
- **Skill Match (~5/week):** High-precision targeting

---

## ✨ Features

### Completed
- ✅ **AI Resume Parsing**: Upload PDF resume → Gemini 2.0 Flash extracts skills automatically
- ✅ **Smart Profile Management**: Edit skills, set experience level, vector embeddings for matching
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

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + pgvector)
- **AI/ML**: Google Gemini 2.0 Flash (resume parsing), Vector embeddings (768-dim)
- **Database**: PostgreSQL with pgvector extension for semantic searching
- **Auth**: Supabase Auth

---

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

2. **Install dependencies**
npm install
