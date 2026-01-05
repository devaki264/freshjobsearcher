'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Match {
  job_id: string;
  company_name: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  url: string;
  matched_skills: string[];
  total_skills: number;
  match_percentage: number;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMatches(data.matches);
        } else {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mt-4">Your Matched Jobs</h1>
          <p className="text-gray-400">
            Found {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {matches.length === 0 && !error && (
          <div className="bg-gray-800/50 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">No Matches Yet</h3>
            <p className="text-gray-400 mb-6">
              Either no jobs have been added, or none match your skills
            </p>
            <Link
              href="/companies"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Subscribe to Companies
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {matches.map((match) => (
            <div
              key={match.job_id}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold">{match.title}</h2>
                  <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
                    <span className="text-white font-semibold">{match.company_name}</span>
                    <span>📍 {match.location}</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {match.match_percentage}%
                </div>
              </div>

              {/* Matched Skills */}
              <div className="mb-4">
                <h4 className="text-sm text-gray-400 mb-2">
                  Your Matching Skills ({match.matched_skills.length}/{match.total_skills}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.matched_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* All Requirements */}
              <div className="mb-4">
                <h4 className="text-sm text-gray-400 mb-2">All Requirements:</h4>
                <div className="flex flex-wrap gap-2">
                  {match.requirements.map((req, idx) => {
                    const isMatched = match.matched_skills.includes(req);
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm ${
                          isMatched
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                        }`}
                      >
                        {req}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-gray-300 text-sm">{match.description.substring(0, 300)}...</p>
              </div>

              {/* Apply Button */}
              
                href={match.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                Apply Now →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}