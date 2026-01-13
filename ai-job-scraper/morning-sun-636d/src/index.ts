/* eslint-disable @typescript-eslint/no-explicit-any */
// src/index.ts
// Cloudflare Worker that monitors jobs for active users

export interface Env {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
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

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('🚀 Starting hourly job monitoring...');
    await processJobAlerts(env);
    console.log('✅ Hourly monitoring completed');
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('🧪 Manual trigger - starting job monitoring...');
    const results = await processJobAlerts(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Job monitoring completed',
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
  let totalEmailsSent = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      console.log(`👤 Processing user: ${user.email}`);
      
      const jobs = await scrapeJobsForUser(user, env);
      totalJobsScraped += jobs.length;
      
      if (jobs.length > 0) {
        const matches = matchJobs(jobs, user);
        
        if (matches.length > 0) {
          await sendJobAlertEmail(user, matches, env);
          totalEmailsSent++;
          console.log(`✅ Sent ${matches.length} job matches to ${user.email}`);
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
    totalEmailsSent,
    errors: errors.length > 0 ? errors : undefined
  };
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
    
    console.log(`📋 Found ${jobIds.length} jobs at ${company.name}`);
    
    const newJobs: any[] = [];
    
    for (const jobId of jobIds.slice(0, 5)) {
      const redisKey = `job:${company.id}:${jobId}:user:${userId}`;
      
      const exists = await checkRedis(redisKey, env);
      
      if (!exists) {
        await setRedis(redisKey, '1', env, 604800);
        
        newJobs.push({
          id: jobId,
          company_id: company.id,
          company_name: company.name,
          url: constructJobUrl(company.career_url, jobId, company.name),
          title: `Job at ${company.name}`,
          scraped_at: new Date().toISOString()
        });
      }
    }
    
    return newJobs;
  } catch (error) {
    console.error(`Scrape error for ${company.name}:`, error);
    return [];
  }
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

function matchJobs(jobs: any[], user: User): any[] {
  const matches: any[] = [];
  
  for (const job of jobs) {
    const matchScore = user.skills.some(skill => 
      job.title.toLowerCase().includes(skill.toLowerCase()) ||
      job.company_name.toLowerCase().includes(skill.toLowerCase())
    ) ? 0.8 : 0.6;
    
    if (matchScore >= 0.5) {
      matches.push({
        ...job,
        match_score: matchScore
      });
    }
  }
  
  return matches.sort((a, b) => b.match_score - a.match_score);
}

async function sendJobAlertEmail(user: User, matches: any[], env: Env): Promise<void> {
  const jobsList = matches.map(job => `
    <li style="margin-bottom: 15px;">
      <strong>${job.company_name}</strong><br>
      <span style="color: #059669;">Match Score: ${Math.round(job.match_score * 100)}%</span><br>
      <a href="${job.url}" style="color: #2563eb;">View Job →</a>
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
      subject: `🎯 ${matches.length} New Job Matches Found!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Job Matches for You!</h2>
          <p>We found ${matches.length} new job postings that match your skills:</p>
          <ul style="list-style: none; padding: 0;">
            ${jobsList}
          </ul>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Too many emails? 
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

async function checkRedis(key: string, env: Env): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      { headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` }}
    );
    const data = await response.json();
    return data.result !== null;
  } catch (error) {
    console.error('Redis check error:', error);
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