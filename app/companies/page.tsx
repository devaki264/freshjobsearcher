'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
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

    // Load all companies
    const { data: companiesData } = await supabase
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('name')

    // Load user's existing subscriptions
    const { data: subsData } = await supabase
      .from('subscriptions')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('active', true)

    setCompanies(companiesData || [])
    
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

  async function saveSelections() {
    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete all existing subscriptions
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)

      // Insert new subscriptions
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

      // Show success message
      setSaved(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error) {
      alert('Failed to save selections')
      console.error(error)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Companies Saved!</h2>
          <p className="text-gray-600 mb-1">
            Monitoring {selectedCompanies.size} companies
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Select Companies</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-2">Choose Companies to Monitor</h2>
          <p className="text-gray-600 mb-6">
            Select companies you'd like to receive job alerts from. We'll notify you when new roles match your skills.
          </p>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {selectedCompanies.size} of {companies.length} companies selected
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => setSelectedCompanies(new Set(companies.map(c => c.id)))}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedCompanies(new Set())}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <label
                  key={company.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCompanies.has(company.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCompanies.has(company.id)}
                    onChange={() => toggleCompany(company.id)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="ml-3 font-medium text-gray-900">{company.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveSelections}
              disabled={saving || selectedCompanies.size === 0}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : `Save ${selectedCompanies.size} Companies`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}