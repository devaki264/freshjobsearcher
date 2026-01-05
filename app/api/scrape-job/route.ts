import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const { jobUrl, companyId } = await request.json();
  
  // 1. Fetch the job page HTML
  const response = await fetch(jobUrl);
  const html = await response.text();
  
  // 2. Use Gemini to extract job info
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `Extract job information from this HTML. Return ONLY valid JSON, no markdown:
  
{
  "title": "Job title",
  "description": "Full description",
  "requirements": "Comma-separated skills (e.g., Python, React, TypeScript)",
  "location": "City, State or Remote",
  "experience_level": "entry_level|mid_level|senior_level"
}

HTML:
${html.substring(0, 20000)}`;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text().replace(/```json|```/g, '').trim();
  const jobData = JSON.parse(jsonText);
  
  // 3. Store in database
  const supabase = createClient();
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: companyId,
      external_id: jobUrl.split('/').pop(),
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      location: jobData.location,
      url: jobUrl,
      h1b_status: 'sponsors_h1b',
      experience_level: jobData.experience_level,
      posted_at: new Date().toISOString(),
      is_active: true
    })
    .select()
    .single();
  
  return NextResponse.json({ success: true, job: data });
}