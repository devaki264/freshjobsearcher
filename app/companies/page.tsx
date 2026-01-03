'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CompaniesPage() {
  const [curatedCompanies, setCuratedCompanies] = useState<any[]>([])
  const [customCompanies, setCustomCompanies] = useState<any[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [notificationLevel, setNotificationLevel] = useState('skill_match')
  const [customUrl, setCustomUrl] = useState('')
  const [customName, setCustomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: companiesData } = await supabase
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('name')

    const { data: customData } = await supabase
      .from('custom_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('notification_level')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    const { data: subsData } = await supabase
      .from('subscriptions')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('active', true)

    setCuratedCompanies(companiesData || [])
    setCustomCompanies(customData || [])
    setNotificationLevel(profiles?.[0]?.notification_level || 'skill_match')
    
    const selected = new Set(subsData?.map(s => s.company_id) || [])
    setSelectedCompanies(selected)
    
    setLoading(false)
  }

  function toggleCompany(companyId: string) {
    const newSelected = new Set(selectedCompanies)
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId)
    } else {
      newSelected.add(companyId)
    }
    setSelectedCompanies(newSelected)
  }

  async function addCustomCompany() {
    if (!customUrl.trim() || !customName.trim()) {
      alert('Please enter both company name and career page URL')
      return
    }

    try {
      new URL(customUrl)
    } catch {
      alert('Please enter a valid URL (e.g., https://careers.company.com)')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('custom_companies')
      .insert({
        user_id: user.id,
        name: customName.trim(),
        career_url: customUrl.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        alert('You have already added this company!')
      } else {
        alert('Failed to add company')
      }
      return
    }

    setCustomCompanies([...customCompanies, data])
    setCustomUrl('')
    setCustomName('')
  }

  async function removeCustomCompany(companyId: string) {
    const { error } = await supabase
      .from('custom_companies')
      .update({ active: false })
      .eq('id', companyId)

    if (!error) {
      setCustomCompanies(customCompanies.filter(c => c.id !== companyId))
      const newSelected = new Set(selectedCompanies)
      newSelected.delete(companyId)
      setSelectedCompanies(newSelected)
    }
  }

  async function saveSelections() {
    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('profiles')
        .update({ 
          notification_level: notificationLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)

      const subscriptions = Array.from(selectedCompanies).map(company_id => ({
        user_id: user.id,
        company_id,
        active: true
      }))

      if (subscriptions.length > 0) {
        const { error } = await supabase
          .from('subscriptions')
          .insert(subscriptions)

        if (error) throw error
      }

      setSaved(true)
      setTimeout(() => router.push('/dashboard'), 2000)
      
    } catch (error) {
      alert('Failed to save selections')
      console.error(error)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 font-serif">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 font-serif">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-12 text-center max-w-md">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold mb-3 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            All Set! 🎉
          </h2>
          <p className="text-xl text-gray-200 mb-2 font-semibold">
            Monitoring {selectedCompanies.size} companies
          </p>
          <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const notificationOptions = [
    {
      id: 'all_jobs',
      title: 'ALL JOBS',
      subtitle: 'Cast a Wide Net',
      emailCount: '40',
      emailUnit: 'emails/week',
      gradient: 'from-yellow-400 to-orange-500',
      bgGradient: 'from-yellow-500/20 to-orange-500/20',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-400',
      icon: (
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      ),
      best: 'Exploring all opportunities',
      tradeoff: 'High volume, manual filtering'
    },
    {
      id: 'experience_match',
      title: 'EXPERIENCE MATCH',
      subtitle: 'Smart Filter',
      emailCount: '15',
      emailUnit: 'emails/week',
      gradient: 'from-blue-400 to-cyan-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-400',
      icon: (
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      ),
      best: 'Focused search at your level',
      tradeoff: 'Some skill checking needed'
    },
    {
      id: 'skill_match',
      title: 'SKILL MATCH',
      subtitle: 'Precision Targeting ⭐',
      emailCount: '5',
      emailUnit: 'emails/week',
      gradient: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-400',
      icon: (
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      best: 'High-quality matches only',
      tradeoff: 'Might miss broader options'
    }
  ]

  const selectedOption = notificationOptions.find(opt => opt.id === notificationLevel)!

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 font-serif">
      <nav className="bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Notification Preferences
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Curated Companies Section - FIRST */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-white mb-3">
              Select Companies to Monitor
            </h2>
            <p className="text-lg text-gray-300">
              All companies below are <span className="font-semibold text-green-400">verified H1B sponsors</span>
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${selectedOption.gradient} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                {selectedCompanies.size}
              </div>
              <p className="text-lg font-semibold text-gray-200">
                companies selected
              </p>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => {
                  const allIds = new Set([
                    ...curatedCompanies.map(c => c.id),
                    ...customCompanies.map(c => c.id)
                  ])
                  setSelectedCompanies(allIds)
                }}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedCompanies(new Set())}
                className="text-sm font-semibold text-gray-400 hover:text-gray-300 hover:underline transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {curatedCompanies.map((company) => {
              const isSelected = selectedCompanies.has(company.id)
              return (
                <label
                  key={company.id}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? `bg-gradient-to-br ${selectedOption.bgGradient} border-2 ${selectedOption.borderColor} shadow-lg`
                      : 'border-2 border-gray-700 hover:border-gray-600 hover:shadow-md bg-gray-900/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCompany(company.id)}
                    className="w-5 h-5 rounded focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                    style={{ accentColor: isSelected ? '#3b82f6' : undefined }}
                  />
                  <span className={`ml-3 font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {company.name}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Custom Companies Section - SECOND */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-white mb-3">
              Add Custom Companies
            </h2>
            <p className="text-lg text-gray-300">
              Don't see a company? Add their career page URL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Company Name (e.g., Stripe)"
              className="px-5 py-3 text-lg border-2 border-gray-600 bg-gray-900/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium placeholder-gray-500"
            />
            <div className="flex gap-3">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://careers.company.com"
                className="flex-1 px-5 py-3 text-lg border-2 border-gray-600 bg-gray-900/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium placeholder-gray-500"
              />
              <button
                onClick={addCustomCompany}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                + Add
              </button>
            </div>
          </div>

          {customCompanies.length > 0 && (
            <div>
              <p className="text-lg font-bold text-gray-200 mb-4">Your Added Companies</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {customCompanies.map((company) => {
                  const isSelected = selectedCompanies.has(company.id)
                  return (
                    <div
                      key={company.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500 shadow-lg'
                          : 'border-2 border-gray-700 bg-gray-900/30'
                      }`}
                    >
                      <label className="flex items-center flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompany(company.id)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: '#a855f7' }}
                        />
                        <span className={`ml-3 font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {company.name}
                        </span>
                      </label>
                      <button
                        onClick={() => removeCustomCompany(company.id)}
                        className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notification Level Section - THIRD */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-3">
              Choose Your Alert Level
            </h2>
            <p className="text-lg text-gray-300">
              Balance <span className="font-semibold text-blue-400">quality</span> vs <span className="font-semibold text-orange-400">quantity</span> based on your search intensity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {notificationOptions.map((option) => {
              const isSelected = notificationLevel === option.id
              return (
                <label
                  key={option.id}
                  className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-br ${option.bgGradient} border-2 ${option.borderColor} shadow-2xl shadow-${option.id === 'all_jobs' ? 'yellow' : option.id === 'experience_match' ? 'blue' : 'purple'}-500/50 scale-105`
                      : 'bg-gray-900/50 border-2 border-gray-700 hover:border-gray-600 hover:shadow-lg'
                  }`}
                >
                  <input
                    type="radio"
                    name="notification_level"
                    value={option.id}
                    checked={isSelected}
                    onChange={(e) => setNotificationLevel(e.target.value)}
                    className="sr-only"
                  />
                  
                  <div className={`mb-6 ${isSelected ? option.textColor : 'text-gray-500'}`}>
                    {option.icon}
                  </div>

                  <div className="mb-2">
                    <div className={`text-2xl font-extrabold tracking-tight ${isSelected ? option.textColor : 'text-gray-400'}`}>
                      {option.title}
                    </div>
                    <div className="text-sm font-medium text-gray-400 mt-1">
                      {option.subtitle}
                    </div>
                  </div>

                  <div className="my-6 border-t-2 border-gray-700"></div>

                  <div className="mb-6 text-center">
                    <div className={`text-5xl font-black ${isSelected ? `bg-gradient-to-r ${option.gradient} bg-clip-text text-transparent` : 'text-gray-600'}`}>
                      ~{option.emailCount}
                    </div>
                    <div className="text-sm text-gray-400 mt-1 font-medium">
                      {option.emailUnit}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <span className="text-green-400 mr-2 font-bold">✓</span>
                      <span className="text-gray-300">{option.best}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-orange-400 mr-2 font-bold">⚠</span>
                      <span className="text-gray-300">{option.tradeoff}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className={`absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br ${option.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        {/* Save Section */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-8">
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-8 py-4 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 font-bold text-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveSelections}
              disabled={saving || selectedCompanies.size === 0}
              className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
                saving || selectedCompanies.size === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${selectedOption.gradient} text-white hover:scale-105`
              }`}
            >
              {saving ? 'Saving...' : `Save Preferences (${selectedCompanies.size} companies)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}