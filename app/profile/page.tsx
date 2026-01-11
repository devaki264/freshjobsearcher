'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  resume_text: string | null;
  skills: string[] | null;
  experience_level: string | null;
}

interface ApiResponse {
  success: boolean;
  profile?: {
    skills: string[];
    experience_level: string;
  };
  error?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // NEW: States for skill editing
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [showReview, setShowReview] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);

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
      .select('resume_text, skills, experience_level')
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

      const data: ApiResponse = await response.json();

      if (data.success && data.profile) {
        // Instead of redirecting, show the review screen
        setExtractedSkills(data.profile.skills || []);
        setExperienceLevel(data.profile.experience_level || 'mid');
        setShowReview(true);
      } else {
        setError(data.error || 'Failed to process resume');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  }

  function removeSkill(index: number) {
    setExtractedSkills(skills => skills.filter((_, i) => i !== index));
  }

  function addSkill() {
    if (newSkill.trim() && !extractedSkills.includes(newSkill.trim())) {
      setExtractedSkills([...extractedSkills, newSkill.trim()]);
      setNewSkill('');
    }
  }

  async function handleSaveAndContinue() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          skills: extractedSkills,
          experience_level: experienceLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      router.push('/companies');
    } catch (err: any) {
      setError(err.message || 'Failed to save skills');
    } finally {
      setSaving(false);
    }
  }

  // Review screen after upload
  if (showReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <nav className="bg-gray-800/50 border-b border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button 
              onClick={() => setShowReview(false)}
              className="text-blue-400 hover:text-blue-300"
            >
              ← Back to Upload
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Review Your Skills</h1>
            <p className="text-gray-400 text-lg">
              AI extracted {extractedSkills.length} skills. Add or remove as needed.
            </p>
          </div>

          {/* Experience Level */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold mb-4">Experience Level</h3>
            <div className="flex gap-4">
              {['entry', 'mid', 'senior'].map((level) => (
                <button
                  key={level}
                  onClick={() => setExperienceLevel(level)}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    experienceLevel === level
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Skills ({extractedSkills.length})
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {extractedSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(idx)}
                    className="text-red-400 hover:text-red-300 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add skill input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill..."
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addSkill}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition"
              >
                Add
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={handleSaveAndContinue}
            disabled={saving || extractedSkills.length === 0}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition"
          >
            {saving ? 'Saving...' : 'Save & Continue to Company Selection →'}
          </button>
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
                {profile.experience_level || 'Not set'}
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
            <li>✓ You review and edit the extracted skills</li>
            <li>✓ Takes ~10 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}