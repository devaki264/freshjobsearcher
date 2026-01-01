'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    setUser(user)
    
    // Get most recent profile
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
    
    if (profiles && profiles.length > 0) {
      setProfile(profiles[0])
    }
    
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">
              AI Job Match Agent
            </h1>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
          <p className="text-gray-600 mb-4">
            Email: {user?.email}
          </p>
          
          <div className="border-t pt-4 mt-4">
            {profile ? (
              // Profile exists - show skills
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
                  <button
                    onClick={() => router.push('/profile')}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Edit Skills
                  </button>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Experience Level:</span> {' '}
                    {profile.experience_level === 'entry' && 'Entry Level (0-2 years)'}
                    {profile.experience_level === 'mid' && 'Mid Level (3-5 years)'}
                    {profile.experience_level === 'senior' && 'Senior Level (5+ years)'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Your Skills ({profile.skills?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ✅ Your profile is all set! You can add more skills or edit existing ones anytime.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-gray-500 text-sm">
                    🚧 Coming next: Select companies to monitor and start receiving job alerts!
                  </p>
                </div>
              </div>
            ) : (
              // No profile - show setup button
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/profile')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Setup Your Profile
                </button>
                <p className="text-gray-500 text-sm">
                  Upload your resume and we will extract your skills using AI
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}