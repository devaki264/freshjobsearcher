// src/index.ts
// AI-Powered Job Discovery Agent with Resource-Efficient Design

export interface Env {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  GEMINI_API_KEY: string;
}

interface User {
  id: string;
  email: string;
  skills: string[];
  experience_level: string;
  companies: {
    id: string;
    name: string;
    career_url: string;
  }[];
}

interface JobAnalysis {
  job_id: string;
  company_name: string;
  title: string;
  url: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  match_score: number;
  reasoning: string;
  analyzed_at: string;
}

// Resource limits
const MAX_COMPANIES_PER_RUN = 3; // Rotate companies instead of all at once
const MAX_JOBS_PER_COMPANY = 5; // Limit jobs to analyze
const MAX_GEMINI_CALLS_PER_COMPANY = 3; // AI budget per company

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('🚀 Starting hourly AI job monitoring...');
    await processJobAlerts(env);
    console.log('✅ Hourly monitoring completed');
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('🧪 Manual trigger - starting AI job monitoring...');
    const results = await processJobAlerts(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'AI-powered job monitoring completed',
      ...results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function processJobAlerts(env: Env) {
  const users = await getActiveUsers(env);
  console.log(`📊 Found ${users.length} active monitoring users`);

  let totalJobsScraped = 0;
  let totalJobsAnalyzed = 0;
  let totalEmailsSent = 0;
  let geminiCallsUsed = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      console.log(`👤 Processing user: ${user.email}`);
      
      // Rotate companies: select subset instead of all
      const selectedCompanies = rotateCompanies(user.companies, MAX_COMPANIES_PER_RUN);
      console.log(`🔄 Selected ${selectedCompanies.length} companies for this run`);
      
      const jobs = await scrapeJobsForUser({ ...user, companies: selectedCompanies }, env);
      totalJobsScraped += jobs.length;
      
      if (jobs.length > 0) {
        // AI analysis with budget limit
        const { matches, callsUsed } = await analyzeJobsWithAI(jobs, user, env, MAX_GEMINI_CALLS_PER_COMPANY * selectedCompanies.length);
        totalJobsAnalyzed += matches.length;
        geminiCallsUsed += callsUsed;
        
        if (matches.length > 0) {
          await sendJobAlertEmail(user, matches, env);
          totalEmailsSent++;
          console.log(`✅ Sent ${matches.length} AI-analyzed job matches to ${user.email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing user ${user.email}:`, error);
      errors.push(`${user.email}: ${error}`);
    }
  }

  return {
    usersProcessed: users.length,
    totalJobsScraped,
    totalJobsAnalyzed,
    geminiCallsUsed,
    totalEmailsSent,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Rotate companies to spread load across days
function rotateCompanies(companies: any[], maxCount: number): any[] {
  if (companies.length <= maxCount) return companies;
  
  // Use hour of day to rotate which companies get scraped
  const hour = new Date().getHours();
  const startIndex = hour % companies.length;
  
  const rotated = [];
  for (let i = 0; i < maxCount; i++) {
    rotated.push(companies[(startIndex + i) % companies.length]);
  }
  
  return rotated;
}

async function getActiveUsers(env: Env): Promise<User[]> {
  const profilesResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?monitoring_active=eq.true&select=user_id,skills,experience_level`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
      }
    }
  );

  if (!profilesResponse.ok) {
    throw new Error(`Failed to fetch profiles: ${profilesResponse.statusText}`);
  }

  const profiles = await profilesResponse.json();
  const users: User[] = [];
  
  for (const profile of profiles) {
    const subsResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${profile.user_id}&active=eq.true&select=company_id,companies(id,name,career_url)`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (!subsResponse.ok) continue;
    
    const subscriptions = await subsResponse.json();
    
    if (subscriptions.length > 0) {
      const authResponse = await fetch(
        `${env.SUPABASE_URL}/auth/v1/admin/users/${profile.user_id}`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
          }
        }
      );
      
      let email = 'unknown@example.com';
      if (authResponse.ok) {
        const authData = await authResponse.json();
        email = authData.email || email;
      }
      
      users.push({
        id: profile.user_id,
        email,
        skills: profile.skills || [],
        experience_level: profile.experience_level || 'mid',
        companies: subscriptions.map((sub: any) => sub.companies)
      });
    }
  }
  
  return users;
}

async function scrapeJobsForUser(user: User, env: Env): Promise<any[]> {
  const allJobs: any[] = [];
  
  for (const company of user.companies) {
    try {
      const jobs = await scrapeCompanyJobs(company, user.id, env);
      allJobs.push(...jobs);
    } catch (error) {
      console.error(`Error scraping ${company.name}:`, error);
    }
  }
  
  return allJobs;
}

