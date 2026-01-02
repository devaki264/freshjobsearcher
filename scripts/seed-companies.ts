import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const companies = [
  // Big Tech
  { name: 'Google', career_url: 'https://careers.google.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Microsoft', career_url: 'https://careers.microsoft.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Amazon', career_url: 'https://www.amazon.jobs/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Meta', career_url: 'https://www.metacareers.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Apple', career_url: 'https://www.apple.com/careers/', h1b_verified: true, scraper_type: 'custom', active: true },
  
  // Semiconductor/Hardware (Your Target Companies)
  { name: 'Intel', career_url: 'https://jobs.intel.com/', h1b_verified: true, scraper_type: 'workday', active: true },
  { name: 'Micron Technology', career_url: 'https://careers.micron.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'NVIDIA', career_url: 'https://www.nvidia.com/en-us/about-nvidia/careers/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'AMD', career_url: 'https://careers.amd.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Qualcomm', career_url: 'https://www.qualcomm.com/company/careers', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Texas Instruments', career_url: 'https://careers.ti.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  
  // Enterprise Software
  { name: 'Oracle', career_url: 'https://www.oracle.com/careers/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'SAP', career_url: 'https://jobs.sap.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Salesforce', career_url: 'https://www.salesforce.com/company/careers/', h1b_verified: true, scraper_type: 'custom', active: true },
  
  // Analytics/Data Companies
  { name: 'Databricks', career_url: 'https://www.databricks.com/company/careers', h1b_verified: true, scraper_type: 'greenhouse', active: true },
  { name: 'Snowflake', career_url: 'https://www.snowflake.com/careers/', h1b_verified: true, scraper_type: 'greenhouse', active: true },
  { name: 'Tableau (Salesforce)', career_url: 'https://www.tableau.com/careers', h1b_verified: true, scraper_type: 'custom', active: true },
  
  // Other Tech
  { name: 'Adobe', career_url: 'https://careers.adobe.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'Cisco', career_url: 'https://jobs.cisco.com/', h1b_verified: true, scraper_type: 'custom', active: true },
  { name: 'VMware', career_url: 'https://careers.vmware.com/', h1b_verified: true, scraper_type: 'workday', active: true },
]

async function seedCompanies() {
  console.log('Seeding companies...')
  
  for (const company of companies) {
    const { data, error } = await supabase
      .from('companies')
      .upsert(company, { onConflict: 'name' })
    
    if (error) {
      console.error(`Error inserting ${company.name}:`, error)
    } else {
      console.log(`✓ ${company.name}`)
    }
  }
  
  console.log('\nSeeding complete! 20 companies added.')
  process.exit(0)
}

seedCompanies()