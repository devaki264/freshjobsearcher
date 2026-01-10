import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findSimpleMatches } from '@/lib/simple-matching';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const matches = await findSimpleMatches(user.id);
    
    return NextResponse.json({
      success: true,
      matches
    });
    
  } catch (error: any) {
    console.error('Error in matches API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get matches' 
    }, { status: 500 });
  }
}