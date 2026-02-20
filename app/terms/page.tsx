export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last Updated: February 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            By accessing or using AI Job Match Agent, you agree to be bound by these Terms of Service.
            If you do not agree with any part of these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
          <p className="text-gray-300 leading-relaxed">
            AI Job Match Agent is an AI-powered platform that helps H1B visa seekers discover
            relevant job opportunities from companies known to sponsor H1B visas. We use
            resume parsing and vector similarity matching to surface the most relevant job postings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>You must provide accurate information when creating your profile</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You agree not to misuse the platform or attempt to disrupt the service</li>
            <li>You will not use the platform for any unlawful purpose</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
          <p className="text-gray-300 leading-relaxed">
            All content, algorithms, and design elements of AI Job Match Agent are the property
            of their respective owners. You retain ownership of your resume and personal data.
            By uploading your resume, you grant us a limited license to process it for matching purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Limitation of Liability</h2>
          <p className="text-gray-300 leading-relaxed">
            AI Job Match Agent provides job matching as-is without guarantee of employment outcomes.
            We are not responsible for the accuracy of third-party job postings or hiring decisions
            made by companies listed on the platform. Use of this service does not constitute
            legal immigration or employment advice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Modifications</h2>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to update these terms at any time. Continued use of the platform
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
          <p className="text-gray-300">
            For questions about these terms, contact us at:{' '}
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