'use client';

import { useState } from 'react';

export default function AddJobsPage() {
  const [jobUrl, setJobUrl] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl, companyId })
      });

      const data = await response.json();
      if (data.success) {
        setResult(`✅ Added: ${data.job.title}`);
        setJobUrl('');
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setResult(`❌ Failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Add Jobs Manually</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Job URL</label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://intel.com/careers/job/12345"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Company ID (from Supabase)</label>
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="uuid-here"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Extracting...' : 'Add Job'}
          </button>
        </form>

        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            {result}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
          <h3 className="font-bold mb-2">How to use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to company careers page (Intel, Micron, etc.)</li>
            <li>Copy job posting URL</li>
            <li>Get company ID from Supabase (SELECT id FROM companies WHERE name='Intel')</li>
            <li>Paste both here and submit</li>
            <li>Gemini extracts job info automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}