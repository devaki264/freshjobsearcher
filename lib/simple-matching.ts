import { createClient } from '@/lib/supabase/server';

export interface SimpleMatch {
  job_id: string;
  company_name: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  url: string;
  matched_skills: string[];
  total_skills: number;
  match_percentage: number;
}

/**
 * Simple keyword matching - if ANY skill matches, show the job
 * This is intentionally loose to avoid false negatives
 */
export async function findSimpleMatches(userId: string): Promise<SimpleMatch[]> {
  const supabase = createClient();

  // 1. Get user's skills
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills')
    .eq('user_id', userId)
    .single();

  if (!profile || !profile.skills) {
    throw new Error('No skills found. Please upload resume first.');
  }

  const userSkills = (profile.skills as string[]).map(s => s.toLowerCase());

  // 2. Get subscribed companies
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('company_id')
    .eq('user_id', userId)
    .eq('active', true);

  const companyIds = subscriptions?.map(s => s.company_id) || [];

  if (companyIds.length === 0) {
    return [];
  }

  // 3. Get all active jobs from subscribed companies
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      description,
      requirements,
      location,
      url,
      company:companies(name)
    `)
    .in('company_id', companyIds)
    .eq('is_active', true);

  if (!jobs || jobs.length === 0) {
    return [];
  }

  // 4. Match each job
  const matches: SimpleMatch[] = [];

  for (const job of jobs) {
    const jobRequirements = job.requirements
      .split(',')
      .map((r: string) => r.trim())
      .filter((r: string) => r.length > 0);

    // Find matched skills (case-insensitive, partial match OK)
    const matchedSkills: string[] = [];
    
    for (const req of jobRequirements) {
      const reqLower = req.toLowerCase();
      
      // Check if user has this skill (exact or partial match)
      const hasSkill = userSkills.some(userSkill => 
        userSkill.includes(reqLower) || 
        reqLower.includes(userSkill)
      );

      if (hasSkill) {
        matchedSkills.push(req);
      }
    }

    // CRITICAL: Show job if it has AT LEAST 1 matched skill
    // This is your strategy - prefer false positives over false negatives
    if (matchedSkills.length > 0) {
      const matchPercentage = (matchedSkills.length / jobRequirements.length) * 100;

      matches.push({
        job_id: job.id,
        company_name: (job.company as any)?.name || 'Unknown',
        title: job.title,
        description: job.description || '',
        requirements: jobRequirements,
        location: job.location || 'Not specified',
        url: job.url,
        matched_skills: matchedSkills,
        total_skills: jobRequirements.length,
        match_percentage: Math.round(matchPercentage)
      });
    }
  }

  // Sort by match percentage (highest first)
  matches.sort((a, b) => b.match_percentage - a.match_percentage);

  return matches;
}