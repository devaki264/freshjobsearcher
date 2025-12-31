'use client'

import Link from 'next/link'

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Confirmed! ✅
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your email has been verified. You can now log in to your account.
          </p>
          
          <Link
            href="/auth/login"
            className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Proceed to Log In
          </Link>
        </div>
      </div>
    </div>
  )
}