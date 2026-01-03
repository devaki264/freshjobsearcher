'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resumeText, setResumeText] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('entry')
  const [embedding, setEmbedding] = useState<number[]>([])
  const [step, setStep] = useState(1)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadExistingProfile()
  }, [])

  const loadExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get most recent profile
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (profiles && profiles.length > 0) {
        const profileData = profiles[0]
        setResumeText(profileData.resume_text || '')
        setSkills(profileData.skills || [])
        setExperienceLevel(profileData.experience_level || 'entry')
        setEmbedding(profileData.resume_embedding || [])
        setHasExistingProfile(true)
        setStep(2)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('resume', file)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setResumeText(data.resumeText)
        setSkills(data.skills)
        setEmbedding(data.embedding)
        setStep(2)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Upload failed')
    }
    setUploading(false)
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const saveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          resume_text: resumeText,
          resume_embedding: embedding,
          skills: skills,
          experience_level: experienceLevel,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setStep(3)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (error) {
      alert('Failed to save profile')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      <nav className="bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {hasExistingProfile ? 'Edit Your Profile' : 'Setup Your Profile'}
            </h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-300 hover:text-white font-medium transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {step === 1 && (
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-8">
            <h2 className="text-3xl font-extrabold text-white mb-4">Upload Your Resume</h2>
            <p className="text-lg text-gray-300 mb-8">
              Our AI will extract your skills automatically. You'll be able to review and edit them next.
            </p>

            <div className="border-2 border-dashed border-blue-500/50 bg-blue-500/5 rounded-xl p-10 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer inline-block"
              >
                <div className="text-blue-400 mb-4">
                  <svg className="mx-auto h-16 w-16" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-lg text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Click to upload PDF
                </span>
              </label>
              {file && (
                <p className="mt-3 text-sm text-gray-300 font-medium">
                  ✓ Selected: {file.name}
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-8 w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {uploading ? 'Processing Resume...' : 'Extract Skills with AI'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-8">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              {hasExistingProfile ? 'Edit Your Skills' : 'Review Your Skills'}
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              {hasExistingProfile 
                ? `You have ${skills.length} skills. Add more or remove any that don't apply.`
                : `AI found ${skills.length} skills. Remove any that don't apply, or add ones we missed.`
              }
            </p>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-200 mb-3">
                Your Skills
              </label>
              <div className="flex flex-wrap gap-3 mb-6 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl min-h-[120px] border border-blue-500/30">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 text-blue-300 font-semibold shadow-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-300 hover:text-white font-bold text-lg transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill..."
                  className="flex-1 px-5 py-3 text-lg border-2 border-gray-600 bg-gray-900/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium placeholder-gray-500"
                />
                <button
                  onClick={addSkill}
                  className="px-8 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-200 mb-3">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-5 py-3 text-lg border-2 border-gray-600 bg-gray-900/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (5+ years)</option>
              </select>
            </div>

            <div className="flex gap-4">
              {!hasExistingProfile && (
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-8 py-4 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 font-bold text-lg transition-all"
                >
                  Back
                </button>
              )}
              <button
                onClick={saveProfile}
                className={`${hasExistingProfile ? 'w-full' : 'flex-1'} px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all`}
              >
                Save Profile
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold mb-3 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Profile Saved! 🎉
            </h2>
            <p className="text-lg text-gray-300">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}