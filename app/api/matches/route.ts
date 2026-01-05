import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findSimpleMatches } from '@/lib/simple-matching';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matches = await findSimpleMatches(user.id);

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}