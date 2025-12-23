# 🎯 Job Alert System for jobseekers looking to be an early applicant for companies they want to work for

**Automated job monitoring system that alerts you within 1 hour of new postings at top companies in the Bay Area.**

> **The ATS Hack:** Companies review applications in the order received. Being in the first 10 applicants vs the first 100 can increase your odds by 10x. This system gets you there.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

---

## 🌟 Features

- ✅ **Monitors 150 top Bay Area tech companies** (Google, Meta, Salesforce, Adobe, etc.)
- ✅ **Hourly scraping** during business hours (6 AM - 10 PM PT)
- ✅ **AI-powered experience parsing** - filters for entry-level (≤2 years) automatically
- ✅ **Email alerts** within 1 hour of new job postings
- ✅ **Intelligent filtering** - only alerts on NEW jobs you haven't seen
- ✅ **Weekend detection** - skips Sat/Sun (saves 30% on costs)
- ✅ **IP-safe scraping** - delays, user agent rotation, retry logic
- ✅ **Database tracking** - full job history and analytics



---

## 📊 The Problem This Solves

### Traditional Job Search
- Check job boards manually 1-2x per week
- See job posted 3-7 days ago
- Apply with 200-500+ other candidates
- Response rate: 1-3%

### With This System
- Get alerts within 1 hour of posting
- Apply when there are 5-20 applicants
- Be in the first batch reviewed
- Response rate: 10-20%+ (10x improvement)

**Example Timeline:**
```
Monday 9:00 AM  - Company posts job
Monday 10:00 AM - You get email alert
Monday 11:00 AM - You apply (applicant #7)
Monday 2:00 PM  - Recruiter reviews first 20 applications
Monday 4:00 PM  - You get interview request

vs.

Thursday 8:00 PM - You see job on LinkedIn
Friday 10:00 AM - You apply (applicant #347)
[Silence...]
```

---

## 💰 Cost Breakdown

### Infrastructure (all free tiers available)
- **Neon PostgreSQL** - Free forever (10GB storage)
- **Resend Email** - Free (3,000 emails/month)
- **Gemini AI** - Free (1,500 requests/day)

### Compute (Modal)
**Recommended:** Hourly checks during business hours (16 runs/day)

| Configuration | Runs/Day | Cost/Month | Use Case |
|--------------|----------|------------|----------|
| Every 6 hours | 4 | $10 | Budget-conscious |
| **Every 1 hour (business)** | **16** | **$37** | **Recommended** |
| Every 1 hour (24/7) | 24 | $55 | Maximum coverage |

**Total cost for 4-month job search:** ~$148 (with hourly business hours monitoring)

---

## 🚀 Quick Start (30 minutes)

### Prerequisites
- Python 3.11+
- PostgreSQL client (`brew install postgresql` or `apt install postgresql-client`)
- Modal account (free, $280 credit to start)
- Neon account (free PostgreSQL)
- Resend account (free email API)
- Gemini API key (free from Google)

### Step 1: Clone and Install

```bash
git clone https://github.com/yourusername/job-alerts.git
cd job-alerts
pip install -r requirements.txt
```

### Step 2: Set Up Database

```bash
# Create Neon account at https://neon.tech
# Get your connection string, then:

psql "YOUR_NEON_CONNECTION_STRING" < schema.sql
python load_top_150.py "YOUR_NEON_CONNECTION_STRING"
```

You should see:
```
✅ Database setup complete!
Active companies: 150
Total H1B approvals: 18,120
```

### Step 3: Configure API Keys

Get your API keys:
- **Gemini:** https://aistudio.google.com/apikey
- **Resend:** https://resend.com (sign up, create API key)
- **Modal:** https://modal.com (sign up)

### Step 4: Deploy to Modal

```bash
# Install and authenticate Modal
pip install modal
modal token new

# Create secrets
modal secret create database-url \
  DATABASE_URL="postgresql://user:pass@host/db"

modal secret create gemini-api-key \
  GEMINI_API_KEY="your-gemini-api-key"

modal secret create resend-api-key \
  RESEND_API_KEY="your-resend-api-key" \
  ALERT_EMAIL="your-email@gmail.com"

# Deploy!
modal deploy modal_app_optimized.py
```

