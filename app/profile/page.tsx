'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  resume_text: string | null;
  skills: string[] | null;
  experience_level: string | null;
  resume_embedding: number[] | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('resume_text, skills, experience_level, resume_embedding')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploaded(true);
        setTimeout(() => router.push('/companies'), 2000);
      } else {
        setError(data.error || 'Failed to process resume');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-800/50 rounded-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-white mb-4">Resume Processed!</h2>
          <p className="text-gray-300 mb-2">Skills extracted successfully</p>
          <p className="text-sm text-gray-400">Redirecting to company selection...</p>
        </div>
      </div>
    );
  }

  const hasResume = !!profile?.resume_text;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <nav className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">
            {hasResume ? 'Update Your Resume' : 'Upload Your Resume'}
          </h1>
          <p className="text-gray-400 text-lg">
            AI will automatically extract your skills and experience
          </p>
        </div>

        {hasResume && profile && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-8">
            <h3 className="text-xl font-semibold mb-4">Current Profile</h3>
            
            <div className="mb-4">
              <h4 className="text-sm text-gray-400 mb-2">Experience Level:</h4>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                {(profile as any).experience_level || 'Not set'}
              </span>
            </div>

            <div>
              <h4 className="text-sm text-gray-400 mb-2">Extracted Skills ({profile.skills?.length || 0}):</h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
          <h3 className="text-xl font-semibold mb-6">
            {hasResume ? 'Upload New Resume' : 'Upload Resume'}
          </h3>

          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
            >
              <div className="text-6xl mb-4">📄</div>
              <h4 className="text-xl font-semibold mb-2">
                {uploading ? 'Processing...' : 'Click to upload'}
              </h4>
              <p className="text-gray-400">
                PDF, DOC, or DOCX (Max 10MB)
              </p>
            </label>
          </div>

          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-500 rounded-lg p-6">
          <h4 className="font-semibold mb-2">What happens next?</h4>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>✓ AI extracts all your technical skills</li>
            <li>✓ Determines your experience level</li>
            <li>✓ Creates semantic embeddings for smart matching</li>
            <li>✓ Takes ~10 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}