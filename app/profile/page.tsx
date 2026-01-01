'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('entry')
  const [embedding, setEmbedding] = useState<number[]>([])
  const [step, setStep] = useState(1) // 1=upload, 2=review, 3=saved
  const router = useRouter()

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
      // Get auth token
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
        setStep(2) // Move to review step
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

      // Save to database
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

      setStep(3) // Success
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (error) {
      alert('Failed to save profile')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Setup Your Profile</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step 1: Upload Resume */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">Upload Your Resume</h2>
            <p className="text-gray-600 mb-6">
              Our AI will extract your skills automatically. You'll be able to review and edit them next.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Click to upload PDF
                </span>
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Processing Resume...' : 'Extract Skills with AI'}
            </button>
          </div>
        )}

        {/* Step 2: Review & Edit Skills */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">Review Your Skills</h2>
            <p className="text-gray-600 mb-6">
              AI found {skills.length} skills. Remove any that don't apply, or add ones we missed.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extracted Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-lg min-h-[100px]">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addSkill}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (5+ years)</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={saveProfile}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Profile Saved!</h2>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}