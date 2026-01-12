'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MonitoringStatus {
  monitoring_active: boolean;
  monitoring_started_at: string | null;
  monitoring_paused_at: string | null;
}

interface MonitoringApiResponse {
  success: boolean;
  monitoring_active?: boolean;
  monitoring_started_at?: string | null;
  monitoring_paused_at?: string | null;
  error?: string;
}

interface MonitoringActionResponse {
  success: boolean;
  action?: string;
  monitoring_active?: boolean;
  error?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    hasResume: false,
    companiesCount: 0,
    matchesCount: 0
  });
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>({
    monitoring_active: false,
    monitoring_started_at: null,
    monitoring_paused_at: null
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
    
    // Auto-reload when user returns to this tab/window
    const handleFocus = () => {
      console.log('🔄 Dashboard focused - refreshing data...');
      loadDashboard();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  async function loadDashboard() {
    try {
      setRefreshing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Load profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('resume_text, skills')
        .eq('user_id', user.id)
        .single();

      // Load subscriptions count
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('active', true);

      // Load monitoring status
      const monitoringResponse = await fetch('/api/monitoring');
      if (monitoringResponse.ok) {
        const monitoringData: MonitoringApiResponse = await monitoringResponse.json();
        if (monitoringData.success) {
          setMonitoringStatus({
            monitoring_active: monitoringData.monitoring_active || false,
            monitoring_started_at: monitoringData.monitoring_started_at || null,
            monitoring_paused_at: monitoringData.monitoring_paused_at || null
          });
        }
      }

      setStats({
        hasResume: !!(profile?.skills && profile.skills.length > 0),
        companiesCount: subscriptions?.length || 0,
        matchesCount: 0 // We'll implement job matching later
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleMonitoringAction(action: 'start' | 'pause' | 'resume') {
    setActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data: MonitoringActionResponse = await response.json();

      if (data.success) {
        // Reload dashboard to get fresh data
        await loadDashboard();

        if (action === 'start') {
          setMessage({ 
            type: 'success', 
            text: '🎉 Monitoring started! Check your email for a welcome message.' 
          });
        } else if (action === 'pause') {
          setMessage({ 
            type: 'success', 
            text: '⏸️ Monitoring paused. You won\'t receive new alerts until you resume.' 
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: '▶️ Monitoring resumed! Job alerts are back on.' 
          });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update monitoring' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  const canStartMonitoring = stats.hasResume && stats.companiesCount > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <nav className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => loadDashboard()}
              disabled={refreshing}
              className="text-gray-400 hover:text-white transition disabled:opacity-50"
              title="Refresh data"
            >
              <span className={refreshing ? 'inline-block animate-spin' : ''}>🔄</span> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-5xl font-bold mb-4">Welcome Back! 👋</h2>
          <p className="text-gray-400 text-xl">Let's find your perfect job match</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-900/20 border-green-500 text-green-300'
              : 'bg-red-900/20 border-red-500 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Skills Card */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📄</div>
              <div>
                <h3 className="text-xl font-semibold">Skills</h3>
                <p className="text-sm text-gray-400">
                  {stats.hasResume ? 'Extracted ✓' : 'Not extracted'}
                </p>
              </div>
            </div>
          </div>

          {/* Companies Card */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🏢</div>
              <div>
                <h3 className="text-xl font-semibold">Companies</h3>
                <p className="text-sm text-gray-400">
                  Monitoring {stats.companiesCount} companies
                </p>
              </div>
            </div>
          </div>

          {/* Matches Card */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🎯</div>
              <div>
                <h3 className="text-xl font-semibold">Matches</h3>
                <p className="text-sm text-gray-400">
                  {stats.matchesCount} jobs available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Actions */}
        <div className="space-y-4 mb-8">
          <Link
            href="/profile"
            className="block bg-blue-500 hover:bg-blue-600 rounded-lg p-6 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Upload Resume</h3>
                <p className="text-blue-100">Let AI extract your skills automatically</p>
              </div>
              <div className="text-3xl group-hover:translate-x-2 transition-transform">→</div>
            </div>
          </Link>

          <Link
            href="/companies"
            className="block bg-purple-500 hover:bg-purple-600 rounded-lg p-6 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Select Companies</h3>
                <p className="text-purple-100">
                  Currently monitoring {stats.companiesCount} companies (skill_match)
                </p>
              </div>
              <div className="text-3xl group-hover:translate-x-2 transition-transform">→</div>
            </div>
          </Link>
        </div>

        {/* Monitoring Control Panel */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-2 border-green-500/50 rounded-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Job Alert Monitoring</h3>
              <p className="text-gray-300">
                {monitoringStatus.monitoring_active
                  ? '🟢 Active - You\'re receiving job alerts'
                  : '⚪ Inactive - Start monitoring to receive alerts'}
              </p>
            </div>
            {monitoringStatus.monitoring_active && (
              <div className="px-4 py-2 bg-green-500/20 border border-green-500 rounded-full text-green-300 text-sm font-semibold">
                ACTIVE
              </div>
            )}
          </div>

          {/* Prerequisites Check */}
          {!canStartMonitoring && (
            <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 font-semibold mb-2">⚠️ Complete setup first:</p>
              <ul className="text-yellow-200 space-y-1 text-sm">
                {!stats.hasResume && <li>• Upload your resume and extract skills</li>}
                {stats.companiesCount === 0 && <li>• Select companies to monitor</li>}
              </ul>
            </div>
          )}

          {/* Action Button */}
          <div>
            {!monitoringStatus.monitoring_active ? (
              <button
                onClick={() => handleMonitoringAction('start')}
                disabled={!canStartMonitoring || actionLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition text-lg"
              >
                {actionLoading ? 'Starting...' : '🚀 Start Monitoring'}
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => handleMonitoringAction('pause')}
                  disabled={actionLoading}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition"
                >
                  {actionLoading ? 'Pausing...' : '⏸️ Pause Monitoring'}
                </button>
                <Link
                  href="/matches"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg transition text-center flex items-center justify-center"
                >
                  👀 View Matches
                </Link>
              </div>
            )}
          </div>

          {/* Status Info */}
          {monitoringStatus.monitoring_started_at && (
            <div className="mt-4 text-sm text-gray-400">
              {monitoringStatus.monitoring_active ? (
                <p>Started on {new Date(monitoringStatus.monitoring_started_at).toLocaleDateString()}</p>
              ) : monitoringStatus.monitoring_paused_at ? (
                <p>Paused on {new Date(monitoringStatus.monitoring_paused_at).toLocaleDateString()}</p>
              ) : null}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500 rounded-lg p-6">
          <h4 className="font-semibold mb-2">💡 How it works:</h4>
          <ol className="text-gray-300 space-y-2 text-sm ml-4 list-decimal">
            <li>Upload your resume to extract skills automatically</li>
            <li>Select companies you want to monitor for new jobs</li>
            <li>Start monitoring to receive email alerts for matching positions</li>
            <li>Pause anytime if you need a break from notifications</li>
          </ol>
        </div>
      </div>
    </div>
  );
}