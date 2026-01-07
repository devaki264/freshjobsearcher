'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
}

export default function AddJobsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .eq('active', true)
      .order('name');

    if (data) {
      setCompanies(data as Company[]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedCompany || !jobUrl) {
      setMessage('Please select a company and enter a job URL');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl,
          companyId: selectedCompany
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Successfully added: ${(data.job as any)?.title || 'Job'}`);
        setJobUrl('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mt-4">Add Jobs Manually</h1>
          <p className="text-gray-400 mt-2">
            Paste a job URL and let AI extract the details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">
              Select Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Job URL
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://careers.company.com/jobs/12345"
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Processing...' : 'Add Job'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-900/20 border border-green-500 text-green-400' 
                : 'bg-red-900/20 border border-red-500 text-red-400'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}