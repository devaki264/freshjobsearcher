'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for confirmation link!')
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f1b2d 50%, #0d1117 100%)' }}>
      
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-5 -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            AI Job Match Agent
          </h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Get instant job alerts to be an early applicant
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          
          {/* Status pills */}
          <div className="flex gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Live monitoring
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
              50+ companies
            </span>
          </div>

          <form className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
                style={{ 
                  background: 'rgba(255,255,255,0.06)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white'
                }}
                placeholder="you@example.com"
                required
                onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
                style={{ 
                  background: 'rgba(255,255,255,0.06)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white'
                }}
                placeholder="••••••••"
                required
                onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-xl text-xs ${
                message.includes('Check') 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`} style={{ 
                background: message.includes('Check') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: message.includes('Check') ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)'
              }}>
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              >
                {loading ? 'Signing in...' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ 
                  background: 'rgba(255,255,255,0.06)', 
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '⚡', label: 'Hourly scraping' },
                { icon: '🎯', label: 'Skill matching' },
                { icon: '📧', label: 'Email alerts' },
              ].map((f) => (
                <div key={f.label} className="py-2 px-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-lg mb-1">{f.icon}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#475569' }}>
          Sign up to start receiving personalized job alerts
        </p>
      </div>
    </div>
  )
}