'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [notificationLevel, setNotificationLevel] = useState<string>('skill_match')
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
      setNotificationLevel(profiles[0].notification_level || 'skill_match')
    }

    // Get user's selected companies
    const { data: subsData } = await supabase
      .from('subscriptions')
      .select(`
        company_id,
        companies (
          id,
          name,
          h1b_verified
        )
      `)
      .eq('user_id', user.id)
      .eq('active', true)

    const selectedCompanies = subsData?.map((sub: any) => sub.companies).filter(Boolean) || []
    setCompanies(selectedCompanies)
    
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    )
  }

  const notificationLevelInfo = {
    all_jobs: { name: 'All Jobs', gradient: 'from-yellow-400 to-orange-500', bgGradient: 'from-yellow-500/20 to-orange-500/20' },
    experience_match: { name: 'Experience Match', gradient: 'from-blue-400 to-cyan-500', bgGradient: 'from-blue-500/20 to-cyan-500/20' },
    skill_match: { name: 'Skill Match', gradient: 'from-purple-400 to-pink-500', bgGradient: 'from-purple-500/20 to-pink-500/20' }
  }

  const currentLevel = notificationLevelInfo[notificationLevel as keyof typeof notificationLevelInfo] || notificationLevelInfo.skill_match

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      <nav className="bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Job Match Agent
            </h1>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-300 hover:text-white font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">Welcome Back!</h2>
            <p className="text-lg text-gray-300">
              {user?.email}
            </p>
          </div>
          
          <div className="border-t border-gray-700 pt-8 space-y-8">
            {profile ? (
              <>
                {/* Profile Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Your Profile</h3>
                    <button
                      onClick={() => router.push('/profile')}
                      className="px-5 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      Edit Skills
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-1">
                      <span className="font-semibold text-gray-200">Experience Level:</span>
                    </p>
                    <p className="text-lg font-bold text-white">
                      {profile.experience_level === 'entry' && 'Entry Level (0-2 years)'}
                      {profile.experience_level === 'mid' && 'Mid Level (3-5 years)'}
                      {profile.experience_level === 'senior' && 'Senior Level (5+ years)'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-200 mb-4">
                      Your Skills ({profile.skills?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 text-blue-300 text-sm rounded-lg font-medium shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-5 mt-6">
                    <p className="text-sm text-blue-300 font-medium">
                      ✅ Your profile is all set! You can add more skills or edit existing ones anytime.
                    </p>
                  </div>
                </div>

                {/* Companies Section */}
                <div className="border-t border-gray-700 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Notification Settings</h3>
                    <button
                      onClick={() => router.push('/companies')}
                      className={`px-5 py-2.5 text-sm bg-gradient-to-r ${currentLevel.gradient} text-white rounded-xl hover:shadow-xl font-semibold shadow-lg transition-all`}
                    >
                      {companies.length > 0 ? 'Edit Preferences' : 'Setup Alerts'}
                    </button>
                  </div>

                  {companies.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="font-semibold text-gray-200">Alert Level:</span>
                        </p>
                        <div className="flex items-center space-x-3">
                          <div className={`px-4 py-2 bg-gradient-to-r ${currentLevel.bgGradient} border border-${notificationLevel === 'all_jobs' ? 'yellow' : notificationLevel === 'experience_match' ? 'blue' : 'purple'}-500/50 rounded-lg`}>
                            <span className="font-bold text-white">{currentLevel.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-200 mb-4">
                          Monitoring {companies.length} companies
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {companies.map((company: any) => (
                            <span
                              key={company.id}
                              className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 text-green-300 text-sm rounded-lg font-medium shadow-sm"
                            >
                              {company.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5">
                        <p className="text-sm text-green-300 font-medium">
                          ✅ You'll receive alerts when jobs matching your skills are posted at these companies.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
                      <p className="text-sm text-yellow-300 font-medium mb-4">
                        ⚠️ No companies selected yet. Choose companies to start receiving job alerts!
                      </p>
                      <button
                        onClick={() => router.push('/companies')}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-bold shadow-lg hover:shadow-xl transition-all"
                      >
                        Select Companies Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Next Steps */}
                {companies.length > 0 && (
                  <div className="border-t border-gray-700 pt-6">
                    <p className="text-gray-400 text-sm font-medium">
                      🚧 Coming soon: View matched jobs and AI-powered recommendations!
                    </p>
                  </div>
                )}
              </>
            ) : (
              // No profile - show setup button
              <div className="text-center py-12">
                <div className="mb-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Let's Get Started!</h3>
                  <p className="text-gray-300 mb-6">
                    Upload your resume and we'll extract your skills using AI
                  </p>
                </div>
                <button
                  onClick={() => router.push('/profile')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Setup Your Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}