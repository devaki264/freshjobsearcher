import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    console.log('📝 POST /api/profile - Starting resume upload');
    
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // DEBUG LOGGING
    console.log('🔍 Auth Debug (POST):', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userError: userError?.message,
      timestamp: new Date().toISOString()
    });
    
    if (userError || !user) {
      console.error('❌ Auth failed (POST):', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    console.log('📄 File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    console.log('🤖 Calling Gemini API...');
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });    
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
          "experience_level": "entry|mid|senior"
        }
        
        For skills: extract ALL technical skills, tools, languages, frameworks.
        For experience_level: determine based on years of experience (entry/mid/senior).`
      }
    ]);

    console.log('✅ Gemini API response received');

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ Failed to extract JSON from Gemini response');
      throw new Error('Failed to extract JSON from response');
    }

    const extracted = JSON.parse(jsonMatch[0]);
    console.log('✅ Extracted data:', {
      skillsCount: extracted.skills?.length,
      experienceLevel: extracted.experience_level
    });

    console.log('💾 Upserting profile in database...');
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        resume_text: extracted.resume_text,
        skills: extracted.skills,
        experience_level: extracted.experience_level,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('❌ Database upsert failed:', upsertError);
      throw upsertError;
    }

    console.log('✅ Profile upserted successfully');

    return NextResponse.json({
      success: true,
      profile: {
        skills: extracted.skills,
        experience_level: extracted.experience_level
      }
    });

  } catch (error: any) {
    console.error('❌ Error processing resume:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process resume' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('📖 GET /api/profile - Fetching profile');
    
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // DEBUG LOGGING
    console.log('🔍 Auth Debug (GET):', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userError: userError?.message,
      timestamp: new Date().toISOString()
    });
    
    if (userError || !user) {
      console.error('❌ Auth failed (GET):', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const { data, error } = await supabase
      .from('profiles')
      .select('resume_text, skills, experience_level')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('❌ Database query failed:', error);
      throw error;
    }

    console.log('✅ Profile fetched:', {
      hasResume: !!data?.resume_text,
      skillsCount: data?.skills?.length
    });

    return NextResponse.json({
      success: true,
      profile: data
    });

  } catch (error: any) {
    console.error('❌ Error getting profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get profile' 
    }, { status: 500 });
  }
}