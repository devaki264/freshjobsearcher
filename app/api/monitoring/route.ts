import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MonitoringRequest {
  action: 'start' | 'pause' | 'resume';
}

export async function POST(request: Request) {
  try {
    console.log('📊 POST /api/monitoring - Managing monitoring status');
    
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Auth failed:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const body: MonitoringRequest = await request.json();
    const { action } = body;

    console.log(`🎬 User ${user.email} requested action: ${action}`);

    // Get current profile to check if this is first time starting
    const { data: profile } = await supabase
      .from('profiles')
      .select('monitoring_active, monitoring_started_at, skills')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found'
      }, { status: 404 });
    }

    // Check if user has uploaded resume
    if (!profile.skills || profile.skills.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please upload your resume first'
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    let updateData: any = {};
    let shouldSendWelcomeEmail = false;

    switch (action) {
      case 'start':
        updateData = {
          monitoring_active: true,
          monitoring_started_at: profile.monitoring_started_at || now, // Only set if first time
          monitoring_paused_at: null,
          updated_at: now
        };
        // Send welcome email only if this is the first time
        shouldSendWelcomeEmail = !profile.monitoring_started_at;
        break;

      case 'pause':
        updateData = {
          monitoring_active: false,
          monitoring_paused_at: now,
          updated_at: now
        };
        break;

      case 'resume':
        updateData = {
          monitoring_active: true,
          monitoring_paused_at: null,
          updated_at: now
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Must be "start", "pause", or "resume"'
        }, { status: 400 });
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      throw updateError;
    }

    console.log(`✅ Monitoring status updated to: ${action}`);

    // Send welcome email if this is the first time starting
    if (shouldSendWelcomeEmail) {
      try {
        await sendWelcomeEmail(user.email!, profile.skills.length);
        console.log('📧 Welcome email sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      action,
      monitoring_active: updateData.monitoring_active
    });

  } catch (error: any) {
    console.error('❌ Error managing monitoring:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update monitoring status' 
    }, { status: 500 });
  }
}

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('monitoring_active, monitoring_started_at, monitoring_paused_at')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      monitoring_active: profile?.monitoring_active || false,
      monitoring_started_at: profile?.monitoring_started_at,
      monitoring_paused_at: profile?.monitoring_paused_at
    });

  } catch (error: any) {
    console.error('❌ Error getting monitoring status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get monitoring status' 
    }, { status: 500 });
  }
}

// Helper function to send welcome email
async function sendWelcomeEmail(email: string, skillCount: number) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set, skipping welcome email');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AI Job Match Agent <noreply@yourdomain.com>', // Change to your verified domain
      to: email,
      subject: '🎉 You\'re now monitoring H1B jobs!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to AI Job Match Agent!</h2>
          <p>You've successfully started monitoring H1B-sponsoring companies.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Settings:</h3>
            <ul>
              <li><strong>${skillCount} skills</strong> extracted from your resume</li>
              <li>Checking for new jobs <strong>every hour</strong></li>
              <li>Only showing jobs that match your skills</li>
            </ul>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>We'll scan for new jobs hourly</li>
            <li>You'll get an email when we find matching positions</li>
            <li>You can pause/resume anytime from your dashboard</li>
          </ul>
          
          <p>Good luck with your job search!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Too many emails? You can pause monitoring anytime from your 
            <a href="https://ai-job-match-agent-686566480080.us-central1.run.app/dashboard">dashboard</a>.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.statusText}`);
  }
}