### Step 5: Test It

```bash
# Manual test run (ignores weekend check)
modal run modal_app_optimized.py::run_manual

# View logs
modal app logs job-alerts-optimized --follow
```

**You should receive an email within 10-15 minutes with any matching jobs!**

---

## 📁 Project Structure

```
job-alerts/
├── README.md                           # This file
├── OPTIMIZED_SETUP.md                  # Detailed setup guide
├── requirements.txt                    # Python dependencies
│
├── schema.sql                          # Database schema
├── filter_top_150.py                   # Generate company list
├── load_top_150.py                     # Load companies to DB
├── top_150_companies.csv               # Pre-filtered company list
│
├── job_scraper_optimized.py            # Scraper with safety features
├── experience_parser.py                # AI-powered experience extraction
├── modal_app_optimized.py              # Main Modal application
│
└── test_system.py                      # Local testing script
```

---

## ⚙️ Configuration

### Change Check Frequency

Edit `modal_app_optimized.py`, line 42:

```python
# Every 1 hour (business hours) - Recommended
schedule=modal.Cron("0 6-22 * * *", timezone="America/Los_Angeles")

# Every 2 hours
schedule=modal.Cron("0 */2 * * *", timezone="America/Los_Angeles")

# Every 6 hours
schedule=modal.Cron("0 6,12,18,0 * * *", timezone="America/Los_Angeles")
```

Redeploy: `modal deploy modal_app_optimized.py`

### Change Experience Filter

Edit `modal_app_optimized.py`, line ~95:

```python
is_match = parser.is_match(years_req, max_years=2.0)  # Change to 1.0, 3.0, etc.
```

### Add/Remove Companies

Edit `top_150_companies.csv`, then:
```bash
python load_top_150.py "YOUR_DB_URL"
```

---

## 📊 Monitoring & Analytics

### View Recent Matches

```sql
-- See jobs matched in last 7 days
SELECT c.name, j.title, j.years_required, j.url, j.first_seen
FROM jobs j
JOIN companies c ON j.company_id = c.id
WHERE j.is_match = TRUE 
  AND j.first_seen > NOW() - INTERVAL '7 days'
ORDER BY j.first_seen DESC;
```

### View Modal Logs

```bash
# Stream live logs
modal app logs job-alerts-optimized --follow

# Check usage/costs
# Go to https://modal.com dashboard → Usage
```

---

## 📈 Expected Results

### Week 1
- **Jobs discovered:** 100-300
- **Matches (≤2 years):** 20-50
- **Email alerts:** 5-10
- **Applications:** 5-15
- **Cost:** ~$9

### Month 1
- **Jobs discovered:** 500-1,500
- **Matches:** 100-250
- **Applications:** 30-50
- **Interviews:** 3-8 (if applying within 1-6 hours)
- **Cost:** ~$37

### After 4 Months
- **Total cost:** ~$148
- **Interviews:** 10-25
- **Offers:** 1-3
- **ROI:** Infinite (you got a job!)

---

## 🔧 Troubleshooting

### No jobs found for a company
- Career page structure may have changed
- Check `scrape_logs` table for errors
- Manually verify the career URL is correct

### No email alerts
- Check spam folder
- Verify Resend API key is correct
- Check Modal logs: `modal app logs job-alerts-optimized`

### High costs (>$50/month)
- Check for failed scrapes retrying repeatedly
- Reduce check frequency or number of companies

---

## 💡 Why I Built This

As an international student requiring H1B sponsorship, I noticed that by the time jobs appeared on LinkedIn or Indeed, they already had 200+ applicants. The real hack wasn't a better resume—it was **being first**.

This system monitors career pages directly and alerts within 1 hour, putting you in the first batch of applicants when your odds are 10x better.

---

## 📄 License

MIT License - Free to use, modify, distribute.

---

## ⭐ Star This Repo!

If this helped you land a job or interview, please star the repo!

**Good luck with your job search!** 🚀
