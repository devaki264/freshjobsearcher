'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev: number) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const slides = [
    {
      title: "Over 50% of interviews booked in the first week",
      description: "More than 50% of candidates who get interviews applied within the first week",
      mockup: "notification"
    },
    {
      title: "Stop applying for jobs that already have 100+ applicants",
      description: "Boost your chances of being an early applicant before the big job boards scrape them and attract the masses",
      mockup: "cards"
    },
    {
      title: "Track your favorite companies with our AI job agent",
      description: "Try this AI Agent that immediately sends you an email notification by tracking companies of your preference and within your experience",
      mockup: "phone"
    }
  ]

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

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
    <div className="min-h-screen flex" style={{ background: '#2D2640' }}>
      
      {/* LEFT SIDE - Carousel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #5B4E8F 0%, #3D3264 100%)'
      }}>
        
        {/* Mountain silhouettes */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ opacity: 0.4 }}>
          <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,200 L200,100 L400,150 L600,80 L800,120 L1000,160 L1200,100 L1200,300 L0,300 Z" 
                  fill="#2D2640" opacity="0.6"/>
            <path d="M0,250 L150,180 L350,210 L550,160 L750,190 L950,220 L1200,180 L1200,300 L0,300 Z" 
                  fill="#1F1A2E" opacity="0.8"/>
          </svg>
        </div>

        {/* Slides */}
        <div className="relative z-10 w-full flex items-center justify-center p-16">
          <div className="max-w-md w-full">
            
            {/* Slide Content */}
            <div className="relative h-[600px]">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ${
                    currentSlide === index 
                      ? 'opacity-100 translate-x-0' 
                      : index < currentSlide 
                        ? 'opacity-0 -translate-x-8' 
                        : 'opacity-0 translate-x-8'
                  }`}
                >
                  {/* Phone Mockup */}
                  <div className="mb-8 flex items-center justify-center">
                    <div className="relative w-64 h-96 rounded-3xl shadow-2xl" 
                         style={{ 
                           background: 'linear-gradient(135deg, #4A3D70 0%, #2D2647 100%)',
                           border: '8px solid #1a1625',
                           padding: '16px'
                         }}>
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-2xl" 
                           style={{ background: '#1a1625' }} />
                      
                      {/* Screen content */}
                      <div className="relative w-full h-full rounded-2xl overflow-hidden" 
                           style={{ background: 'linear-gradient(135deg, #6B5B95 0%, #4D4070 100%)' }}>
                        
                        {/* Notification card */}
                        <div className="absolute top-12 left-4 right-4 p-4 rounded-xl backdrop-blur-lg" 
                             style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" 
                                 style={{ background: '#8B7AB8' }}>
                              💼
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-semibold" style={{ color: '#1a1625' }}>New Job Alert</div>
                              <div className="text-sm font-bold mt-1" style={{ color: '#2D2640' }}>Software Engineer</div>
                              <div className="text-xs mt-0.5" style={{ color: '#5B4E8F' }}>
                                {index === 0 ? 'Google Inc.' : index === 1 ? 'OpenAI Inc.' : 'OpenAI Inc.'}
                              </div>
                              <div className="text-xs" style={{ color: '#8B7AB8' }}>San Francisco, CA</div>
                              {index === 1 && (
                                <div className="mt-2 text-xs font-medium" style={{ color: '#E67E22' }}>
                                  8 Applicants
                                </div>
                              )}
                            </div>
                            {index === 2 && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" 
                                   style={{ background: '#8B7AB8' }}>
                                7
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional cards for slide 2 */}
                        {index === 1 && (
                          <>
                            <div className="absolute top-32 left-8 right-8 p-3 rounded-xl backdrop-blur-lg rotate-3" 
                                 style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                              <div className="text-xs font-semibold" style={{ color: '#1a1625' }}>New Job</div>
                              <div className="text-sm font-bold" style={{ color: '#2D2640' }}>Manager, BizOps</div>
                              <div className="text-xs" style={{ color: '#5B4E8F' }}>Lyra Health</div>
                              <div className="text-xs mt-1" style={{ color: '#E67E22' }}>1 min ago</div>
                            </div>
                            <div className="absolute top-52 left-12 right-4 p-3 rounded-xl backdrop-blur-lg -rotate-2" 
                                 style={{ background: 'rgba(255, 255, 255, 0.85)' }}>
                              <div className="text-xs font-semibold" style={{ color: '#1a1625' }}>Software Engineer</div>
                              <div className="text-sm font-bold" style={{ color: '#E67E22' }}>154 Applicants</div>
                              <div className="text-xs" style={{ color: '#5B4E8F' }}>Google</div>
                            </div>
                          </>
                        )}

                        {/* App icons for slide 3 */}
                        {index === 2 && (
                          <div className="absolute bottom-8 left-4 right-4 flex gap-4 justify-center">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" 
                                 style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                              🔍
                            </div>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" 
                                 style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                              🎵
                            </div>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white" 
                                 style={{ background: '#00D9A3' }}>
                              AI
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-4 text-center leading-tight px-4">
                    {slide.title}
                  </h2>

                  {/* Description */}
                  <p className="text-base leading-relaxed text-center px-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {slide.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className="transition-all duration-300"
                  style={{
                    width: currentSlide === index ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: currentSlide === index 
                      ? '#FFFFFF' 
                      : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#1a1625' }}>
        
        <div className="w-full max-w-md">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" 
                 style={{ background: 'linear-gradient(135deg, #8B7AB8, #6B5B95)' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              AI Job Match Agent
            </h1>
            <p className="text-sm" style={{ color: '#9B8DB8' }}>
              Get instant job alerts to be an early applicant
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 border" style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderColor: 'rgba(255,255,255,0.1)' 
          }}>
            
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-4"
              style={{ background: '#FFFFFF', color: '#1f2937', cursor: 'pointer' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <span className="text-xs" style={{ color: '#9B8DB8' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Email/Password Toggle */}
            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer'
                }}
              >
                Sign in with Email
              </button>
            ) : (
              <form className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8DB8' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
                    style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white'
                    }}
                    placeholder="you@example.com"
                    required
                    onFocus={(e) => e.target.style.borderColor = 'rgba(139,122,184,0.6)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8DB8' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
                    style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white'
                    }}
                    placeholder="••••••••"
                    required
                    onFocus={(e) => e.target.style.borderColor = 'rgba(139,122,184,0.6)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                  />
                </div>

                {/* Message */}
                {message && (
                  <div className={`p-3 rounded-xl text-xs ${
                    message.includes('Check') 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`} style={{ 
                    background: message.includes('Check') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    border: message.includes('Check') ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)'
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
                    style={{ background: 'linear-gradient(135deg, #8B7AB8, #6B5B95)', cursor: 'pointer' }}
                  >
                    {loading ? 'Signing in...' : 'Log In'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Up
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-xs text-center pt-2"
                  style={{ color: '#9B8DB8', cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#6B5B95' }}>
            Sign up to start receiving personalized job alerts
          </p>
        </div>
      </div>
    </div>
  )
}