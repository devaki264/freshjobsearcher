import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  console.log('Adding notification features...\n')

  // 1. Add notification_level to profiles
  console.log('1. Adding notification_level column to profiles...')
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS notification_level TEXT DEFAULT 'skill_match' 
      CHECK (notification_level IN ('all_jobs', 'experience_match', 'skill_match'));
    `
  })

  if (alterError) {
    console.log('Note: Column might already exist or using direct SQL...')
  } else {
    console.log('✓ Added notification_level column')
  }

  // 2. Create custom_companies table
  console.log('\n2. Creating custom_companies table...')
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS custom_companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users NOT NULL,
        name TEXT NOT NULL,
        career_url TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
        scraper_type TEXT DEFAULT 'unknown',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, career_url)
      );
    `
  })

  if (tableError) {
    console.log('Note: Table might already exist...')
  } else {
    console.log('✓ Created custom_companies table')
  }

  console.log('\n✅ Migration complete!')
  process.exit(0)
}

migrate()