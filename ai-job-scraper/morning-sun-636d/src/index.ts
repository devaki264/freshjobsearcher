// src/index.ts
// Cloudflare Worker that scrapes company career pages every hour

export interface Env {
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

// List of companies to scrape (with YOUR actual UUIDs)
const COMPANIES = [
  {
    id: 'a1af5e02-98f0-4f48-9242-d6ea871fd317',
    name: 'Google',
    careersUrl: 'https://www.google.com/about/careers/applications/jobs/results',
    scrapeStrategy: 'google'
  },
  {
    id: 'd6063566-c52f-47f4-a887-55d837e7e43c',
    name: 'Microsoft',
    careersUrl: 'https://careers.microsoft.com/professionals/us/en/search-results',
    scrapeStrategy: 'microsoft'
  },
  {
    id: 'a0f5e561-9829-4010-8955-b812e31f074e',
    name: 'Amazon',
    careersUrl: 'https://www.amazon.jobs/en/search',
    scrapeStrategy: 'amazon'
  },
  {
    id: 'd4441b5e-c0e6-487e-8747-4f14878d21fb',
    name: 'Meta',
    careersUrl: 'https://www.metacareers.com/jobs',
    scrapeStrategy: 'meta'
  },
  {
    id: '6eb97a00-3058-4891-835e-5eaf78a05e52',
    name: 'Apple',
    careersUrl: 'https://jobs.apple.com/en-us/search',
    scrapeStrategy: 'apple'
  },
  {
    id: 'b97d7f75-9fba-4aba-971a-48d8c12e94c9',
    name: 'Micron Technology',
    careersUrl: 'https://careers.micron.com/careers/search',
    scrapeStrategy: 'micron'
  },
  {
    id: '29fa1e65-8433-415f-9b2e-c6676f1e5795',
    name: 'Texas Instruments',
    careersUrl: 'https://careers.ti.com/search-jobs',
    scrapeStrategy: 'ti'
  },
  {
    id: '1224afc7-aab8-47ac-8950-bc75a7757624',
    name: 'Adobe',
    careersUrl: 'https://careers.adobe.com/us/en/search-results',
    scrapeStrategy: 'adobe'
  }
]

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('🚀 Starting hourly job scraping...')

    for (const company of COMPANIES) {
      try {
        await scrapeCompany(company, env)
      } catch (error) {
        console.error(`❌ Error scraping ${company.name}:`, error)
      }
    }

    console.log('✅ Hourly scraping completed')
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    // Manual trigger for testing
    console.log('🧪 Manual trigger - starting job scraping...')

    const results = []

