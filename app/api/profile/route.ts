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

    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type,
          data: base64
        }
      },
      {
        text: `Extract the following from this resume in JSON format:
        {
          "resume_text": "full text content",
          "skills": ["skill1", "skill2", ...],
          "experience_level": "entry|mid|senior",
          "resume_embedding": [array of numbers for semantic search]
        }
        
        For skills: extract ALL technical skills, tools, languages, frameworks.
        For experience_level: determine based on years of experience.
        For resume_embedding: generate a 768-dimensional embedding vector.`
      }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const extracted = JSON.parse(jsonMatch[0]);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        resume_text: extracted.resume_text,
        skills: extracted.skills,
        experience_level: extracted.experience_level,
        resume_embedding: extracted.resume_embedding,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      profile: {
        skills: extracted.skills,
        experience_level: extracted.experience_level
      }
    });

  } catch (error: any) {
    console.error('Error processing resume:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process resume' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('resume_text, skills, experience_level, resume_embedding')
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      profile: data
    });

  } catch (error: any) {
    console.error('Error getting profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get profile' 
    }, { status: 500 });
  }
}