async function scrapeCompanyJobs(company: any, userId: string, env: Env): Promise<any[]> {
  console.log(`🔍 Scraping ${company.name}...`);
  
  try {
    const response = await fetch(company.career_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const jobIds = extractJobIds(html, company.name);
    
    console.log(`📋 Found ${jobIds.length} potential jobs at ${company.name}`);
    
    const newJobs: any[] = [];
    
    // Limit to MAX_JOBS_PER_COMPANY
    for (const jobId of jobIds.slice(0, MAX_JOBS_PER_COMPANY)) {
      const redisKey = `job:${company.id}:${jobId}:user:${userId}`;
      
      const exists = await checkRedis(redisKey, env);
      
      if (!exists) {
        // Mark as seen (7 days)
        await setRedis(redisKey, '1', env, 604800);
        
        newJobs.push({
          id: jobId,
          company_id: company.id,
          company_name: company.name,
          url: constructJobUrl(company.career_url, jobId, company.name),
          scraped_at: new Date().toISOString()
        });
      }
    }
    
    console.log(`✨ ${newJobs.length} new jobs found at ${company.name}`);
    return newJobs;
  } catch (error) {
    console.error(`Scrape error for ${company.name}:`, error);
    return [];
  }
}

// AI-POWERED JOB ANALYSIS (THE MAGIC! ✨)
async function analyzeJobsWithAI(jobs: any[], user: User, env: Env, maxCalls: number): Promise<{ matches: JobAnalysis[], callsUsed: number }> {
  const matches: JobAnalysis[] = [];
  let callsUsed = 0;
  
  for (const job of jobs) {
    if (callsUsed >= maxCalls) {
      console.log(`⚠️ Reached Gemini API budget (${maxCalls} calls), skipping remaining jobs`);
      break;
    }
    
    try {
      // Check cache first
      const cacheKey = `analysis:${job.company_id}:${job.id}`;
      const cached = await getRedisJSON(cacheKey, env);
      
      if (cached) {
        console.log(`💾 Using cached analysis for job ${job.id}`);
        matches.push(cached);
        continue;
      }
      
      // Fetch job page
      const jobHtml = await fetchJobPage(job.url);
      
      if (!jobHtml) {
        console.log(`⚠️ Could not fetch job page: ${job.url}`);
        continue;
      }
      
      // Call Gemini AI
      console.log(`🤖 Analyzing job ${job.id} with Gemini AI...`);
      const analysis = await analyzeJobWithGemini(jobHtml, job, user, env);
      callsUsed++;
      
      // Cache result (7 days)
      await setRedisJSON(cacheKey, analysis, env, 604800);
      
      // Only include if match score >= 0.6
      if (analysis.match_score >= 0.6) {
        matches.push(analysis);
      }
      
    } catch (error) {
      console.error(`Error analyzing job ${job.id}:`, error);
    }
  }
  
  return { 
    matches: matches.sort((a, b) => b.match_score - a.match_score),
    callsUsed 
  };
}

async function fetchJobPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Extract text content (remove scripts, styles)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit to ~8k chars to save tokens
    
    return textContent;
  } catch (error) {
    console.error('Error fetching job page:', error);
    return null;
  }
}

async function analyzeJobWithGemini(jobText: string, job: any, user: User, env: Env): Promise<JobAnalysis> {
  const prompt = `You are an expert technical recruiter analyzing job descriptions for candidates.

CANDIDATE PROFILE:
- Skills: ${user.skills.join(', ')}
- Experience Level: ${user.experience_level}

JOB DESCRIPTION:
${jobText}

Analyze this job and return ONLY a JSON object (no markdown, no explanation):
{
  "title": "extracted job title",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "experience_level": "entry|mid|senior",
  "match_score": 0.0-1.0,
  "reasoning": "2-3 sentence explanation of match quality"
}

Consider:
1. Skills overlap (weight: 50%)
2. Experience level match (weight: 30%)
3. Role relevance (weight: 20%)`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Gemini response');
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    job_id: job.id,
    company_name: job.company_name,
    title: analysis.title || 'Unknown Position',
    url: job.url,
    required_skills: analysis.required_skills || [],
    preferred_skills: analysis.preferred_skills || [],
    experience_level: analysis.experience_level || 'mid',
    match_score: analysis.match_score || 0.5,
    reasoning: analysis.reasoning || 'Match analysis completed',
    analyzed_at: new Date().toISOString()
  };
}