    for (const company of COMPANIES) {
      try {
        const result = await scrapeCompany(company, env)
        results.push({ company: company.name, ...result })
      } catch (error) {
        console.error(`❌ Error scraping ${company.name}:`, error)
        results.push({ 
          company: company.name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Job scraping completed',
      results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function scrapeCompany(company: any, env: Env) {
  console.log(`🔍 Scraping ${company.name}...`)

  try {
    // Fetch career page
    const response = await fetch(company.careersUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Extract job IDs based on strategy
    const jobIds = extractJobIds(html, company.scrapeStrategy)

    console.log(`📋 Found ${jobIds.length} jobs at ${company.name}`)

    let newJobsCount = 0

    // Check each job against Redis
    for (const jobId of jobIds.slice(0, 10)) { // Limit to 10 jobs per company per run
      const redisKey = `job:${company.id}:${jobId}`

      // Check if we've seen this job before
      const exists = await checkRedis(redisKey, env)

      if (!exists) {
        console.log(`✨ New job found: ${jobId}`)

        // Mark as seen in Redis (30 day expiry)
        await setRedis(redisKey, '1', env)

        // Send to Supabase Edge Function for processing
        const jobUrl = constructJobUrl(company.careersUrl, jobId, company.scrapeStrategy)
        
        await sendToEdgeFunction({
          jobUrl,
          companyId: company.id,
          companyName: company.name
        }, env)

        newJobsCount++
      }
    }

    return {
      totalJobs: jobIds.length,
      newJobs: newJobsCount
    }

  } catch (error) {
    console.error(`Error in scrapeCompany for ${company.name}:`, error)
    throw error
  }
}

// Extract job IDs from HTML (simplified - you'll need to customize per company)
function extractJobIds(html: string, strategy: string): string[] {
  const jobIds: string[] = []

  try {
    if (strategy === 'google') {
      // Google: Look for job URLs like /jobs/results/123456
      const regex = /\/jobs\/results\/(\d+)/g
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    } else if (strategy === 'microsoft') {
      // Microsoft: Look for job IDs
      const regex = /jobId["\s:=]+([0-9]+)/gi
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    } else if (strategy === 'amazon') {
      // Amazon: Look for job IDs in URLs
      const regex = /\/jobs\/(\d+)/g
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    } else if (strategy === 'meta') {
      // Meta: Look for job IDs
      const regex = /careers\.com\/jobs\/(\d+)/g
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    } else if (strategy === 'apple') {
      // Apple: Look for job IDs
      const regex = /post-id["\s:=]+([A-Z0-9-]+)/gi
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    } else if (strategy === 'micron') {
      // Micron: Look for job IDs
      const regex = /data-job-id["\s:=]+(\d+)/gi
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    } else if (strategy === 'ti') {
      // Texas Instruments: Look for job IDs
      const regex = /jobId["\s:=]+([0-9]+)/gi
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    } else if (strategy === 'adobe') {
      // Adobe: Look for job IDs
      const regex = /job\/([A-Z0-9]+)/gi
      let match
      while ((match = regex.exec(html)) !== null) {
        jobIds.push(match[1])
      }
    }
  } catch (error) {
    console.error(`Error extracting job IDs for ${strategy}:`, error)
  }

  // Remove duplicates
  return [...new Set(jobIds)]
}

// Construct full job URL from ID
function constructJobUrl(baseUrl: string, jobId: string, strategy: string): string {
  if (strategy === 'google') {
    return `https://www.google.com/about/careers/applications/jobs/results/${jobId}`
  } else if (strategy === 'microsoft') {
    return `https://careers.microsoft.com/us/en/job/${jobId}`
  } else if (strategy === 'amazon') {
    return `https://www.amazon.jobs/en/jobs/${jobId}`
  } else if (strategy === 'meta') {
    return `https://www.metacareers.com/jobs/${jobId}`
  } else if (strategy === 'apple') {
    return `https://jobs.apple.com/en-us/details/${jobId}`
  } else if (strategy === 'micron') {
    return `https://careers.micron.com/careers/job/${jobId}`
  } else if (strategy === 'ti') {
    return `https://careers.ti.com/job/${jobId}`
  } else if (strategy === 'adobe') {
    return `https://careers.adobe.com/us/en/job/${jobId}`
  }
  return baseUrl
}

// Check if job exists in Redis
async function checkRedis(key: string, env: Env): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      {
        headers: {
          Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
        }
      }
    )
    
    const data = await response.json()
    return data.result !== null
  } catch (error) {
    console.error('Redis check error:', error)
    return false
  }
}

// Store job ID in Redis (with 30 day expiry)
async function setRedis(key: string, value: string, env: Env): Promise<void> {
  try {
    await fetch(
      `${env.UPSTASH_REDIS_REST_URL}/set/${key}/${value}/EX/2592000`, // 30 days
      {
        headers: {
          Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
        }
      }
    )
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

// Send job to Supabase Edge Function
async function sendToEdgeFunction(data: any, env: Env) {
  const edgeFunctionUrl = `${env.SUPABASE_URL}/functions/v1/job-enricher`

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Edge Function error:', error)
      throw new Error(`Failed to process job: ${error}`)
    }

    const result = await response.json()
    console.log('✅ Job processed:', result)
  } catch (error) {
    console.error('Error calling Edge Function:', error)
    throw error
  }
}