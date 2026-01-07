import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { jobUrl, companyId } = body as any;

    if (!jobUrl || !companyId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing jobUrl or companyId' 
      }, { status: 400 });
    }

    // Fetch the job page
    const response = await fetch(jobUrl);
    const html = await response.text();

    // Use Gemini to extract job details
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent([
      {
        text: `Extract job details from this HTML in JSON format:
        {
          "title": "job title",
          "description": "job description",
          "requirements": "comma-separated list of required skills",
          "location": "job location",
          "experience_level": "entry|mid|senior"
        }
        
        HTML:
        ${html.substring(0, 20000)}`
      }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const jobData = JSON.parse(jsonMatch[0]);

    // Store in database
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        company_id: companyId,
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        location: jobData.location,
        experience_level: jobData.experience_level,
        url: jobUrl,
        external_id: jobUrl,
        h1b_status: 'sponsors_h1b',
        is_active: true,
        scraped_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      job
    });

  } catch (error: any) {
    console.error('Error scraping job:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to scrape job' 
    }, { status: 500 });
  }
}