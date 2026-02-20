export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last Updated: February 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <p className="text-gray-300 leading-relaxed">
            AI Job Match Agent collects the following information when you use our service:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
            <li>Email address and account credentials (via Google OAuth or email signup)</li>
            <li>Resume content you voluntarily upload for job matching purposes</li>
            <li>Skills, experience level, and job preferences you provide</li>
            <li>Job matching preferences and company selections</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-300 leading-relaxed">
            We use your information exclusively to provide and improve the AI Job Match Agent service:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
            <li>Parsing your resume using AI to extract skills and experience</li>
            <li>Matching you with relevant job postings from H1B-sponsoring companies</li>
            <li>Sending job match notifications based on your preferences</li>
            <li>Improving matching accuracy over time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage & Security</h2>
          <p className="text-gray-300 leading-relaxed">
            Your data is stored securely in Supabase (PostgreSQL) with row-level security enabled.
            Resume content is processed by Google Gemini AI and stored as encrypted vector embeddings.
            We do not sell or share your personal data with third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
          <p className="text-gray-300 leading-relaxed">
            We use the following third-party services to operate this platform:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
            <li>Google OAuth — for authentication</li>
            <li>Google Gemini AI — for resume parsing and job matching</li>
            <li>Supabase — for database and authentication</li>
            <li>Resend — for transactional email notifications</li>
            <li>Google Cloud Run — for application hosting</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
          <p className="text-gray-300 leading-relaxed">
            You may request deletion of your account and all associated data at any time by
            contacting us at devadevaohm@gmail.com. We will process deletion requests within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Contact</h2>
          <p className="text-gray-300">
            For privacy-related questions, contact us at:{' '}
            <a href="mailto:devadevaohm@gmail.com" className="text-blue-400 hover:underline">
              devadevaohm@gmail.com
            </a>
          </p>
        </section>

        <a href="/" className="text-blue-400 hover:underline text-sm">← Back to Home</a>
      </div>
    </div>
  );
}