'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  resume_text: string | null;
  skills: string[] | null;
  experience_level: string | null;
  notification_level: string | null;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscribedCount, setSubscribedCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('resume_text, skills, experience_level, notification_level')
      .eq('user_id', user.id)
      .single();

    const { data: subsData } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true);

    const { data: matchesData } = await supabase
      .from('jobs')
      .select('id')
      .eq('is_active', true)
      .limit(100);

    setProfile(profileData as any);
    setSubscribedCount(subsData?.length || 0);
    setMatchedCount(matchesData?.length || 0);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const hasResume = !!profile?.resume_text;
  const hasCompanies = subscribedCount > 0;
  const notificationLevel = (profile as any)?.notification_level || 'skill_match';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <nav className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-2">Welcome Back! 👋</h2>
          <p className="text-gray-400 text-lg">Let's find your perfect job match</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="text-4xl mb-2">📄</div>
            <h3 className="text-xl font-semibold mb-1">Resume</h3>
            <p className="text-gray-400">
              {hasResume ? `${profile.skills?.length || 0} skills extracted` : 'Not uploaded'}
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="text-4xl mb-2">🏢</div>
            <h3 className="text-xl font-semibold mb-1">Companies</h3>
            <p className="text-gray-400">
              {subscribedCount > 0 ? `Monitoring ${subscribedCount} companies` : 'None selected'}
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="text-xl font-semibold mb-1">Matches</h3>
            <p className="text-gray-400">{matchedCount} jobs available</p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/profile"
            className="block bg-blue-600 hover:bg-blue-700 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  {hasResume ? 'Update Resume' : 'Upload Resume'}
                </h3>
                <p className="text-blue-100">
                  {hasResume ? 'Update your skills and experience' : 'Let AI extract your skills automatically'}
                </p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>

          <Link
            href="/companies"
            className="block bg-purple-600 hover:bg-purple-700 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">Select Companies</h3>
                <p className="text-purple-100">
                  {hasCompanies 
                    ? `Currently monitoring ${subscribedCount} companies (${notificationLevel})` 
                    : 'Choose which companies to monitor'}
                </p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>

          {hasResume && hasCompanies && (
            <Link
              href="/matches"
              className="block bg-green-600 hover:bg-green-700 rounded-lg p-6 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-1">View Matched Jobs</h3>
                  <p className="text-green-100">
                    See {matchedCount} jobs that match your skills
                  </p>
                </div>
                <div className="text-2xl">→</div>
              </div>
            </Link>
          )}
        </div>

        {!hasResume && (
          <div className="mt-12 bg-yellow-900/20 border border-yellow-500 rounded-lg p-6">
            <p className="text-yellow-400">
              👋 Start by uploading your resume to get personalized job matches!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}