function extractJobIds(html: string, companyName: string): string[] {
  const jobIds: string[] = [];
  
  try {
    let regex: RegExp;
    
    if (companyName.includes('Google')) {
      regex = /\/jobs\/results\/(\d+)/g;
    } else if (companyName.includes('Microsoft')) {
      regex = /jobId["\s:=]+([0-9]+)/gi;
    } else if (companyName.includes('Amazon')) {
      regex = /\/jobs\/(\d+)/g;
    } else if (companyName.includes('Meta')) {
      regex = /careers\.com\/jobs\/(\d+)/g;
    } else if (companyName.includes('Apple')) {
      regex = /post-id["\s:=]+([A-Z0-9-]+)/gi;
    } else if (companyName.includes('Micron')) {
      regex = /data-job-id["\s:=]+(\d+)/gi;
    } else if (companyName.includes('Texas Instruments')) {
      regex = /jobId["\s:=]+([0-9]+)/gi;
    } else if (companyName.includes('Adobe')) {
      regex = /job\/([A-Z0-9]+)/gi;
    } else if (companyName.includes('Intel')) {
      regex = /jobId["\s:=]+([0-9]+)/gi;
    } else {
      regex = /job[/-](\d+)/gi;
    }
    
    let match;
    while ((match = regex.exec(html)) !== null) {
      jobIds.push(match[1]);
    }
  } catch (error) {
    console.error('Error extracting job IDs:', error);
  }
  
  return [...new Set(jobIds)];
}

function constructJobUrl(baseUrl: string, jobId: string, companyName: string): string {
  if (companyName.includes('Google')) {
    return `https://www.google.com/about/careers/applications/jobs/results/${jobId}`;
  } else if (companyName.includes('Microsoft')) {
    return `https://careers.microsoft.com/us/en/job/${jobId}`;
  } else if (companyName.includes('Amazon')) {
    return `https://www.amazon.jobs/en/jobs/${jobId}`;
  } else if (companyName.includes('Meta')) {
    return `https://www.metacareers.com/jobs/${jobId}`;
  } else if (companyName.includes('Apple')) {
    return `https://jobs.apple.com/en-us/details/${jobId}`;
  } else if (companyName.includes('Micron')) {
    return `https://careers.micron.com/careers/job/${jobId}`;
  } else if (companyName.includes('Texas Instruments')) {
    return `https://careers.ti.com/job/${jobId}`;
  } else if (companyName.includes('Adobe')) {
    return `https://careers.adobe.com/us/en/job/${jobId}`;
  } else if (companyName.includes('Intel')) {
    return `https://jobs.intel.com/job/${jobId}`;
  }
  return `${baseUrl}/${jobId}`;
}

async function sendJobAlertEmail(user: User, matches: JobAnalysis[], env: Env): Promise<void> {
  const jobsList = matches.map(job => `
    <li style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-left: 4px solid #059669;">
      <strong style="font-size: 16px;">${job.title}</strong><br>
      <span style="color: #6b7280;">${job.company_name}</span><br>
      <span style="color: #059669; font-weight: bold;">🎯 AI Match Score: ${Math.round(job.match_score * 100)}%</span><br>
      <p style="margin: 10px 0; color: #374151;">${job.reasoning}</p>
      <div style="margin-top: 10px;">
        <strong>Required:</strong> ${job.required_skills.slice(0, 5).join(', ')}
      </div>
      <a href="${job.url}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">View Job →</a>
    </li>
  `).join('');
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'AI Job Match <onboarding@resend.dev>',
      to: user.email,
      subject: `🤖 ${matches.length} AI-Matched Jobs Found!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827;">🤖 AI-Powered Job Matches</h2>
          <p>Our AI analyzed ${matches.length} jobs specifically for your profile:</p>
          <ul style="list-style: none; padding: 0;">
            ${jobsList}
          </ul>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Powered by Google Gemini AI • 
            <a href="https://ai-job-match-agent-686566480080.us-central1.run.app/dashboard">Pause monitoring</a>
          </p>
        </div>
      `
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
}

// Redis helpers
async function checkRedis(key: string, env: Env): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      { headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` }}
    );
    const data = await response.json();
    return data.result !== null;
  } catch (error) {
    return false;
  }
}

async function setRedis(key: string, value: string, env: Env, ttlSeconds: number = 2592000): Promise<void> {
  try {
    await fetch(
      `${env.UPSTASH_REDIS_REST_URL}/set/${key}/${value}/EX/${ttlSeconds}`,
      { headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` }}
    );
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

async function getRedisJSON(key: string, env: Env): Promise<any | null> {
  try {
    const response = await fetch(
      `${env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      { headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` }}
    );
    const data = await response.json();
    return data.result ? JSON.parse(data.result) : null;
  } catch (error) {
    return null;
  }
}

async function setRedisJSON(key: string, value: any, env: Env, ttlSeconds: number): Promise<void> {
  try {
    const jsonStr = JSON.stringify(value);
    await fetch(
      `${env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(jsonStr)}/EX/${ttlSeconds}`,
      { headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` }}
    );
  } catch (error) {
    console.error('Redis JSON set error:', error);
  }
}
